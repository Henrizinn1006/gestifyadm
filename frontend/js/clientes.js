/**
 * clientes.js — CRUD completo de Clientes.
 */

const Clientes = (() => {
  let _lista = [];
  let _editandoId = null;
  let _buscaTimer = null;

  function _form(dados = {}) {
    return `
      <form id="form-cliente" onsubmit="Clientes.salvar(event)">
        <div class="form-row">
          <div class="form-group" style="flex:2">
            <label>Nome *</label>
            <input type="text" class="input-field" name="nome" value="${dados.nome || ''}" required placeholder="Nome completo" />
          </div>
          <div class="form-group" style="flex:1">
            <label>Telefone</label>
            <input type="text" class="input-field" name="telefone" value="${dados.telefone || ''}" placeholder="(99) 99999-9999" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>E-mail</label>
            <input type="email" class="input-field" name="email" value="${dados.email || ''}" placeholder="email@exemplo.com" />
          </div>
          <div class="form-group">
            <label>Endereço</label>
            <input type="text" class="input-field" name="endereco" value="${dados.endereco || ''}" placeholder="Rua, número, cidade" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label>Observações</label>
            <textarea class="input-field" name="observacoes" placeholder="Anotações importantes...">${dados.observacoes || ''}</textarea>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-outline" onclick="Modal.fechar()">Cancelar</button>
          <button type="submit" class="btn btn-primary">${_editandoId ? 'Salvar Alterações' : 'Cadastrar Cliente'}</button>
        </div>
      </form>
    `;
  }

  function _renderTabela() {
    const tbody = document.getElementById('tbody-clientes');
    if (!tbody) return;

    if (!_lista.length) {
      tbody.innerHTML = `
        <tr><td colspan="6">
          <div class="empty-state">
            <div class="empty-state-icon"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48"><circle cx="18" cy="16" r="7"/><circle cx="32" cy="14" r="5"/><path d="M4 40c0-8 6-14 14-14s14 6 14 14"/><path d="M32 19c4 1 8 5 8 10" stroke-linecap="round"/></svg></div>
            <p>Nenhum cliente cadastrado ainda.</p>
          </div>
        </td></tr>`;
      return;
    }

    tbody.innerHTML = _lista.map(c => `
      <tr>
        <td><span class="text-muted">#${c.id}</span></td>
        <td><strong>${c.nome}</strong></td>
        <td>${Fmt.str(c.telefone)}</td>
        <td>${Fmt.str(c.email)}</td>
        <td>${Fmt.str(c.endereco)}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" title="Editar" onclick="Clientes.editar(${c.id})"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M11 2l3 3-9 9H2v-3L11 2z"/></svg></button>
            <button class="btn-icon" title="Excluir" onclick="Clientes.confirmarExclusao(${c.id}, '${c.nome.replace(/'/g,"\\'")}')"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><polyline points="2 4 14 4"/><path d="M5 4V2h6v2M6 7v5M10 7v5"/><rect x="3" y="4" width="10" height="10" rx="1"/></svg></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async function listar() {
    const busca = document.getElementById('busca-clientes')?.value || '';
    try {
      _lista = await api.get(`clientes?busca=${encodeURIComponent(busca)}`);
      _renderTabela();
    } catch (err) {
      Toast.show('Erro ao carregar clientes.', 'error');
    }
  }

  function buscar() {
    clearTimeout(_buscaTimer);
    _buscaTimer = setTimeout(listar, 350);
  }

  function abrirModal(dados = {}) {
    _editandoId = null;
    Modal.abrir('Novo Cliente', _form(dados));
  }

  async function editar(id) {
    try {
      const dados = await api.get(`clientes/${id}`);
      _editandoId = id;
      Modal.abrir('Editar Cliente', _form(dados));
    } catch (err) {
      Toast.show('Erro ao carregar cliente.', 'error');
    }
  }

  async function salvar(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
      nome:        form.nome.value.trim(),
      telefone:    form.telefone.value.trim() || null,
      email:       form.email.value.trim()    || null,
      endereco:    form.endereco.value.trim() || null,
      observacoes: form.observacoes.value.trim() || null,
    };

    try {
      if (_editandoId) {
        await api.put(`clientes/${_editandoId}`, payload);
        Toast.show('Cliente atualizado com sucesso!', 'success');
      } else {
        await api.post('clientes', payload);
        Toast.show('Cliente cadastrado com sucesso!', 'success');
      }
      Modal.fechar();
      await listar();
    } catch (err) {
      Toast.show(err.message || 'Erro ao salvar cliente.', 'error');
    }
  }

  function confirmarExclusao(id, nome) {
    Modal.abrirConfirm(
      `Deseja excluir o cliente "${nome}"? Esta ação não pode ser desfeita.`,
      () => excluir(id)
    );
  }

  async function excluir(id) {
    try {
      await api.delete(`clientes/${id}`);
      Toast.show('Cliente excluído com sucesso!', 'success');
      await listar();
    } catch (err) {
      Toast.show(err.message || 'Erro ao excluir cliente.', 'error');
    }
  }

  return { listar, buscar, abrirModal, editar, salvar, confirmarExclusao, excluir };
})();
