// Génère un récapitulatif exportable (CSV) des parcelles, du cheptel et des
// aides estimées. Ce n'est PAS le format officiel TéléPAC (XML propriétaire
// non public) — c'est un document préparatoire à usage de l'exploitant.

function csvEscape(value) {
  const str = String(value ?? "");
  return /[",\n;]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function genererRecapitulatifCsv(user, campagne, aidesEstimation) {
  const { aides_decouplees: ad } = aidesEstimation;
  const lignes = [
    ["Exploitation", user.nom_exploitation || ""],
    ["Email", user.email],
    ["Campagne", campagne],
    ["Date export", new Date().toISOString()],
    [],
    ["Aides découplées (sur surface totale)", "Montant estimé (€)"],
    ["Paiement de base", ad.paiement_base_eur],
    ["Paiement redistributif", ad.paiement_redistributif_eur],
    ["Écorégime", ad.ecoregime_eur],
    ["Sous-total aides découplées", ad.total_eur],
    [],
    ["Parcelles", "Culture", "Surface (ha)", "Taux (€/ha)", "Montant estimé (€)"],
    ...aidesEstimation.detail_parcelles.map((p) => [
      p.nom,
      p.culture,
      p.surface_ha,
      p.taux_eur_par_ha,
      p.montant_estime_eur,
    ]),
    [],
    ["Cheptel", "Espèce", "Effectif", "Taux (€/tête)", "Montant estimé (€)"],
    ...aidesEstimation.detail_cheptels.map((c) => [
      c.nom,
      c.espece,
      c.effectif,
      c.taux_eur_par_tete,
      c.montant_estime_eur,
    ]),
    [],
    ["Surface totale (ha)", aidesEstimation.surface_totale_ha],
    ["Effectif total (têtes)", aidesEstimation.effectif_total],
    ["Sous-total aides découplées (€)", ad.total_eur],
    ["Sous-total aides couplées / par production (€)", aidesEstimation.montant_couplees_eur],
    ["Montant total estimé (€)", aidesEstimation.montant_total_estime_eur],
    [],
    [aidesEstimation.avertissement],
  ];

  return lignes.map((ligne) => ligne.map(csvEscape).join(";")).join("\n");
}
