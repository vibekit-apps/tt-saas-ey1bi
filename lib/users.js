const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]', 'utf8');
}

function readAll() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (_) {
    return [];
  }
}

function writeAll(users) {
  ensureStore();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function publicUser(u) {
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return rest;
}

async function createUser({ email, password, name }) {
  email = String(email || '').trim().toLowerCase();
  if (!email || !password) throw new Error('email_and_password_required');
  const users = readAll();
  if (users.find(u => u.email === email)) {
    throw new Error('email_taken');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: crypto.randomUUID(),
    email,
    name: name || email.split('@')[0],
    passwordHash,
    plan: 'free',
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeAll(users);
  return publicUser(user);
}

function getUserByEmail(email) {
  email = String(email || '').trim().toLowerCase();
  return readAll().find(u => u.email === email) || null;
}

function getUserById(id) {
  return readAll().find(u => u.id === id) || null;
}

async function verifyPassword(user, password) {
  if (!user || !user.passwordHash) return false;
  return bcrypt.compare(password, user.passwordHash);
}

function updateUser(id, patch) {
  const users = readAll();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...patch };
  writeAll(users);
  return publicUser(users[idx]);
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  verifyPassword,
  updateUser,
  publicUser,
};
