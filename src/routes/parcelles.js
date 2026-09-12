// CRUD des parcelles déclarées par l'exploitant, par campagne

import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function validateParcelle(body) {
  const { nom, culture, surface_ha, campagne } = body;
  if (!nom || !culture || surface_ha === undefined || !campagne) {
    return "nom, culture, surface_ha et campagne sont requis";
  }
  if (typeof surface_ha !== "number" || surface_ha <= 0) {
    return "surface_ha doit être un nombre positif";
  }
  if (!Number.isInteger(campagne) || campagne < 2000 || campagne > 2100) {
    return "campagne doit être une année valide";
  }
  return null;
}

router.get("/parcelles", (req, res) => {
  const campagne = parseInt(req.query.campagne, 10);
  const parcelles = campagne
    ? db
        .prepare("SELECT * FROM parcelles WHERE user_id = ? AND campagne = ? ORDER BY created_at DESC")
        .all(req.userId, campagne)
    : db.prepare("SELECT * FROM parcelles WHERE user_id = ? ORDER BY created_at DESC").all(req.userId);
  res.json(parcelles);
});

router.get("/parcelles/:id", (req, res) => {
  const parcelle = db
    .prepare("SELECT * FROM parcelles WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!parcelle) return res.status(404).json({ error: "Parcelle introuvable" });
  res.json(parcelle);
});

router.post("/parcelles", (req, res) => {
  const error = validateParcelle(req.body);
  if (error) return res.status(400).json({ error });

  const { nom, culture, surface_ha, commune, ilot, campagne, latitude, longitude } = req.body;
  const { lastInsertRowid: id } = db
    .prepare(
      "INSERT INTO parcelles (user_id, nom, culture, surface_ha, commune, ilot, campagne, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .run(
      req.userId,
      nom,
      culture,
      surface_ha,
      commune || null,
      ilot || null,
      campagne,
      latitude ?? null,
      longitude ?? null
    );

  res.status(201).json(db.prepare("SELECT * FROM parcelles WHERE id = ?").get(id));
});

router.put("/parcelles/:id", (req, res) => {
  const existing = db
    .prepare("SELECT id FROM parcelles WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "Parcelle introuvable" });

  const error = validateParcelle(req.body);
  if (error) return res.status(400).json({ error });

  const { nom, culture, surface_ha, commune, ilot, campagne, latitude, longitude } = req.body;
  db.prepare(
    "UPDATE parcelles SET nom = ?, culture = ?, surface_ha = ?, commune = ?, ilot = ?, campagne = ?, latitude = ?, longitude = ? WHERE id = ?"
  ).run(
    nom,
    culture,
    surface_ha,
    commune || null,
    ilot || null,
    campagne,
    latitude ?? null,
    longitude ?? null,
    req.params.id
  );

  res.json(db.prepare("SELECT * FROM parcelles WHERE id = ?").get(req.params.id));
});

router.delete("/parcelles/:id", (req, res) => {
  const result = db
    .prepare("DELETE FROM parcelles WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: "Parcelle introuvable" });
  res.status(204).send();
});

export default router;
