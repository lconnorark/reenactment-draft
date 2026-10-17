/* Spycraft — Prairie Grove
   - Union Code‑Breaker: decrypt Vigenère + analysis tools (IOC, repeated trigrams)
   - Confederate Signaler: compose & encipher using documented wartime keywords
   - Reads ?mode=union|confed, ?unit=..., ?return=..., ?lock=1 (optional)
   - Document‑relative; GitHub Pages‑friendly
*/

/* ---------- DOM ---------- */
const ctxLine      = document.getElementById("ctxLine");
const roleTabs     = document.getElementById("roleTabs");
const tabUnion     = document.getElementById("tabUnion");
const tabConfed    = document.getElementById("tabConfed");

const unionPanel   = document.getElementById("unionPanel");
const confedPanel  = document.getElementById("confedPanel");

const returnBar    = document.getElementById("returnBar");
const returnBtn    = document.getElementById("returnBtn");
const toastHost    = document.getElementById("toastHost");

/* Union controls */
const cipherText   = document.getElementById("cipherText");
const newInterceptBtn = document.getElementById("newInterceptBtn");
const clearInterceptBtn= document.getElementById("clearInterceptBtn");
const keyGuess     = document.getElementById("keyGuess");
const tryKeyBtn    = document.getElementById("tryKeyBtn");
const hintBtn      = document.getElementById("hintBtn");
const iocBtn       = document.getElementById("iocBtn");
const repeatsBtn   = document.getElementById("repeatsBtn");
const analysisOut  = document.getElementById("analysisOut");
const plainOut     = document.getElementById("plainOut");
const historicBadge= document.getElementById("historicBadge");
const statusBadge  = document.getElementById("statusBadge");

/* Confederate controls */
const msgInput     = document.getElementById("msgInput");
const keySelect    = document.getElementById("keySelect");
const encipherBtn  = document.getElementById("encipherBtn");
const clearConfedBtn= document.getElementById("clearConfedBtn");
const cipherOut    = document.getElementById("cipherOut");

/* ---------- Params & mode ---------- */
function getParams() {
  const p = new URLSearchParams(location.search);
  return {
    mode: (p.get("mode") || "union").toLowerCase(),   // 'union' or 'confed'
    unit: p.get("unit") || "",
    ret:  p.get("return") || "",
    lock: p.get("lock") === "1"
  };
}

/* ---------- Utilities ---------- */
function toast(msg) {
  const box = document.createElement("div");
  box.className = "toast";
  box.textContent = msg;
  toastHost.appendChild(box);
  setTimeout(() => box.remove(), 1600);
}
function onlyLetters(s) { return s.toUpperCase().replace(/[^A-Z]/g, ""); }
function normalizeKey(k) { return onlyLetters(k); }

const A = "A".charCodeAt(0);

/* Vigenère core */
function vigenereEncrypt(plain, key) {
  const P = onlyLetters(plain);
  const K = normalizeKey(key);
  if (!P || !K) return "";
  let out = "";
  for (let i = 0, j = 0; i < P.length; i++) {
    const pi = P.charCodeAt(i) - A;
    const ki = K.charCodeAt(j % K.length) - A;
    out += String.fromCharCode(A + ((pi + ki) % 26));
    j++;
  }
  return out;
}
function vigenereDecrypt(cipher, key) {
  const C = onlyLetters(cipher);
  const K = normalizeKey(key);
  if (!C || !K) return "";
  let out = "";
  for (let i = 0, j = 0; i < C.length; i++) {
    const ci = C.charCodeAt(i) - A;
    const ki = K.charCodeAt(j % K.length) - A;
    out += String.fromCharCode(A + ((ci - ki + 26) % 26));
    j++;
  }
  return out;
}

/* Analysis: Index of Coincidence */
function indexOfCoincidence(text) {
  const T = onlyLetters(text);
  const N = T.length; if (N < 2) return 0;
  const freq = Array(26).fill(0);
  for (const ch of T) freq[ch.charCodeAt(0) - A]++;
  let num = 0; for (const f of freq) num += f * (f - 1);
  return num / (N * (N - 1));
}
/* Friedman estimate: K ≈ (0.026*N) / ((0.065 - IC) + N*(IC - 0.038)) */
function friedmanKeyEstimate(text) {
  const T = onlyLetters(text);
  const N = T.length;
  if (N < 30) return { N, IC: indexOfCoincidence(T), K: 1 };
  const IC = indexOfCoincidence(T);
  const K = (0.026 * N) / ((0.065 - IC) + (N * (IC - 0.038)));
  return { N, IC, K };
}
/* Repeated trigrams & gcd of distances (basic Kasiski-style hint) */
function repeatedTrigrams(text) {
  const T = onlyLetters(text);
  const pos = new Map();
  for (let i = 0; i <= T.length - 3; i++) {
    const tri = T.slice(i, i + 3);
    if (!pos.has(tri)) pos.set(tri, []);
    pos.get(tri).push(i);
  }
  const repeats = [];
  const gcds = [];
  function gcd(a, b){ return b ? gcd(b, a % b) : a; }
  for (const [tri, arr] of pos) {
    if (arr.length >= 2) {
      const dists = [];
      for (let i = 1; i < arr.length; i++) dists.push(arr[i] - arr[i-1]);
      const g = dists.reduce((a,b) => gcd(a,b));
      repeats.push({ tri, positions: arr, dists, gcd: g });
      gcds.push(g);
    }
  }
  return { repeats, gcds };
}

/* ---------- Data ---------- */
/* Documented Confederate wartime keywords (examples) */
const HISTORIC_KEYS = [
  "Manchester Bluff",
  "Complete Victory",
  "Come Retribution",
  "My Old Kentucky Home"
];
function isHistoricKey(k) {
  const canon = k.toLowerCase().replace(/[^a-z]/g,"");
  return ["manchesterbluff","completevictory","comeretribution","myoldkentuckyhome"].includes(canon);
}

/* Intercept messages (you can edit/extend these) */
const INTERCEPTS = [
  "blunt attacks left from the northwest near sunset hold the crest and conserve rounds",
  "federal artillery duels across the illinois river before repeated assaults on the ridge",
  "withdraw toward van buren at midnight if ammunition falls critically low on the line",
  "coordinate with herron to keep intervals closed along the center while the left resists",
  "use the orchard hedge as cover then refuse the flank if pressed in the western woods"
];

/* ---------- Mode handling ---------- */
function setCtx(mode, unit) {
  const role = mode === "confed" ? "Confederate Signaler" : "Union Code‑Breaker";
  ctxLine.textContent = unit ? `${role} • Unit: ${unit}` : role;
}
function setActiveMode(mode, lockTabs=false) {
  if (lockTabs) roleTabs.classList.add("hidden");
  else roleTabs.classList.remove("hidden");
  tabUnion.classList.toggle("active", mode === "union");
  tabConfed.classList.toggle("active", mode === "confed");
  unionPanel.classList.toggle("hidden", mode !== "union");
  confedPanel.classList.toggle("hidden", mode !== "confed");
}

/* ---------- Union: intercept generation ---------- */
function newIntercept() {
  const msg = INTERCEPTS[Math.floor(Math.random() * INTERCEPTS.length)];
  const key = HISTORIC_KEYS[Math.floor(Math.random() * HISTORIC_KEYS.length)];
  const C = vigenereEncrypt(msg, key);
  cipherText.value = C;
  plainOut.value = ""; keyGuess.value = ""; analysisOut.textContent = "";
  historicBadge.textContent = "—"; statusBadge.textContent = "—";
}

/* ---------- Wire‑up ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const { mode, unit, ret, lock } = getParams();

  /* Context + Return */
  setCtx(mode, unit);
  if (ret) {
    returnBar.classList.remove("hidden");
    returnBtn.addEventListener("click", () => { location.href = ret; });
  }

  /* Tabs */
  setActiveMode(mode, lock);
  tabUnion.addEventListener("click", () => setActiveMode("union", false));
  tabConfed.addEventListener("click", () => setActiveMode("confed", false));

  /* Populate Confederate keyword list */
  keySelect.replaceChildren();
  HISTORIC_KEYS.forEach(k => {
    const opt = document.createElement("option");
    opt.value = k; opt.textContent = k;
    keySelect.appendChild(opt);
  });

  /* Union: events */
  newInterceptBtn.addEventListener("click", newIntercept);
  clearInterceptBtn.addEventListener("click", () => {
    cipherText.value = ""; plainOut.value = ""; keyGuess.value = ""; analysisOut.textContent = "";
    historicBadge.textContent = "—"; statusBadge.textContent = "—";
  });

  tryKeyBtn.addEventListener("click", () => {
    const k = keyGuess.value.trim();
    if (!k) { toast("Enter a keyword guess."); return; }
    const P = vigenereDecrypt(cipherText.value, k);
    plainOut.value = P;

    const isHist = isHistoricKey(k);
    historicBadge.textContent = isHist ? "Yes (documented)" : "No";

    const normalized = P.toLowerCase().replace(/[^a-z]/g,"");
    const success = INTERCEPTS.some(m => m.replace(/[^a-z]/g,"") === normalized);
    statusBadge.textContent = success ? "✔ Correct" : (P ? "Produced text" : "—");
    toast(success ? "Correct decryption!" : (P ? "Decryption produced text—try another keyword." : "No output—check your key."));
  });

  hintBtn.addEventListener("click", () => {
    analysisOut.textContent = [
      "Historic keywords:",
      ...HISTORIC_KEYS.map(k => `• ${k}`)
    ].join("\n");
  });

  iocBtn.addEventListener("click", () => {
    const stats = friedmanKeyEstimate(cipherText.value);
    analysisOut.textContent =
      `Length N=${stats.N}\nIndex of Coincidence IC=${stats.IC.toFixed(4)}\nEstimated key length K≈${stats.K.toFixed(1)}\n` +
      `Tip: Confederate keywords were often long phrases (15–17 letters when normalized).`;
  });

  repeatsBtn.addEventListener("click", () => {
    const rep = repeatedTrigrams(cipherText.value);
    const lines = [];
    rep.repeats.slice(0, 10).forEach(r => {
      lines.push(`${r.tri} @ [${r.positions.join(", ")}], dists=[${r.dists.join(", ")}], gcd=${r.gcd}`);
    });
    const uniq = Array.from(new Set(rep.gcds)).filter(Boolean).sort((a,b)=>a-b);
    analysisOut.textContent =
      (lines.length ? lines.join("\n") + "\n" : "No repeated trigrams detected.\n") +
      `Likely key-length factors → ${uniq.join(", ") || "—"}.`;
  });

  /* Confederate: events */
  encipherBtn.addEventListener("click", () => {
    const plain = msgInput.value.trim();
    const key   = keySelect.value;
    if (!plain) { toast("Enter plaintext."); return; }
    const C = vigenereEncrypt(plain, key);
    cipherOut.value = C;
  });
  clearConfedBtn.addEventListener("click", () => {
    msgInput.value = ""; cipherOut.value = "";
  });

  /* Default content */
  if (mode === "union") newIntercept();
});

/* ---------- End ---------- */
