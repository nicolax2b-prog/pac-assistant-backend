// Génère un récapitulatif PDF mis en page (non officiel) de la situation PAC
// d'un exploitant : aides découplées, parcelles, cheptel, totaux.

import PDFDocument from "pdfkit";

const MARGIN = 50;
const PAGE_WIDTH = 595.28; // A4 portrait, points
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  text: "#1c2216",
  muted: "#5c6357",
  primary: "#3f6b2e",
  border: "#c9cfc0",
  warningBg: "#fdf3e0",
  warningText: "#7a4d00",
};

function ensureSpace(doc, neededHeight) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + neededHeight > bottom) {
    doc.addPage();
  }
}

function sectionTitle(doc, text) {
  ensureSpace(doc, 40);
  doc.x = MARGIN;
  doc.moveDown(0.8);
  doc.fontSize(13).fillColor(COLORS.primary).font("Helvetica-Bold").text(text, MARGIN, doc.y, {
    width: CONTENT_WIDTH,
  });
  doc.x = MARGIN;
  doc.moveDown(0.3);
  doc.fillColor(COLORS.text).font("Helvetica");
}

function drawTable(doc, headers, rows, colWidths) {
  const rowHeight = 20;
  const startX = MARGIN;
  doc.x = startX;

  function drawRow(cells, opts = {}) {
    ensureSpace(doc, rowHeight + 4);
    const y = doc.y;
    let x = startX;
    doc.font(opts.bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
    cells.forEach((cell, i) => {
      doc.fillColor(opts.color || COLORS.text).text(String(cell), x, y, {
        width: colWidths[i],
        align: opts.align?.[i] || "left",
      });
      x += colWidths[i];
    });
    doc.x = startX;
    doc.y = y + rowHeight;
  }

  drawRow(headers, { bold: true, color: COLORS.muted });
  doc
    .moveTo(startX, doc.y)
    .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), doc.y)
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .stroke();
  doc.moveDown(0.2);

  for (const row of rows) {
    drawRow(row);
  }
  doc.moveDown(0.5);
}

export function genererRecapitulatifPdf(user, campagne, aidesEstimation) {
  const doc = new PDFDocument({ size: "A4", margin: MARGIN, bufferPages: true });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const ad = aidesEstimation.aides_decouplees;

  // En-tête
  doc.fontSize(18).font("Helvetica-Bold").fillColor(COLORS.text).text("PAC Assistant");
  doc
    .fontSize(11)
    .font("Helvetica")
    .fillColor(COLORS.muted)
    .text("Récapitulatif préparatoire de situation PAC — document NON OFFICIEL");
  doc.moveDown(0.8);

  doc.fontSize(10).fillColor(COLORS.text);
  doc.text(`Exploitation : ${user.nom_exploitation || "—"}`);
  doc.text(`Email : ${user.email}`);
  doc.text(`Campagne : ${campagne}`);
  doc.text(`Généré le : ${new Date().toLocaleString("fr-FR")}`);

  // Avertissement
  doc.moveDown(0.8);
  const warningY = doc.y;
  const warningText = aidesEstimation.avertissement;
  doc.fontSize(9).font("Helvetica");
  const warningHeight = doc.heightOfString(warningText, { width: CONTENT_WIDTH - 20 }) + 16;
  doc.rect(MARGIN, warningY, CONTENT_WIDTH, warningHeight).fill(COLORS.warningBg);
  doc
    .fillColor(COLORS.warningText)
    .text(warningText, MARGIN + 10, warningY + 8, { width: CONTENT_WIDTH - 20 });
  doc.y = warningY + warningHeight;
  doc.fillColor(COLORS.text);

  // Chiffres clés
  doc.moveDown(1);
  sectionTitle(doc, "Chiffres clés");
  drawTable(
    doc,
    ["Surface totale (ha)", "Effectif total (têtes)", "Montant total estimé (€)"],
    [[aidesEstimation.surface_totale_ha, aidesEstimation.effectif_total, aidesEstimation.montant_total_estime_eur]],
    [CONTENT_WIDTH / 3, CONTENT_WIDTH / 3, CONTENT_WIDTH / 3]
  );

  // Aides découplées
  sectionTitle(doc, "Aides découplées (calculées sur la surface totale)");
  drawTable(
    doc,
    ["Paiement de base (€)", "Paiement redistributif (€)", "Écorégime (€)", "Sous-total (€)"],
    [[ad.paiement_base_eur, ad.paiement_redistributif_eur, ad.ecoregime_eur, ad.total_eur]],
    [CONTENT_WIDTH * 0.28, CONTENT_WIDTH * 0.28, CONTENT_WIDTH * 0.22, CONTENT_WIDTH * 0.22]
  );

  // Parcelles
  if (aidesEstimation.detail_parcelles.length > 0) {
    sectionTitle(doc, "Aides couplées par production — Parcelles");
    drawTable(
      doc,
      ["Parcelle", "Culture", "Surface (ha)", "Taux (€/ha)", "Montant (€)"],
      aidesEstimation.detail_parcelles.map((p) => [
        p.nom,
        p.culture,
        p.surface_ha,
        p.taux_eur_par_ha,
        p.montant_estime_eur,
      ]),
      [CONTENT_WIDTH * 0.26, CONTENT_WIDTH * 0.26, CONTENT_WIDTH * 0.16, CONTENT_WIDTH * 0.16, CONTENT_WIDTH * 0.16]
    );
  }

  // Cheptel
  if (aidesEstimation.detail_cheptels.length > 0) {
    sectionTitle(doc, "Aides couplées par production — Cheptel");
    drawTable(
      doc,
      ["Cheptel", "Espèce", "Effectif", "Taux (€/tête)", "Montant (€)"],
      aidesEstimation.detail_cheptels.map((c) => [
        c.nom,
        c.espece,
        c.effectif,
        c.taux_eur_par_tete,
        c.montant_estime_eur,
      ]),
      [CONTENT_WIDTH * 0.26, CONTENT_WIDTH * 0.26, CONTENT_WIDTH * 0.16, CONTENT_WIDTH * 0.16, CONTENT_WIDTH * 0.16]
    );
  }

  // Pied de page numéroté
  const pageRange = doc.bufferedPageRange();
  for (let i = 0; i < pageRange.count; i++) {
    doc.switchToPage(pageRange.start + i);
    doc
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(`Page ${i + 1} / ${pageRange.count} — document généré par PAC Assistant, non officiel`, MARGIN, doc.page.height - 30, {
        width: CONTENT_WIDTH,
        align: "center",
      });
  }

  doc.end();
  return done;
}
