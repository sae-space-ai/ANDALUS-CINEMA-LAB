// Prueba de integración: Flujo completo sin APIs externas
// Ejecutar: npx tsx tests/integration.test.ts

import { getDb, closeDb } from '../server/db';
import { hashPassword, verifyPassword, authenticate, validateSession } from '../server/auth';
import { computeChecksum } from '../server/storage';

async function testIntegration() {
  console.log('🧪 Pruebas de integración (sin APIs externas)');
  console.log('');

  // Test 1: Database
  console.log('1️⃣  SQLite...');
  try {
    const db = getDb();
    db.prepare("INSERT OR REPLACE INTO auth_config (key, value) VALUES ('test', 'value')").run();
    const row = db.prepare("SELECT value FROM auth_config WHERE key = 'test'").get() as any;
    if (row?.value === 'value') {
      console.log('   ✅ SQLite funcional');
    } else {
      console.log('   ❌ SQLite: datos incorrectos');
    }
    db.prepare("DELETE FROM auth_config WHERE key = 'test'").run();
  } catch (error: any) {
    console.log('   ❌ SQLite:', error.message);
  }

  // Test 2: Auth
  console.log('2️⃣  Autenticación...');
  try {
    const hash = await hashPassword('testpassword');
    const valid = await verifyPassword('testpassword', hash);
    const invalid = await verifyPassword('wrongpassword', hash);
    
    if (valid && !invalid) {
      console.log('   ✅ Bcrypt funcional');
    } else {
      console.log('   ❌ Bcrypt: verificación incorrecta');
    }
  } catch (error: any) {
    console.log('   ❌ Auth:', error.message);
  }

  // Test 3: Session
  console.log('3️⃣  Sesiones...');
  try {
    const sessionId = await authenticate('integration_test_pass');
    if (sessionId && validateSession(sessionId)) {
      console.log('   ✅ Sesiones funcionales');
    } else {
      console.log('   ❌ Sesiones: no se pudo validar');
    }
  } catch (error: any) {
    console.log('   ❌ Sesiones:', error.message);
  }

  // Test 4: Checksum
  console.log('4️⃣  Checksum...');
  try {
    const buffer = Buffer.from('test data');
    const checksum = computeChecksum(buffer);
    if (checksum && checksum.length === 64) {
      console.log('   ✅ SHA-256 funcional');
    } else {
      console.log('   ❌ Checksum: formato incorrecto');
    }
  } catch (error: any) {
    console.log('   ❌ Checksum:', error.message);
  }

  // Test 5: Project CRUD
  console.log('5️⃣  CRUD de proyectos...');
  try {
    const db = getDb();
    const projectId = 'test_' + Date.now();
    
    db.prepare(`
      INSERT INTO projects (id, name, status, full_text)
      VALUES (?, ?, 'CREATED', 'test text')
    `).run(projectId, 'Test Project');

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;
    
    if (project?.name === 'Test Project') {
      console.log('   ✅ CRUD funcional');
    } else {
      console.log('   ❌ CRUD: datos incorrectos');
    }

    // Cleanup
    db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
  } catch (error: any) {
    console.log('   ❌ CRUD:', error.message);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('Pruebas completadas.');
  console.log('');
  console.log('⚠️  Las pruebas de Gemini/Veo requieren API key.');
  console.log('⚠️  La prueba de vídeo real (PDF_TO_REAL_VIDEO_001)');
  console.log('    requiere GEMINI_API_KEY + acceso a Veo.');
  console.log('═══════════════════════════════════════════════');

  closeDb();
}

testIntegration();
