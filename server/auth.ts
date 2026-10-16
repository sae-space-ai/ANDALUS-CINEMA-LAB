import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './db';
import type { FastifyRequest, FastifyReply } from 'fastify';

const SESSION_DURATION_HOURS = 24;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function isPasswordSet(): Promise<boolean> {
  const db = getDb();
  const row = db.prepare('SELECT value FROM auth_config WHERE key = ?').get('password_hash');
  return !!row;
}

export async function setPassword(password: string): Promise<void> {
  const db = getDb();
  const hash = await hashPassword(password);
  db.prepare('INSERT OR REPLACE INTO auth_config (key, value) VALUES (?, ?)').run('password_hash', hash);
}

export async function authenticate(password: string): Promise<string | null> {
  const db = getDb();
  const row = db.prepare('SELECT value FROM auth_config WHERE key = ?').get('password_hash') as { value: string } | undefined;
  
  if (!row) {
    // First time: set password and create session
    await setPassword(password);
    return createSession();
  }

  const valid = await verifyPassword(password, row.value);
  if (!valid) return null;

  return createSession();
}

function createSession(): string {
  const db = getDb();
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000).toISOString();
  
  db.prepare('INSERT INTO sessions (id, expires_at) VALUES (?, ?)').run(sessionId, expiresAt);
  
  // Clean expired sessions
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
  
  return sessionId;
}

export function validateSession(sessionId: string): boolean {
  const db = getDb();
  const row = db.prepare(
    "SELECT id FROM sessions WHERE id = ? AND is_valid = 1 AND expires_at > datetime('now')"
  ).get(sessionId) as { id: string } | undefined;
  
  return !!row;
}

export function invalidateSession(sessionId: string): void {
  const db = getDb();
  db.prepare('UPDATE sessions SET is_valid = 0 WHERE id = ?').run(sessionId);
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  const sessionId = request.cookies['andalus_session'];
  
  if (!sessionId || !validateSession(sessionId)) {
    reply.code(401).send({ error: 'No autorizado' });
    return false;
  }
  
  return true;
}
