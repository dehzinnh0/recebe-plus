// ============================================================================
// RECEBE+ — MÓDULO DEDICADO DE INSUMOS E EVIDÊNCIAS DE DEVOLUÇÃO
// ============================================================================
// 4.8 Tela: Módulo Dedicado de Insumos e Evidências

import { state, api } from '../state.js';
import { esc, fmtDate } from '../helpers.js';

/**
 * Renderiza a estrutura HTML da página de Insumos (Filtros + Tabela)
 */
export function renderInsumosPage() {
    fetchInsumos();
    return `<section class="section-page active">
        <section class="panel records" style="margin-bottom: 20px;">
            <div class="panel-head"><div><h3>Filtros de Pesquisa</h3><p>Selecione os critérios para filtrar o relatório</p></div></div>
            <div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; padding: 15px;">
                <div class="field"><label>Data Início</label><input type="date" id="filtro-data-inicio" value="${state.insumoFiltros?.dataInicio || ''}"></div>
                <div class="field"><label>Data Fim</label><input type="date" id="filtro-data-fim" value="${state.insumoFiltros?.dataFim || ''}"></div>
                <div class="field"><label>CD / Hub Origem</label><input type="text" id="filtro-origem" placeholder="Ex: Guarulhos" value="${esc(state.insumoFiltros?.origem || '')}"></div>
                <div class="field"><label>Conferente Responsável</label><input type="text" id="filtro-conferente" placeholder="Nome do conferente" value="${esc(state.insumoFiltros?.conferente || '')}"></div>
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

/**
 * Consulta a API do backend (/api/insumos) com os filtros ativos
 */
export async function fetchInsumos() {
    try {
        const query = new URLSearchParams(state.insumoFiltros || {}).toString();
        const payload = await api(`/api/insumos?${query}`);
        state.insumosRecords = payload.insumos || [];
        renderInsumosTable();
    } catch (e) {
        const body = document.querySelector("#insumos-table-body");
        if (body) body.innerHTML = `<tr><td colspan="7" class="empty">Falha ao carregar insumos.</td></tr>`;
    }
}

/**
 * Preenche a tabela no DOM com a lista de insumos retornados
 */
export function renderInsumosTable() {
    const body = document.querySelector("#insumos-table-body");
    if (!body) return;
    if (!state.insumosRecords || !state.insumosRecords.length) {
        body.innerHTML = `<tr><td colspan="7" class="empty">Nenhum registro de insumo encontrado.</td></tr>`;
        return;
    }
    body.innerHTML = state.insumosRecords.map(i => `<tr>
        <td>${fmtDate(i.criado_em)}</td>
        <td><strong>${esc(i.origem)}</strong><br><span class="subtext">${esc(i.placa)}</span></td>
        <td><strong>${i.quantidade}x</strong> ${esc(i.tipo_insumo)}</td>
        <td><span class="status-badge status-concluido">${esc(i.condicao || 'Íntegro')}</span></td>
        <td>${esc(i.conferente)}</td>
        <td>${i.foto_url ? `<a href="${esc(i.foto_url)}" target="_blank" rel="noopener noreferrer" class="secondary-btn" style="padding:2px 8px; font-size:10px;">Ver Foto</a>` : '—'}</td>
        <td>${esc(i.observacao || '—')}</td>
    </tr>`).join("");
}
