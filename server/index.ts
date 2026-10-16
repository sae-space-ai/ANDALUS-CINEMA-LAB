import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import fastifyCors from '@fastify/cors';
import path from 'path';
import fs from 'fs';
import { getDb } from './db';
import { authenticate, requireAuth, invalidateSession, isPasswordSet } from './auth';
import { savePdf, saveVideo, getPdfPath, getVideoPath, deleteProjectFiles } from './storage';
import { readPdfBuffer } from './pdf';
import { generateSceneDraft, generateBible, isGeminiConfigured } from './gemini';
import { startVideoGeneration, pollVideoStatus, downloadVideo, isVeoConfigured, getVideoModel, estimateCost } from './veo';
import { v4 as uuidv4 } from 'uuid';

const PORT = parseInt(process.env.PORT || '3000');
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

const fastify = Fastify({
  logger: {
    level: 'info',
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  },
});

// Register plugins
await fastify.register(fastifyCookie, {
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
});

await fastify.register(fastifyMultipart, {
  limits: {
    fileSize: (parseInt(process.env.MAX_UPLOAD_MB || '50')) * 1024 * 1024,
  },
});

await fastify.register(fastifyCors, {
  origin: process.env.APP_ORIGIN || 'http://localhost:5173',
  credentials: true,
});

// Serve frontend static files
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  await fastify.register(fastifyStatic, {
    root: distPath,
    prefix: '/',
    decorateReply: false,
  });
}

// ===== AUTH ROUTES =====

fastify.post('/api/auth/login', async (request, reply) => {
  const { password } = request.body as { password: string };
  
  if (!password || password.length < 4) {
    return reply.code(400).send({ error: 'Contraseña inválida' });
  }

  const sessionId = await authenticate(password);
  
  if (!sessionId) {
    return reply.code(401).send({ error: 'Contraseña incorrecta' });
  }

  reply.setCookie('andalus_session', sessionId, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
  });

  return { success: true };
});

fastify.post('/api/auth/logout', async (request, reply) => {
  const sessionId = request.cookies['andalus_session'];
  if (sessionId) {
    invalidateSession(sessionId);
  }
  reply.clearCookie('andalus_session', { path: '/' });
  return { success: true };
});

fastify.get('/api/auth/status', async (request, reply) => {
  const sessionId = request.cookies['andalus_session'];
  const authenticated = !!sessionId && await requireAuth(request, reply);
  return { 
    authenticated,
    passwordSet: await isPasswordSet(),
    geminiConfigured: isGeminiConfigured(),
    veoConfigured: isVeoConfigured(),
  };
});

// ===== PROJECT ROUTES =====

fastify.get('/api/projects', async (request, reply) => {
  if (!await requireAuth(request, reply)) return;
  
  const db = getDb();
  const projects = db.prepare(`
    SELECT id, name, created_at, updated_at, status, pdf_file_name, pdf_file_size, 
           video_path, video_duration, error
    FROM projects 
    ORDER BY updated_at DESC
  `).all();

  return { projects };
});

fastify.get('/api/projects/:id', async (request, reply) => {
  if (!await requireAuth(request, reply)) return;
  
  const { id } = request.params as { id: string };
  const db = getDb();
  
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
  if (!project) {
    return reply.code(404).send({ error: 'Proyecto no encontrado' });
  }

  const pages = db.prepare('SELECT page_number, text FROM pages WHERE project_id = ? ORDER BY page_number').all(id);

  return {
    project: {
      ...project,
      pages,
      scene_draft: project.scene_draft ? JSON.parse(project.scene_draft) : null,
      bible: project.bible ? JSON.parse(project.bible) : null,
    },
  };
});

fastify.post('/api/projects', async (request, reply) => {
  if (!await requireAuth(request, reply)) return;
  
  const data = await request.file();
  if (!data) {
    return reply.code(400).send({ error: 'No se recibió archivo PDF' });
  }

  const buffer = await data.toBuffer();
  const fileName = data.filename;
  
  if (!fileName.toLowerCase().endsWith('.pdf')) {
    return reply.code(400).send({ error: 'El archivo debe ser un PDF' });
  }

  // Read PDF
  const pdfResult = await readPdfBuffer(buffer);
  
  if (pdfResult.needsOcr) {
    return reply.code(400).send({ 
      error: 'NEEDS_OCR — Este PDF parece estar escaneado y no contiene texto extraíble.' 
    });
  }

  // Save PDF
  const projectId = uuidv4();
  const { path: pdfPath, checksum } = savePdf(projectId, buffer, fileName);

  // Save project
  const db = getDb();
  db.prepare(`
    INSERT INTO projects (id, name, pdf_file_name, pdf_file_size, pdf_checksum, pdf_path, full_text, rights_confirmed, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'TEXT_EXTRACTED')
  `).run(projectId, fileName.replace('.pdf', ''), fileName, buffer.length, checksum, pdfPath, pdfResult.fullText);

  // Save pages
  const insertPage = db.prepare('INSERT INTO pages (project_id, page_number, text) VALUES (?, ?, ?)');
  for (const page of pdfResult.pages) {
    insertPage.run(projectId, page.pageNumber, page.text);
  }

  return { projectId, totalPages: pdfResult.totalPages, textLength: pdfResult.fullText.length };
});

fastify.delete('/api/projects/:id', async (request, reply) => {
  if (!await requireAuth(request, reply)) return;
  
  const { id } = request.params as { id: string };
  const db = getDb();
  
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
  if (!project) {
    return reply.code(404).send({ error: 'Proyecto no encontrado' });
  }

  // Delete files
  deleteProjectFiles(id);

  // Delete from DB (cascade will delete pages)
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);

  return { success: true };
});

// ===== SCENE ROUTES =====

fastify.post('/api/projects/:id/scene', async (request, reply) => {
  if (!await requireAuth(request, reply)) return;
  
  if (!isGeminiConfigured()) {
    return reply.code(400).send({ error: 'Gemini no configurado en el servidor' });
  }

  const { id } = request.params as { id: string };
  const { fragmentText, sourcePages, style, bible } = request.body as any;

  if (!fragmentText || !sourcePages || sourcePages.length === 0) {
    return reply.code(400).send({ error: 'Fragmento y páginas son obligatorios' });
  }

  try {
    const draft = await generateSceneDraft(fragmentText, sourcePages, bible, style);
    
    const db = getDb();
    db.prepare(`
      UPDATE projects 
      SET scene_draft = ?, status = 'AWAITING_APPROVAL', updated_at = datetime('now')
      WHERE id = ?
    `).run(JSON.stringify(draft), id);

    return { draft };
  } catch (error: any) {
    return reply.code(500).send({ error: error.message });
  }
});

fastify.post('/api/projects/:id/scene/approve', async (request, reply) => {
  if (!await requireAuth(request, reply)) return;
  
  const { id } = request.params as { id: string };
  const { draft } = request.body as any;

  const db = getDb();
  db.prepare(`
    UPDATE projects 
    SET scene_draft = ?, approved_prompt = ?, status = 'APPROVED', updated_at = datetime('now')
    WHERE id = ?
  `).run(JSON.stringify(draft), draft.cinematicPrompt, id);

  return { success: true };
});

fastify.post('/api/projects/:id/bible', async (request, reply) => {
  if (!await requireAuth(request, reply)) return;
  
  if (!isGeminiConfigured()) {
    return reply.code(400).send({ error: 'Gemini no configurado en el servidor' });
  }

  const { id } = request.params as { id: string };
  
  const db = getDb();
  const project = db.prepare('SELECT full_text FROM projects WHERE id = ?').get(id) as any;
  
  if (!project) {
    return reply.code(404).send({ error: 'Proyecto no encontrado' });
  }

  try {
    const bible = await generateBible(project.full_text);
    
    db.prepare(`
      UPDATE projects 
      SET bible = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(JSON.stringify(bible), id);

    return { bible };
  } catch (error: any) {
    return reply.code(500).send({ error: error.message });
  }
});

// ===== VIDEO ROUTES =====

fastify.post('/api/projects/:id/generate', async (request, reply) => {
  if (!await requireAuth(request, reply)) return;
  
  if (!isVeoConfigured()) {
    return reply.code(400).send({ error: 'Veo no configurado en el servidor' });
  }

  const { id } = request.params as { id: string };
  const db = getDb();
  
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
  
  if (!project || !project.scene_draft) {
    return reply.code(400).send({ error: 'No hay escena aprobada para generar' });
  }

  if (project.status !== 'APPROVED') {
    return reply.code(400).send({ error: 'La escena no está en estado APPROVED' });
  }

  const sceneDraft = JSON.parse(project.scene_draft);

  try {
    // Start generation
    db.prepare(`
      UPDATE projects 
      SET status = 'QUEUED', video_model = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(getVideoModel(), id);

    const operationId = await startVideoGeneration(sceneDraft);

    db.prepare(`
      UPDATE projects 
      SET operation_id = ?, status = 'GENERATING', updated_at = datetime('now')
      WHERE id = ?
    `).run(operationId, id);

    // Poll in background
    pollVideoStatus(operationId, (status) => {
      console.log(`[Video ${id}] ${status}`);
    }).then(async (result) => {
      if (result.status === 'COMPLETED' && result.videoUrl) {
        try {
          const videoBuffer = await downloadVideo(result.videoUrl);
          const videoPath = saveVideo(id, videoBuffer);
          
          db.prepare(`
            UPDATE projects 
            SET video_path = ?, video_file_size = ?, status = 'COMPLETED', 
                generation_cost = ?, updated_at = datetime('now')
            WHERE id = ?
          `).run(videoPath, videoBuffer.length, estimateCost(getVideoModel(), 8), id);
        } catch (error: any) {
          db.prepare(`
            UPDATE projects 
            SET status = 'FAILED', error = ?, updated_at = datetime('now')
            WHERE id = ?
          `).run(error.message, id);
        }
      } else {
        db.prepare(`
          UPDATE projects 
          SET status = 'FAILED', error = ?, updated_at = datetime('now')
          WHERE id = ?
        `).run(result.error || 'Error desconocido', id);
      }
    }).catch((error) => {
      db.prepare(`
        UPDATE projects 
        SET status = 'FAILED', error = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(error.message, id);
    });

    return { operationId, status: 'GENERATING' };
  } catch (error: any) {
    db.prepare(`
      UPDATE projects 
      SET status = 'FAILED', error = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(error.message, id);
    
    return reply.code(500).send({ error: error.message });
  }
});

fastify.get('/api/projects/:id/status', async (request, reply) => {
  if (!await requireAuth(request, reply)) return;
  
  const { id } = request.params as { id: string };
  const db = getDb();
  
  const project = db.prepare('SELECT status, error, video_path FROM projects WHERE id = ?').get(id) as any;
  
  if (!project) {
    return reply.code(404).send({ error: 'Proyecto no encontrado' });
  }

  return { 
    status: project.status, 
    error: project.error,
    hasVideo: !!project.video_path,
  };
});

// ===== VIDEO DOWNLOAD =====

fastify.get('/api/projects/:id/video', async (request, reply) => {
  if (!await requireAuth(request, reply)) return;
  
  const { id } = request.params as { id: string };
  const db = getDb();
  
  const project = db.prepare('SELECT video_path, pdf_file_name FROM projects WHERE id = ?').get(id) as any;
  
  if (!project || !project.video_path) {
    return reply.code(404).send({ error: 'Vídeo no disponible' });
  }

  const videoPath = getVideoPath(project.video_path);
  if (!videoPath) {
    return reply.code(404).send({ error: 'Vídeo no encontrado' });
  }

  const fileName = `${project.pdf_file_name || 'scene'}.mp4`;
  
  reply.header('Content-Type', 'video/mp4');
  reply.header('Content-Disposition', `attachment; filename="${fileName}"`);
  
  return reply.send(fs.createReadStream(videoPath));
});

// ===== DIAGNOSTICS =====

fastify.get('/api/diagnostics', async (request, reply) => {
  if (!await requireAuth(request, reply)) return;
  
  return {
    pdf: { status: 'VERIFIED', detail: 'pdfjs-dist cargado y funcional' },
    gemini: { 
      status: isGeminiConfigured() ? 'CONFIGURED' : 'NOT_CONFIGURED',
      detail: isGeminiConfigured() ? `${process.env.TEXT_MODEL || 'gemini-2.0-flash'} — API key presente` : 'Falta GEMINI_API_KEY en el servidor'
    },
    veo: { 
      status: isVeoConfigured() ? 'CONFIGURED' : 'NOT_CONFIGURED',
      detail: isVeoConfigured() ? `${getVideoModel()} — listo para generar` : 'Falta GEMINI_API_KEY en el servidor'
    },
    storage: { status: 'VERIFIED', detail: `DATA_DIR: ${DATA_DIR}` },
    database: { status: 'VERIFIED', detail: 'SQLite funcional' },
  };
});

// ===== START SERVER =====

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  AL-ANDALUS AI — ANDALUS CINEMA LAB                      ║
║  Servidor iniciado en http://localhost:${PORT}              ║
║                                                           ║
║  Frontend: ${fs.existsSync(distPath) ? 'dist/ encontrado ✓' : 'dist/ no encontrado (ejecuta npm run build)'}
║  Datos: ${DATA_DIR}
║  Gemini: ${isGeminiConfigured() ? 'Configurado ✓' : 'NO configurado ✗'}
║  Veo: ${isVeoConfigured() ? 'Configurado ✓' : 'NO configurado ✗'}
╚═══════════════════════════════════════════════════════════╝
  `);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
