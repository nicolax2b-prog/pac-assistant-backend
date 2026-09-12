// CRUD du cheptel déclaré par l'exploitant

import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function validateCheptel(body) {
  const { nom, espece, effectif } = body;
  if (!nom || !espece || effectif === undefined) {
    return "nom, espece et effectif sont requis";
  }
  if (!Number.isInteger(effectif) || effectif <= 0) {
    return "effectif doit être un nombre entier positif";
  }
  return null;
}

router.get("/cheptels", (req, res) => {
  const cheptels = db
    .prepare("SELECT * FROM cheptels WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.userId);
  res.json(cheptels);
});

router.get("/cheptels/:id", (req, res) => {
  const cheptel = db
    .prepare("SELECT * FROM cheptels WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!cheptel) return res.status(404).json({ error: "Cheptel introuvable" });
  res.json(cheptel);
});

router.post("/cheptels", (req, res) => {
  const error = validateCheptel(req.body);
  if (error) return res.status(400).json({ error });

  const { nom, espece, effectif, commune } = req.body;
  const { lastInsertRowid: id } = db
    .prepare("INSERT INTO cheptels (user_id, nom, espece, effectif, commune) VALUES (?, ?, ?, ?, ?)")
    .run(req.userId, nom, espece, effectif, commune || null);

  res.status(201).json(db.prepare("SELECT * FROM cheptels WHERE id = ?").get(id));
});

router.put("/cheptels/:id", (req, res) => {
  const existing = db
    .prepare("SELECT id FROM cheptels WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "Cheptel introuvable" });

  const error = validateCheptel(req.body);
  if (error) return res.status(400).json({ error });

  const { nom, espece, effectif, commune } = req.body;
  db.prepare("UPDATE cheptels SET nom = ?, espece = ?, effectif = ?, commune = ? WHERE id = ?").run(
    nom,
    espece,
    effectif,
    commune || null,
    req.params.id
  );

  res.json(db.prepare("SELECT * FROM cheptels WHERE id = ?").get(req.params.id));
});

router.delete("/cheptels/:id", (req, res) => {
  const result = db
    .prepare("DELETE FROM cheptels WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: "Cheptel introuvable" });
  res.status(204).send();
});

export default router;
