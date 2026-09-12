// Estimation simplifiée des aides PAC (surfaces + cheptel), incluant les
// productions caractéristiques du territoire corse (oliveraie, agrumes,
// châtaigneraie, parcours/maquis pour l'élevage extensif, apiculture...).
//
// Deux blocs distincts, conformes à la structure réelle observée sur un
// relevé de situation (RDS) TéléPAC :
//
// 1. AIDES DÉCOUPLÉES — calculées sur la SEULE surface totale admissible,
//    indépendamment de la culture (paiement de base, paiement redistributif
//    sur les premiers hectares, écorégime). C'est la mécanique réelle des
//    aides "de base" du 1er pilier PAC depuis la réforme 2023.
// 2. AIDES COUPLÉES / VALORISATION PAR PRODUCTION — barème indicatif €/ha et
//    €/tête par culture/espèce, qui sert de proxy pour les aides couplées
//    végétales/animales et l'ICHN (très variables et non modélisées ici).
//
// AVERTISSEMENT GLOBAL : tous ces montants sont indicatifs. Les vrais taux
// (nationaux/régionaux), seuils, plafonds, convergence des DPB, éligibilité
// à l'écorégime, etc. varient chaque campagne et ne sont pas reproduits ici.
// Ne jamais utiliser ces chiffres comme montant de déclaration officielle.

export const AIDES_DECOUPLEES_BAREME = {
  paiement_base_eur_ha: 70,
  paiement_redistributif_eur_ha: 30,
  seuil_redistributif_ha: 52,
  ecoregime_eur_ha: 60,
};

export const BAREME_EUR_PAR_HA = {
  ble_tendre: 130,
  ble_dur: 145,
  orge: 125,
  mais: 120,
  vigne: 90,
  olivier: 160,
  agrumes: 200,
  chataigneraie: 140,
  maraichage: 180,
  prairie: 110,
  parcours: 80,
  fourrage: 100,
  legumineuses: 150,
  autre: 100,
};

export const BAREME_EUR_PAR_TETE = {
  bovin_viande: 200,
  bovin_lait: 150,
  ovin: 20,
  caprin: 18,
  porcin: 15,
  volaille: 2,
  equin: 50,
  apiculture: 15,
  autre: 10,
};

export function estimerAidesDecouplees(surfaceTotaleHa) {
  const {
    paiement_base_eur_ha,
    paiement_redistributif_eur_ha,
    seuil_redistributif_ha,
    ecoregime_eur_ha,
  } = AIDES_DECOUPLEES_BAREME;

  const surfaceRedistributive = Math.min(surfaceTotaleHa, seuil_redistributif_ha);

  const paiementBase = Math.round(surfaceTotaleHa * paiement_base_eur_ha * 100) / 100;
  const paiementRedistributif =
    Math.round(surfaceRedistributive * paiement_redistributif_eur_ha * 100) / 100;
  const ecoregime = Math.round(surfaceTotaleHa * ecoregime_eur_ha * 100) / 100;

  return {
    paiement_base_eur: paiementBase,
    paiement_redistributif_eur: paiementRedistributif,
    ecoregime_eur: ecoregime,
    total_eur: Math.round((paiementBase + paiementRedistributif + ecoregime) * 100) / 100,
  };
}

export function estimerAideParcelle(parcelle) {
  const culture = (parcelle.culture || "").toLowerCase().trim();
  const tauxParHa = BAREME_EUR_PAR_HA[culture] ?? BAREME_EUR_PAR_HA.autre;
  const montantEstime = Math.round(tauxParHa * parcelle.surface_ha * 100) / 100;

  return {
    parcelleId: parcelle.id,
    nom: parcelle.nom,
    culture: parcelle.culture,
    surface_ha: parcelle.surface_ha,
    taux_eur_par_ha: tauxParHa,
    montant_estime_eur: montantEstime,
  };
}

export function estimerAideCheptel(cheptel) {
  const espece = (cheptel.espece || "").toLowerCase().trim();
  const tauxParTete = BAREME_EUR_PAR_TETE[espece] ?? BAREME_EUR_PAR_TETE.autre;
  const montantEstime = Math.round(tauxParTete * cheptel.effectif * 100) / 100;

  return {
    cheptelId: cheptel.id,
    nom: cheptel.nom,
    espece: cheptel.espece,
    effectif: cheptel.effectif,
    taux_eur_par_tete: tauxParTete,
    montant_estime_eur: montantEstime,
  };
}

export function estimerAides(parcelles, cheptels = []) {
  const detailParcelles = parcelles.map(estimerAideParcelle);
  const detailCheptels = cheptels.map(estimerAideCheptel);

  const totalCouplParcelles = detailParcelles.reduce((sum, p) => sum + p.montant_estime_eur, 0);
  const totalCouplCheptels = detailCheptels.reduce((sum, c) => sum + c.montant_estime_eur, 0);
  const surfaceTotale = parcelles.reduce((sum, p) => sum + p.surface_ha, 0);
  const effectifTotal = cheptels.reduce((sum, c) => sum + c.effectif, 0);

  const aidesDecouplees = estimerAidesDecouplees(surfaceTotale);
  const montantCouplees = Math.round((totalCouplParcelles + totalCouplCheptels) * 100) / 100;

  return {
    avertissement:
      "Estimation indicative uniquement — ne remplace pas le calcul officiel PAC/TéléPAC. " +
      "Les aides découplées sont calculées sur la seule surface totale (comme dans la réalité) ; " +
      "les montants par production sont un proxy pour les aides couplées, non un calcul officiel.",
    surface_totale_ha: Math.round(surfaceTotale * 100) / 100,
    effectif_total: effectifTotal,
    aides_decouplees: aidesDecouplees,
    montant_couplees_eur: montantCouplees,
    montant_surfaces_eur: Math.round(totalCouplParcelles * 100) / 100,
    montant_cheptel_eur: Math.round(totalCouplCheptels * 100) / 100,
    montant_total_estime_eur:
      Math.round((aidesDecouplees.total_eur + montantCouplees) * 100) / 100,
    detail_parcelles: detailParcelles,
    detail_cheptels: detailCheptels,
  };
}
