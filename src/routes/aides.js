// Estimation des aides PAC (surfaces + cheptel) pour l'exploitant connecté

import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { estimerAides } from "../services/aidesCalculator.js";

const router = Router();
router.use(requireAuth);

router.get("/aides/estimation", (req, res) => {
  const parcelles = db.prepare("SELECT * FROM parcelles WHERE user_id = ?").all(req.userId);
  const cheptels = db.prepare("SELECT * FROM cheptels WHERE user_id = ?").all(req.userId);

  res.json(estimerAides(parcelles, cheptels));
});

export default router;
