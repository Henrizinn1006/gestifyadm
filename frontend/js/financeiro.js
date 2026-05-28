/**
 * financeiro.js — CRUD completo de Movimentações Financeiras.
 */

const Financeiro = (() => {
  let _lista = [];
  let _editandoId = null;
  let _categorias = [];
  let _eventos = [];
  let _clientes = [];
  let _fornecedores = [];

  async function _carregarDependencias() {
    try {
      [_categorias, _eventos, _clientes, _fornecedores] = await Promise.all([
        api.get('categorias'),
        api.get('eventos'),
        api.get('clientes'),
        api.get('fornecedores'),
      ]);
    } catch (_) {}
  }

  function _opcoes(lista, campoValor = 'id', campoLabel = 'nome', selecionado = null, emptyLabel = '-- Nenhum --') {
    return `<option value="">${emptyLabel}</option>` +
      lista.map(i =>
        `<option value="${i[campoValor]}" ${i[campoValor] === selecionado ? 'selected' : ''}>${i[campoLabel]}</option>`
      ).join('');
  }

  function _opcoesCategorias(tipo = '', selecionado = null) {
    const lista = tipo ? _categorias.filter(c => c.tipo === tipo) : _categorias;
    return `<option value="">-- Sem categoria --</option>` +
      lista.map(c =>
        `<option value="${c.id}" ${c.id === selecionado ? 'selected' : ''}>${c.nome} (${c.tipo})</option>`
      ).join('');
  }

  function _form(dados = {}) {
    return `
      <form id="form-financeiro" onsubmit="Financeiro.salvar(event)">
        <div class="form-row">
          <div class="form-group">
            <label>Tipo *</label>
            <select class="input-field" name="tipo" required onchange="Financeiro._onTipoChange(this)">
              <option value="receita" ${dados.tipo === 'receita' ? 'selected' : ''}>Receita</option>
              <option value="despesa" ${dados.tipo === 'despesa' ? 'selected' : ''}>Despesa</option>
            </select>
          </div>
          <div class="form-group">
            <label>Data *</label>
            <input type="date" class="input-field" name="data" value="${dados.data || new Date().toISOString().slice(0,10)}" required />
          </div>
          <div class="form-group">
            <label>Valor (R$) *</label>
            <input type="number" step="0.01" min="0.01" class="input-field" name="valor" value="${dados.valor || ''}" required placeholder="0,00" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group" style="flex:2">
            <label>Descrição *</label>
            <input type="text" class="input-field" name="descricao" value="${dados.descricao || ''}" required placeholder="Ex: Pagamento de flores" />
          </div>
          <div class="form-group">
            <label>Status</label>
            <select class="input-field" name="status">
              <option value="pago"      ${dados.status === 'pago'      ? 'selected' : ''}>Pago</option>
              <option value="pendente"  ${dados.status === 'pendente'  ? 'selected' : ''}>⏳ Pendente</option>
              <option value="cancelado" ${dados.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Categoria</label>
            <select class="input-field" name="categoria_id" id="sel-categoria">
              ${_opcoesCategorias(dados.tipo, dados.categoria_id)}
            </select>
          </div>
          <div class="form-group">
            <label>Forma de Pagamento</label>
            <select class="input-field" name="forma_pagamento">
              <option value="pix"           ${dados.forma_pagamento === 'pix'           ? 'selected' : ''}>PIX</option>
              <option value="dinheiro"      ${dados.forma_pagamento === 'dinheiro'      ? 'selected' : ''}>Dinheiro</option>
              <option value="credito"       ${dados.forma_pagamento === 'credito'       ? 'selected' : ''}>Crédito</option>
              <option value="debito"        ${dados.forma_pagamento === 'debito'        ? 'selected' : ''}>Débito</option>
              <option value="boleto"        ${dados.forma_pagamento === 'boleto'        ? 'selected' : ''}>Boleto</option>
              <option value="transferencia" ${dados.forma_pagamento === 'transferencia' ? 'selected' : ''}>Transferência</option>
              <option value="outro"         ${dados.forma_pagamento === 'outro'         ? 'selected' : ''}>Outro</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Evento (opcional)</label>
            <select class="input-field" name="evento_id">
              ${_opcoes(_eventos, 'id', 'nome', dados.evento_id)}
            </select>
          </div>
          <div class="form-group">
            <label>Cliente (opcional)</label>
            <select class="input-field" name="cliente_id">
              ${_opcoes(_clientes, 'id', 'nome', dados.cliente_id)}
            </select>
          </div>
          <div class="form-group">
            <label>Fornecedor (opcional)</label>
            <select class="input-field" name="fornecedor_id">
              ${_opcoes(_fornecedores, 'id', 'nome', dados.fornecedor_id)}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label>Observações</label>
            <textarea class="input-field" name="observacoes" placeholder="Notas adicionais...">${dados.observacoes || ''}</textarea>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-outline" onclick="Modal.fechar()">Cancelar</button>
          <button type="submit" class="btn btn-primary">${_editandoId ? 'Salvar Alterações' : 'Cadastrar Movimentação'}</button>
        </div>
      </form>
    `;
  }

  // Atualiza categorias quando tipo muda no formulário
  function _onTipoChange(el) {
    const sel = document.getElementById('sel-categoria');
    if (sel) {
      sel.innerHTML = _opcoesCategorias(el.value);
    }
  }

  function _calcularTotais() {
    let rec = 0, desp = 0;
    _lista.forEach(m => {
      if (m.status === 'cancelado') return;
      if (m.tipo === 'receita') rec  += m.valor;
      else                      desp += m.valor;
    });
    const saldo = rec - desp;
    const el1 = document.getElementById('fin-total-rec');
    const el2 = document.getElementById('fin-total-desp');
    const el3 = document.getElementById('fin-total-saldo');
    if (el1) el1.textContent = Fmt.moeda(rec);
    if (el2) el2.textContent = Fmt.moeda(desp);
    if (el3) {
      el3.textContent = Fmt.moeda(saldo);
      el3.className   = `card-value ${saldo >= 0 ? 'text-green' : 'text-red'}`;
    }
  }

  function _renderTabela() {
    const tbody = document.getElementById('tbody-financeiro');
    if (!tbody) return;

    if (!_lista.length) {
      tbody.innerHTML = `
        <tr><td colspan="10">
          <div class="empty-state">
            <div class="empty-state-icon"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48"><rect x="4" y="10" width="40" height="28" rx="3"/><line x1="4" y1="20" x2="44" y2="20"/><circle cx="24" cy="32" r="5"/><line x1="24" y1="29" x2="24" y2="35"/><line x1="21" y1="32" x2="27" y2="32"/></svg></div>
            <p>Nenhuma movimentação encontrada.</p>
          </div>
        </td></tr>`;
      _calcularTotais();
      return;
    }

    tbody.innerHTML = _lista.map(m => {
      const valorClass = m.tipo === 'receita' ? 'valor-receita' : 'valor-despesa';
      const sinal      = m.tipo === 'receita' ? '+' : '-';
      return `
        <tr>
          <td><span class="text-muted">#${m.id}</span></td>
          <td>${Fmt.data(m.data)}</td>
          <td>${Fmt.tipoBadge(m.tipo)}</td>
          <td><strong>${m.descricao}</strong>${m.evento_nome ? `<br><span class="text-muted" style="font-size:0.75rem">${m.evento_nome}</span>` : ''}</td>
          <td>${Fmt.str(m.categoria_nome)}</td>
          <td>${m.evento_nome ? `<small class="text-accent">${m.evento_nome}</small>` : '—'}</td>
          <td class="${valorClass}">${sinal} ${Fmt.moeda(m.valor)}</td>
          <td>${Fmt.formaPag(m.forma_pagamento)}</td>
          <td>${Fmt.statusMov(m.status)}</td>
          <td>
            <div class="action-btns">
              <button class="btn-icon" title="Editar" onclick="Financeiro.editar(${m.id})"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M11 2l3 3-9 9H2v-3L11 2z"/></svg></button>
              <button class="btn-icon" title="Excluir" onclick="Financeiro.confirmarExclusao(${m.id}, '${m.descricao.replace(/'/g,"\\'")}')"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><polyline points="2 4 14 4"/><path d="M5 4V2h6v2M6 7v5M10 7v5"/><rect x="3" y="4" width="10" height="10" rx="1"/></svg></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    _calcularTotais();
  }

  async function listar() {
    const tipo   = document.getElementById('filtro-tipo-fin')?.value   || '';
    const status = document.getElementById('filtro-status-fin')?.value || '';
    const mes    = document.getElementById('filtro-mes-fin')?.value    || '';
    try {
      const params = new URLSearchParams();
      if (tipo)   params.set('tipo', tipo);
      if (status) params.set('status', status);
      if (mes)    params.set('mes', mes);
      _lista = await api.get(`financeiro?${params.toString()}`);
      _renderTabela();
    } catch (err) {
      Toast.show('Erro ao carregar movimentações.', 'error');
    }
  }

  async function abrirModal(dados = {}) {
    await _carregarDependencias();
    _editandoId = null;
    Modal.abrir('Nova Movimentação', _form(dados));
  }

  async function editar(id) {
    await _carregarDependencias();
    try {
      const dados = await api.get(`financeiro/${id}`);
      _editandoId = id;
      Modal.abrir('Editar Movimentação', _form(dados));
    } catch (err) {
      Toast.show('Erro ao carregar movimentação.', 'error');
    }
  }

  async function salvar(e) {
    e.preventDefault();
    const form = e.target;

    const payload = {
      tipo:            form.tipo.value,
      descricao:       form.descricao.value.trim(),
      valor:           parseFloat(form.valor.value),
      data:            form.data.value,
      categoria_id:    form.categoria_id.value    ? parseInt(form.categoria_id.value)    : null,
      evento_id:       form.evento_id.value       ? parseInt(form.evento_id.value)       : null,
      cliente_id:      form.cliente_id.value      ? parseInt(form.cliente_id.value)      : null,
      fornecedor_id:   form.fornecedor_id.value   ? parseInt(form.fornecedor_id.value)   : null,
      forma_pagamento: form.forma_pagamento.value,
      status:          form.status.value,
      observacoes:     form.observacoes.value.trim() || null,
    };

    try {
      if (_editandoId) {
        await api.put(`financeiro/${_editandoId}`, payload);
        Toast.show('Movimentação atualizada!', 'success');
      } else {
        await api.post('financeiro', payload);
        Toast.show('Movimentação cadastrada!', 'success');
      }
      Modal.fechar();
      await listar();
    } catch (err) {
      Toast.show(err.message || 'Erro ao salvar movimentação.', 'error');
    }
  }

  function confirmarExclusao(id, desc) {
    Modal.abrirConfirm(
      `Deseja excluir a movimentação "${desc}"?`,
      () => excluir(id)
    );
  }

  async function excluir(id) {
    try {
      await api.delete(`financeiro/${id}`);
      Toast.show('Movimentação excluída!', 'success');
      await listar();
    } catch (err) {
      Toast.show(err.message || 'Erro ao excluir.', 'error');
    }
  }

  return { listar, abrirModal, editar, salvar, confirmarExclusao, excluir, _onTipoChange };
})();
