// Point d'entrée du backend PAC Assistant

import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import parcellesRouter from "./routes/parcelles.js";
import cheptelsRouter from "./routes/cheptels.js";
import aidesRouter from "./routes/aides.js";
import declarationRouter from "./routes/declaration.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET manquant : copiez .env.example vers .env et renseignez-le");
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// Routes
app.use("/", healthRouter);
app.use("/", authRouter);
app.use("/", parcellesRouter);
app.use("/", cheptelsRouter);
app.use("/", aidesRouter);
app.use("/", declarationRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur interne du serveur" });
});

app.listen(PORT, () => {
  console.log(`PAC Assistant backend démarré sur http://localhost:${PORT}`);
  console.log(`→ Vérifier : http://localhost:${PORT}/health`);
});
