const CULTURE_LABELS = {
  ble_tendre: "Blé tendre",
  ble_dur: "Blé dur",
  orge: "Orge",
  mais: "Maïs",
  vigne: "Vigne (viticulture)",
  olivier: "Oliveraie",
  agrumes: "Agrumes",
  chataigneraie: "Châtaigneraie",
  maraichage: "Maraîchage",
  prairie: "Prairie",
  parcours: "Parcours / maquis",
  fourrage: "Fourrage",
  legumineuses: "Légumineuses",
  autre: "Autre",
};

const ESPECE_LABELS = {
  bovin_viande: "Bovin viande",
  bovin_lait: "Bovin lait",
  ovin: "Ovin",
  caprin: "Caprin",
  porcin: "Porcin",
  volaille: "Volaille",
  equin: "Équin",
  apiculture: "Apiculture (ruches)",
  autre: "Autre",
};

let token = localStorage.getItem("pac_token");
let userEmail = localStorage.getItem("pac_email");

const $ = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || "Erreur inconnue");
  return data;
}

function setSession(newToken, email) {
  token = newToken;
  userEmail = email;
  localStorage.setItem("pac_token", token);
  localStorage.setItem("pac_email", email);
}

function clearSession() {
  token = null;
  userEmail = null;
  localStorage.removeItem("pac_token");
  localStorage.removeItem("pac_email");
}

function showApp() {
  $("authSection").classList.add("hidden");
  $("appSection").classList.remove("hidden");
  $("userBar").classList.remove("hidden");
  $("userLabel").textContent = userEmail;
  refreshAll();
}

function showAuth() {
  $("authSection").classList.remove("hidden");
  $("appSection").classList.add("hidden");
  $("userBar").classList.add("hidden");
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    $("loginForm").classList.toggle("hidden", btn.dataset.tab !== "login");
    $("registerForm").classList.toggle("hidden", btn.dataset.tab !== "register");
  });
});

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("loginError").textContent = "";
  try {
    const email = $("loginEmail").value;
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: $("loginPassword").value }),
    });
    setSession(data.token, email);
    showApp();
  } catch (err) {
    $("loginError").textContent = err.message;
  }
});

$("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("registerError").textContent = "";
  try {
    const email = $("registerEmail").value;
    const data = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password: $("registerPassword").value,
        nom_exploitation: $("registerNom").value,
      }),
    });
    setSession(data.token, email);
    showApp();
  } catch (err) {
    $("registerError").textContent = err.message;
  }
});

$("logoutBtn").addEventListener("click", () => {
  clearSession();
  showAuth();
});

function resetParcelleForm() {
  $("parcelleId").value = "";
  $("parcelleForm").reset();
  $("parcelleSubmitBtn").textContent = "Ajouter la parcelle";
  $("parcelleCancelBtn").classList.add("hidden");
}

$("parcelleCancelBtn").addEventListener("click", resetParcelleForm);

$("parcelleForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("parcelleError").textContent = "";
  const id = $("parcelleId").value;
  const payload = {
    nom: $("parcelleNom").value,
    culture: $("parcelleCulture").value,
    surface_ha: parseFloat($("parcelleSurface").value),
    commune: $("parcelleCommune").value,
  };
  try {
    await api(id ? `/parcelles/${id}` : "/parcelles", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    resetParcelleForm();
    refreshAll();
  } catch (err) {
    $("parcelleError").textContent = err.message;
  }
});

function editParcelle(p) {
  $("parcelleId").value = p.id;
  $("parcelleNom").value = p.nom;
  $("parcelleCulture").value = p.culture;
  $("parcelleSurface").value = p.surface_ha;
  $("parcelleCommune").value = p.commune || "";
  $("parcelleSubmitBtn").textContent = "Enregistrer les modifications";
  $("parcelleCancelBtn").classList.remove("hidden");
  $("parcelleNom").focus();
}

async function deleteParcelle(id) {
  if (!confirm("Supprimer cette parcelle ?")) return;
  await api(`/parcelles/${id}`, { method: "DELETE" });
  refreshAll();
}

function renderParcelles(parcelles) {
  const tbody = document.querySelector("#parcellesTable tbody");
  tbody.innerHTML = "";
  for (const p of parcelles) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.nom}</td>
      <td>${CULTURE_LABELS[p.culture] || p.culture}</td>
      <td>${p.surface_ha}</td>
      <td>${p.commune || "–"}</td>
      <td class="actions"></td>
    `;
    const editBtn = document.createElement("button");
    editBtn.textContent = "Modifier";
    editBtn.className = "secondary";
    editBtn.addEventListener("click", () => editParcelle(p));

    const delBtn = document.createElement("button");
    delBtn.textContent = "Supprimer";
    delBtn.className = "secondary";
    delBtn.addEventListener("click", () => deleteParcelle(p.id));

    tr.querySelector(".actions").append(editBtn, delBtn);
    tbody.appendChild(tr);
  }
}

function resetCheptelForm() {
  $("cheptelId").value = "";
  $("cheptelForm").reset();
  $("cheptelSubmitBtn").textContent = "Ajouter au cheptel";
  $("cheptelCancelBtn").classList.add("hidden");
}

$("cheptelCancelBtn").addEventListener("click", resetCheptelForm);

$("cheptelForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("cheptelError").textContent = "";
  const id = $("cheptelId").value;
  const payload = {
    nom: $("cheptelNom").value,
    espece: $("cheptelEspece").value,
    effectif: parseInt($("cheptelEffectif").value, 10),
    commune: $("cheptelCommune").value,
  };
  try {
    await api(id ? `/cheptels/${id}` : "/cheptels", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    resetCheptelForm();
    refreshAll();
  } catch (err) {
    $("cheptelError").textContent = err.message;
  }
});

function editCheptel(c) {
  $("cheptelId").value = c.id;
  $("cheptelNom").value = c.nom;
  $("cheptelEspece").value = c.espece;
  $("cheptelEffectif").value = c.effectif;
  $("cheptelCommune").value = c.commune || "";
  $("cheptelSubmitBtn").textContent = "Enregistrer les modifications";
  $("cheptelCancelBtn").classList.remove("hidden");
  $("cheptelNom").focus();
}

async function deleteCheptel(id) {
  if (!confirm("Supprimer ce cheptel ?")) return;
  await api(`/cheptels/${id}`, { method: "DELETE" });
  refreshAll();
}

function renderCheptels(cheptels) {
  const tbody = document.querySelector("#cheptelsTable tbody");
  tbody.innerHTML = "";
  for (const c of cheptels) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.nom}</td>
      <td>${ESPECE_LABELS[c.espece] || c.espece}</td>
      <td>${c.effectif}</td>
      <td>${c.commune || "–"}</td>
      <td class="actions"></td>
    `;
    const editBtn = document.createElement("button");
    editBtn.textContent = "Modifier";
    editBtn.className = "secondary";
    editBtn.addEventListener("click", () => editCheptel(c));

    const delBtn = document.createElement("button");
    delBtn.textContent = "Supprimer";
    delBtn.className = "secondary";
    delBtn.addEventListener("click", () => deleteCheptel(c.id));

    tr.querySelector(".actions").append(editBtn, delBtn);
    tbody.appendChild(tr);
  }
}

function renderAides(estimation) {
  $("aidesAvertissement").textContent = estimation.avertissement;
  $("statSurface").textContent = estimation.surface_totale_ha;
  $("statEffectif").textContent = estimation.effectif_total;
  $("statMontant").textContent = estimation.montant_total_estime_eur;

  const ad = estimation.aides_decouplees;
  $("decouplBase").textContent = ad.paiement_base_eur;
  $("decouplRedistributif").textContent = ad.paiement_redistributif_eur;
  $("decouplEcoregime").textContent = ad.ecoregime_eur;
  $("decouplTotal").textContent = ad.total_eur;

  const parcellesBody = document.querySelector("#aidesParcellesTable tbody");
  parcellesBody.innerHTML = "";
  for (const d of estimation.detail_parcelles) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.nom}</td>
      <td>${CULTURE_LABELS[d.culture] || d.culture}</td>
      <td>${d.surface_ha}</td>
      <td>${d.taux_eur_par_ha}</td>
      <td>${d.montant_estime_eur}</td>
    `;
    parcellesBody.appendChild(tr);
  }

  const cheptelsBody = document.querySelector("#aidesCheptelsTable tbody");
  cheptelsBody.innerHTML = "";
  for (const d of estimation.detail_cheptels) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.nom}</td>
      <td>${ESPECE_LABELS[d.espece] || d.espece}</td>
      <td>${d.effectif}</td>
      <td>${d.taux_eur_par_tete}</td>
      <td>${d.montant_estime_eur}</td>
    `;
    cheptelsBody.appendChild(tr);
  }
}

async function refreshAll() {
  try {
    const [parcelles, cheptels, aides] = await Promise.all([
      api("/parcelles"),
      api("/cheptels"),
      api("/aides/estimation"),
    ]);
    renderParcelles(parcelles);
    renderCheptels(cheptels);
    renderAides(aides);
  } catch (err) {
    if (err.message.includes("Token") || err.message.includes("Authentification")) {
      clearSession();
      showAuth();
    }
  }
}

async function telechargerExport(path, filename) {
  const res = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

$("exportBtn").addEventListener("click", () =>
  telechargerExport("/declaration/export", "recapitulatif-pac.csv")
);

$("exportPdfBtn").addEventListener("click", () =>
  telechargerExport("/declaration/export-pdf", "recapitulatif-pac.pdf")
);

if (token) showApp();
else showAuth();
