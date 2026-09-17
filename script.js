const STORAGE_KEY = "zapiski-rukodelnitsy-v1";

const STATUS_LABELS = {
  work: "в работе",
  wait: "ожидает ткань",
  done: "сдан",
};

function uid() {
  return crypto.randomUUID();
}

function createDefaults() {
  return {
    materials: [
      { id: uid(), name: "Лён натуральный, 150 см", meta: "2,4 м · молочный" },
      { id: uid(), name: "Муслин хлопковый", meta: "1,8 м · пыльно-розовый" },
      { id: uid(), name: "Нитки Gutermann", meta: "3 катушки · № 50" },
      { id: uid(), name: "Кружево хлопковое", meta: "4 м · кремовое" },
      { id: uid(), name: "Пуговицы деревянные", meta: "12 шт · Ø 18 мм" },
      { id: uid(), name: "Флизелин лёгкий", meta: "1 м · белый" },
    ],
    ideas: [
      {
        id: uid(),
        title: "Летнее платье-кимоно",
        note: "Свободный крой, пояс из той же ткани, рукава ¾. Лён + контрастная отстрочка.",
      },
      {
        id: uid(),
        title: "Сумка-шоппер с карманом",
        note: "Двойное дно, внутренняя подкладка, ручки из ременной ленты.",
      },
      {
        id: uid(),
        title: "Детский комбинезон",
        note: "Мягкий муслин, кнопки по плечу, вышивка имени на кармашке.",
      },
      {
        id: uid(),
        title: "Скатерть с мережкой",
        note: "Квадрат 150×150, ручная мережка по краю, тонкий кант.",
      },
    ],
    shops: [
      { id: uid(), name: "Ткани «Льняной двор»", note: "натуральные ткани · доставка", url: "" },
      { id: uid(), name: "Фурнитура «Иголочка»", note: "пуговицы, молнии, нитки", url: "" },
      { id: uid(), name: "Магазин «Муслин»", note: "детские и лёгкие ткани", url: "" },
      { id: uid(), name: "Ателье-склад «Крой»", note: "остатки метражом · выгодно", url: "" },
    ],
    clients: [
      { id: uid(), name: "Анна К.", order: "Платье на выпускной", status: "work" },
      { id: uid(), name: "Мария С.", order: "Комплект постельного", status: "done" },
      { id: uid(), name: "Елена В.", order: "Ремонт пальто", status: "wait" },
      { id: uid(), name: "Ольга П.", order: "Сумка и косметичка", status: "work" },
    ],
    cost: {
      materialsCost: 1200,
      hours: 6,
      rate: 800,
      margin: 20,
    },
  };
}

let data = loadData();
let editing = { list: null, id: null };
let saveTimer = null;

const els = {
  materials: document.getElementById("materials-list"),
  ideas: document.getElementById("ideas-list"),
  shops: document.getElementById("shops-list"),
  clients: document.getElementById("clients-list"),
  saveStatus: document.getElementById("save-status"),
  costForm: document.getElementById("cost-form"),
  totalPrice: document.getElementById("total-price"),
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaults();
    const parsed = JSON.parse(raw);
    const defaults = createDefaults();
    return {
      materials: Array.isArray(parsed.materials) ? parsed.materials : defaults.materials,
      ideas: Array.isArray(parsed.ideas) ? parsed.ideas : defaults.ideas,
      shops: Array.isArray(parsed.shops) ? parsed.shops : defaults.shops,
      clients: Array.isArray(parsed.clients) ? parsed.clients : defaults.clients,
      cost: { ...defaults.cost, ...(parsed.cost || {}) },
    };
  } catch {
    return createDefaults();
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  els.saveStatus.textContent = "Сохранено в браузере";
  els.saveStatus.classList.add("is-visible");
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    els.saveStatus.classList.remove("is-visible");
  }, 1600);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatRub(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function isEditing(list, id) {
  return editing.list === list && editing.id === id;
}

function itemActions(id) {
  return `
    <div class="item-actions">
      <button type="button" class="icon-btn" data-action="edit" data-id="${id}">Изменить</button>
      <button type="button" class="icon-btn icon-btn-danger" data-action="delete" data-id="${id}">Удалить</button>
    </div>
  `;
}

function editActions() {
  return `
    <div class="item-actions">
      <button type="submit" class="icon-btn icon-btn-save">Сохранить</button>
      <button type="button" class="icon-btn" data-action="cancel">Отмена</button>
    </div>
  `;
}

function renderMaterials() {
  if (!data.materials.length) {
    els.materials.innerHTML = `<li class="empty-state">Пока нет материалов — добавьте первый ниже.</li>`;
    return;
  }

  els.materials.innerHTML = data.materials
    .map((item) => {
      if (isEditing("materials", item.id)) {
        return `
          <li class="is-editing" data-id="${item.id}">
            <form class="inline-form" data-list="materials" data-id="${item.id}">
              <input type="text" name="name" value="${escapeHtml(item.name)}" required />
              <input type="text" name="meta" value="${escapeHtml(item.meta || "")}" placeholder="Количество · цвет" />
              ${editActions()}
            </form>
          </li>
        `;
      }

      return `
        <li data-id="${item.id}">
          <div class="item-main">
            <span class="material-name">${escapeHtml(item.name)}</span>
            <span class="material-meta">${escapeHtml(item.meta || "—")}</span>
          </div>
          ${itemActions(item.id)}
        </li>
      `;
    })
    .join("");
}

function renderIdeas() {
  if (!data.ideas.length) {
    els.ideas.innerHTML = `<p class="empty-state">Пока нет идей — запишите первую ниже.</p>`;
    return;
  }

  els.ideas.innerHTML = data.ideas
    .map((item) => {
      if (isEditing("ideas", item.id)) {
        return `
          <article class="idea is-editing" data-id="${item.id}">
            <form class="inline-form" data-list="ideas" data-id="${item.id}">
              <input type="text" name="title" value="${escapeHtml(item.title)}" required />
              <textarea name="note" rows="3">${escapeHtml(item.note || "")}</textarea>
              ${editActions()}
            </form>
          </article>
        `;
      }

      return `
        <article class="idea" data-id="${item.id}">
          <div class="item-main">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.note || "")}</p>
          </div>
          ${itemActions(item.id)}
        </article>
      `;
    })
    .join("");
}

function renderShops() {
  if (!data.shops.length) {
    els.shops.innerHTML = `<li class="empty-state">Пока нет магазинов — добавьте первый ниже.</li>`;
    return;
  }

  els.shops.innerHTML = data.shops
    .map((item) => {
      if (isEditing("shops", item.id)) {
        return `
          <li class="is-editing" data-id="${item.id}">
            <form class="inline-form" data-list="shops" data-id="${item.id}">
              <input type="text" name="name" value="${escapeHtml(item.name)}" required />
              <input type="text" name="note" value="${escapeHtml(item.note || "")}" placeholder="Заметка" />
              <input type="url" name="url" value="${escapeHtml(item.url || "")}" placeholder="Ссылка" />
              ${editActions()}
            </form>
          </li>
        `;
      }

      const content = `
        <span class="shop-name">${escapeHtml(item.name)}</span>
        <span class="shop-note">${escapeHtml(item.note || "—")}</span>
      `;
      const link = item.url
        ? `<a class="shop-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${content}</a>`
        : `<div class="shop-link is-plain">${content}</div>`;

      return `
        <li data-id="${item.id}">
          <div class="shop-row">
            ${link}
            ${itemActions(item.id)}
          </div>
        </li>
      `;
    })
    .join("");
}

function renderClients() {
  if (!data.clients.length) {
    els.clients.innerHTML = `<li class="empty-state">Пока нет клиентов — добавьте первого ниже.</li>`;
    return;
  }

  els.clients.innerHTML = data.clients
    .map((item) => {
      if (isEditing("clients", item.id)) {
        return `
          <li class="is-editing" data-id="${item.id}">
            <form class="inline-form inline-form-clients" data-list="clients" data-id="${item.id}">
              <input type="text" name="name" value="${escapeHtml(item.name)}" required />
              <input type="text" name="order" value="${escapeHtml(item.order)}" required />
              <select name="status">
                <option value="work"${item.status === "work" ? " selected" : ""}>в работе</option>
                <option value="wait"${item.status === "wait" ? " selected" : ""}>ожидает ткань</option>
                <option value="done"${item.status === "done" ? " selected" : ""}>сдан</option>
              </select>
              ${editActions()}
            </form>
          </li>
        `;
      }

      return `
        <li data-id="${item.id}">
          <div class="item-main client-main">
            <span class="client-name">${escapeHtml(item.name)}</span>
            <span class="client-order">${escapeHtml(item.order)}</span>
            <span class="client-status status-${escapeHtml(item.status)}">${escapeHtml(STATUS_LABELS[item.status] || item.status)}</span>
          </div>
          ${itemActions(item.id)}
        </li>
      `;
    })
    .join("");
}

function renderAll() {
  renderMaterials();
  renderIdeas();
  renderShops();
  renderClients();
  applyCost();
}

function applyCost() {
  const { materialsCost, hours, rate, margin } = data.cost;
  document.getElementById("materials-cost").value = materialsCost;
  document.getElementById("hours").value = hours;
  document.getElementById("rate").value = rate;
  document.getElementById("margin").value = margin;
  calcTotal();
}

function calcTotal() {
  const materials = Number(document.getElementById("materials-cost").value) || 0;
  const hours = Number(document.getElementById("hours").value) || 0;
  const rate = Number(document.getElementById("rate").value) || 0;
  const margin = Number(document.getElementById("margin").value) || 0;
  const total = Math.round((materials + hours * rate) * (1 + margin / 100));

  els.totalPrice.classList.add("is-updating");
  els.totalPrice.textContent = formatRub(total);
  window.setTimeout(() => els.totalPrice.classList.remove("is-updating"), 220);
}

function findItem(listName, id) {
  return data[listName].find((item) => item.id === id);
}

function startEdit(listName, id) {
  editing = { list: listName, id };
  renderAll();
  const firstInput = document.querySelector(`[data-id="${id}"] .inline-form input, [data-id="${id}"] .inline-form textarea`);
  firstInput?.focus();
}

function cancelEdit() {
  editing = { list: null, id: null };
  renderAll();
}

function deleteItem(listName, id) {
  data[listName] = data[listName].filter((item) => item.id !== id);
  if (isEditing(listName, id)) editing = { list: null, id: null };
  persist();
  renderAll();
}

function saveEdit(form) {
  const listName = form.dataset.list;
  const id = form.dataset.id;
  const item = findItem(listName, id);
  if (!item) return;

  const fd = new FormData(form);

  if (listName === "materials") {
    item.name = String(fd.get("name") || "").trim() || item.name;
    item.meta = String(fd.get("meta") || "").trim();
  }
  if (listName === "ideas") {
    item.title = String(fd.get("title") || "").trim() || item.title;
    item.note = String(fd.get("note") || "").trim();
  }
  if (listName === "shops") {
    item.name = String(fd.get("name") || "").trim() || item.name;
    item.note = String(fd.get("note") || "").trim();
    item.url = String(fd.get("url") || "").trim();
  }
  if (listName === "clients") {
    item.name = String(fd.get("name") || "").trim() || item.name;
    item.order = String(fd.get("order") || "").trim() || item.order;
    item.status = String(fd.get("status") || "work");
  }

  editing = { list: null, id: null };
  persist();
  renderAll();
}

function bindList(container, listName) {
  container.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    if (action === "cancel") {
      cancelEdit();
      return;
    }

    const id = button.dataset.id;
    if (action === "delete") {
      if (window.confirm("Удалить эту запись?")) deleteItem(listName, id);
      return;
    }
    if (action === "edit") startEdit(listName, id);
  });

  container.addEventListener("submit", (event) => {
    const form = event.target.closest(".inline-form");
    if (!form) return;
    event.preventDefault();
    saveEdit(form);
  });
}

function bindAddForm(form, listName, createItem) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const item = createItem(formData);
    if (!item) return;
    data[listName].push(item);
    form.reset();
    persist();
    renderAll();
  });
}

bindList(els.materials, "materials");
bindList(els.ideas, "ideas");
bindList(els.shops, "shops");
bindList(els.clients, "clients");

bindAddForm(document.getElementById("materials-form"), "materials", (fd) => {
  const name = String(fd.get("name") || "").trim();
  if (!name) return null;
  return { id: uid(), name, meta: String(fd.get("meta") || "").trim() };
});

bindAddForm(document.getElementById("ideas-form"), "ideas", (fd) => {
  const title = String(fd.get("title") || "").trim();
  if (!title) return null;
  return { id: uid(), title, note: String(fd.get("note") || "").trim() };
});

bindAddForm(document.getElementById("shops-form"), "shops", (fd) => {
  const name = String(fd.get("name") || "").trim();
  if (!name) return null;
  return {
    id: uid(),
    name,
    note: String(fd.get("note") || "").trim(),
    url: String(fd.get("url") || "").trim(),
  };
});

bindAddForm(document.getElementById("clients-form"), "clients", (fd) => {
  const name = String(fd.get("name") || "").trim();
  const order = String(fd.get("order") || "").trim();
  if (!name || !order) return null;
  return { id: uid(), name, order, status: String(fd.get("status") || "work") };
});

els.costForm.addEventListener("input", () => {
  data.cost = {
    materialsCost: Number(document.getElementById("materials-cost").value) || 0,
    hours: Number(document.getElementById("hours").value) || 0,
    rate: Number(document.getElementById("rate").value) || 0,
    margin: Number(document.getElementById("margin").value) || 0,
  };
  calcTotal();
  persist();
});

document.getElementById("reset-data").addEventListener("click", () => {
  if (!window.confirm("Сбросить все списки и расчёт к примерам?")) return;
  data = createDefaults();
  editing = { list: null, id: null };
  persist();
  renderAll();
});

renderAll();
