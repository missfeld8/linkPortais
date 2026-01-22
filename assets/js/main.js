const API_URL =
  'https://script.google.com/macros/s/AKfycbwl9J5R3otD7LNw_SRDux0OwAKWHpd3JAWemI1XMemPks5lyQx-JT47qSGMqyMd_zJh/exec';

let sites = [];
let filtered = [];

/* =========================
   JSONP CALLBACK
========================= */
function handleData(data) {
  if (!Array.isArray(data)) {
    console.error('Resposta inválida:', data);
    return;
  }

  sites = data;
  filtered = [...data];

  render();
  updateStats();
  buildCategoriaFilters();
}

/* =========================
   LOAD DATA (JSONP)
========================= */
(function loadSites() {
  const script = document.createElement('script');
  script.src = `${API_URL}?callback=handleData`;
  script.onerror = () =>
    console.error('Erro ao carregar dados da planilha');
  document.body.appendChild(script);
})();

/* =========================
   SEARCH
========================= */
document.getElementById('searchInput').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();

  filtered = sites.filter(s =>
    s.nome.toLowerCase().includes(q) ||
    s.url.toLowerCase().includes(q) ||
    s.categorias.some(c => c.includes(q)) ||
    (s.contato && s.contato.toLowerCase().includes(q)) ||
    (s.whatsapp && s.whatsapp.toLowerCase().includes(q))
  );

  render();
});

/* =========================
   DRAWER
========================= */
document.getElementById('openFilters').onclick = () => {
  document.getElementById('filters').classList.toggle('open');
};

/* =========================
   HELPERS
========================= */
function renderContato(valor) {
  if (!valor) return '-';

  const text = valor.toString().trim();

  // email
  if (text.includes('@')) {
    return `<a href="mailto:${text}">${text}</a>`;
  }

  // whatsapp
  const phone = text.replace(/\D/g, '');
  if (phone.length >= 8) {
    return `
      <a href="https://wa.me/55${phone}" target="_blank">
        📱 ${text}
      </a>
    `;
  }

  return text;
}

/* =========================
   RENDER TABLE
========================= */
function render() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  filtered.forEach(s => {
    const quantidade = Number(s.quantidade) || 1;
    const preco = Number(s.preco) || 0;

    const unit =
      quantidade > 1 ? (preco / quantidade).toFixed(2) : null;

    const url = s.url
      ? s.url.startsWith('http')
        ? s.url
        : `https://${s.url}`
      : '#';

    tbody.innerHTML += `
      <tr>
        <td>${s.nome || '-'}</td>

        <td>
          ${s.categorias.length
            ? s.categorias.map(c => `<span class="tag">${c}</span>`).join('')
            : '-'}
        </td>

        <td>
          ${s.url ? `<a href="${url}" target="_blank">${s.url}</a>` : '-'}
        </td>

        <td>${s.da || 0}</td>
        <td>${s.dr || 0}</td>
        <td>${s.spam || 0}%</td>

        <td>${quantidade}</td>

        <td class="price-main">
          R$ ${preco.toFixed(2)}
        </td>

        <td class="price-unit">
          ${unit ? `R$ ${unit}/artigo` : '-'}
        </td>

        <td>${renderContato(s.contato)}</td>
        <td>${renderContato(s.whatsapp)}</td>
      </tr>
    `;
  });
}

/* =========================
   STATS
========================= */
function updateStats() {
  document.getElementById('statSites').innerText = sites.length;

  const categorias = new Set();
  let totalDA = 0;

  sites.forEach(s => {
    s.categorias.forEach(c => categorias.add(c));
    totalDA += Number(s.da) || 0;
  });

  document.getElementById('statNichos').innerText = categorias.size;
  document.getElementById('statDA').innerText =
    Math.round(totalDA / sites.length) || 0;
}

/* =========================
   CATEGORIA FILTER BUILDER
========================= */
function buildCategoriaFilters() {
  const box = document.getElementById('nichoFilters');
  box.innerHTML = '';

  const set = new Set();
  sites.forEach(s => s.categorias.forEach(c => set.add(c)));

  [...set].sort().forEach(cat => {
    box.innerHTML += `
      <label>
        <input type="checkbox" value="${cat}"> ${cat}
      </label>
    `;
  });
}

const API_URL =
  'https://script.google.com/macros/s/AKfycbwl9J5R3otD7LNw_SRDux0OwAKWHpd3JAWemI1XMemPks5lyQx-JT47qSGMqyMd_zJh/exec';

let sites = [];
let filtered = [];

/* =========================
   JSONP CALLBACK
========================= */
function handleData(data) {
  if (!Array.isArray(data)) {
    console.error('Resposta inválida:', data);
    return;
  }

  sites = data;
  filtered = [...data];

  render();
  updateStats();
  buildCategoriaFilters();
}

/* =========================
   LOAD DATA (JSONP)
========================= */
(function loadSites() {
  const script = document.createElement('script');
  script.src = `${API_URL}?callback=handleData`;
  script.onerror = () =>
    console.error('Erro ao carregar dados da planilha');
  document.body.appendChild(script);
})();

/* =========================
   SEARCH
========================= */
document.getElementById('searchInput').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();

  filtered = sites.filter(s =>
    s.nome.toLowerCase().includes(q) ||
    s.url.toLowerCase().includes(q) ||
    s.categorias.some(c => c.includes(q)) ||
    (s.contato && s.contato.toLowerCase().includes(q)) ||
    (s.whatsapp && s.whatsapp.toLowerCase().includes(q))
  );

  render();
});

/* =========================
   DRAWER
========================= */
document.getElementById('openFilters').onclick = () => {
  document.getElementById('filters').classList.toggle('open');
};

/* =========================
   HELPERS
========================= */
function renderContato(valor) {
  if (!valor) return '-';

  const text = valor.toString().trim();

  // email
  if (text.includes('@')) {
    return `<a href="mailto:${text}">${text}</a>`;
  }

  // whatsapp
  const phone = text.replace(/\D/g, '');
  if (phone.length >= 8) {
    return `
      <a href="https://wa.me/55${phone}" target="_blank">
        📱 ${text}
      </a>
    `;
  }

  return text;
}

/* =========================
   RENDER TABLE
========================= */
function render() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  filtered.forEach(s => {
    const quantidade = Number(s.quantidade) || 1;
    const preco = Number(s.preco) || 0;

    const unit =
      quantidade > 1 ? (preco / quantidade).toFixed(2) : null;

    const url = s.url
      ? s.url.startsWith('http')
        ? s.url
        : `https://${s.url}`
      : '#';

    tbody.innerHTML += `
      <tr>
        <td>${s.nome || '-'}</td>

        <td>
          ${s.categorias.length
            ? s.categorias.map(c => `<span class="tag">${c}</span>`).join('')
            : '-'}
        </td>

        <td>
          ${s.url ? `<a href="${url}" target="_blank">${s.url}</a>` : '-'}
        </td>

        <td>${s.da || 0}</td>
        <td>${s.dr || 0}</td>
        <td>${s.spam || 0}%</td>

        <td>${quantidade}</td>

        <td class="price-main">
          R$ ${preco.toFixed(2)}
        </td>

        <td class="price-unit">
          ${unit ? `R$ ${unit}/artigo` : '-'}
        </td>

        <td>${renderContato(s.contato)}</td>
        <td>${renderContato(s.whatsapp)}</td>
      </tr>
    `;
  });
}

/* =========================
   STATS
========================= */
function updateStats() {
  document.getElementById('statSites').innerText = sites.length;

  const categorias = new Set();
  let totalDA = 0;

  sites.forEach(s => {
    s.categorias.forEach(c => categorias.add(c));
    totalDA += Number(s.da) || 0;
  });

  document.getElementById('statNichos').innerText = categorias.size;
  document.getElementById('statDA').innerText =
    Math.round(totalDA / sites.length) || 0;
}

/* =========================
   CATEGORIA FILTER BUILDER
========================= */
function buildCategoriaFilters() {
  const box = document.getElementById('nichoFilters');
  box.innerHTML = '';

  const set = new Set();
  sites.forEach(s => s.categorias.forEach(c => set.add(c)));

  [...set].sort().forEach(cat => {
    box.innerHTML += `
      <label>
        <input type="checkbox" value="${cat}"> ${cat}
      </label>
    `;
  });
}
