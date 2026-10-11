"use strict";

// ==========================================
// 1. CONSTANTES, ÍCONES E ESTADO GLOBAL
// ==========================================

// 1.1 Seletores utilitários do DOM e chaves de armazenamento local
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const STORAGE_KEY = "recebe-plus-records-v1";
const CONFIG_KEY = "recebe-plus-config-v1";

// 1.2 Coleção de ícones SVG do sistema
const icons = {
    dashboard: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    truck: `<svg viewBox="0 0 24 24"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>`,
    dock: `<svg viewBox="0 0 24 24"><path d="M4 21V4h16v17M8 21V8h8v13M8 12h8M8 16h8"/></svg>`,
    chart: `<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20V7M2 20h21"/></svg>`,
    gear: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/></svg>`,
    search: `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>`,
    refresh: `<svg viewBox="0 0 24 24"><path d="M20 6v5h-5M4 18v-5h5M18 9a7 7 0 0 0-12-2l-2 4M6 15a7 7 0 0 0 12 2l2-4"/></svg>`,
    clock: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
    check: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>`,
    box: `<svg viewBox="0 0 24 24"><path d="m4 7 8-4 8 4-8 4zM4 7v10l8 4 8-4V7M12 11v10"/></svg>`,
    plus: `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`,
    logout: `<svg viewBox="0 0 24 24"><path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10"/></svg>`,
    boxSeam: `<svg viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`
};

// 1.3 Gerador de dados iniciais para demonstração local (Seed)
const pad = n => String(n).padStart(2, "0");
const now = new Date();
const isoAt = (hour, minute = 0, dayOffset = 0) => {
    const d = new Date(now); d.setDate(d.getDate() + dayOffset); d.setHours(hour, minute, 0, 0); return d.toISOString();
};
const seedRecords = [
    { id: "D-101", data: isoAt(7, 20), origem: "CD Guarulhos", doca: "3", motorista: "Carlos Mendes", placa: "RFG-8J21", volumetria: 1860, inicio: isoAt(7, 42), fim: isoAt(8, 31), sla: 60, conferente: "Ana Souza", status: "Concluído" },
    { id: "D-102", data: isoAt(8, 10), origem: "Hub Campinas", doca: "5", motorista: "João Ribeiro", placa: "GHT-4C07", volumetria: 2430, inicio: isoAt(8, 28), fim: null, sla: 75, conferente: "Marcos Lima", status: "Em descarga" },
    { id: "D-103", data: isoAt(9, 0), origem: "CD Extrema", doca: "2", motorista: "Paulo Nunes", placa: "BXR-1D94", volumetria: 0, inicio: null, fim: null, sla: 45, conferente: "—", status: "Aguardando" },
    { id: "D-104", data: isoAt(9, 35), origem: "Hub Sorocaba", doca: "8", motorista: "Rafael Alves", placa: "TJK-6F13", volumetria: 0, inicio: null, fim: null, sla: 90, conferente: "Beatriz Reis", status: "Em Trânsito" },
    { id: "D-105", data: isoAt(10, 20), origem: "CD Louveira", doca: "1", motorista: "Diego Martins", placa: "KLM-9A42", volumetria: 0, inicio: null, fim: null, sla: 55, conferente: "—", status: "Em Trânsito" },
    { id: "D-098", data: isoAt(14, 0, -1), origem: "Hub Campinas", doca: "4", motorista: "Lucas Rocha", placa: "QWE-7B65", volumetria: 2210, inicio: isoAt(14, 12, -1), fim: isoAt(15, 8, -1), sla: 70, conferente: "Ana Souza", status: "Concluído" },
    { id: "D-099", data: isoAt(15, 30, -1), origem: "CD Guarulhos", doca: "7", motorista: "André Silva", placa: "MNO-2K18", volumetria: 1750, inicio: isoAt(15, 51, -1), fim: isoAt(17, 2, -1), sla: 60, conferente: "Marcos Lima", status: "Em Atraso" }
].map(r => ({ ...r, source: "local" }));

// 1.4 Estado global reativo da aplicação
function loadJSON(key, fallback) {
    try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
    catch { return fallback; }
}

const state = {
    page: "dashboard",
    role: null,
    user: null,
    csrf: null,
    authChecked: false,
    records: loadJSON(STORAGE_KEY, seedRecords),
    sheetRecords: [],
    insumosRecords: [],
    config: loadJSON(CONFIG_KEY, { sheetUrl: "", refreshMinutes: 5 }),
    query: "",
    statusFilter: "todos",
    insumoFiltros: { dataInicio: "", dataFim: "", origem: "", conferente: "" },
    lastSync: null,
    apiOnline: false
};

function saveRecords() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records)); }
function saveConfig() { localStorage.setItem(CONFIG_KEY, JSON.stringify(state.config)); }

// ==========================================
// 2. COMUNICAÇÃO HTTP, AUTENTICAÇÃO E REGRAS DE ACESSO
// ==========================================

// 2.1 Cliente HTTP unificado para requisições na API
async function api(path, options = {}) {
    const response = await fetch(path, {
        ...options,
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            ...(state.csrf ? { "X-CSRF-Token": state.csrf } : {}),
            ...(options.headers || {})
        }
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Falha na API");
    return payload;
}

// 2.2 Sincronização e hidratação do estado via servidor
async function hydrateFromServer() {
    try {
        const payload = await api("/api/records");
        state.records = payload.records;
        state.apiOnline = true;
        saveRecords();
        renderApp();
    } catch {
        state.apiOnline = false;
    }
}

// 2.3 Checagem de sessão ativa ao carregar a página
async function checkSession() {
    try {
        const payload = await api("/api/me");
        state.user = payload.user;
        state.role = payload.user.role;
        state.csrf = payload.csrf;
        state.apiOnline = true;
    } catch {
        state.user = null;
        state.role = null;
        state.csrf = null;
    }
    state.authChecked = true;
    renderApp();
    if (state.user) hydrateFromServer();
}

// 2.4 Matriz de controle de permissões por perfil (RBAC)
function can(permission) {
    if (state.role === "Supervisor") return true;
    if (permission === "create") return ["Conferente", "Assistente"].includes(state.role);
    if (permission === "transition") return state.role === "Conferente";
    if (permission === "sheet") return false;
    return Boolean(state.user);
}

// ==========================================
// 3. PROCESSAMENTO DE DADOS, REGRA DO TURNO E FORMATAÇÕES
// ==========================================

// 3.1 Consolidação e normalização de registros
function allRecords() {
    const seen = new Set();
    return [...state.records, ...state.sheetRecords].map(normalizeRecord).filter(r => {
        const key = `${String(r.placa).toUpperCase()}-${String(r.data).slice(0, 16)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    }).sort((a, b) => new Date(b.data) - new Date(a.data));
}

function normalizeRecord(record) {
    const status = record.status === "Previsto" ? "Em Trânsito" : record.status === "Divergência" ? "Em Atraso" : record.status;
    const dock = String(record.doca ?? "").replace(/^D/i, "").replace(/^0+(?=\d)/, "");
    return { ...record, status, doca: dock || "—" };
}

function dockLabel(value) {
    const number = String(value ?? "").replace(/\D/g, "");
    return number ? String(Number(number)).padStart(2, "0") : "—";
}

function hasVolumetry(record) {
    return ["Em descarga", "Concluído", "Em Atraso"].includes(normalizeRecord(record).status);
}

function sameDay(iso, date = new Date()) {
    const d = new Date(iso);
    return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
}

// 3.2 Filtro de inteligência de turno operacional (T1, T2 e T3)
function recordsDoTurnoAtual() {
    const agora = new Date();
    const hora = agora.getHours();

    let inicioTurno, fimTurno;

    if (hora >= 6 && hora < 14) {
        inicioTurno = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 6, 0, 0);
        fimTurno = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 13, 59, 59);
    } else if (hora >= 14 && hora < 22) {
        inicioTurno = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 14, 0, 0);
        fimTurno = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 21, 59, 59);
    } else {
        if (hora >= 22) {
            inicioTurno = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 22, 0, 0);
            fimTurno = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1, 5, 59, 59);
        } else {
            inicioTurno = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 1, 22, 0, 0);
            fimTurno = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 5, 59, 59);
        }
    }

    return allRecords().filter(r => {
        const dataComparacao = new Date(r.inicio || r.data);
        return dataComparacao >= inicioTurno && dataComparacao <= fimTurno;
    });
}

// 3.3 Auxiliares de formatação de data, hora e tempo de SLA
function fmtDate(iso, withTime = true) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("pt-BR", withTime ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "short" }).format(d);
}

function fmtTime(iso) {
    return iso ? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "—";
}

function slug(text) {
    return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-");
}

function durationMinutes(record) {
    if (!record.inicio) return 0;
    return Math.max(0, Math.round(((record.fim ? new Date(record.fim) : new Date()) - new Date(record.inicio)) / 60000));
}

function slaClass(record) {
    const d = durationMinutes(record);
    return d <= record.sla * .85 ? "good" : d <= record.sla ? "warn" : "bad";
}

function toast(title, message = "") {
    const root = $("#toast-root");
    root.innerHTML = `<div class="toast"><b>${title}</b>${message}</div>`;
    setTimeout(() => root.innerHTML = "", 3200);
}

function esc(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

// ==========================================
// 4. ESTRUTURA PRINCIPAL E COMPONENTES DA INTERFACE (VIEWS)
// ==========================================

// 4.1 Configuração de Itens do Menu Navegação
const navItems = [
    ["dashboard", "Visão geral", "dashboard"],
    ["recebimentos", "Torre de Controle", "truck"],
    ["docas", "Inbound", "dock"],
    ["insumos", "Insumos", "boxSeam"],
    ["analises", "Análises", "chart"],
    ["configuracoes", "Configurações", "gear"]
];

function navButton([id, label, icon], mobile = false) {
    return `<button class="${mobile ? "" : "nav-item "}${state.page === id ? "active" : ""}" data-page="${id}">
    ${mobile ? icons[icon] : `<span class="nav-icon">${icons[icon]}</span>`}${mobile ? `<span>${label.replace("Visão geral", "Início").replace("Torre de Controle", "Torre").replace("Configurações", "Ajustes")}</span>` : label}
  </button>`;
}

// 4.2 Renderização da Casca/Shell Principal da Aplicação
function renderApp() {
    if (!state.authChecked) {
        $("#app").innerHTML = `<main class="auth-page"><div class="auth-loader"><span class="brand-mark"><i></i><i></i><i></i></span><strong>recebe+</strong><p>Carregando operação...</p></div></main>`;
        return;
    }
    if (!state.user) {
        renderLogin();
        return;
    }

    const agora = new Date();
    const dataHoraFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const titles = {
        dashboard: ["", `HOSA - RESUMO DE VOLUMETRIA ${dataHoraFormatada}`],
        recebimentos: ["", "Torre de Controle"],
        docas: ["", "Gestão de Docas"],
        insumos: ["RRA / EVIDÊNCIAS", "Relatório de Insumos Devolvidos"],
        analises: ["DESEMPENHO", "Análises"],
        configuracoes: ["SISTEMA", "Configurações"]
    };

    const title = titles[state.page];
    const isAnalises = state.page === "analises";

    $("#app").innerHTML = `<div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark"><i></i><i></i><i></i></span><span class="brand-name">recebe+<small>controle logístico</small></span></div>
      <div class="nav-label">Operação</div><nav class="nav-list">${navItems.slice(0, 4).map(n => navButton(n)).join("").replace("Visão geral", "Visão Geral")}</nav>
      <div class="nav-label">Gestão</div><nav class="nav-list">${navItems.slice(4).map(n => navButton(n)).join("")}</nav>
      <div class="sidebar-bottom">
        <div class="sync-tile"><strong>Google Sheets</strong><p>${state.config.sheetUrl ? `Leitura automática a cada ${state.config.refreshMinutes} min.` : "Aguardando acesso à torre de controle."}</p>${can("sheet") ? `<button data-action="sheet-config">${state.config.sheetUrl ? "Gerenciar conexão" : "Configurar integração"}</button>` : ""}</div>
        <button class="profile" data-action="logout" style="width:100%;border-left:0;border-right:0;border-bottom:0;background:transparent;text-align:left"><span class="avatar">${state.user.username.slice(0, 2).toUpperCase()}</span><span><strong>${esc(state.user.username)}</strong><span>${state.role} • sair</span></span></button>
      </div>
    </aside>
    <main class="main">
      <header class="topbar"><div><p class="eyebrow">${title[0]}</p><h1>${title[1]}</h1></div><div class="top-actions">
        <span class="live-pill"><i class="pulse"></i><span id="sync-label">${state.lastSync ? `Atualizado ${fmtTime(state.lastSync)}` : ""}</span></span>
        <button class="icon-btn" data-action="sync" title="Sincronizar">${icons.refresh}</button>
        ${isAnalises ? `<button class="secondary-btn" data-action="export">Exportar CSV</button>` : ""}
        <button class="logout-btn" data-action="logout">${icons.logout}<span>Sair</span></button>
      </div></header>
      <div class="page">${renderCurrentPage()}</div>
    </main>
    <nav class="mobile-nav">${navItems.slice(0, 4).map(n => navButton(n, true)).join("")}</nav>
  </div>`;
    bindEvents();
}

// 4.3 Tela de Autenticação / Login
function renderLogin() {
    $("#app").innerHTML = `<main class="auth-page"><section class="auth-visual"><div class="auth-brand"><span class="brand-mark"><i></i><i></i><i></i></span><span class="brand-name">recebe+<small>controle logístico</small></span></div><div class="auth-copy"><span class="auth-kicker">OPERAÇÃO EM MOVIMENTO</span><h1>Cada doca.<br>Cada minuto.<br><em>Sob controle.</em></h1><p>Recebimento, volumetria e SLA em uma única visão operacional.</p></div><div class="auth-stats"><span><strong>18</strong>docas monitoradas</span><span><strong>24/7</strong>visão da operação</span><span><strong>1</strong>fonte de verdade</span></div></section><section class="auth-form-wrap"><form class="login-card" id="login-form"><p class="eyebrow">ACESSO RESTRITO</p><h2>Bem-vindo</h2><p class="login-intro">Entre com seu usuário e senha para acessar o recebimento.</p><div class="field"><label>Usuário</label><input name="username" required autocomplete="username" autofocus placeholder="Digite seu usuário"></div><div class="field"><label>Senha</label><div class="password-field"><input name="password" required type="password" autocomplete="current-password" placeholder="Digite sua senha"><button type="button" data-action="toggle-password" aria-label="Mostrar senha">Ver</button></div></div><button class="primary-btn login-submit" type="submit">Entrar no sistema</button><p class="security-note">Acesso monitorado · Sessão protegida · Ambiente de testes</p></form></section></main>`;
}

// 4.4 Roteador e alternador de páginas
function renderCurrentPage() {
    if (state.page === "dashboard") return renderDashboard();
    if (state.page === "recebimentos") return renderReceiptsPage();
    if (state.page === "docas") return renderDocksPage();
    if (state.page === "insumos") return renderInsumosPage();
    if (state.page === "analises") return renderAnalyticsPage();
    return renderSettingsPage();
}

// 4.5 Tela: Visão Geral (Dashboard)
function getMetrics() {
    const today = allRecords().filter(r => sameDay(r.data));
    const active = today.filter(r => r.status === "Em descarga");
    const finished = today.filter(r => r.status === "Concluído" || r.status === "Em Atraso");
    const avg = finished.length ? Math.round(finished.reduce((sum, r) => sum + durationMinutes(r), 0) / finished.length) : 0;
    const onSla = finished.length ? Math.round(finished.filter(r => durationMinutes(r) <= Number(r.sla || 60)).length / finished.length * 100) : 100;
    return { today, active, finished, avg, onSla, docks: new Set(active.map(r => r.doca)).size };
}

function renderDashboard() {
    const m = getMetrics();
    return `<section class="section-page active">
    <div class="kpi-grid">
      ${kpi("Veículos previstos", m.today.length, "truck", `${m.today.filter(r => r.status === "Em Trânsito").length} em trânsito`, true)}
      ${kpi("Em descarga", m.active.length, "dock", `${m.docks} docas ocupadas`)}
      ${kpi("Volumetria", m.today.filter(hasVolumetry).reduce((s, r) => s + Number(r.volumetria || 0), 0).toLocaleString("pt-BR"), "box", "volumes confirmados")}
    </div>
    <div class="content-grid">
      <section class="panel"><div class="panel-head"><div><h3>Fluxo de recebimento</h3><p>Em trânsito x concluídos por faixa horária</p></div><div class="chart-legend"><span><i></i>Em trânsito</span><span><i></i>Concluídos</span></div></div>${renderVolumeChart(m.today)}</section>
      <section class="panel"><div class="panel-head"><div><h3>Status da operação</h3><p>Distribuição de hoje</p></div><div class="segmented"><button class="active">Hoje</button></div></div>${renderStatus(m.today)}</section>
    </div>
    ${renderRecordsPanel(m.today.slice(0, 6), "Recebimentos de hoje", true)}
  </section>`;
}

function kpi(label, value, icon, trend, featured = false) {
    return `<article class="kpi-card ${featured ? "featured" : ""}"><div class="kpi-head"><span>${label}</span><span class="kpi-icon">${icons[icon]}</span></div><div class="kpi-value">${value}</div><div class="trend"><b>●</b>${trend}</div></article>`;
}

function renderVolumeChart(records) {
    const hours = ["06h", "08h", "10h", "12h", "14h", "16h", "18h"];
    const values = hours.map(h => { const start = Number(h.slice(0, 2)); const rows = records.filter(r => { const hr = new Date(r.data).getHours(); return hr >= start && hr < start + 2 }); return [rows.length, rows.filter(r => r.status === "Concluído").length] });
    const max = Math.max(4, ...values.flat());
    return `<div class="volume-chart"><div class="axis-y"><span>${max}</span><span>${Math.round(max * .66)}</span><span>${Math.round(max * .33)}</span><span>0</span></div><div class="chart-field">${values.map((v, i) => `<div class="bar-group"><i class="bar" style="height:${Math.max(2, v[0] / max * 100)}%"></i><i class="bar secondary" style="height:${Math.max(2, v[1] / max * 100)}\%"></i><span>${hours[i]}</span></div>`).join("")}</div></div>`;
}

function renderStatus(records) {
    const statuses = ["Concluído", "Em descarga", "Aguardando", "Em Trânsito", "Em Atraso"];
    const colors = ["var(--green)", "var(--brand)", "var(--orange)", "#dce5ed", "var(--red)"];
    const counts = statuses.map(s => records.filter(r => r.status === s).length);
    return `<div class="status-body"><div class="donut-wrap"><div class="donut"><div class="donut-center"><strong>${records.length}</strong><span>veículos</span></div></div></div><div class="status-list">${statuses.map((s, i) => `<div class="status-row"><i style="background:${colors[i]}"></i><span>${s}</span><strong>${counts[i]}</strong></div>`).join("")}</div></div>`;
}

// 4.6 Tela: Torre de Controle (Recebimentos)
function renderReceiptsPage() {
    const transitoRecords = state.sheetRecords.map(r => {
        const diffMins = Number(r.previsao) || 0;
        let calcStatus = "Em Trânsito";

        if (diffMins <= 4.9833 && diffMins > 0) calcStatus = "Aguardando";
        if (diffMins <= 0) calcStatus = "Em Atraso";

        return { ...r, calcStatus, diffMins };
    });

    const produtividadeRecords = recordsDoTurnoAtual()
        .filter(r => r.status === "Concluído" || r.status === "Em descarga");

    const canDownloadReport = state.role === "Assistente" || state.role === "Supervisor";

    return `<section class="section-page active">
        ${canDownloadReport ? `
        <div style="display: flex; justify-content: flex-end; margin-bottom: 15px;">
            <button class="primary-btn" data-action="download-turno" style="background: var(--green); box-shadow: 0 4px 10px rgba(10,166,111,.2);">📥 Fechar Turno (Excel)</button>
        </div>` : ""}

        <section class="panel records" style="margin-bottom: 24px;">
            <div class="panel-head"><div><h3>Veículos em Trânsito</h3><p>Rastreio da planilha conectada</p></div></div>
            <div class="table-wrap"><table>
                <thead>
                    <tr><th>Hub / CD</th><th>Previsão de Chegada</th><th>Status</th></tr>
                </thead>
                <tbody>
                    ${transitoRecords.length ? transitoRecords.map(r => `<tr>
                        <td><strong>${esc(r.origem)}</strong></td>
                        <td>${r.previsao ? `${r.previsao} min` : "—"}</td>
                        <td><span class="status-badge status-${slug(r.calcStatus)}">${esc(r.calcStatus)}</span></td>
                    </tr>`).join("") : `<tr><td colspan="3" class="empty">Nenhum veículo a caminho na planilha conectada.</td></tr>`}
                </tbody>
            </table></div>
        </section>

        <section class="panel records">
            <div class="panel-head"><div><h3>Produtividade</h3><p>Operações de descarga e finalizadas</p></div></div>
            <div class="table-wrap"><table>
                <thead>
                    <tr><th>Origem</th><th>Volumetria</th><th>Início</th><th>Finalizado em</th><th>SLA</th><th>Status</th><th>Responsável</th></tr>
                </thead>
                <tbody>
                    ${produtividadeRecords.length ? produtividadeRecords.map(r => `<tr>
                        <td><strong>${esc(r.origem)}</strong></td>
                        <td>${hasVolumetry(r) && Number(r.volumetria) > 0 ? Number(r.volumetria).toLocaleString("pt-BR") : "-"}</td>
                        <td>${fmtTime(r.inicio)}</td>
                        <td>${fmtTime(r.fim)}</td>
                        <td><span class="sla ${r.inicio ? slaClass(r) : ""}">${durationMinutes(r)}/${r.sla || 60} min</span></td>
                        <td><span class="status-badge status-${slug(r.status)}">${esc(r.status)}</span></td>
                        <td>${esc(r.conferente)}</td>
                    </tr>`).join("") : `<tr><td colspan="7" class="empty">Nenhuma operação produtiva no momento.</td></tr>`}
                </tbody>
            </table></div>
        </section>
    </section>`;
}

// 4.7 Tela: Operação Inbound e Gestão de Docas
function renderDocksPage() {
    const today = allRecords().filter(r => sameDay(r.data));
    const docks = Array.from({ length: 18 }, (_, i) => String(i + 1));
    const activeCount = today.filter(r => r.status === "Em descarga").length;
    return `<section class="section-page active"><div class="hero-strip"><div><h2>Operação Inbound</h2><p>Selecione uma doca para iniciar o recebimento.</p></div><span class="date-chip">${activeCount} de 18 docas em operação</span></div><div class="inbound-grid">${docks.map(d => renderDockCard(d, today)).join("")}</div></section>`;
}

function renderDockCard(dock, records) {
    const record = records.find(r => r.doca === dock && r.status === "Em descarga") || records.find(r => r.doca === dock && ["Aguardando", "Em Trânsito"].includes(r.status));
    const status = record?.status || "Disponível";

    const isEmDescarga = record?.status === "Em descarga";
    const canCreate = can("create");

    const isOwner = (record?.conferente === state.user?.username) || (record?.conferente === state.user?.name);
    const isSupervisor = state.role === "Supervisor";
    const canFinish = isEmDescarga && (isOwner || isSupervisor);

    let btnAction = "new-record";
    let btnText = "Iniciar recebimento";
    let btnClass = "primary-btn inbound-start";

    if (record) {
        if (isEmDescarga) {
            btnAction = "prompt-insumos";
            btnText = "Finalizar Descarga";
            if (!canFinish) btnClass += " disabled";
        } else if (["Aguardando", "Em Trânsito"].includes(status)) {
            btnAction = "prepare-unload";
            btnText = "Iniciar descarga agendada";
        }
    } else if (!canCreate) {
        btnClass += " disabled";
    }

    return `<article class="inbound-card ${isEmDescarga ? "is-active" : ""}">
    <div class="inbound-card-head"><span>DOCA</span><strong>${dockLabel(dock)}</strong></div>
    <div class="inbound-card-data">
      <div><span>Veículo</span><strong>${record ? esc(record.placa) : "-"}</strong></div>
      <div><span>Origem</span><strong>${record ? esc(record.origem) : "-"}</strong></div>
      <div><span>Volumes</span><strong>${record && hasVolumetry(record) && Number(record.volumetria) > 0 ? Number(record.volumetria).toLocaleString("pt-BR") : "-"}</strong></div>
      <div><span>Status</span><strong><span class="status-badge status-${slug(status)}">${esc(status)}</span></strong></div>
    </div>
    <button class="${btnClass}" ${btnClass.includes("disabled") ? "disabled" : ""} data-action="${btnAction}" data-id="${record ? esc(record.id) : ""}" data-dock="${dock}">${btnText}</button>
    ${isEmDescarga && !canFinish ? `<p style="font-size: 9px; color: var(--red); text-align: center; margin-top: 5px;">Apenas ${record.conferente} ou Gestor</p>` : ""}
  </article>`;
}

// 4.8 Tela: Módulo Dedicado de Insumos e Evidências
function renderInsumosPage() {
    fetchInsumos();
    return `<section class="section-page active">
        <section class="panel records" style="margin-bottom: 20px;">
            <div class="panel-head"><div><h3>Filtros de Pesquisa</h3><p>Selecione os critérios para filtrar o relatório</p></div></div>
            <div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; padding: 15px;">
                <div class="field"><label>Data Início</label><input type="date" id="filtro-data-inicio" value="${state.insumoFiltros.dataInicio}"></div>
                <div class="field"><label>Data Fim</label><input type="date" id="filtro-data-fim" value="${state.insumoFiltros.dataFim}"></div>
                <div class="field"><label>CD / Hub Origem</label><input type="text" id="filtro-origem" placeholder="Ex: Guarulhos" value="${esc(state.insumoFiltros.origem)}"></div>
                <div class="field"><label>Conferente Responsável</label><input type="text" id="filtro-conferente" placeholder="Nome do conferente" value="${esc(state.insumoFiltros.conferente)}"></div>
            </div>
            <div style="padding: 0 15px 15px 15px; display:flex; gap:10px; justify-content: flex-end;">
                <button class="secondary-btn" data-action="limpar-filtros-insumos">Limpar Filtros</button>
                <button class="primary-btn" data-action="filtrar-insumos">Aplicar Filtro</button>
            </div>
        </section>

        <section class="panel records">
            <div class="panel-head"><div><h3>Evidências de Devolução</h3><p>Histórico de insumos registrados no encerramento</p></div></div>
            <div class="table-wrap"><table>
                <thead>
                    <tr><th>Data / Hora</th><th>Origem / Veículo</th><th>Insumo & Qtd</th><th>Condição</th><th>Conferente</th><th>Evidência</th><th>Observação</th></tr>
                </thead>
                <tbody id="insumos-table-body">
                    <tr><td colspan="7" class="empty">Carregando insumos...</td></tr>
                </tbody>
            </table></div>
        </section>
    </section>`;
}

async function fetchInsumos() {
    try {
        const query = new URLSearchParams(state.insumoFiltros).toString();
        const payload = await api(`/api/insumos?${query}`);
        state.insumosRecords = payload.insumos || [];
        renderInsumosTable();
    } catch (e) {
        const body = $("#insumos-table-body");
        if (body) body.innerHTML = `<tr><td colspan="7" class="empty">Falha ao carregar insumos.</td></tr>`;
    }
}

function renderInsumosTable() {
    const body = $("#insumos-table-body");
    if (!body) return;
    if (!state.insumosRecords.length) {
        body.innerHTML = `<tr><td colspan="7" class="empty">Nenhum registro de insumo encontrado.</td></tr>`;
        return;
    }
    body.innerHTML = state.insumosRecords.map(i => `<tr>
        <td>${fmtDate(i.criado_em)}</td>
        <td><strong>${esc(i.origem)}</strong><br><span class="subtext">${esc(i.placa)}</span></td>
        <td><strong>${i.quantidade}x</strong> ${esc(i.tipo_insumo)}</td>
        <td><span class="status-badge status-concluido">${esc(i.condicao || 'Íntegro')}</span></td>
        <td>${esc(i.conferente)}</td>
        <td>${i.foto_url ? `<a href="${esc(i.foto_url)}" target="_blank" class="secondary-btn" style="padding:2px 8px; font-size:10px;">Ver Foto</a>` : '—'}</td>
        <td>${esc(i.observacao || '—')}</td>
    </tr>`).join("");
}

// 4.9 Tela: Análises Operational
function renderAnalyticsPage() {
    const rows = recordsDoTurnoAtual();

    const finished = rows.filter(r => r.fim);
    const avg = finished.length ? Math.round(finished.reduce((s, r) => s + durationMinutes(r), 0) / finished.length) : 0;

    const origins = [...new Set(rows.map(r => r.origem))].map(name => ({
        name,
        count: rows.filter(r => r.origem === name).length,
        volume: rows.filter(r => r.origem === name && hasVolumetry(r)).reduce((s, r) => s + Number(r.volumetria || 0), 0)
    })).sort((a, b) => b.volume - a.volume);

    return `<section class="section-page active">
    <div class="hero-strip">
        <div>
            <h2>Análise operacional</h2>
            <p>Indicadores consolidados referentes <strong>apenas ao turno atual</strong>.</p>
        </div>
        <button class="secondary-btn" data-action="export">Exportar base</button>
    </div>
    
    <div class="kpi-grid">
        ${kpi("Recebimentos", rows.length, "truck", "neste turno", true)}
        ${kpi("Finalizados", finished.length, "check", "operações concluídas")}
        ${kpi("Tempo médio", `${avg}<small> min</small>`, "clock", "por descarga")}
        ${kpi("Volume total", rows.filter(hasVolumetry).reduce((s, r) => s + Number(r.volumetria || 0), 0).toLocaleString("pt-BR"), "box", "volumes movimentados")}
        ${kpi("Origens", origins.length, "dock", "CDs e hubs")}
    </div>
    
    <section class="panel records">
        <div class="panel-head">
            <div>
                <h3>Desempenho por origem</h3>
                <p>Ranking por volumetria cadastrada (Turno Atual)</p>
            </div>
        </div>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr><th>Origem</th><th>Recebimentos</th><th>Volumetria</th><th>Participação</th></tr>
                </thead>
                <tbody>
                    ${origins.length ? origins.map(o => `<tr>
                        <td><strong>${esc(o.name)}</strong></td>
                        <td>${o.count}</td>
                        <td>${o.volume.toLocaleString("pt-BR")}</td>
                        <td>${Math.round(o.volume / Math.max(1, rows.filter(hasVolumetry).reduce((s, r) => s + Number(r.volumetria || 0), 0)) * 100)}%</td>
                    </tr>`).join("") : `<tr><td colspan="4" class="empty">Nenhum dado registrado neste turno ainda.</td></tr>`}
                </tbody>
            </table>
        </div>
    </section>
  </section>`;
}

// 4.10 Tela: Configurações do Sistema
function renderSettingsPage() {
    return `<section class="section-page active">
    <div class="hero-strip">
      <div><h2>Configurações</h2><p>Integrações, perfil e comportamento do sistema.</p></div>
    </div>
    <div class="management-grid">
      <article class="panel info-card">
        <p class="eyebrow">INTEGRAÇÃO</p>
        <h3>Google Sheets</h3>
        <p>Importação somente leitura da planilha usada como torre de controle. Os dados cadastrados no Recebe+ não alteram a planilha.</p>
        <div class="settings-list">
          <div class="settings-row"><span>Status</span><strong>${state.config.sheetUrl ? "Conectado" : "Aguardando acesso"}</strong></div>
          <div class="settings-row"><span>Atualização</span><strong>A cada ${state.config.refreshMinutes} min</strong></div>
          <div class="settings-row"><span>Última leitura</span><strong>${state.lastSync ? fmtDate(state.lastSync) : "—"}</strong></div>
        </div>
        ${can("sheet") ? `<button class="primary-btn" data-action="sheet-config">Configurar conexão</button>` : `<p class="helper">Somente supervisores podem configurar esta integração.</p>`}
      </article>

      <article class="panel info-card">
        <p class="eyebrow">PERFIL ATIVO</p>
        <h3>${state.role}</h3>
        <p>As permissões são definidas automaticamente pelo usuário autenticado.</p>
        <div class="settings-list">
          <div class="settings-row"><span>Usuário</span><strong>${esc(state.user.username)}</strong></div>
          <div class="settings-row"><span>Permissão</span><strong>${state.role === "Supervisor" ? "Gestão completa" : state.role === "Conferente" ? "Operação de descarga" : "Cadastro e monitoramento"}</strong></div>
          <div class="settings-row"><span>Armazenamento</span><strong>${state.apiOnline ? "Base compartilhada" : "Contingência local"}</strong></div>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px;">
          <button class="secondary-btn" data-action="open-change-password">Alterar Minha Senha</button>
          <button class="secondary-btn" data-action="logout">Encerrar sessão</button>
          ${state.role === "Supervisor" ? `<button class="primary-btn" data-action="manage-users">Gerenciar Equipe</button>` : ""}
        </div>
      </article>
    </div>
  </section>`;
}

// ==========================================
// 5. COMPONENTES MODAIS E FORMULÁRIOS INTERATIVOS
// ==========================================

// 5.1 Modal: Novo Recebimento
function openNewRecord(preselectedDock = "") {
    const localValue = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    $("#modal-root").innerHTML = `<div class="overlay" data-action="close-modal"><form class="modal" id="record-form" onclick="event.stopPropagation()"><div class="modal-head"><div><h2>Iniciar recebimento</h2><p>Registre o veículo e os dados da descarga na doca ${dockLabel(preselectedDock)}.</p></div><button type="button" class="close-btn" data-action="close-modal">×</button></div><div class="modal-body"><div class="form-grid">
    <div class="field"><label>Data e hora previstas *</label><input required name="data" type="datetime-local" value="${localValue}"></div>
    <div class="field"><label>CD / Hub de origem *</label><input required name="origem" placeholder="Ex.: CD Guarulhos"></div>
    <div class="field"><label>Motorista *</label><input required name="motorista" placeholder="Nome completo"></div>
    <div class="field"><label>Placa do veículo *</label><input required maxlength="8" name="placa" placeholder="ABC-1D23" style="text-transform:uppercase"></div>
    <div class="field"><label>Volumetria *</label><input required min="1" name="volumetria" type="number" placeholder="Quantidade de volumes"><p class="helper">Obrigatória para iniciar o recebimento.</p></div>
    <div class="field"><label>Doca *</label><select required name="doca"><option value="">Selecione</option>${Array.from({ length: 18 }, (_, i) => `<option value="${i + 1}" ${String(i + 1) === String(preselectedDock) ? "selected" : ""}>${pad(i + 1)}</option>`).join("")}</select></div>
    <div class="field"><label>SLA de descarga (min) *</label><input required min="1" name="sla" type="number" value="60"></div>
    <div class="field"><label>Conferente / Responsável</label><input name="conferente" value="${esc(state.user?.name || state.user?.username)}" readonly style="background:#f3f6fa;color:#8396a7;"></div>
    <div class="field full"><label>Status inicial</label><select name="status"><option selected>Em descarga</option><option>Aguardando</option><option>Em Trânsito</option></select><p class="helper">O horário de início será registrado automaticamente.</p></div>
  </div></div><div class="modal-actions"><button type="button" class="secondary-btn" data-action="close-modal">Cancelar</button><button class="primary-btn" type="submit">Iniciar Recebimento</button></div></form></div>`;
    const statusField = $("#record-form [name=status]");
    const volumeField = $("#record-form [name=volumetria]");
    const syncVolumeRequirement = () => { volumeField.required = statusField.value === "Em descarga"; };
    statusField.addEventListener("change", syncVolumeRequirement); syncVolumeRequirement();
}

// 5.2 Modal: Confirmação de Início de Descarga Agendada
function openStartUnload(id) {
    const r = allRecords().find(item => item.id === id); if (!r) return;
    $("#modal-root").innerHTML = `<div class="overlay" data-action="close-modal"><form class="modal small" id="start-unload-form" data-id="${esc(r.id)}">
    <div class="modal-head"><div><h2>Iniciar Recebimento</h2><p>${esc(r.placa)} • Doca ${dockLabel(r.doca)}</p></div><button type="button" class="close-btn" data-action="close-modal">×</button></div>
    <div class="modal-body">
      <div class="field"><label>Volumetria confirmada *</label><input required min="1" name="volumetria" type="number" placeholder="Quantidade de volumes"></div>
    </div>
    <div class="modal-actions"><button type="button" class="secondary-btn" data-action="close-modal">Cancelar</button><button class="primary-btn" type="submit">Confirmar e Iniciar</button></div>
  </form></div>`;
}

// 5.3 Modal: Registro de Devolução de Insumos e Foto (Link Google Drive)
function getInsumoTemplate(index) {
    return `
    <div class="insumo-item" style="border: 1px solid #e0e6ed; padding: 12px; border-radius: 8px; margin-bottom: 12px; background: #fdfdfd;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="font-size: 11px; color: var(--ink);">Insumo #${index + 1}</strong>
            ${index > 0 ? `<button type="button" onclick="this.closest('.insumo-item').remove()" style="background:none; border:none; color:var(--red); font-size:16px; cursor:pointer;" title="Remover">×</button>` : ''}
        </div>
        <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 8px;">
            <div class="field">
                <label>Tipo *</label>
                <select name="tipo_insumo" required>
                    <option value="">Selecione</option>
                    <option value="Gaylords">Gaylords</option>
                    <option value="Pallets">Pallets</option>
                    <option value="Bags">Bags</option>
                    <option value="Strech">Strech</option>
                    <option value="Outros">Outros</option>
                </select>
            </div>
            <div class="field">
                <label>Quantidade *</label>
                <input type="number" min="1" name="qtd_insumo" required placeholder="Qtd">
            </div>
            <div class="field full status-insumo-wrap">
                <label>Condição</label>
                <select name="status_insumo">
                    <option value="Completas">Completas / Íntegras</option>
                    <option value="Incompletas">Incompletas / Danificadas</option>
                </select>
            </div>
            <div class="field full">
                <label>Observação</label>
                <input type="text" name="obs_insumo" placeholder="Detalhes (opcional)" maxlength="120">
            </div>
        </div>
    </div>`;
}

function openPromptInsumos(id) {
    const r = allRecords().find(item => item.id === id); if (!r) return;
    $("#modal-root").innerHTML = `<div class="overlay" data-action="close-modal"><form class="modal" id="finish-unload-form" data-id="${esc(r.id)}">
    <div class="modal-head"><div><h2>Finalizar Recebimento</h2><p>Doca ${dockLabel(r.doca)} • Deseja registrar devolução de insumos?</p></div><button type="button" class="close-btn" data-action="close-modal">×</button></div>
    
    <div class="modal-body" style="max-height: 65vh; overflow-y: auto;">
      <div style="display:flex; gap:10px; margin-bottom: 15px;">
        <label style="display:flex; align-items:center; gap:5px;"><input type="radio" name="tem_insumo" value="sim" checked> Sim, carregar insumos</label>
        <label style="display:flex; align-items:center; gap:5px;"><input type="radio" name="tem_insumo" value="nao"> Não há insumos</label>
      </div>

      <div id="insumos-fields">
          <div id="insumos-list">
              ${getInsumoTemplate(0)}
          </div>
          
          <button type="button" class="secondary-btn" data-action="add-insumo" style="width:100%; margin-bottom: 15px; border-style: dashed; color: var(--brand);">+ Adicionar outro insumo</button>
          
          <div class="field full">
            <label>Link da Evidência / Foto (Google Drive) *</label>
            <input type="url" name="foto_url" placeholder="https://drive.google.com/file/d/..." style="width:100%;">
            <p class="helper">Cole o link da foto salva no Google Drive da empresa.</p>
          </div>
      </div>
    </div>
    <div class="modal-actions">
        <button type="button" class="secondary-btn" data-action="close-modal">Cancelar</button>
        <button class="primary-btn" type="submit" style="background:var(--green)">Concluir Descarga</button>
    </div>
  </form></div>`;

    const form = document.getElementById("finish-unload-form");
    const fieldsWrap = document.getElementById("insumos-fields");

    form.addEventListener("change", (e) => {
        if (e.target.name === "tem_insumo") {
            fieldsWrap.style.display = e.target.value === "sim" ? "block" : "none";
            const firstQtd = form.querySelector('[name="qtd_insumo"]');
            if (firstQtd) firstQtd.required = (e.target.value === "sim");
        }
    });
}

// 5.4 Modal: Configuração da Conexão com Google Sheets
function openSheetConfig() {
    $("#modal-root").innerHTML = `<div class="overlay" data-action="close-modal"><form class="modal small" id="sheet-form" onclick="event.stopPropagation()"><div class="modal-head"><div><h2>Conectar Google Sheets</h2><p>Integração somente leitura com a torre de controle.</p></div><button type="button" class="close-btn" data-action="close-modal">×</button></div><div class="modal-body">
    <div class="field"><label>URL pública de exportação CSV</label><input name="sheetUrl" type="url" value="${esc(state.config.sheetUrl)}" placeholder="https://docs.google.com/spreadsheets/.../export?format=csv"><p class="helper">A planilha precisa estar publicada para leitura.</p></div>
    <div class="field" style="margin-top:15px"><label>Intervalo de atualização</label><select name="refreshMinutes"><option value="1" ${state.config.refreshMinutes == 1 ? "selected" : ""}>A cada 1 minuto</option><option value="5" ${state.config.refreshMinutes == 5 ? "selected" : ""}>A cada 5 minutos</option><option value="15" ${state.config.refreshMinutes == 15 ? "selected" : ""}>A cada 15 minutos</option></select></div>
  </div><div class="modal-actions">${state.config.sheetUrl ? `<button type="button" class="secondary-btn" data-action="disconnect-sheet">Desconectar</button>` : ""}<button class="primary-btn" type="submit">Salvar e testar</button></div></form></div>`;
}

// 5.5 Modal: Gerenciamento de Equipe
async function openManageUsers() {
    $("#modal-root").innerHTML = `<div class="overlay"><div class="modal small"><div class="modal-body" style="text-align:center;padding:40px;">Carregando equipe...</div></div></div>`;
    try {
        const res = await api("/api/users");
        const listHtml = res.users.map(u => `
            <div class="settings-row" style="margin-bottom: 8px;">
                <div>
                    <strong style="display:block;color:var(--ink);font-size:12px;">${esc(u.name || u.username)}</strong>
                    <span style="font-size:10px;">Login: ${esc(u.username)} • Perfil: ${esc(u.role)}</span>
                </div>
                <button class="secondary-btn" style="padding: 6px 10px; font-size: 10px;" data-action="edit-user" data-username="${esc(u.username)}" data-name="${esc(u.name || "")}" data-role="${esc(u.role)}">Editar</button>
            </div>
        `).join("");

        $("#modal-root").innerHTML = `<div class="overlay" data-action="close-modal">
            <div class="modal small" onclick="event.stopPropagation()">
                <div class="modal-head"><div><h2>Gerenciar Equipe</h2><p>Usuários cadastrados no sistema.</p></div><button class="close-btn" data-action="close-modal">×</button></div>
                <div class="modal-body">
                    <div style="max-height: 300px; overflow-y: auto; margin-bottom: 15px; padding-right: 5px;">
                        ${listHtml}
                    </div>
                    <button class="primary-btn" style="width: 100%;" data-action="new-user">Adicionar Novo Usuário</button>
                </div>
            </div>
        </div>`;
    } catch (e) {
        $("#modal-root").innerHTML = "";
        toast("Erro", "Não foi possível carregar a equipe.");
    }
}

function openUserForm(username = "", name = "", role = "Conferente") {
    const isEdit = !!username;
    $("#modal-root").innerHTML = `<div class="overlay" data-action="close-modal">
        <form class="modal small" id="register-user-form" data-action-type="${isEdit ? 'update' : 'create'}" onclick="event.stopPropagation()">
            <div class="modal-head">
                <div>
                    <h2>${isEdit ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                    <p>${isEdit ? 'Altere as informações do membro da equipe.' : 'Preencha os dados do novo membro.'}</p>
                </div>
                <button type="button" class="close-btn" data-action="close-modal">×</button>
            </div>
            <div class="modal-body">
                <div class="field"><label>Nome Completo *</label><input required name="new_name" type="text" placeholder="Ex: André Costa" value="${esc(name)}"></div>
                <div class="field"><label>Nome de Usuário (Login) *</label><input required name="new_username" type="text" placeholder="Ex: andre.costa" value="${esc(username)}" ${isEdit ? 'readonly style="background:#f3f6fa;color:#8396a7;cursor:not-allowed;"' : ''}></div>
                <div class="field"><label>${isEdit ? 'Nova Senha (deixe em branco para manter)' : 'Senha Inicial *'}</label><input ${isEdit ? '' : 'required'} name="new_password" type="password" placeholder="${isEdit ? 'Digite se for redefinir a senha' : 'Mínimo de 12 caracteres'}"></div>
                <div class="field" style="margin-top:10px"><label>Função no Sistema *</label>
                    <select required name="new_role">
                        <option value="Conferente" ${role === 'Conferente' ? 'selected' : ''}>Conferente (Apenas opera docas)</option>
                        <option value="Assistente" ${role === 'Assistente' ? 'selected' : ''}>Assistente (Cadastra e monitora)</option>
                        <option value="Supervisor" ${role === 'Supervisor' ? 'selected' : ''}>Supervisor (Acesso total)</option>
                    </select>
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" class="secondary-btn" data-action="manage-users">Voltar para lista</button>
                <button class="primary-btn" type="submit">${isEdit ? 'Salvar Alterações' : 'Cadastrar Usuário'}</button>
            </div>
        </form>
    </div>`;
}

// 5.6 Modal: Troca de Senha do Usuário Autenticado
function openChangePasswordModal() {
    $("#modal-root").innerHTML = `<div class="overlay" data-action="close-modal">
        <form class="modal small" id="change-password-form" onclick="event.stopPropagation()">
            <div class="modal-head">
                <div><h2>Alterar Minha Senha</h2><p>Digite sua senha atual e a nova frase-senha.</p></div>
                <button type="button" class="close-btn" data-action="close-modal">×</button>
            </div>
            <div class="modal-body">
                <div class="field"><label>Senha Atual *</label><input required name="current_password" type="password" placeholder="Digite sua senha atual"></div>
                <div class="field"><label>Nova Senha *</label><input required name="new_password" type="password" placeholder="Mínimo de 12 caracteres"></div>
            </div>
            <div class="modal-actions">
                <button type="button" class="secondary-btn" data-action="close-modal">Cancelar</button>
                <button class="primary-btn" type="submit">Alterar Senha</button>
            </div>
        </form>
    </div>`;
}

// ==========================================
// 6. EVENTOS DE INTERAÇÃO, SUBMISSÕES E INTEGRAÇÃO
// ==========================================

// 6.1 Banners de Eventos e Filtros Globais
function bindEvents() {
    $$('[data-page]').forEach(btn => btn.addEventListener("click", () => { state.page = btn.dataset.page; renderApp(); }));
    const search = $("#record-search");
    if (search) search.addEventListener("input", e => { state.query = e.target.value; const pos = e.target.selectionStart; renderApp(); const next = $("#record-search"); if (next) { next.focus(); next.setSelectionRange(pos, pos); } });
    const filter = $("#status-filter");
    if (filter) filter.addEventListener("change", e => { state.statusFilter = e.target.value; renderApp(); });
}

async function updateRecord(id, transition, changes, payload = {}) {
    const index = state.records.findIndex(r => r.id === id); if (index < 0) return false;
    if (state.apiOnline && state.records[index].source === "server") {
        try { const result = await api(`/api/records/${encodeURIComponent(id)}/transition`, { method: "PATCH", body: JSON.stringify({ action: transition, ...payload }) }); state.records[index] = result.record; }
        catch (error) { toast("Ação não concluída", error.message); return false; }
    } else state.records[index] = { ...state.records[index], ...changes };
    saveRecords(); $("#modal-root").innerHTML = ""; renderApp(); return true;
}

// 6.2 Handler Global de Cliques (delegativo)
document.addEventListener("click", async event => {
    const button = event.target.closest("[data-action]"); if (!button) return;
    const action = button.dataset.action;
    if (action === "new-record" && can("create")) openNewRecord(button.dataset.dock || "");
    if (action === "close-modal") {
        if (event.target.classList.contains('overlay') || event.target.closest('.close-btn') || event.target.classList.contains('secondary-btn')) {
            $("#modal-root").innerHTML = "";
        }
    }
    if (action === "manage-users" && state.role === "Supervisor") openManageUsers();
    if (action === "new-user") openUserForm();
    if (action === "edit-user") openUserForm(button.dataset.username, button.dataset.name, button.dataset.role);
    if (action === "sheet-config" && can("sheet")) openSheetConfig();
    if (action === "toggle-password") { const input = button.parentElement.querySelector("input"); input.type = input.type === "password" ? "text" : "password"; button.textContent = input.type === "password" ? "Ver" : "Ocultar"; }
    if (action === "logout") { try { await api("/api/logout", { method: "POST", body: "{}" }); } catch { } state.user = null; state.role = null; state.csrf = null; state.records = []; renderApp(); }
    if (action === "sync") syncSheet(true);
    if (action === "open-change-password") openChangePasswordModal();
    if (action === "export") exportCSV();
    if (action === "download-turno") downloadTurnoExcel();
    if (action === "prepare-unload") openStartUnload(button.dataset.id);
    if (action === "prompt-insumos") openPromptInsumos(button.dataset.id);
    if (action === "disconnect-sheet") { state.config.sheetUrl = ""; state.sheetRecords = []; saveConfig(); $("#modal-root").innerHTML = ""; renderApp(); toast("Planilha desconectada"); }
    if (action === "add-insumo") {
        const list = document.getElementById("insumos-list");
        if (list) {
            const div = document.createElement("div");
            div.innerHTML = getInsumoTemplate(list.children.length);
            list.appendChild(div.firstElementChild);
            document.querySelector('.modal-body').scrollBy({ top: 150, behavior: 'smooth' });
        }
    }
    if (action === "filtrar-insumos") {
        state.insumoFiltros = {
            dataInicio: $("#filtro-data-inicio")?.value || "",
            dataFim: $("#filtro-data-fim")?.value || "",
            origem: $("#filtro-origem")?.value || "",
            conferente: $("#filtro-conferente")?.value || ""
        };
        fetchInsumos();
    }
    if (action === "limpar-filtros-insumos") {
        state.insumoFiltros = { dataInicio: "", dataFim: "", origem: "", conferente: "" };
        renderApp();
    }
});

// 6.3 Handler Global de Form Submissions
document.addEventListener("submit", async event => {
    if (event.target.id === "login-form") {
        event.preventDefault(); const submit = event.target.querySelector("button[type=submit]"); submit.disabled = true; submit.textContent = "Validando…"; const form = new FormData(event.target);
        try { const payload = await api("/api/login", { method: "POST", body: JSON.stringify({ username: form.get("username"), password: form.get("password") }) }); state.user = payload.user; state.role = payload.user.role; state.csrf = payload.csrf; state.apiOnline = true; renderApp(); await hydrateFromServer(); toast("Acesso autorizado", `Sessão iniciada como ${state.role}.`); }
        catch (error) { submit.disabled = false; submit.textContent = "Entrar no sistema"; toast("Acesso não autorizado", error.message); }
    }
    if (event.target.id === "record-form") {
        event.preventDefault(); const form = new FormData(event.target); const status = form.get("status");
        const record = { id: `R-${Date.now().toString().slice(-6)}`, data: new Date(form.get("data")).toISOString(), origem: String(form.get("origem")).trim(), doca: form.get("doca") || "—", motorista: String(form.get("motorista")).trim(), placa: String(form.get("placa")).trim().toUpperCase(), volumetria: Number(form.get("volumetria")), inicio: status === "Em descarga" ? new Date().toISOString() : null, fim: null, sla: Number(form.get("sla")), conferente: String(form.get("conferente") || "—").trim(), status, source: "local" };
        if (state.apiOnline) {
            try { const payload = await api("/api/records", { method: "POST", body: JSON.stringify(record) }); state.records.unshift(payload.record); }
            catch (error) { toast("Cadastro não concluído", error.message); return; }
        } else state.records.unshift(record);
        saveRecords(); $("#modal-root").innerHTML = ""; renderApp(); toast("Recebimento cadastrado", `${record.placa} incluído na operação.`);
    }
    if (event.target.id === "start-unload-form") {
        event.preventDefault();
        const id = event.target.dataset.id;
        const volume = Number(new FormData(event.target).get("volumetria"));
        const conferenteNome = state.user.name || state.user.username;

        if (await updateRecord(id, "start", { status: "Em descarga", inicio: new Date().toISOString(), volumetria: volume, conferente: conferenteNome }, { volumetria: volume, conferente: conferenteNome })) {
            toast("Descarga iniciada", "Volumetria confirmada e SLA em andamento.");
        }
    }
    if (event.target.id === "finish-unload-form") {
        event.preventDefault();
        const id = event.target.dataset.id;
        const form = new FormData(event.target);

        const payload = { 
            action: "finish",
            status: "Concluído", 
            fim: new Date().toISOString(),
            foto_url: form.get("foto_url") || ""
        };

        if (form.get("tem_insumo") === "sim") {
            const items = [...event.target.querySelectorAll('.insumo-item')];
            const insumosList = items.map(item => ({
                tipo: item.querySelector('[name="tipo_insumo"]').value,
                qtd: Number(item.querySelector('[name="qtd_insumo"]').value || 0),
                status: item.querySelector('[name="status_insumo"]')?.value || "",
                obs: item.querySelector('[name="obs_insumo"]')?.value || "",
                foto_url: form.get("foto_url") || ""
            })).filter(i => i.tipo && i.qtd > 0);

            payload.insumos = insumosList;
            payload.insumo_tipo = insumosList.map(i => `${i.qtd}x ${i.tipo}`).join(", ");
            payload.insumo_qtd = insumosList.reduce((acc, curr) => acc + curr.qtd, 0);
        }

        if (await updateRecord(id, "finish", payload, payload)) {
            toast("Descarga finalizada", "Insumos registrados com sucesso no PostgreSQL.");
        }
    }
    if (event.target.id === "sheet-form") {
        event.preventDefault(); const form = new FormData(event.target); state.config.sheetUrl = String(form.get("sheetUrl") || "").trim(); state.config.refreshMinutes = Number(form.get("refreshMinutes") || 5); saveConfig(); $("#modal-root").innerHTML = ""; syncSheet(true); scheduleSync();
    }
    if (event.target.id === "register-user-form") {
        event.preventDefault();
        const form = new FormData(event.target);
        const submit = event.target.querySelector("button[type=submit]");
        const actionType = event.target.dataset.actionType;

        submit.disabled = true;
        submit.textContent = "Salvando...";

        const newPassword = String(form.get("new_password") || "").trim();

        api("/api/users", {
            method: "POST",
            body: JSON.stringify({
                action: actionType,
                name: String(form.get("new_name") || "").trim(),
                username: String(form.get("new_username") || "").trim(),
                password: newPassword,
                role: form.get("new_role")
            })
        })
            .then(payload => {
                const msg = newPassword.length > 0 ? "Perfil e senha atualizados com sucesso." : "Perfil atualizado com sucesso.";
                toast("Sucesso!", msg);
                openManageUsers();
            })
            .catch(error => {
                if (error.message && error.message.includes("Unexpected end of JSON")) {
                    toast("Sucesso!", "Alteração realizada com sucesso.");
                    openManageUsers();
                    return;
                }
                submit.disabled = false;
                submit.textContent = actionType === 'create' ? "Cadastrar Usuário" : "Salvar Alterações";
                toast("Falha ao salvar", error.message);
            });
    }

    if (event.target.id === "change-password-form") {
        event.preventDefault();
        const form = new FormData(event.target);
        const submit = event.target.querySelector("button[type=submit]");

        submit.disabled = true; submit.textContent = "Atualizando...";

        api("/api/change-password", {
            method: "POST",
            body: JSON.stringify({
                currentPassword: form.get("current_password"),
                newPassword: form.get("new_password")
            })
        })
            .then(payload => {
                toast("Sucesso!", "Sua senha foi alterada com sucesso.");
                $("#modal-root").innerHTML = "";
            })
            .catch(error => {
                submit.disabled = false; submit.textContent = "Alterar Senha";
                toast("Falha ao alterar senha", error.message);
            });
    }
});

// ==========================================
// 7. EXPORTAÇÕES E SINCRONIZAÇÃO DE PLANILHAS (CSV/EXCEL)
// ==========================================

// 7.1 Parser e Interpretador CSV do Google Sheets
function parseCSV(text) {
    const rows = []; let row = [], field = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i], next = text[i + 1];
        if (ch === '"' && quoted && next === '"') { field += '"'; i++; }
        else if (ch === '"') { quoted = !quoted; }
        else if (ch === ',' && !quoted) { row.push(field.trim()); field = ""; }
        else if ((ch === '\n' || ch === '\r') && !quoted) { if (ch === '\r' && next === '\n') i++; row.push(field.trim()); if (row.some(Boolean)) rows.push(row); row = []; field = ""; }
        else field += ch;
    }
    row.push(field.trim()); if (row.some(Boolean)) rows.push(row); return rows;
}

function normHeader(value) { return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); }

function parseDateBR(value) {
    if (!value) return new Date().toISOString(); const direct = new Date(value); if (!Number.isNaN(direct.getTime())) return direct.toISOString();
    const m = String(value).match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/); if (!m) return new Date().toISOString();
    const year = Number(m[3]) < 100 ? 2000 + Number(m[3]) : Number(m[3]); return new Date(year, Number(m[2]) - 1, Number(m[1]), Number(m[4] || 0), Number(m[5] || 0)).toISOString();
}

function parseTimeOnDate(value, base) {
    if (!value) return null; const direct = new Date(value); if (!Number.isNaN(direct.getTime())) return direct.toISOString(); const m = String(value).match(/(\d{1,2}):(\d{2})/); if (!m) return null; const d = new Date(base); d.setHours(Number(m[1]), Number(m[2]), 0, 0); return d.toISOString();
}

function parseSla(value) { const m = String(value || "").match(/(\d+):(\d+)/); return m ? Number(m[1]) * 60 + Number(m[2]) : Number(String(value || 60).replace(/\D/g, "")) || 60; }

function recordsFromCSV(text) {
    const rows = parseCSV(text); if (rows.length < 2) return [];
    const headers = rows[0].map(normHeader); const get = (row, name) => row[headers.indexOf(normHeader(name))] || "";

    return rows.slice(1).map((row, i) => {
        const data = parseDateBR(get(row, "Data"));
        return normalizeRecord({
            id: `GS-${i}-${String(get(row, "Placa do Veículo")).replace(/\W/g, "")}`,
            data,
            origem: get(row, "Origem") || "—",
            previsao: get(row, "Previsao") || get(row, "Previsão") || "",
            doca: get(row, "Doca") || "—",
            motorista: get(row, "Motorista") || "—",
            placa: get(row, "Placa do Veículo") || "—",
            volumetria: Number(String(get(row, "Volumetria")).replace(/\D/g, "")) || 0,
            inicio: parseTimeOnDate(get(row, "Início Descarga"), data),
            fim: parseTimeOnDate(get(row, "Fim Descarga"), data),
            sla: parseSla(get(row, "SLA")),
            conferente: get(row, "Conferente / Responsável") || "—",
            status: get(row, "Status do Recebimento") || "Em Trânsito",
            source: "sheet"
        });
    }).filter(r => r.placa !== "—");
}

// 7.2 Sincronizador de planilha remota (Google Sheets Torre de Controle)
async function syncSheet(manual = false) {
    if (!state.config.sheetUrl) { if (manual) openSheetConfig(); return; }
    const label = $("#sync-label"); if (label) label.textContent = "Sincronizando…";
    try { const response = await fetch(state.config.sheetUrl, { cache: "no-store" }); if (!response.ok) throw new Error(`HTTP ${response.status}`); const csv = await response.text(); const parsed = recordsFromCSV(csv); if (!parsed.length) throw new Error("Nenhuma linha reconhecida"); state.sheetRecords = parsed; state.lastSync = new Date().toISOString(); renderApp(); if (manual) toast("Planilha sincronizada", `${parsed.length} registros importados em modo leitura.`); }
    catch (error) { if (label) label.textContent = "Falha na sincronização"; if (manual) toast("Não foi possível ler a planilha", "Verifique se a URL CSV está pública e se as colunas estão corretas."); }
}

let syncTimer;
function scheduleSync() { clearInterval(syncTimer); if (state.config.sheetUrl) syncTimer = setInterval(() => syncSheet(false), Math.max(1, state.config.refreshMinutes) * 60000); }

// 7.3 Geradores e exportadores em CSV e Excel (.XLSX)
function exportCSV() {
    const headers = ["Data", "Origem", "Doca", "Motorista", "Placa do Veículo", "Volumetria", "Início Descarga", "Fim Descarga", "SLA", "Conferente / Responsável", "Status do Recebimento"];
    const quote = v => `"${String(v ?? "").replace(/"/g, '""')}"`; const body = allRecords().map(r => [fmtDate(r.data), r.origem, dockLabel(r.doca), r.motorista, r.placa, hasVolumetry(r) ? r.volumetria : "", fmtTime(r.inicio), fmtTime(r.fim), r.sla, r.conferente, r.status].map(quote).join(","));
    const blob = new Blob(["\ufeff" + [headers.map(quote).join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `recebimentos-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href); toast("Arquivo exportado", "A base CSV foi preparada para download.");
}

function downloadTurnoExcel() {
    if (typeof XLSX === "undefined") {
        toast("Erro", "Biblioteca Excel não carregada. Verifique a tag no index.html.");
        return;
    }

    const agora = new Date();
    const hora = agora.getHours();

    let turno = "T3";
    if (hora >= 6 && hora < 14) turno = "T1";
    else if (hora >= 14 && hora < 22) turno = "T2";

    const produtividadeRecords = recordsDoTurnoAtual()
        .filter(r => r.status === "Concluído" || r.status === "Em descarga");

    if (produtividadeRecords.length === 0) {
        toast("Aviso", "Nenhum dado de produtividade para exportar.");
        return;
    }

    const dadosExcel = produtividadeRecords.map(r => ({
        "Origem": r.origem,
        "Volumetria": hasVolumetry(r) && Number(r.volumetria) > 0 ? Number(r.volumetria) : "",
        "Início": fmtTime(r.inicio),
        "Finalizado em": fmtTime(r.fim),
        "SLA Previsto (min)": r.sla,
        "Tempo Decorrido (min)": durationMinutes(r),
        "Status": r.status,
        "Responsável": r.conferente
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtividade");

    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const nomeArquivo = `${turno}_${dia}-${mes}.xlsx`;

    XLSX.writeFile(wb, nomeArquivo);
    toast("Download Concluído", `Planilha ${nomeArquivo} gerada com sucesso.`);
}

// ==========================================
// 8. INICIALIZAÇÃO DA APLICAÇÃO E SERVICE WORKER
// ==========================================

renderApp();
scheduleSync();
checkSession();
if (state.config.sheetUrl) syncSheet(false);
if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("service-worker.js").catch(() => { });
}