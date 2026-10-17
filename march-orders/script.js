/* Marching Orders — consecutive flow with game stops
   - Reads ?side, ?unit, ?spot (1..5)
   - Shows the current order content with progress (Order X of 5)
   - Stop 3: Spycraft & Haversack game buttons (side-aware) open in new tab (with return=)
   - Stop 4: Commander's Dilemma button (locked perspective by unit) opens in new tab (with return=)
   - Next → advances spot by +1 (same tab). At 5, Next becomes “Finish” (returns to Enlist with side+unit).
   - Previous → goes back by -1 (disabled at spot 1)
   - Back → returns to Enlist selection page (preserves side+unit params)
*/

// ---------- DOM ----------
const headerContext = document.getElementById("headerContext");
const orderTitle    = document.getElementById("orderTitle");
const orderBody     = document.getElementById("orderBody");

const spotVal       = document.getElementById("spotVal");
const spotMax       = document.getElementById("spotMax");
const prevBtn       = document.getElementById("prevBtn");
const nextBtn       = document.getElementById("nextBtn");
const backBtn       = document.getElementById("backBtn");

const extrasBox     = document.getElementById("extrasBox");

const toastHost     = document.getElementById("toastHost");

// ---------- Config ----------
const SPOT_MAX = 5;
spotMax.textContent = String(SPOT_MAX);

// ---------- Source data (EDIT ME: replace placeholder text with your actual orders) ----------
const ORDERS = {
  union: {
    "19th Iowa Infantry": [
      "Spot 1 — 19th Iowa: Move by companies to the forward prairie edge; maintain interval; await artillery cover.",
      "Spot 2 — 19th Iowa: Advance under shelling in two bounds; avoid bunching near the hedgerow.",
      "Spot 3 — 19th Iowa: Support the center assault; keep skirmishers open and report gaps.",
      "Spot 4 — 19th Iowa: Hold the gained ground on the slope; rotate companies to keep powder dry.",
      "Spot 5 — 19th Iowa: Consolidate line before dusk; tally ammunition and casualties."
    ],
    "20th Wisconsin Infantry": [
      "Spot 1 — 20th Wisconsin: Form on the right of the center; intervals at two paces.",
      "Spot 2 — 20th Wisconsin: Cross the fence line by platoons; watch for canister from the crest.",
      "Spot 3 — 20th Wisconsin: Align with supporting artillery; mark fallen timber for cover.",
      "Spot 4 — 20th Wisconsin: Reinforce the right sub‑sector; send runners for flank reports.",
      "Spot 5 — 20th Wisconsin: Prepare to hold overnight; resupply powder and caps."
    ],
    "13th Kansas Infantry": [
      "Spot 1 — 13th Kansas: Deploy skirmishers toward the orchard; maintain spacing.",
      "Spot 2 — 13th Kansas: Push reconnaissance to the hedgerow; avoid ridge exposure.",
      "Spot 3 — 13th Kansas: Support the center; recover wounded; sustain the line.",
      "Spot 4 — 13th Kansas: Rotate skirmishers; mark lanes for stretcher teams.",
      "Spot 5 — 13th Kansas: Consolidate positions near the orchard; prepare for relief."
    ],
    "1st Indian Home Guard": [
      "Spot 1 — 1st Indian HG: Screen the prairie margin; report enemy movement.",
      "Spot 2 — 1st Indian HG: Extend the left picket; avoid the open crest.",
      "Spot 3 — 1st Indian HG: Stabilize the left; support local counter‑pushes.",
      "Spot 4 — 1st Indian HG: Maintain observation; rotate pickets; conserve ammunition.",
      "Spot 5 — 1st Indian HG: Draw back to the designated line; rendezvous for resupply."
    ]
  },
  confederate: {
    "34th Arkansas Infantry": [
      "Spot 1 — 34th Arkansas: Form on the wooded ridge; dress ranks; conserve rounds.",
      "Spot 2 — 34th Arkansas: Repulse assault up the slope; keep intervals tight.",
      "Spot 3 — 34th Arkansas: Counter‑push to restore line; avoid canister lanes.",
      "Spot 4 — 34th Arkansas: Hold positions; rotate men to maintain cover.",
      "Spot 5 — 34th Arkansas: Prepare to withdraw at night; tally remaining ammunition."
    ],
    "2nd Arkansas Infantry": [
      "Spot 1 — 2nd Arkansas: Dress on colors along the ridge; maintain silence.",
      "Spot 2 — 2nd Arkansas: Engage advancing enemy; steady fire by files.",
      "Spot 3 — 2nd Arkansas: Re‑establish intervals; resupply sergeants to the front.",
      "Spot 4 — 2nd Arkansas: Conserve ammunition; use cover to offset artillery.",
      "Spot 5 — 2nd Arkansas: Night protocol; prepare for silent withdrawal."
    ],
    "10th Missouri Cavalry": [
      "Spot 1 — 10th Missouri Cav: Scout northwest approaches; report Union movement.",
      "Spot 2 — 10th Missouri Cav: Screen left flank; avoid unnecessary carbine fire.",
      "Spot 3 — 10th Missouri Cav: Relay messages along the ridge; guide infantry adjustments.",
      "Spot 4 — 10th Missouri Cav: Maintain contact with pickets; monitor artillery positions.",
      "Spot 5 — 10th Missouri Cav: Fall back to reserve line; prepare for night operations."
    ],
    "Blocher's Artillery Battery": [
      "Spot 1 — Blocher’s Battery: Establish guns on the ridge; check elevation against the river.",
      "Spot 2 — Blocher’s Battery: Contest counterbattery; rotate crews; watch caissons.",
      "Spot 3 — Blocher’s Battery: Support infantry counters; avoid low trails into canister.",
      "Spot 4 — Blocher’s Battery: Conserve shot; maintain readiness for rapid limbering.",
      "Spot 5 — Blocher’s Battery: Prepare to withdraw; secure ammunition; tally fuses."
    ]
  }
};

// ---------- Helpers ----------
function toast(msg) {
  const box = document.createElement("div");
  box.className = "toast";
  box.textContent = msg;
  toastHost.appendChild(box);
  setTimeout(() => box.remove(), 1600);
}
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

function getParams() {
  const p = new URLSearchParams(location.search);
  const side = (p.get("side") || "").toLowerCase();
  const unit = p.get("unit") || "";
  let spot = parseInt(p.get("spot") || "1", 10);
  spot = clamp(isNaN(spot) ? 1 : spot, 1, SPOT_MAX);
  return { side, unit, spot };
}

function setParams(side, unit, spot) {
  const p = new URLSearchParams();
  p.set("side", side);
  p.set("unit", unit);
  p.set("spot", String(spot));
  // Same‑tab navigation
  location.href = `./page1.html?${p.toString()}`;
}

function enlistURL(side, unit) {
  const p = new URLSearchParams();
  p.set("side", side); p.set("unit", unit);
  return `./index.html?${p.toString()}`;
}

// Open a link in new tab (for games), carry a return= param
function openGame(url) {
  try { window.open(url, "_blank", "noopener"); }
  catch { location.href = url; }
}

// Map a unit to Commander's Dilemma perspective
function dilemmaPerspective(side, unit) {
  if (side === "confederate") return "confed";
  // Union mapping
  const herronUnits = ["19th Iowa Infantry", "20th Wisconsin Infantry"];
  const bluntUnits  = ["13th Kansas Infantry", "1st Indian Home Guard"];
  if (herronUnits.includes(unit)) return "herron";
  if (bluntUnits.includes(unit))  return "blunt";
  // Fallback (safe): herron
  return "herron";
}

// ---------- Rendering ----------
function render() {
  const { side, unit, spot } = getParams();
  backBtn.onclick = () => { location.href = "./index.html"; };

  // Validate side/unit
  if (!ORDERS[side]) {
    headerContext.textContent = "Invalid side parameter.";
    orderBody.textContent = "Please return to unit selection.";
    prevBtn.disabled = true; nextBtn.disabled = true;
    extrasBox.classList.add("hidden");
    return;
  }
  const sideOrders = ORDERS[side];
  const unitOrders = sideOrders[unit];
  if (!unitOrders || unitOrders.length !== SPOT_MAX) {
    headerContext.textContent = `Orders not found for ${unit}.`;
    orderBody.textContent = "Please return to unit selection.";
    prevBtn.disabled = true; nextBtn.disabled = true;
    extrasBox.classList.add("hidden");
    return;
  }

  // Header context
  const sideName = side === "union" ? "Union Army" : "Confederate Army";
  headerContext.textContent = `${sideName} — ${unit}`;

  // Title + progress
  spotVal.textContent = String(spot);

  // Body
  orderBody.textContent = unitOrders[spot - 1];

  // Build extras for stop 3 & 4
  buildExtras(side, unit, spot);

  // Buttons
  prevBtn.disabled = (spot <= 1);
  nextBtn.textContent = (spot >= SPOT_MAX) ? "Finish" : "Next →";

  prevBtn.onclick = () => setParams(side, unit, spot - 1);
  nextBtn.onclick = () => {
    if (spot >= SPOT_MAX) {
      // Finished — return to Enlist (same tab)
      location.href = enlistURL(side, unit);
    } else {
      setParams(side, unit, spot + 1);
    }
  };
  backBtn.onclick = () => { location.href = enlistURL(side, unit); };
}

function buildExtras(side, unit, spot) {
  extrasBox.replaceChildren();

  // Only show extras at specific stops
  if (spot !== 3 && spot !== 4) {
    extrasBox.classList.add("hidden");
    return;
  }
  extrasBox.classList.remove("hidden");

  const title = document.createElement("h3");
  const row   = document.createElement("div");
  row.className = "extras-row";

  // Compute return URL (back to the same spot)
  const returnURL = `./page1.html?side=${encodeURIComponent(side)}&unit=${encodeURIComponent(unit)}&spot=${spot}`;

  if (spot === 3) {
    title.textContent = "Game Station — Stop 3";
    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = "Optional mini‑games for context. Open in a new tab, then return here and click Next to continue.";

    // Spycraft: mode depends on side
    const spyMode = side === "union" ? "union" : "confed";
    const spyURL = `../spycraft/index.html?mode=${spyMode}&return=${encodeURIComponent(returnURL)}&unit=${encodeURIComponent(unit)}`;

    // Haversack game (no side‑locking required; include side+unit for context)
    const havURL = `../haversack/index.html?side=${encodeURIComponent(side)}&unit=${encodeURIComponent(unit)}&return=${encodeURIComponent(returnURL)}`;

    const spyBtn = document.createElement("button");
    spyBtn.className = "secondary-btn touch-btn";
    spyBtn.type = "button"; spyBtn.textContent = "Open Spycraft";
    spyBtn.addEventListener("click", () => openGame(spyURL));

    const havBtn = document.createElement("button");
    havBtn.className = "secondary-btn touch-btn";
    havBtn.type = "button"; havBtn.textContent = "Open Haversack Game";
    havBtn.addEventListener("click", () => openGame(havURL));

    extrasBox.appendChild(title);
    extrasBox.appendChild(desc);
    row.appendChild(spyBtn);
    row.appendChild(havBtn);
    extrasBox.appendChild(row);
    return;
  }

  if (spot === 4) {
    title.textContent = "Scenario Station — Stop 4";
    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = "Open the locked Commander's Dilemma for your unit. It will launch in a new tab; when finished, return here and click Next.";

    const perspective = dilemmaPerspective(side, unit);
    // Lock perspective via param; include return back to this stop
    const dilemmaURL = `../app/index.html?side=${encodeURIComponent(perspective)}&lock=1&unit=${encodeURIComponent(unit)}&return=${encodeURIComponent(returnURL)}`;

    const cdBtn = document.createElement("button");
    cdBtn.className = "primary-btn touch-btn";
    cdBtn.type = "button"; cdBtn.textContent = "Play Commander's Dilemma";
    cdBtn.addEventListener("click", () => openGame(dilemmaURL));

    extrasBox.appendChild(title);
    extrasBox.appendChild(desc);
    row.appendChild(cdBtn);
    extrasBox.appendChild(row);
    return;
  }
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", render);
