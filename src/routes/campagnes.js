// Liste des campagnes (années) pour lesquelles l'exploitant a des données

import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/campagnes", (req, res) => {
  const rows = db
    .prepare(
      `SELECT campagne FROM parcelles WHERE user_id = ?
       UNION
       SELECT campagne FROM cheptels WHERE user_id = ?
       ORDER BY campagne DESC`
    )
    .all(req.userId, req.userId);

  const annees = rows.map((r) => r.campagne);
  const anneeActuelle = new Date().getFullYear();
  if (!annees.includes(anneeActuelle)) annees.unshift(anneeActuelle);

  res.json(annees.sort((a, b) => b - a));
});

export default router;
