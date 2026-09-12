// Inscription et connexion des exploitants

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = "7d";

function issueToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

router.post("/auth/register", async (req, res) => {
  const { email, password, nom_exploitation } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email et password sont requis" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Le mot de passe doit faire au moins 8 caractères" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "Un compte existe déjà avec cet email" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const { lastInsertRowid: userId } = db
    .prepare("INSERT INTO users (email, password_hash, nom_exploitation) VALUES (?, ?, ?)")
    .run(email, passwordHash, nom_exploitation || null);

  res.status(201).json({ token: issueToken(userId), userId });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email et password sont requis" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Email ou mot de passe incorrect" });
  }

  res.json({ token: issueToken(user.id), userId: user.id });
});

export default router;
