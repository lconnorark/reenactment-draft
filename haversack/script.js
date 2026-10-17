// Haversack Challenge — pick 10 items that total exactly 60 lb.
// Historical references: see Sources in /haversack/index.html

const ITEMS = [
  // NOTE: Several items (marked "approx.") use rounded, integer weights for gameplay.
  // Major weights sourced from Civil War Monitor; item types from NPS accouterments.
  // Citations are listed in the HTML Sources section.

  { id: "rifle_acc", name: "Rifle & accouterments", weight: 14,
    desc: "Firearm grouped with bayonet, belt & boxes (within 11–14 lb range).",
    refs: ["turn17search20"] }, // Civil War Monitor

  { id: "ammo", name: "Ammunition (cartridges)", weight: 5,
    desc: "Typical carried ammunition on campaign (~5 lb).",
    refs: ["turn17search25"] }, // NPS Appomattox

  { id: "canteen_full", name: "Canteen (full)", weight: 4,
    desc: "Water for the march (rounded from ~3.8 lb).",
    refs: ["turn17search20"] }, // Civil War Monitor

  { id: "knapsack_packed", name: "Knapsack (packed)", weight: 15,
    desc: "Clothes, blanket roll & personal items (approx., heavy on campaign).",
    refs: ["turn17search20","turn17search14"] }, // Monitor + NPS accouterments (presence)

  { id: "blanket_wool", name: "Wool blanket", weight: 5,
    desc: "Essential bedding for the field.",
    refs: ["turn17search20"] }, // Monitor

  { id: "shelter_half", name: "Shelter half", weight: 2,
    desc: "Half of a small wedge tent carried by each man (rounded).",
    refs: ["turn17search20"] }, // Monitor

  { id: "haversack_rations", name: "Haversack + 3 days cooked rations", weight: 6,
    desc: "Food carried in tarred canvas haversack (rounded from ~5.75 lb).",
    refs: ["turn17search20"] }, // Monitor

  { id: "mess_tinware", name: "Mess kit (tin cup, plate, utensils)", weight: 2,
    desc: "Tinware for eating (approx.).",
    refs: ["turn17search14"] }, // NPS accouterments

  { id: "gum_blanket", name: "Gum blanket (ground cloth)", weight: 2,
    desc: "Rubberized cloth to keep bedding off wet ground (approx.).",
    refs: ["turn17search14"] }, // NPS accouterments

  { id: "overcoat", name: "Winter overcoat", weight: 5,
    desc: "Outer layer for cold weather (rounded from ~5.25 lb).",
    refs: ["turn17search20"] }, // Monitor

  { id: "underclothing", name: "Extra underclothing", weight: 2,
    desc: "Spare shirt/drawers/socks (from ~2 lb).",
    refs: ["turn17search20"] }, // Monitor

  { id: "bible_letters", name: "Bible & letters from home", weight: 1,
    desc: "Personal items (approx.).",
    refs: ["turn17search14"] }, // NPS accouterments notes

  { id: "housewife", name: "Housewife (sewing kit)", weight: 1,
    desc: "Needles, thread, buttons—repair kit (approx.).",
    refs: ["turn17search14"] }, // NPS accouterments

  { id: "coffee_sugar", name: "Coffee & sugar pokes", weight: 2,
    desc: "Staple rations for the march (approx.).",
    refs: ["turn17search31"] }, // Foods of the Civil War

  { id: "soap_candles", name: "Soap & candles", weight: 2,
    desc: "Small comforts from ration issues (approx.).",
    refs: ["turn17search34"] }, // Emmitsburg ration list

  { id: "tent_poles", name: "Tent poles & pegs", weight: 4,
    desc: "Wooden poles & stakes for shelter half (approx.).",
    refs: ["turn17search8"] }, // Sutler listing (existence)

  { id: "frying_pan", name: "Mess frying pan", weight: 3,
    desc: "Often discarded to lighten loads (approx.).",
    refs: ["turn17search14"] }, // NPS accouterments background

  { id: "extra_socks", name: "Extra socks", weight: 1,
    desc: "Spare pair (approx.).",
    refs: ["turn17search14"] }, // NPS accouterments

  { id: "hardtack_bag", name: "Hardtack bag", weight: 2,
    desc: "Marching rations carried in haversack (approx.).",
    refs: ["turn17search31"] }, // Foods of the Civil War

  { id: "spare_clothes", name: "Spare trousers & shirt", weight: 3,
    desc: "Extra set (rounded from ~3.2 lb).",
    refs: ["turn17search20"] }, // Monitor
];

// Target rules
const MAX_ITEMS = 10;
const TARGET_WEIGHT = 60;

// DOM refs
const gridEl = document.getElementById("itemGrid");
const selectedCountEl = document.getElementById("selectedCount");
const totalWeightEl = document.getElementById("totalWeight");
const resultMessageEl = document.getElementById("resultMessage");
const checkButton = document.getElementById("checkButton");
const resetButton = document.getElementById("resetButton");

// Render the item grid
function renderGrid() {
  gridEl.replaceChildren();
  const fragment = document.createDocumentFragment();

  ITEMS.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";

    const title = document.createElement("h3");
    title.textContent = item.name;

    const weight = document.createElement("div");
    weight.className = "weight";
    weight.textContent = `${item.weight} lb`;

    const desc = document.createElement("div");
    desc.className = "desc";
    desc.textContent = item.desc;

    const selectWrap = document.createElement("label");
    selectWrap.className = "item-select";
    selectWrap.setAttribute("aria-label", `Select ${item.name}`);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = item.id;
    checkbox.addEventListener("change", onSelectionChange);

    const labelText = document.createElement("span");
    labelText.textContent = "Select";

    // Grid structure
    card.appendChild(title);
    card.appendChild(weight);
    card.appendChild(desc);
    card.appendChild(selectWrap);

    selectWrap.appendChild(checkbox);
    selectWrap.appendChild(labelText);

    fragment.appendChild(card);
  });

  gridEl.appendChild(fragment);
}

function getSelectedIds() {
  return Array.from(gridEl.querySelectorAll("input[type='checkbox']:checked")).map(cb => cb.value);
}
function getSelectedItems() {
  const ids = getSelectedIds();
  return ITEMS.filter(i => ids.includes(i.id));
}

function recomputeStatus() {
  const items = getSelectedItems();
  const count = items.length;
  const total = items.reduce((sum, i) => sum + i.weight, 0);

  selectedCountEl.textContent = count;
  totalWeightEl.textContent = total;

  // Live guidance
  resultMessageEl.className = "result-message";
  if (count > MAX_ITEMS) {
    resultMessageEl.classList.add("error");
    resultMessageEl.textContent = `Too many items selected (${count}). You may carry at most ${MAX_ITEMS}. Remove ${count - MAX_ITEMS} item(s).`;
  } else if (count === MAX_ITEMS) {
    const delta = TARGET_WEIGHT - total;
    if (delta === 0) {
      resultMessageEl.classList.add("ok");
      resultMessageEl.textContent = "Perfect! Ten items totaling exactly 60 lb.";
    } else if (delta > 0) {
      resultMessageEl.classList.add("error");
      resultMessageEl.textContent = `You need ${delta} more lb to reach 60. Swap in heavier items.`;
    } else {
      resultMessageEl.classList.add("error");
      resultMessageEl.textContent = `You are ${Math.abs(delta)} lb over. Replace with lighter items.`;
    }
  } else {
    resultMessageEl.textContent = "Select ten items that sum to 60 lb. Use Check when ready.";
  }
}

function onSelectionChange(e) {
  // Don’t allow selecting more than 10 items
  const checked = gridEl.querySelectorAll("input[type='checkbox']:checked");
  if (checked.length > MAX_ITEMS) {
    e.target.checked = false; // prevent exceeding
  }
  recomputeStatus();
}

checkButton.addEventListener("click", () => {
  const count = getSelectedIds().length;
  const total = getSelectedItems().reduce((sum, i) => sum + i.weight, 0);

  resultMessageEl.className = "result-message";
  if (count !== MAX_ITEMS) {
    resultMessageEl.classList.add("error");
    resultMessageEl.textContent = `You selected ${count} item(s). Please select exactly ${MAX_ITEMS}.`;
    return;
  }
  if (total !== TARGET_WEIGHT) {
    resultMessageEl.classList.add("error");
    const diff = Math.abs(total - TARGET_WEIGHT);
    resultMessageEl.textContent = total < TARGET_WEIGHT
      ? `Not quite—add ${diff} lb to reach 60.`
      : `Not quite—remove ${diff} lb to reach 60.`;
    return;
  }

  resultMessageEl.classList.add("ok");
  resultMessageEl.textContent = "Well done! Your load is historically plausible and totals 60 lb.";
});

resetButton.addEventListener("click", () => {
  gridEl.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);
  recomputeStatus();
});

// Init
renderGrid();
recomputeStatus();

/* ---------- SAMPLE SOLUTION (one of several) ----------
   A valid 10-item combination that totals exactly 60 lb:
   - Rifle & accouterments (14)
   - Ammunition (5)
   - Canteen (4)
   - Knapsack (packed) (15) [approx heavy]
   - Haversack + 3 days cooked rations (6)
   - Wool blanket (5)
   - Winter overcoat (5)
   - Shelter half (2)
   - Mess kit tinware (2) [approx]
   - Coffee & sugar pokes (2) [approx]
   Sum = 14 + 5 + 4 + 15 + 6 + 5 + 5 + 2 + 2 + 2 = 60 lb
-------------------------------------------------------- */
