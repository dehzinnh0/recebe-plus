"use strict";

const $ = (selector, root = document) => root.querySelector(selector); const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const STORAGE_KEY = "recebe-plus-records-v1";
const CONFIG_KEY = "recebe-plus-config-v1";

const icons = {
    dashboard: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    truck: `<svg viewBox="0 0 24 24"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>`,
    dock: `<svg viewBox="0 0 24 24"><path d="M4 21V4h16v17M8 21V8h8v13M8 12h8M8 16h8"/></svg>`,
    box: `<svg viewBox="0 0 24 24"><path d="m4 7 8-4 8 4-8 4zM4 7v10l8 4 8-4V7M12 11v10"/></svg>`,
    chart: `<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20V7M2 20h21"/></svg>`,
    gear: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/></svg>`,
    search: `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>`,
    refresh: `<svg viewBox="0 0 24 24"><path d="M20 6v5h-5M4 18v-5h5M18 9a7 7 0 0 0-12-2l-2 4M6 15a7 7 0 0 0 12 2l2-4"/></svg>`,
    clock: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
    check: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>`,
    logout: `<svg viewBox="0 0 24 24"><path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10"/></svg>`
};

const pad = n => String(n).padStart(2, "0");
const now = new Date();
const isoAt = (hour, minute = 0, dayOffset = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
};

const seedRecords = [
    { id: "D-101", data: isoAt(7, 20), origem: "CD Guarulhos", doca: "3", motorista: "Carlos Mendes", placa: "RFG-8J21", volumetria: 1860, inicio: isoAt(7, 42), fim: isoAt(8, 31), sla: 60, conferente: "Ana Souza", status: "Concluído" },
    { id: "D-102", data: isoAt(8, 10), origem: "Hub Campinas", doca: "5", motorista: "João Ribeiro", placa: "GHT-4C07", volumetria: 2430, inicio: isoAt(8, 28), fim: null, sla: 75, conferente: "Marcos Lima", status: "Em descarga" },
    { id: "D-103", data: isoAt(9, 0), origem: "CD Extrema", doca: "2", motorista: "Paulo Nunes", placa: "BXR-1D94", volumetria: 0, inicio: null, fim: null, sla: 45, conferente: "—", status: "Aguardando" }
].map(r => ({ ...r, source: "local" }));

function loadJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

const state = {
    page: "dashboard",
    role: null,
    user: null,
    csrf: null,
    authChecked: false,
    records: loadJSON(STORAGE_KEY, seedRecords),
    sheetRecords: [],
    insumosList: [],
    config: loadJSON(CONFIG_KEY, { sheetUrl: "", refreshMinutes: 5 }),
    query: "",
    statusFilter: "todos",
    insumoFiltroDataInicio: "",
    insumoFiltroDataFim: "",
    insumoFiltroOrigem: "",
    insumoFiltroConferente: "",
    lastSync: null,
    apiOnline: false
};

function saveRecords() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records)); }
function saveConfig() { localStorage.setItem(CONFIG_KEY, JSON.stringify(state.config)); }

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

function can(permission) {
    if (state.role === "Supervisor") return true;
    if (permission === "create") return ["Conferente", "Assistente"].includes(state.role);
    if (permission === "transition") return state.role === "Conferente";
    if (permission === "sheet") return false;
    return Boolean(state.user);
}

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
    return d <= record.sla * 0.85 ? "good" : d <= record.sla ? "warn" : "bad";
}

function toast(title, message = "") {
    const root = $("#toast-root") || document.body;
    const toastEl = document.createElement("div");
    toastEl.className = "toast";
    toastEl.innerHTML = `<b>${title}</b>${message ? `<p>${message}</p>` : ""}`;
    root.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 3200);
}

function esc(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

// -------------------------------------------------------------
// NAV E TEMPLATES DE INTERFACE
// -------------------------------------------------------------

const navItems = [
    ["dashboard", "Visão geral", "dashboard"],
    ["recebimentos", "Torre de Controle", "truck"],
    ["docas", "Inbound", "dock"],
    ["insumos", "Insumos", "box"],
    ["analises", "Análises", "chart"],
    ["configuracoes", "Configurações", "gear"]
];

function navButton([id, label, icon], mobile = false) {
    return `<button class="${mobile ? "" : "nav-item "}${state.page === id ? "active" : ""}" data-page="${id}">
        ${mobile ? icons[icon] : `<span class="nav-icon">${icons[icon]}</span>`}
        ${mobile ? `<span>${label.replace("Visão geral", "Início").replace("Torre de Controle", "Torre").replace("Configurações", "Ajustes")}</span>` : label}
    </button>`;
}

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
                    <option value="Stretch">Stretch</option>
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
        insumos: ["EVIDÊNCIAS", "Envio de Insumos"],
        analises: ["DESEMPENHO", "Análises"],
        configuracoes: ["SISTEMA", "Configurações"]
    };

    const title = titles[state.page] || ["", "Recebe+"];
    const isAnalises = state.page === "analises";

    $("#app").innerHTML = `<div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark"><i></i><i></i><i></i></span><span class="brand-name">recebe+<small>controle logístico</small></span></div>
      <div class="nav-label">Operação</div><nav class="nav-list">${navItems.slice(0, 4).map(n => navButton(n)).join("")}</nav>
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
    <div id="toast-root"></div></div>`;

    bindEvents();
}

function renderLogin() {
    $("#app").innerHTML = `<main class="auth-page"><section class="auth-visual"><div class="auth-brand"><span class="brand-mark"><i></i><i></i><i></i></span><span class="brand-name">recebe+<small>controle logístico</small></span></div><div class="auth-copy"><span class="auth-kicker">OPERAÇÃO EM MOVIMENTO</span><h1>Cada doca.<br>Cada minuto.<br><em>Sob controle.</em></h1><p>Recebimento, volumetria e SLA em uma única visão operacional.</p></div><div class="auth-stats"><span><strong>18</strong>docas monitoradas</span><span><strong>24/7</strong>visão da operação</span><span><strong>1</strong>fonte de verdade</span></div></section><section class="auth-form-wrap"><form class="login-card" id="login-form"><p class="eyebrow">ACESSO RESTRITO</p><h2>Bem-vindo</h2><p class="login-intro">Entre com seu usuário e senha para acessar o recebimento.</p><div class="field"><label>Usuário</label><input name="username" required autocomplete="username" autofocus placeholder="Digite seu usuário"></div><div class="field"><label>Senha</label><div class="password-field"><input name="password" required type="password" autocomplete="current-password" placeholder="Digite sua senha"><button type="button" data-action="toggle-password" aria-label="Mostrar senha">Ver</button></div></div><button class="primary-btn login-submit" type="submit">Entrar no sistema</button><p class="security-note">Acesso monitorado · Sessão protegida · Ambiente de testes</p></form></section></main>`;
}

function renderCurrentPage() {
    if (state.page === "dashboard") return renderDashboard();
    if (state.page === "recebimentos") return renderReceiptsPage();
    if (state.page === "docas") return renderDocksPage();
    if (state.page === "insumos") return renderInsumosPage();
    if (state.page === "analises") return renderAnalyticsPage();
    return renderSettingsPage();
}

function getMetrics() {
    const today = allRecords().filter(r => sameDay(r.data));
    const active = today.filter(r => r.status === "Em descarga");
    const finished = today.filter(r => r.status === "Concluído" || r.status === "Em Atraso");
    const avg = finished.length ? Math.round(finished.reduce((sum, r) => sum + durationMinutes(r), 0) / finished.length) : 0;
    const onSla = finished.length ? Math.round(finished.filter(r => durationMinutes(r) <= Number(r.sla || 60)).length / finished.length * 100) : 100;
    return { today, active, finished, avg, onSla, docks: new Set(active.map(r => r.doca)).size };
}

function kpi(label, value, icon, trend, featured = false) {
    return `<article class="kpi-card ${featured ? "featured" : ""}"><div class="kpi-head"><span>${label}</span><span class="kpi-icon">${icons[icon]}</span></div><div class="kpi-value">${value}</div><div class="trend"><b>●</b>${trend}</div></article>`;
}

function renderDashboard() {
    const m = getMetrics();
    return `<section class="section-page active">
    <div class="kpi-grid">
        ${kpi("Veículos previstos", m.today.length, "truck", `${m.today.filter(r => r.status === "Em Trânsito").length} em trânsito`, true)}
        ${kpi("Em descarga", m.active.length, "dock", `${m.docks} docas ocupadas`)}
        ${kpi("Volumetria", m.today.filter(hasVolumetry).reduce((s, r) => s + Number(r.volumetria || 0), 0).toLocaleString("pt-BR"), "box", "volumes confirmados")}
    </div>
    ${renderRecordsPanel(m.today.slice(0, 6), "Recebimentos de hoje", true)}
    </section>`;
}

function renderRecordsPanel(records, title = "Veículos em Trânsito", compact = false) {
    return `<section class="panel records"><div class="panel-head"><div><h3>${title}</h3><p>${records.length} registro(s) encontrado(s)</p></div></div>
    <div class="table-wrap"><table>
        <thead><tr><th>Doca</th><th>Origem / Veículo</th><th>Data</th><th>Status</th></tr></thead>
        <tbody>${records.map(r => `<tr>
            <td><strong>${dockLabel(r.doca)}</strong></td>
            <td><strong>${esc(r.origem)}</strong><br><span class="subtext">${esc(r.placa)} •${esc(r.motorista)}</span></td>
            <td>${fmtDate(r.data)}</td>
            <td><span class="status-badge status-${slug(r.status)}">${esc(r.status)}</span></td>
        </tr>`).join("")}</tbody>
    </table></div></section>`;
}

function renderReceiptsPage() {
    const transitoRecords = state.sheetRecords.map(r => {
        const diffMins = Number(r.previsao) || 0;
        let calcStatus = "Em Trânsito";
        if (diffMins <= 4.9833 && diffMins > 0) calcStatus = "Aguardando";
        if (diffMins <= 0) calcStatus = "Em Atraso";
        return { ...r, calcStatus, diffMins };
    });

    const produtividadeRecords = recordsDoTurnoAtual().filter(r => r.status === "Concluído" || r.status === "Em descarga");
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

// -------------------------------------------------------------
// MÓDULO DEDICADO DE INSUMOS (EVIDÊNCIAS DE ENVIO)
// -------------------------------------------------------------

async function fetchInsumosData() {
    if (!state.apiOnline) return;
    try {
        const params = new URLSearchParams();
        if (state.insumoFiltroDataInicio) params.append("data_inicio", state.insumoFiltroDataInicio);
        if (state.insumoFiltroDataFim) params.append("data_fim", state.insumoFiltroDataFim);
        if (state.insumoFiltroOrigem) params.append("origem", state.insumoFiltroOrigem);
        if (state.insumoFiltroConferente) params.append("conferente", state.insumoFiltroConferente);

        const payload = await api(`/api/insumos?${params.toString()}`);
        state.insumosList = payload.insumos || [];
    } catch (err) {
        toast("Aviso", "Não foi possível carregar os insumos.");
    }
}

function renderInsumosPage() {
    fetchInsumosData();

    return `<section class="section-page active">
        <div class="hero-strip">
            <div>
                <h2>Evidências de Envio de Insumos</h2>
                <p>Histórico e comprovação de insumos devolvidos (Pallets, Gaylords, Bags, Stretch).</p>
            </div>
            <button class="secondary-btn" data-action="refresh-insumos">Atualizar Lista</button>
        </div>

        <section class="panel" style="margin-bottom: 20px;">
            <div class="panel-head"><div><h3>Filtros de Pesquisa</h3><p>Filtre por Período, Origem/CD e Conferente</p></div></div>
            <div style="padding: 15px;" class="form-grid">
                <div class="field">
                    <label>Data Início</label>
                    <input type="date" id="filtro-insumo-inicio" value="${state.insumoFiltroDataInicio}">
                </div>
                <div class="field">
                    <label>Data Fim</label>
                    <input type="date" id="filtro-insumo-fim" value="${state.insumoFiltroDataFim}">
                </div>
                <div class="field">
                    <label>Origem / Destino</label>
                    <input type="text" id="filtro-insumo-origem" placeholder="Ex: CD Guarulhos" value="${esc(state.insumoFiltroOrigem)}">
                </div>
                <div class="field">
                    <label>Conferente</label>
                    <input type="text" id="filtro-insumo-conferente" placeholder="Nome do responsável" value="${esc(state.insumoFiltroConferente)}">
                </div>
                <div class="field full" style="display:flex; gap:10px; justify-content:flex-end;">
                    <button class="secondary-btn" data-action="clear-insumos-filter">Limpar Filtros</button>
                    <button class="primary-btn" data-action="apply-insumos-filter">Aplicar Filtro</button>
                </div>
            </div>
        </section>

        <section class="panel records">
            <div class="panel-head"><div><h3>Insumos Registrados</h3><p>${state.insumosList.length} registro(s) encontrado(s)</p></div></div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Data/Hora</th>
                            <th>Origem & Placa</th>
                            <th>Tipo de Insumo</th>
                            <th>Qtd</th>
                            <th>Condição</th>
                            <th>Conferente</th>
                            <th>Foto (Google Drive)</th>
                            <th>Observações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.insumosList.length ? state.insumosList.map(i => `<tr>
                            <td>${fmtDate(i.criado_em)}</td>
                            <td><strong>${esc(i.origem)}</strong><br><span class="subtext">${esc(i.placa)}</span></td>
                            <td><strong>${esc(i.tipo_insumo)}</strong></td>
                            <td>${i.quantidade}</td>
                            <td><span class="status-badge status-${slug(i.condicao)}">${esc(i.condicao || "Íntegra")}</span></td>
                            <td>${esc(i.conferente)}</td>
                            <td>${i.foto_url ? `<a href="${esc(i.foto_url)}" target="_blank" class="secondary-btn" style="padding:4px 8px; font-size:11px; text-decoration:none;">📷 Ver Foto</a>` : "—"}</td>
                            <td>${esc(i.observacao || "—")}</td>
                        </tr>`).join("") : `<tr><td colspan="8" class="empty">Nenhum registro de insumo encontrado com os filtros aplicados.</td></tr>`}
                    </tbody>
                </table>
            </div>
        </section>
    </section>`;
}

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
    </div>
    </section>`;
}

function renderSettingsPage() {
    return `<section class="section-page active"><div class="hero-strip"><div><h2>Configurações</h2><p>Perfil e permissões do sistema.</p></div></div>
    <article class="panel info-card"><p class="eyebrow">PERFIL ATIVO</p><h3>${state.role}</h3>
    <div class="settings-list">
      <div class="settings-row"><span>Usuário</span><strong>${esc(state.user.username)}</strong></div>
      <div class="settings-row"><span>Armazenamento</span><strong>${state.apiOnline ? "PostgreSQL (Render)" : "Contingência Local"}</strong></div>
    </div>
    </article></section>`;
}

// -------------------------------------------------------------
// MODAIS DE CONFIRMAÇÃO E CADASTROS
// -------------------------------------------------------------

function openPromptInsumos(id) {
    const r = allRecords().find(item => item.id === id);
    if (!r) return;

    $("#modal-root").innerHTML = `<div class="overlay" data-action="close-modal"><form class="modal" id="finish-unload-form" data-id="${esc(r.id)}">
    <div class="modal-head"><div><h2>Finalizar Recebimento & Insumos</h2><p>Doca ${dockLabel(r.doca)} • Registre os insumos enviados</p></div><button type="button" class="close-btn" data-action="close-modal">×</button></div>
    <div class="modal-body" style="max-height: 65vh; overflow-y: auto;">
      <div style="display:flex; gap:10px; margin-bottom: 15px;">
        <label style="display:flex; align-items:center; gap:5px;"><input type="radio" name="tem_insumo" value="sim" checked> Sim, incluir insumos enviados</label>
        <label style="display:flex; align-items:center; gap:5px;"><input type="radio" name="tem_insumo" value="nao"> Não há insumos nesta descarga</label>
      </div>

      <div id="insumos-fields">
          <div id="insumos-list">
              ${getInsumoTemplate(0)}
          </div>
          
          <button type="button" class="secondary-btn" data-action="add-insumo" style="width:100%; margin-bottom: 15px; border-style: dashed; color: var(--brand);">+ Adicionar outro insumo</button>
          
          <div class="field full" style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
            <label>Link da Foto / Evidência no Google Drive (Opcional)</label>
            <input type="url" name="foto_url" placeholder="https://drive.google.com/file/d/...">
            <p class="helper">Cole o link compartilhado da pasta ou foto no Google Drive.</p>
          </div>
      </div>
    </div>
    <div class="modal-actions">
        <button type="button" class="secondary-btn" data-action="close-modal">Cancelar</button>
        <button class="primary-btn" type="submit" style="background:var(--green)">Concluir Descarga</button>
    </div></form></div>`;

    const form = document.getElementById("finish-unload-form");
    const fieldsWrap = document.getElementById("insumos-fields");

    form.addEventListener("change", (e) => {
        if (e.target.name === "tem_insumo") {
            fieldsWrap.style.display = e.target.value === "sim" ? "block" : "none";
        }
    });
}

function bindEvents() {
    $$('[data-page]').forEach(btn => btn.addEventListener("click", () => {
        state.page = btn.dataset.page;
        renderApp();
    }));
}

// -------------------------------------------------------------
// HANDLERS DE EVENTOS DE CLIQUE E SUBMISSÃO DE FORMULÁRIOS
// -------------------------------------------------------------

document.addEventListener("click", async event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;

    if (action === "close-modal") {
        if (event.target.classList.contains('overlay') || event.target.closest('.close-btn') || event.target.classList.contains('secondary-btn')) {
            $("#modal-root").innerHTML = "";
        }
    }
    if (action === "logout") {
        try { await api("/api/logout", { method: "POST", body: "{}" }); } catch { }
        state.user = null;
        state.role = null;
        state.csrf = null;
        renderApp();
    }
    if (action === "prompt-insumos") openPromptInsumos(button.dataset.id);
    if (action === "add-insumo") {
        const list = document.getElementById("insumos-list");
        if (list) {
            const div = document.createElement("div");
            div.innerHTML = getInsumoTemplate(list.children.length);
            list.appendChild(div.firstElementChild);
        }
    }
    if (action === "apply-insumos-filter") {
        state.insumoFiltroDataInicio = $("#filtro-insumo-inicio")?.value || "";
        state.insumoFiltroDataFim = $("#filtro-insumo-fim")?.value || "";
        state.insumoFiltroOrigem = $("#filtro-insumo-origem")?.value || "";
        state.insumoFiltroConferente = $("#filtro-insumo-conferente")?.value || "";
        renderApp();
    }
    if (action === "clear-insumos-filter") {
        state.insumoFiltroDataInicio = "";
        state.insumoFiltroDataFim = "";
        state.insumoFiltroOrigem = "";
        state.insumoFiltroConferente = "";
        renderApp();
    }
    if (action === "refresh-insumos") {
        renderApp();
    }
});

document.addEventListener("submit", async event => {
    if (event.target.id === "login-form") {
        event.preventDefault();
        const submit = event.target.querySelector("button[type=submit]");
        submit.disabled = true;
        submit.textContent = "Validando…";
        const form = new FormData(event.target);
        try {
            const payload = await api("/api/login", {
                method: "POST",
                body: JSON.stringify({ username: form.get("username"), password: form.get("password") })
            });
            state.user = payload.user;
            state.role = payload.user.role;
            state.csrf = payload.csrf;
            state.apiOnline = true;
            renderApp();
            await hydrateFromServer();
            toast("Acesso autorizado", `Sessão iniciada como ${state.role}.`);
        } catch (error) {
            submit.disabled = false;
            submit.textContent = "Entrar no sistema";
            toast("Acesso não autorizado", error.message);
        }
    }

    if (event.target.id === "finish-unload-form") {
        event.preventDefault();
        const id = event.target.dataset.id;
        const form = new FormData(event.target);

        const payload = { action: "finish", status: "Concluído", fim: new Date().toISOString() };

        if (form.get("tem_insumo") === "sim") {
            const items = [...event.target.querySelectorAll('.insumo-item')];
            const insumos = items.map(item => ({
                tipo: item.querySelector('[name="tipo_insumo"]').value,
                qtd: Number(item.querySelector('[name="qtd_insumo"]').value || 0),
                status: item.querySelector('[name="status_insumo"]')?.value || "",
                obs: item.querySelector('[name="obs_insumo"]')?.value || ""
            })).filter(i => i.tipo && i.qtd > 0);

            payload.insumos = insumos;
            payload.foto_url = form.get("foto_url") || "";
            payload.insumo_tipo = insumos.map(i => `${i.qtd}x ${i.tipo}`).join(", ");
            payload.insumo_qtd = insumos.reduce((acc, curr) => acc + Number(curr.qtd || 0), 0);
        }

        try {
            await api(`/api/records/${encodeURIComponent(id)}/transition`, {
                method: "PATCH",
                body: JSON.stringify(payload)
            });
            $("#modal-root").innerHTML = "";
            toast("Descarga finalizada", "Insumos e evidências gravados no PostgreSQL.");
            hydrateFromServer();
        } catch (error) {
            toast("Erro ao finalizar", error.message);
        }
    }
});

renderApp();
checkSession();