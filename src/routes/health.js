// Route de vérification que le serveur est en ligne

import { Router } from "express";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "pac-assistant-backend",
    timestamp: new Date().toISOString(),
  });
});

export default router;
