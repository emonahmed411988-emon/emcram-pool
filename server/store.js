import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, 'db.json');

function loadDb() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    }
  } catch {
    // ignore corrupt file
  }
  return { users: {} };
}

function saveDb(db) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2), 'utf8');
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, key] = stored.split(':');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(hash, 'hex'));
}

export function createAccount({ username, email, password, account }) {
  const db = loadDb();
  const key = email.trim().toLowerCase();
  if (db.users[key]) {
    return { ok: false, error: 'Email already registered' };
  }
  db.users[key] = {
    email: key,
    passwordHash: hashPassword(password),
    account: { ...account, username: username.trim(), email: key, isGuest: false },
    updatedAt: Date.now(),
  };
  saveDb(db);
  return { ok: true, account: db.users[key].account };
}

export function authenticate({ email, password }) {
  const db = loadDb();
  const key = email.trim().toLowerCase();
  const entry = db.users[key];
  if (!entry || !verifyPassword(password, entry.passwordHash)) {
    return { ok: false, error: 'Invalid email or password' };
  }
  return { ok: true, account: entry.account };
}

export function syncAccount(account) {
  if (!account || !account.email) return { ok: false };
  const db = loadDb();
  const key = account.email.trim().toLowerCase();
  if (!db.users[key]) return { ok: false };
  db.users[key].account = account;
  db.users[key].updatedAt = Date.now();
  saveDb(db);
  return { ok: true };
}

export function getLeaderboard() {
  const db = loadDb();
  return Object.values(db.users)
    .map((u) => ({
      username: u.account.username,
      avatarId: u.account.avatarId,
      level: u.account.level,
      winnings: u.account.stats?.totalCoinsWon || 0,
    }))
    .sort((a, b) => b.winnings - a.winnings)
    .slice(0, 50);
}
