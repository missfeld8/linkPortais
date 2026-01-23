const API_URL =
  'https://script.google.com/macros/s/AKfycbyRvMpqEfByIiN3zbrZSOgGgjdoMHO2Hw_glGKjkBCwEoDeLZz4noPzNrX6rRygmTOj/exec';

let sites = [];
let filtered = [];

/* =========================
   PAGINAÇÃO
========================= */
let currentPage = 1;
const perPage = 20;

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

  if (dataReady) inicializarSistema();
});

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
}

/* =========================
   LOAD DATA (JSONP)
========================= */
(function loadSites() {
  const script = document.createElement('script');
  script.src = `${API_URL}?callback=handleData`;
  document.body.appendChild(script);
})();

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

/* 🔥 NORMALIZA TEXTO (CORRIGE ACENTOS, ESPAÇOS, MAIÚSCULAS) */
function normalizeText(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
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

  filtered = sites.filter(s => {
    const nome = normalizeText(s.nome);
    const url = normalizeText(s.url);
    const estado = normalizeText(s.estado);
    const categorias = s.categorias || [];

    const quantidade = Number(s.quantidade) || 1;
    const precoPacote = Number(s.preco) || 0;
    const precoUnit = precoPacote / quantidade;

    /* BUSCA */
    if (
      q &&
      !(
        nome.includes(q) ||
        url.includes(q) ||
        estado.includes(q) ||
        categorias.some(c => normalizeText(c).includes(q))
      )
    ) return false;

    /* ESTADO (AGORA FUNCIONA PERFEITO) */
    if (estadoFiltro && estado !== estadoFiltro) return false;

    /* CATEGORIAS */
    if (
      categoriasSelecionadas.length &&
      !categoriasSelecionadas.some(c => categorias.includes(c))
    ) return false;

    /* MÉTRICAS */
    if (+s.da < daMin || +s.da > daMax) return false;
    if (+s.dr < drMin || +s.dr > drMax) return false;

    /* PREÇOS */
    if (precoPacote < precoMin || precoPacote > precoMax) return false;
    if (precoUnit < unitMin || precoUnit > unitMax) return false;

    /* QUANTIDADE */
    if (quantidade < qtdMin || quantidade > qtdMax) return false;

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
   BUILD ESTADOS (CORRIGIDO)
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

    /* contato */
    const contato = s.contato || '-';

    /* whatsapp */
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
        <td class="${Number(s.da || 0) < 20 ? 'danger' : ''}">${s.da || 0}</td>
        <td>${s.dr || 0}</td>
        <td>${s.trafego || '-'}</td>
        <td class="${Number(s.spam || 0) > 10 ? 'danger' : ''}">${s.spam || 0}%</td>
        <td>${quantidade}</td>
        <td>R$ ${unit}</td>
        <td>R$ ${preco.toFixed(2)}</td>        
        <td>${contato}</td>
        <td>${whatsapp}</td>
      </tr>
    `;
  });
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

  filtered = [...sites];
  currentPage = 1;
  render();
  updateStats();
  renderPagination();
  closeFilters();
}

/* =========================
   UI
========================= */
function closeFilters() {
  filtersBox.classList.remove('open');
}
