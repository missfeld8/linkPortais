/* =========================
   AUTH GATEWAY CONFIG 🔐
========================= */
const AUTH_API =
  'https://script.google.com/macros/s/AKfycbw7bGr_QOhkVRKzrVfZj9Wrkax1hTqqNKs8LdO1Nw03bsi93bq2YPXjrQiPW0FzpSe4/exec';

// domínio atual automático (SEM BARRA)
const CLIENT_DOMAIN = window.location.origin;

/* =========================
   CONTROLE DE VISIBILIDADE DE COLUNAS (HARDCODED)
========================= */

const hideDA              = false;
const hideDR              = false;
const hideTrafegoSemRush  = false;
const hideTrafegoAhrefz   = false;
const hideSpam            = false;
const hideQuantidade      = true;
const hidePrecoUnitario   = true;
const hidePrecoPacote     = false;
const hideContato         = true;
const hideWhatsapp        = true;

let sites = [];
let filtered = [];

/* =========================
   PAGINAÇÃO
========================= */
let currentPage = 1;
const perPage = 100;

/* =========================
   CONTROLE DE ESTADO
========================= */
let domReady = false;
let dataReady = false;

/* =========================
   VARIÁVEIS UI
========================= */
let filtersBox;
let selectBox;
let optionsBox;
let tagsBox;
let placeholder;

let categoriasSelecionadas = [];


/* =========================
   DOM READY
========================= */
document.addEventListener('DOMContentLoaded', () => {
  domReady = true;

  filtersBox = document.getElementById('filters');
  selectBox = document.getElementById('categoriaSelect');
  optionsBox = document.getElementById('categoriaOptions');
  tagsBox = document.getElementById('categoriaTags');
  placeholder = document.getElementById('categoriaPlaceholder');

  /* MULTISELECT */
  selectBox.addEventListener('click', () => {
    optionsBox.classList.toggle('open');
  });

  document.addEventListener('click', e => {
    if (!selectBox.contains(e.target) && !optionsBox.contains(e.target)) {
      optionsBox.classList.remove('open');
    }
  });

  /* EVENTS */
  document.getElementById('searchInput').addEventListener('input', () => {
    currentPage = 1;
    applyFilters();
  });

  document.getElementById('applyFilters').addEventListener('click', () => {
    currentPage = 1;
    applyFilters();
    closeFilters();
  });

  document.getElementById('clearFilters').addEventListener('click', clearFilters);

  document.getElementById('openFilters').addEventListener('click', () => {
    filtersBox.classList.toggle('open');
  });

  document.getElementById('closeFilters').addEventListener('click', closeFilters);

  /* 🌙 DARK MODE */
  const toggleTheme = document.getElementById('toggleTheme');

  toggleTheme.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem(
      'theme',
      document.body.classList.contains('dark') ? 'dark' : 'light'
    );
  });

  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
  }

  // 🔐 INICIA SISTEMA VIA AUTH
  carregarViaAuth();
});


/* =========================
   LOAD VIA AUTH (GATEWAY 🔐)
========================= */
function carregarViaAuth() {
  const script = document.createElement('script');

  const authURL =
    AUTH_API +
    '?origin=' + encodeURIComponent(CLIENT_DOMAIN) +
    '&callback=handleAuth';

  script.src = authURL;
  document.body.appendChild(script);
}


/* =========================
   CALLBACK AUTH
========================= */
function handleAuth(resp) {
  if (!resp || !resp.autorizado) {
    console.error('Acesso não autorizado:', resp?.erro || resp);
    alert('Acesso não autorizado ao sistema.');
    return;
  }

  const realEndpoint = resp.endpoint;
  const key = resp.key;

  // 🔥 CHAMADA FINAL AO SCRIPT DE DADOS
  const finalURL =
    realEndpoint +
    '?key=' + encodeURIComponent(key) +
    '&origin=' + encodeURIComponent(CLIENT_DOMAIN) +
    '&callback=handleData';
  const script = document.createElement('script');
  script.src = finalURL;
  document.body.appendChild(script);
}


/* =========================
   JSONP CALLBACK (DADOS)
========================= */
function handleData(data) {
  if (!Array.isArray(data)) {
    console.error('Resposta inválida (não é array):', data);
    alert('Erro ao carregar dados.');
    return;
  }

  sites = data;
  filtered = [...data];

  dataReady = true;

  if (domReady) inicializarSistema();
}


/* =========================
   INICIALIZAÇÃO SEGURA
========================= */
function inicializarSistema() {
  buildCategoriaFilters();
  buildEstadoFilters();
  applyFilters();
  aplicarVisibilidadeColunas();
}


/* =========================
   HELPERS
========================= */
function getValue(id, fallback) {
  const el = document.getElementById(id);
  return el && el.value !== '' ? Number(el.value) : fallback;
}

function getText(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim().toLowerCase() : '';
}

function normalizeText(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parseTraffic(value) {
  if (!value) return 0;

  const text = value.toString().toLowerCase().trim();

  if (text.endsWith('k')) {
    const num = parseFloat(text.replace('k', ''));
    return Math.round(num * 1000);
  }

  const n = Number(text.replace(/[^\d.]/g, ''));
  return isNaN(n) ? 0 : n;
}


/* =========================
   APPLY FILTERS
========================= */
function applyFilters() {
  const q = getText('searchInput');

  const estadoFiltro = normalizeText(
    document.getElementById('estadoFiltro').value
  );

  const daMin = getValue('daMin', 0);
  const daMax = getValue('daMax', 100);

  const drMin = getValue('drMin', 0);
  const drMax = getValue('drMax', 100);

  const precoMin = getValue('precoMin', 0);
  const precoMax = getValue('precoMax', 999999);

  const unitMin = getValue('unitMin', 0);
  const unitMax = getValue('unitMax', 999999);

  const qtdMin = getValue('qtdMin', 1);
  const qtdMax = getValue('qtdMax', 999);

  const trafegoMin = getValue('trafegoMin', 0);
  const trafegoMax = getValue('trafegoMax', 999999999);

  const trafego2Min = getValue('trafego2Min', 0);
  const trafego2Max = getValue('trafego2Max', 999999999);

    const trafego3Min = getValue('trafego3Min', 0);
  const trafego3Max = getValue('trafego3Max', 999999999);

  filtered = sites.filter(s => {
    const nome = normalizeText(s.nome);
    const url = normalizeText(s.url);
    const estado = normalizeText(s.estado);
    const categorias = s.categorias || [];

    const quantidade = Number(s.quantidade) || 1;
    const precoPacote = Number(s.preco) || 0;
    const precoUnit = precoPacote / quantidade;

    const trafego = parseTraffic(s.trafego);
    const trafego2 = parseTraffic(s.trafego2);

    if (
      q &&
      !(
        nome.includes(q) ||
        url.includes(q) ||
        estado.includes(q) ||
        categorias.some(c => normalizeText(c).includes(q))
      )
    ) return false;

    if (estadoFiltro && estado !== estadoFiltro) return false;

    if (
      categoriasSelecionadas.length &&
      !categoriasSelecionadas.some(c => categorias.includes(c))
    ) return false;

    if (+s.da < daMin || +s.da > daMax) return false;
    if (+s.dr < drMin || +s.dr > drMax) return false;

    if (precoPacote < precoMin || precoPacote > precoMax) return false;
    if (precoUnit < unitMin || precoUnit > unitMax) return false;

    if (quantidade < qtdMin || quantidade > qtdMax) return false;

    if (trafego < trafegoMin || trafego > trafegoMax) return false;
    if (trafego2 < trafego2Min || trafego2 > trafego2Max) return false;
    if (trafego3 < trafego3Min || trafego3 > trafego3Max) return false;

    return true;
  });

  render();
  updateStats();
  renderPagination();
}

/* =========================
   BUILD CATEGORIAS
========================= */
function buildCategoriaFilters() {
  optionsBox.innerHTML = '';
  categoriasSelecionadas = [];
  tagsBox.innerHTML = '';
  placeholder.innerText = 'Selecionar categorias';

  const set = new Set();
  sites.forEach(s => s.categorias?.forEach(c => set.add(c)));

  [...set].sort().forEach(cat => {
    const div = document.createElement('div');
    div.textContent = cat;
    div.onclick = () => toggleCategoria(cat, div);
    optionsBox.appendChild(div);
  });
}

function toggleCategoria(cat, el) {
  if (categoriasSelecionadas.includes(cat)) {
    categoriasSelecionadas = categoriasSelecionadas.filter(c => c !== cat);
    el.classList.remove('selected');
  } else {
    categoriasSelecionadas.push(cat);
    el.classList.add('selected');
  }

  renderCategoriaTags();
}

function renderCategoriaTags() {
  tagsBox.innerHTML = '';

  if (categoriasSelecionadas.length === 0) {
    placeholder.innerText = 'Selecionar categorias';
    applyFilters();
    return;
  }

  placeholder.innerText = `${categoriasSelecionadas.length} selecionada(s)`;

  categoriasSelecionadas.forEach(cat => {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `${cat} <span>×</span>`;

    tag.querySelector('span').onclick = () => {
      categoriasSelecionadas = categoriasSelecionadas.filter(c => c !== cat);

      [...optionsBox.children].forEach(opt => {
        if (opt.textContent === cat) opt.classList.remove('selected');
      });

      renderCategoriaTags();
    };

    tagsBox.appendChild(tag);
  });

  applyFilters();
}

/* =========================
   BUILD ESTADOS
========================= */
function buildEstadoFilters() {
  const select = document.getElementById('estadoFiltro');
  select.innerHTML = '<option value="">Todos</option>';

  const estados = new Set();
  sites.forEach(s => s.estado && estados.add(s.estado));

  [...estados].sort().forEach(e => {
    select.innerHTML += `<option value="${normalizeText(e)}">${e}</option>`;
  });
}

/* =========================
   RENDER TABELA
========================= */
function render() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  const start = (currentPage - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  pageItems.forEach(s => {
    const quantidade = Number(s.quantidade) || 1;
    const preco = Number(s.preco) || 0;
    const unit = (preco / quantidade).toFixed(2);

    const url = s.url
      ? s.url.startsWith('http')
        ? s.url
        : `https://${s.url}`
      : '#';

    const contato = s.contato || '-';

    let whatsapp = '-';
    if (s.whatsapp) {
      const numero = s.whatsapp.replace(/\D/g, '');
      whatsapp = `<a href="https://wa.me/${numero}" target="_blank">${s.whatsapp}</a>`;
    }

    tbody.innerHTML += `
      <tr>
        <td>${s.nome || '-'}</td>
        <td>${s.categorias?.map(c => `<span class="tag">${c}</span>`).join('') || '-'}</td>
        <td>${s.url ? `<a href="${url}" target="_blank">${s.url}</a>` : '-'}</td>
        <td>${s.estado || '-'}</td>

        <td class="col-da ${Number(s.da || 0) < 20 ? 'danger' : ''}">${s.da || 0}</td>
        <td class="col-dr">${s.dr || 0}</td>
        <td class="col-trafego1">${s.trafego || '-'}</td>
        <td class="col-trafego2">${s.trafego2 || '-'}</td>
        <td class="col-spam ${Number(s.spam || 0) > 10 ? 'danger' : ''}">${s.spam || 0}%</td>
        <td class="col-qtd">${quantidade}</td>
        <td class="col-preco-unit">R$ ${unit}</td>
        <td class="col-preco-pacote">R$ ${preco.toFixed(2)}</td>
        <td class="col-contato">${contato}</td>
        <td class="col-whatsapp">${whatsapp}</td>
      </tr>
    `;
  });

  aplicarVisibilidadeColunas(); // 👈 aplica após cada render
}

/* =========================
   PAGINATION
========================= */
function renderPagination() {
  const container = document.getElementById('pagination');
  container.innerHTML = '';

  const totalPages = Math.ceil(filtered.length / perPage);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.innerText = i;
    if (i === currentPage) btn.classList.add('active');

    btn.onclick = () => {
      currentPage = i;
      render();
      renderPagination();
    };

    container.appendChild(btn);
  }
}

/* =========================
   STATS
========================= */
function updateStats() {
  document.getElementById('statSites').innerText = filtered.length;

  const categorias = new Set();
  let totalDA = 0;

  filtered.forEach(s => {
    s.categorias?.forEach(c => categorias.add(c));
    totalDA += Number(s.da) || 0;
  });

  document.getElementById('statNichos').innerText = categorias.size;
  document.getElementById('statDA').innerText =
    filtered.length ? Math.round(totalDA / filtered.length) : 0;
}

/* =========================
   CLEAR FILTERS
========================= */
function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('estadoFiltro').value = '';

  categoriasSelecionadas = [];
  tagsBox.innerHTML = '';
  placeholder.innerText = 'Selecionar categorias';
  [...optionsBox.children].forEach(opt => opt.classList.remove('selected'));

  ['daMin','drMin'].forEach(id => document.getElementById(id).value = 0);
  ['daMax','drMax'].forEach(id => document.getElementById(id).value = 100);
  ['daRange','drRange'].forEach(id => document.getElementById(id).value = 100);
  ['daValue','drValue'].forEach(id => document.getElementById(id).innerText = 100);

  document.getElementById('precoMin').value = 0;
  document.getElementById('precoMax').value = 999999;
  document.getElementById('unitMin').value = 0;
  document.getElementById('unitMax').value = 999999;
  document.getElementById('qtdMin').value = 1;
  document.getElementById('qtdMax').value = 999;
  document.getElementById('trafegoMin').value = 0;
  document.getElementById('trafegoMax').value = 999999999;
  document.getElementById('trafego2Min').value = 0;
  document.getElementById('trafego2Max').value = 999999999;
  document.getElementById('trafego3Min').value = 0;
  document.getElementById('trafego3Max').value = 999999999;

  filtered = [...sites];
  currentPage = 1;
  render();
  updateStats();
  renderPagination();
  closeFilters();
}

/* =========================
   VISIBILIDADE DE COLUNAS + FILTROS (FINAL)
========================= */
function aplicarVisibilidadeColunas() {
  const map = [
    { hide: hideDA,             th: 'th-da',            td: 'col-da',            filter: 'filter-da' },
    { hide: hideDR,             th: 'th-dr',            td: 'col-dr',            filter: 'filter-dr' },
    { hide: hideTrafegoSemRush, th: 'th-trafego1',      td: 'col-trafego1',      filter: 'filter-trafego1' },
    { hide: hideTrafegoAhrefz,  th: 'th-trafego2',      td: 'col-trafego2',      filter: 'filter-trafego2' },
    { hide: hideQuantidade,     th: 'th-qtd',           td: 'col-qtd',           filter: 'filter-qtd' },
    { hide: hidePrecoUnitario,  th: 'th-preco-unit',   td: 'col-preco-unit',   filter: 'filter-preco-unit' },
    { hide: hidePrecoPacote,    th: 'th-preco-pacote', td: 'col-preco-pacote', filter: 'filter-preco-pacote' },
    { hide: hideContato,        th: 'th-contato',       td: 'col-contato' },
    { hide: hideWhatsapp,       th: 'th-whatsapp',      td: 'col-whatsapp' },
  ];

  map.forEach(col => {
    const th = document.getElementById(col.th);
    const tds = document.querySelectorAll(`.${col.td}`);
    const filter = col.filter ? document.getElementById(col.filter) : null;

    if (col.hide) {
      if (th) th.style.display = 'none';
      tds.forEach(td => (td.style.display = 'none'));
      if (filter) filter.style.display = 'none';
    } else {
      if (th) th.style.display = '';
      tds.forEach(td => (td.style.display = ''));
      if (filter) filter.style.display = '';
    }
  });
}

/* =========================
   UI
========================= */
function closeFilters() {
  filtersBox.classList.remove('open');
}
