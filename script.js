const form = document.getElementById("cost-form");
const totalEl = document.getElementById("total-price");

function formatRub(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function calcTotal() {
  const materials = Number(document.getElementById("materials-cost").value) || 0;
  const hours = Number(document.getElementById("hours").value) || 0;
  const rate = Number(document.getElementById("rate").value) || 0;
  const margin = Number(document.getElementById("margin").value) || 0;

  const base = materials + hours * rate;
  const total = Math.round(base * (1 + margin / 100));

  totalEl.classList.add("is-updating");
  totalEl.textContent = formatRub(total);
  window.setTimeout(() => totalEl.classList.remove("is-updating"), 220);
}

form.addEventListener("input", calcTotal);
calcTotal();
