// Récapitulatif et export préparatoire de la déclaration PAC

import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { estimerAides } from "../services/aidesCalculator.js";
import { genererRecapitulatifCsv } from "../services/exportPac.js";
import { genererRecapitulatifPdf } from "../services/exportPacPdf.js";

const router = Router();
router.use(requireAuth);

function chargerContexte(userId) {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  const parcelles = db.prepare("SELECT * FROM parcelles WHERE user_id = ?").all(userId);
  const cheptels = db.prepare("SELECT * FROM cheptels WHERE user_id = ?").all(userId);
  return { user, aidesEstimation: estimerAides(parcelles, cheptels) };
}

router.get("/declaration/recapitulatif", (req, res) => {
  const { user, aidesEstimation } = chargerContexte(req.userId);
  res.json({
    exploitation: { email: user.email, nom_exploitation: user.nom_exploitation },
    ...aidesEstimation,
  });
});

router.get("/declaration/export", (req, res) => {
  const { user, aidesEstimation } = chargerContexte(req.userId);
  const csv = genererRecapitulatifCsv(user, aidesEstimation);

  // BOM UTF-8 requis pour qu'Excel affiche correctement les accents sous Windows
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=recapitulatif-pac.csv");
  res.send("﻿" + csv);
});

router.get("/declaration/export-pdf", async (req, res) => {
  const { user, aidesEstimation } = chargerContexte(req.userId);
  const pdfBuffer = await genererRecapitulatifPdf(user, aidesEstimation);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=recapitulatif-pac.pdf");
  res.send(pdfBuffer);
});

export default router;
