/* Prairie Grove — Enlist flow (focused)
   - Marching Orders deep‑link only (five spots per unit)
   - Opens in the same tab (no new window)
   - Removed High‑contrast feature
   - Removed "Begin Experience" on selection screen
   - Unit summaries on Selection & Experience screens
   - Deep link hydration (?side=...&unit=...) and resume prompt preserved
*/

// --- Data --------------------------------------------------------------------
const militaryUnits = {
  union: [
    "19th Iowa Infantry",
    "20th Wisconsin Infantry",
    "13th Kansas Infantry",
    "1st Indian Home Guard"
  ],
  confederate: [
    "34th Arkansas Infantry",
    "2nd Arkansas Infantry",
    "10th Missouri Cavalry",
    "Blocher's Artillery Battery"
  ]
};

const sideNames = { union: "Union Army", confederate: "Confederate Army" };

const unitImages = {
  "19th Iowa Infantry": {
    src: "./images/units/19th-iowa.jpg",
    alt: "Soldiers of the 19th Iowa Infantry, circa 1862",
    credit: "Courtesy of Iowa State Historical Society"
  },
  "34th Arkansas Infantry": {
    src: "./images/units/34th-arkansas.jpg",
    alt: "Flag and members of the 34th Arkansas Infantry",
    credit: "Courtesy of Arkansas State Archives"
  },
  "20th Wisconsin Infantry": {
    src: "./images/units/20th-wisconsin.jpg",
    alt: "The 20th Wisconsin Infantry, 1862",
    credit: ""
  },
  "13th Kansas Infantry": {
    src: "./images/units/13th-kansas.jpg",
    alt: "The 13th Kansas, 1863",
    credit: ""
  },
  "1st Indian Home Guard": {
    src: "./images/units/1st-indian.jpg",
    alt: "The 1st Indian Home Guard, 1864",
    credit: ""
  },
  "2nd Arkansas Infantry": {
    src: "./images/units/2nd-arkansas.jpg",
    alt: "The 2nd Arkansas, 1865",
    credit: ""
  },
  "10th Missouri Cavalry": {
    src: "./images/units/10th-missouri.jpg",
    alt: "The 10th Missouri Cavalry, 1863",
    credit: ""
  },
  "Blocher's Artillery Battery": {
    src: "./images/units/blochers-battery.jpg",
    alt: "Blocher's Artillery Battery, 1864",
    credit: ""
  }
};

/* Unit summaries (neutral, concise; adjust any line as needed) */
const unitMeta = {
  "19th Iowa Infantry": {
    type: "Infantry",
    summary: "A volunteer regiment from Iowa serving in the Trans‑Mississippi theater. At Prairie Grove, companies advanced over open prairie under artillery fire and supported line stability."
  },
  "20th Wisconsin Infantry": {
    type: "Infantry",
    summary: "Raised in 1862 and posted west of the Mississippi. At Prairie Grove, the regiment helped hold intervals across the center under intermittent shelling."
  },
  "13th Kansas Infantry": {
    type: "Infantry",
    summary: "A Kansas volunteer unit active along the frontier and into Arkansas. Companies rotated through skirmish lines and reinforced positions to stabilize the Union front."
  },
  "1st Indian Home Guard": {
    type: "Infantry",
    summary: "Native volunteers from Indian Territory serving with Union columns. At Prairie Grove they assisted with screening, counter‑skirmishing, and anchoring segments of the line."
  },
  "34th Arkansas Infantry": {
    type: "Infantry",
    summary: "Organized in Arkansas in 1862. At Prairie Grove, the regiment formed on the wooded ridge and helped repulse assaults up the slope before nightfall."
  },
  "2nd Arkansas Infantry": {
    type: "Infantry",
    summary: "Deployed across western Arkansas and the Indian Territory. On the ridge near Prairie Grove, its role emphasized holding intervals and conserving ammunition late in the day."
  },
  "10th Missouri Cavalry": {
    type: "Cavalry",
    summary: "Missouri troopers tasked with screening and reconnaissance. During the action they scouted approaches, probed Union screens, and relayed reports along the line."
  },
  "Blocher's Artillery Battery": {
    type: "Artillery",
    summary: "A field battery supporting Confederate positions. Its fire contested Union guns across the Illinois River and disrupted infantry pushes on the slope."
  }
};

// --- State -------------------------------------------------------------------
let selectedSideKey = "";
let selectedUnitName = "";

// --- DOM ---------------------------------------------------------------------
const startScreen = document.getElementById("startScreen");
const unitScreen = document.getElementById("unitScreen");
const selectionScreen = document.getElementById("selectionScreen");
const experienceScreen = document.getElementById("experienceScreen");

const sideLabel = document.getElementById("sideLabel");
const unitHeading = document.getElementById("unitHeading");
const unitInstructions = document.getElementById("unitInstructions");
const unitList = document.getElementById("unitList");

const selectedSide = document.getElementById("selectedSide");
const selectedUnit = document.getElementById("selectedUnit");
const selectionMessage = document.getElementById("selectionMessage");

const experienceSide = document.getElementById("experienceSide");
const experienceUnit = document.getElementById("experienceUnit");

const sideButtons = document.querySelectorAll("[data-side]");
const shareLinkBtn = document.getElementById("shareLinkBtn");

const backButton = document.getElementById("backButton");
const changeUnitButton = document.getElementById("changeUnitButton");
const restartButton = document.getElementById("restartButton");
const experienceRestartButton = document.getElementById("experienceRestartButton");

const resumeBox = document.getElementById("resumeBox");
const resumeSide = document.getElementById("resumeSide");
const resumeUnit = document.getElementById("resumeUnit");
const resumeBtn = document.getElementById("resumeBtn");
const dismissResumeBtn = document.getElementById("dismissResumeBtn");

const qaRow = document.getElementById("qaRow");

const selectionSummary = document.getElementById("selectionSummary");
const summaryTypeBadge = document.getElementById("summaryTypeBadge");
const summaryText = document.getElementById("summaryText");

const experienceSummary = document.getElementById("experienceSummary");
const summaryTypeBadgeExp = document.getElementById("summaryTypeBadgeExp");
const summaryTextExp = document.getElementById("summaryTextExp");

const toastHost = document.getElementById("toastHost");

// --- Events: side choice & navigation ---------------------------------------
sideButtons.forEach((button) => button.addEventListener("click", () => showUnitOptions(button.dataset.side)));
backButton.addEventListener("click", showStartScreen);
changeUnitButton.addEventListener("click", returnToUnitOptions);
restartButton.addEventListener("click", restartExperience);
experienceRestartButton.addEventListener("click", restartExperience);
shareLinkBtn.addEventListener("click", copyLaunchLink);

// Resume prompt
resumeBtn.addEventListener("click", () => {
  const saved = getSavedSelection();
  if (saved?.side && saved?.unit) {
    selectedSideKey = saved.side;
    showUnitOptions(saved.side);
    selectUnit(saved.unit);
  }
  resumeBox.classList.add("hidden");
});
dismissResumeBtn.addEventListener("click", () => resumeBox.classList.add("hidden"));

// Pressed state (touch/mouse)
document.addEventListener("pointerdown", (event) => {
  const button = event.target.closest(".touch-btn");
  if (!button || button.disabled) return;
  button.classList.add("is-pressed");
});
["pointerup","pointercancel"].forEach(ev => document.addEventListener(ev, clearPressedButtons));
document.addEventListener("pointerleave", (event) => { if (event.pointerType === "mouse") clearPressedButtons(); });
window.addEventListener("blur", clearPressedButtons);
function clearPressedButtons() { document.querySelectorAll(".touch-btn.is-pressed").forEach((b) => b.classList.remove("is-pressed")); }

// --- Screens -----------------------------------------------------------------
function hideAllScreens() {
  startScreen.classList.add("hidden");
  unitScreen.classList.add("hidden");
  selectionScreen.classList.add("hidden");
  experienceScreen.classList.add("hidden");
}
function showStartScreen() {
  hideAllScreens();
  startScreen.classList.remove("hidden");

  const firstSideButton = startScreen.querySelector("[data-side]");
  if (firstSideButton) firstSideButton.focus();

  const saved = getSavedSelection();
  if (saved?.side && saved?.unit) {
    resumeSide.textContent = sideNames[saved.side] || saved.side;
    resumeUnit.textContent = saved.unit;
    resumeBox.classList.remove("hidden");
  } else {
    resumeBox.classList.add("hidden");
  }
}

function showUnitOptions(sideKey) {
  if (!Object.prototype.hasOwnProperty.call(militaryUnits, sideKey)) return;
  selectedSideKey = sideKey;
  selectedUnitName = "";

  hideAllScreens();
  unitScreen.classList.remove("hidden");

  sideLabel.textContent = sideNames[sideKey];
  sideLabel.classList.remove("union-label","confederate-label");
  sideLabel.classList.add(sideKey + "-label");

  unitHeading.textContent = "Choose a " + sideNames[sideKey] + " Unit";
  unitInstructions.textContent = "Select one of the military units below to continue.";

  createUnitButtons(militaryUnits[sideKey]);

  const firstUnitButton = unitList.querySelector(".unit-btn");
  if (firstUnitButton) firstUnitButton.focus();
}

function createUnitButtons(units) {
  unitList.replaceChildren();
  units.forEach((unitName) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "unit-btn touch-btn";
    button.textContent = unitName;
    button.setAttribute("aria-label", "Select " + unitName);
    button.addEventListener("click", () => selectUnit(unitName));
    unitList.appendChild(button);
  });

  // Keyboard nav (once per render)
  unitList.addEventListener("keydown", (e) => {
    const items = Array.from(unitList.querySelectorAll(".unit-btn"));
    const idx = items.indexOf(document.activeElement);
    const k = e.key.toLowerCase();
    if (k === "arrowdown" || k === "arrowright") {
      e.preventDefault(); items[Math.min(items.length - 1, (idx < 0 ? 0 : idx + 1))]?.focus();
    } else if (k === "arrowup" || k === "arrowleft") {
      e.preventDefault(); items[Math.max(0, (idx < 0 ? 0 : idx - 1))]?.focus();
    } else if (k === "enter" || k === " ") {
      e.preventDefault(); if (idx >= 0) items[idx].click();
    }
  }, { once: true });
}

// --- Images ------------------------------------------------------------------
function ensureImageElement(imgId, containerId) {
  let img = document.getElementById(imgId);
  if (!img) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    img = document.createElement("img");
    img.id = imgId; img.loading = "lazy";
    container.insertBefore(img, container.firstChild);
  }
  return img;
}
function renderUnitImage(containerId, imgId, captionId, unitName) {
  const container = document.getElementById(containerId);
  const caption = document.getElementById(captionId);
  if (!container || !caption) return;

  const img = ensureImageElement(imgId, containerId);
  const meta = unitImages[unitName];

  function hide() {
    if (img) { img.removeAttribute("src"); img.alt = ""; }
    caption.textContent = "";
    container.classList.add("hidden");
  }
  if (meta && meta.src) {
    img.src = meta.src; img.alt = meta.alt || unitName;
    caption.textContent = meta.credit ? `Image: ${meta.credit}` : "";
    container.classList.remove("hidden");
    img.onerror = () => hide();
  } else {
    hide();
  }
}
function renderSelectionImage(unitName) { renderUnitImage("selectionImageContainer","selectionImage","selectionImageCaption",unitName); }
function renderExperienceImage(unitName) { renderUnitImage("experienceImageContainer","experienceImage","experienceImageCaption",unitName); }

// --- Unit summaries ----------------------------------------------------------
function renderUnitSummary(target) {
  const meta = unitMeta[selectedUnitName];
  if (!meta) {
    target.container.classList.add("hidden");
    target.badge.textContent = "";
    target.text.textContent = "";
    return;
  }
  target.badge.textContent = meta.type || "Unit";
  target.text.textContent = meta.summary || "";
  target.container.classList.remove("hidden");
}

// --- Selection & routing -----------------------------------------------------
function selectUnit(unitName) {
  if (selectedSideKey === "" || !militaryUnits[selectedSideKey].includes(unitName)) return;

  selectedUnitName = unitName;
  selectedSide.textContent = sideNames[selectedSideKey];
  selectedUnit.textContent = selectedUnitName;
  selectionMessage.textContent = "You are ready to proceed to marching orders for this unit.";

  renderSelectionImage(selectedUnitName);
  saveSelection(selectedSideKey, selectedUnitName);

  // Build five marching orders "spots" (open in same tab)
  buildMarchingOrdersSpots();

  // Render summary on Selection screen
  renderUnitSummary({
    container: selectionSummary,
    badge: summaryTypeBadge,
    text: summaryText
  });

  hideAllScreens();
  selectionScreen.classList.remove("hidden");
  changeUnitButton.focus();
}

function returnToUnitOptions() {
  if (selectedSideKey === "") { showStartScreen(); return; }
  showUnitOptions(selectedSideKey);
}

function restartExperience() { showStartScreen(); }

// --- Marching Orders ---------------------------------------------------------
function ordersURL(spot) {
  const p = new URLSearchParams();
  p.set("side", selectedSideKey);
  p.set("unit", selectedUnitName || "");
  p.set("spot", String(spot));
  // Document‑relative path so it works under /<repo>/ on GitHub Pages
  return `./march-orders/index.html?${p.toString()}`;
}

function buildMarchingOrdersSpots() {
  qaRow.replaceChildren();
  for (let s = 1; s <= 5; s++) {
    const b = document.createElement("button");
    b.className = "secondary-btn touch-btn";
    b.type = "button";
    b.textContent = `Open Marching Orders — Spot ${s}`;
    b.setAttribute("aria-label", `Open marching orders for spot ${s}`);
    b.addEventListener("click", () => openInSameTab(ordersURL(s)));
    qaRow.appendChild(b);
  }
}

function openInSameTab(href) { location.href = href; }

// --- Experience (placeholder + summary mirror) -------------------------------
function beginExperiencePlaceholder() {
  // Not used (Begin Experience removed). Kept for future extension if needed.
}
function showExperienceWithSummary() {
  // Optional educator view; called elsewhere if you decide to route here later.
  if (selectedSideKey === "" || selectedUnitName === "") return;

  experienceSide.textContent = sideNames[selectedSideKey];
  experienceSide.classList.remove("union-label","confederate-label");
  experienceSide.classList.add(selectedSideKey + "-label");
  experienceUnit.textContent = selectedUnitName;

  renderExperienceImage(selectedUnitName);
  renderUnitSummary({
    container: experienceSummary,
    badge: summaryTypeBadgeExp,
    text: summaryTextExp
  });

  hideAllScreens();
  experienceScreen.classList.remove("hidden");
  experienceRestartButton.focus();
}

// --- Share launch link (side+unit), not orders copy --------------------------
const STORAGE_KEY = "pg_enlist_selection";
function saveSelection(side, unit) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ side, unit })); } catch {} }
function getSavedSelection() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; } }

function copyLaunchLink() {
  if (!selectedSideKey) { toast("Choose a side first."); return; }
  const unit = selectedUnitName || "";
  const params = new URLSearchParams();
  params.set("side", selectedSideKey);
  if (unit) params.set("unit", unit);
  const url = `${location.origin}${location.pathname}?${params.toString()}`;
  copy(url, "Launch link copied to clipboard.");
}

function copy(text, okMsg="Copied.") {
  navigator.clipboard?.writeText(text)
    .then(() => toast(okMsg))
    .catch(() => toast("Unable to copy link."));
}

// --- Deep‑link hydration -----------------------------------------------------
function hydrateFromURL() {
  const p = new URLSearchParams(location.search);
  const s = p.get("side");
  const u = p.get("unit");

  if (s && Object.prototype.hasOwnProperty.call(militaryUnits, s)) {
    showUnitOptions(s);
    if (u && militaryUnits[s].includes(u)) { selectUnit(u); return; }
    return; // no unit yet—stay on unit selection
  }
  showStartScreen();
}

// --- Toast -------------------------------------------------------------------
function toast(msg) {
  const box = document.createElement("div");
  box.className = "toast";
  box.textContent = msg;
  toastHost.appendChild(box);
  setTimeout(() => box.remove(), 1800);
}

// --- Init --------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", hydrateFromURL);
