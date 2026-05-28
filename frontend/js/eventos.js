/**
 * eventos.js — CRUD completo de Eventos.
 */

const Eventos = (() => {
  let _lista = [];
  let _clientes = [];
  let _editandoId = null;
  let _buscaTimer = null;

  async function _carregarClientes() {
    try {
      _clientes = await api.get('clientes');
    } catch (_) { _clientes = []; }
  }

  function _opcoesClientes(selecionado = null) {
    return `<option value="">-- Nenhum --</option>` +
      _clientes.map(c =>
        `<option value="${c.id}" ${c.id === selecionado ? 'selected' : ''}>${c.nome}</option>`
      ).join('');
  }

  function _form(dados = {}) {
    return `
      <form id="form-evento" onsubmit="Eventos.salvar(event)">
        <div class="form-row">
          <div class="form-group" style="flex:2">
            <label>Nome do Evento *</label>
            <input type="text" class="input-field" name="nome" value="${dados.nome || ''}" required placeholder="Ex: Casamento Silva" />
          </div>
          <div class="form-group" style="flex:1">
            <label>Data do Evento</label>
            <input type="date" class="input-field" name="data_evento" value="${dados.data_evento || ''}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Cliente</label>
            <select class="input-field" name="cliente_id">
              ${_opcoesClientes(dados.cliente_id)}
            </select>
          </div>
          <div class="form-group">
            <label>Local</label>
            <input type="text" class="input-field" name="local" value="${dados.local || ''}" placeholder="Ex: Espaço Jardins" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Orçamento Previsto (R$)</label>
            <input type="number" step="0.01" min="0" class="input-field" name="orcamento_previsto" value="${dados.orcamento_previsto || 0}" />
          </div>
          <div class="form-group">
            <label>Valor Fechado (R$)</label>
            <input type="number" step="0.01" min="0" class="input-field" name="valor_fechado" value="${dados.valor_fechado || 0}" />
          </div>
          <div class="form-group">
            <label>Status</label>
            <select class="input-field" name="status">
              <option value="planejado"    ${dados.status === 'planejado'    ? 'selected' : ''}>Planejado</option>
              <option value="em_andamento" ${dados.status === 'em_andamento' ? 'selected' : ''}>Em Andamento</option>
              <option value="concluido"    ${dados.status === 'concluido'    ? 'selected' : ''}>Concluído</option>
              <option value="cancelado"    ${dados.status === 'cancelado'    ? 'selected' : ''}>Cancelado</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label>Observações</label>
            <textarea class="input-field" name="observacoes" placeholder="Detalhes do evento...">${dados.observacoes || ''}</textarea>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-outline" onclick="Modal.fechar()">Cancelar</button>
          <button type="submit" class="btn btn-primary">${_editandoId ? 'Salvar Alterações' : 'Cadastrar Evento'}</button>
        </div>
      </form>
    `;
  }

  function _renderTabela() {
    const tbody = document.getElementById('tbody-eventos');
    if (!tbody) return;

    if (!_lista.length) {
      tbody.innerHTML = `
        <tr><td colspan="8">
          <div class="empty-state">
            <div class="empty-state-icon"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48"><rect x="6" y="10" width="36" height="32" rx="3"/><line x1="16" y1="6" x2="16" y2="14"/><line x1="32" y1="6" x2="32" y2="14"/><line x1="6" y1="22" x2="42" y2="22"/><circle cx="24" cy="32" r="5"/></svg></div>
            <p>Nenhum evento cadastrado ainda.</p>
          </div>
        </td></tr>`;
      return;
    }

    tbody.innerHTML = _lista.map(e => `
      <tr>
        <td><span class="text-muted">#${e.id}</span></td>
        <td><strong>${e.nome}</strong></td>
        <td>${Fmt.str(e.cliente_nome)}</td>
        <td>${Fmt.data(e.data_evento)}</td>
        <td>${Fmt.str(e.local)}</td>
        <td class="valor-receita">${Fmt.moeda(e.valor_fechado)}</td>
        <td>${Fmt.statusEvento(e.status)}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" title="Ver Relatório" onclick="App.irParaRelatorio(${e.id})"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><rect x="2" y="1" width="12" height="14" rx="1"/><line x1="5" y1="5" x2="11" y2="5"/><line x1="5" y1="8" x2="11" y2="8"/><line x1="5" y1="11" x2="9" y2="11"/></svg></button>
            <button class="btn-icon" title="Editar" onclick="Eventos.editar(${e.id})"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M11 2l3 3-9 9H2v-3L11 2z"/></svg></button>
            <button class="btn-icon" title="Excluir" onclick="Eventos.confirmarExclusao(${e.id}, '${e.nome.replace(/'/g,"\\'")}')"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><polyline points="2 4 14 4"/><path d="M5 4V2h6v2M6 7v5M10 7v5"/><rect x="3" y="4" width="10" height="10" rx="1"/></svg></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async function listar() {
    const status = document.getElementById('filtro-status-evento')?.value || '';
    const busca  = document.getElementById('busca-eventos')?.value || '';
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (busca)  params.set('busca', busca);
      _lista = await api.get(`eventos?${params.toString()}`);
      _renderTabela();
    } catch (err) {
      Toast.show('Erro ao carregar eventos.', 'error');
    }
  }

  function buscar() {
    clearTimeout(_buscaTimer);
    _buscaTimer = setTimeout(listar, 350);
  }

  async function abrirModal(dados = {}) {
    await _carregarClientes();
    _editandoId = null;
    Modal.abrir('Novo Evento', _form(dados));
  }

  async function editar(id) {
    await _carregarClientes();
    try {
      const dados = await api.get(`eventos/${id}`);
      _editandoId = id;
      Modal.abrir('Editar Evento', _form(dados));
    } catch (err) {
      Toast.show('Erro ao carregar evento.', 'error');
    }
  }

  async function salvar(e) {
    e.preventDefault();
    const form = e.target;
    const clienteId = form.cliente_id.value;
    const payload = {
      nome:               form.nome.value.trim(),
      cliente_id:         clienteId ? parseInt(clienteId) : null,
      data_evento:        form.data_evento.value || null,
      local:              form.local.value.trim()  || null,
      orcamento_previsto: parseFloat(form.orcamento_previsto.value) || 0,
      valor_fechado:      parseFloat(form.valor_fechado.value) || 0,
      status:             form.status.value,
      observacoes:        form.observacoes.value.trim() || null,
    };

    try {
      if (_editandoId) {
        await api.put(`eventos/${_editandoId}`, payload);
        Toast.show('Evento atualizado com sucesso!', 'success');
      } else {
        await api.post('eventos', payload);
        Toast.show('Evento cadastrado com sucesso!', 'success');
      }
      Modal.fechar();
      await listar();
    } catch (err) {
      Toast.show(err.message || 'Erro ao salvar evento.', 'error');
    }
  }

  function confirmarExclusao(id, nome) {
    Modal.abrirConfirm(
      `Deseja excluir o evento "${nome}"? As movimentações vinculadas NÃO serão excluídas.`,
      () => excluir(id)
    );
  }

  async function excluir(id) {
    try {
      await api.delete(`eventos/${id}`);
      Toast.show('Evento excluído com sucesso!', 'success');
      await listar();
    } catch (err) {
      Toast.show(err.message || 'Erro ao excluir evento.', 'error');
    }
  }

  return { listar, buscar, abrirModal, editar, salvar, confirmarExclusao, excluir };
})();
