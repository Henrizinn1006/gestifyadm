/**
 * lion.js — Interface de chat com o Lion AI
 * v2 — corrigido: onclick+JSON.stringify, double-bind, filtro de mensagens tool
 */

const Lion = (() => {
  // ── Estado ───────────────────────────────────────────────────────────────
  let sessaoAtual = null;
  let streamingNow = false;
  let _initialized = false;   // evita double-bind de eventos

  // ── Inicialização ─────────────────────────────────────────────────────────
  function init() {
    if (!_initialized) {
      _bindEvents();
      _initialized = true;
    }
    verificarStatus();
    carregarSessoes();
  }

  function _bindEvents() {
    document.getElementById("lion-nova-sessao").addEventListener("click", novaSessao);
    document.getElementById("lion-send-btn").addEventListener("click", enviar);
    document.getElementById("lion-encerrar-sessao").addEventListener("click", encerrarSessaoAtual);

    const input = document.getElementById("lion-input");
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        enviar();
      }
    });
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 160) + "px";
    });

    // ── Delegação de eventos para a lista de sessões ──────────────────────
    // Usa data-sessao-id para evitar o problema de JSON.stringify em onclick
    document.getElementById("lion-sessoes-lista").addEventListener("click", (e) => {
      const item = e.target.closest(".lion-sessao-item");
      if (!item) return;
      const id    = parseInt(item.dataset.sessaoId, 10);
      const titulo = item.dataset.titulo;
      if (id) _selecionarSessao(id, titulo);
    });
  }

  // ── Status ────────────────────────────────────────────────────────────────
  async function verificarStatus() {
    const badge = document.getElementById("lion-status-badge");
    try {
      const data = await _api("/lion/status");
      if (data.configurado) {
        badge.innerHTML = `<span class="dot dot-on"></span> Lion online · ${data.modelo}`;
        badge.className = "lion-status lion-status-ok";
      } else {
        badge.innerHTML = `<span class="dot dot-warn"></span> Chave OpenAI não configurada`;
        badge.className = "lion-status lion-status-warn";
      }
    } catch {
      badge.innerHTML = `<span class="dot dot-off"></span> Erro ao conectar`;
      badge.className = "lion-status lion-status-err";
    }
  }

  // ── Sessões ───────────────────────────────────────────────────────────────
  async function carregarSessoes() {
    try {
      const sessoes = await _api("/lion/sessoes");
      _renderSessoes(sessoes);
    } catch (e) {
      console.error("[Lion] Erro ao carregar sessões:", e);
    }
  }

  function _renderSessoes(sessoes) {
    const lista = document.getElementById("lion-sessoes-lista");
    if (!sessoes || !sessoes.length) {
      lista.innerHTML = '<p class="lion-no-sessions">Nenhuma conversa ainda.<br>Clique em "+ Nova".</p>';
      return;
    }
    // Usa data-sessao-id e data-titulo para evitar o bug de aspas no onclick
    lista.innerHTML = sessoes.map((s) => {
      const isActive = s.id === sessaoAtual ? "active" : "";
      // escapa o titulo para uso em data-attribute HTML
      const tituloAttr = _escAttr(s.titulo);
      const tituloHtml = _escHtml(s.titulo);
      return `
        <div class="lion-sessao-item ${isActive}"
             data-sessao-id="${s.id}"
             data-titulo="${tituloAttr}">
          <div class="lion-sessao-titulo">${tituloHtml}</div>
          <div class="lion-sessao-meta">${_formatarData(s.updated_at)}</div>
        </div>
      `;
    }).join("");
  }

  async function novaSessao() {
    try {
      const s = await _api("/lion/sessoes", { method: "POST", body: {} });
      sessaoAtual = s.id;
      await carregarSessoes();
      _abrirSessao(s.id, s.titulo);
    } catch (e) {
      _toast("Erro ao criar sessão: " + e.message, "error");
    }
  }

  async function _selecionarSessao(id, titulo) {
    sessaoAtual = id;
    // Atualiza destaque visual imediatamente
    document.querySelectorAll(".lion-sessao-item").forEach((el) => {
      el.classList.toggle("active", parseInt(el.dataset.sessaoId, 10) === id);
    });
    await _abrirSessao(id, titulo);
  }

  async function _abrirSessao(id, titulo) {
    document.getElementById("lion-chat-titulo").textContent = titulo || "Conversa";
    document.getElementById("lion-encerrar-sessao").style.display = "inline-flex";
    _habilitarInput(true);

    const msgs = document.getElementById("lion-messages");
    msgs.innerHTML = '<div class="lion-loading-msgs">Carregando histórico…</div>';

    try {
      const data = await _api(`/lion/sessoes/${id}/historico`);
      const mensagens = (data.mensagens || []).filter(
        (m) => (m.role === "user" || m.role === "assistant") && !m.content.startsWith("[ferramentas:")
      );

      if (!mensagens.length) {
        _mostrarBoasVindas();
      } else {
        msgs.innerHTML = "";
        mensagens.forEach((m) => _adicionarMensagem(m.role, m.content));
        _scrollParaBaixo();
      }
    } catch {
      _mostrarBoasVindas();
    }
  }

  async function encerrarSessaoAtual() {
    if (!sessaoAtual) return;
    if (!confirm("Encerrar esta conversa?")) return;
    try {
      await _api(`/lion/sessoes/${sessaoAtual}`, { method: "DELETE" });
      sessaoAtual = null;
      document.getElementById("lion-chat-titulo").textContent = "Selecione ou crie uma conversa";
      document.getElementById("lion-encerrar-sessao").style.display = "none";
      _habilitarInput(false);
      _mostrarBoasVindas();
      await carregarSessoes();
    } catch {
      _toast("Erro ao encerrar sessão", "error");
    }
  }

  // ── Chat / Envio ──────────────────────────────────────────────────────────
  async function enviar() {
    if (streamingNow) return;

    const input = document.getElementById("lion-input");
    const mensagem = input.value.trim();
    if (!mensagem) return;

    // Cria sessão automaticamente se não houver
    if (!sessaoAtual) {
      try {
        const s = await _api("/lion/sessoes", { method: "POST", body: {} });
        sessaoAtual = s.id;
        document.getElementById("lion-encerrar-sessao").style.display = "inline-flex";
        _habilitarInput(true);
      } catch (e) {
        _toast("Erro ao criar sessão", "error");
        return;
      }
    }

    // Remove boas-vindas
    const welcome = document.getElementById("lion-messages").querySelector(".lion-welcome");
    if (welcome) welcome.remove();

    input.value = "";
    input.style.height = "auto";
    _adicionarMensagem("user", mensagem);
    _scrollParaBaixo();

    streamingNow = true;
    _habilitarInput(false);
    _mostrarTyping(true);

    const toolIndicators = {};
    let msgDiv = null;
    let fullText = "";

    try {
      const response = await fetch("/lion/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessao_id: sessaoAtual, mensagem }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;

          let chunk;
          try { chunk = JSON.parse(raw); } catch { continue; }

          switch (chunk.type) {
            case "sessao_id":
              sessaoAtual = chunk.sessao_id;
              await carregarSessoes();
              break;

            case "text":
              _mostrarTyping(false);
              if (!msgDiv) msgDiv = _criarBolhaLion();
              fullText += chunk.text;
              msgDiv.querySelector(".lion-msg-content").innerHTML = _renderMarkdown(fullText);
              _scrollParaBaixo();
              break;

            case "tool_start":
              _mostrarTyping(false);
              toolIndicators[chunk.name] = _adicionarToolIndicator(chunk.name);
              break;

            case "tool_result":
              if (toolIndicators[chunk.name]) {
                _finalizarToolIndicator(toolIndicators[chunk.name], chunk.name);
              }
              break;

            case "done":
              await carregarSessoes();
              break;

            case "error":
              _adicionarMensagemErro(chunk.message);
              break;
          }
        }
      }
    } catch (e) {
      _adicionarMensagemErro("Erro de conexão: " + e.message);
    } finally {
      streamingNow = false;
      _mostrarTyping(false);
      _habilitarInput(true);
      document.getElementById("lion-input").focus();
      _scrollParaBaixo();
    }
  }

  // ── Exemplos rápidos ──────────────────────────────────────────────────────
  function exemplo(btn) {
    // Remove o emoji do início (ex: "Quais..." → "Quais...")
    const txt = btn.textContent.replace(/^\S+\s/, "").trim();
    const input = document.getElementById("lion-input");
    input.value = txt;
    input.focus();
    enviar();
  }

  // ── Renderização de mensagens ──────────────────────────────────────────────
  function _adicionarMensagem(role, content) {
    const msgs = document.getElementById("lion-messages");
    const div = document.createElement("div");
    div.className = `lion-msg lion-msg-${role}`;

    const avatar = role === "user"
      ? '<div class="lion-msg-avatar lion-msg-avatar-user">Eu</div>'
      : '<div class="lion-msg-avatar lion-msg-avatar-lion"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24"><circle cx="16" cy="15" r="7"/><path d="M8 26c0-4 3.6-7 8-7s8 3 8 7"/><circle cx="16" cy="15" r="3" fill="currentColor"/></svg></div>';

    const contentHtml = role === "assistant"
      ? _renderMarkdown(content)
      : _escHtml(content);

    div.innerHTML = `
      ${avatar}
      <div class="lion-msg-bubble">
        <div class="lion-msg-content">${contentHtml}</div>
      </div>
    `;
    msgs.appendChild(div);
    return div;
  }

  function _criarBolhaLion() {
    const msgs = document.getElementById("lion-messages");
    const div = document.createElement("div");
    div.className = "lion-msg lion-msg-assistant";
    div.innerHTML = `
      <div class="lion-msg-avatar lion-msg-avatar-lion"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24"><circle cx="16" cy="15" r="7"/><path d="M8 26c0-4 3.6-7 8-7s8 3 8 7"/><circle cx="16" cy="15" r="3" fill="currentColor"/></svg></div>
      <div class="lion-msg-bubble">
        <div class="lion-msg-content"></div>
      </div>
    `;
    msgs.appendChild(div);
    return div;
  }

  function _adicionarMensagemErro(msg) {
    const msgs = document.getElementById("lion-messages");
    const div = document.createElement("div");
    div.className = "lion-msg lion-msg-error";
    div.innerHTML = `<div class="lion-error-badge">${_escHtml(msg)}</div>`;
    msgs.appendChild(div);
    _scrollParaBaixo();
  }

  function _adicionarToolIndicator(name) {
    const msgs = document.getElementById("lion-messages");
    const div = document.createElement("div");
    div.className = "lion-tool-indicator";
    div.innerHTML = `<span class="tool-spinner"></span> Executando <strong>${_nomeFerramenta(name)}</strong>…`;
    msgs.appendChild(div);
    _scrollParaBaixo();
    return div;
  }

  function _finalizarToolIndicator(div, name) {
    if (!div) return;
    div.innerHTML = `<span class="tool-done">&#10003;</span> ${_nomeFerramenta(name)} concluído`;
    div.className = "lion-tool-indicator lion-tool-done";
  }

  function _nomeFerramenta(name) {
    return ({
      listar_clientes:       "Listar Clientes",
      criar_cliente:         "Criar Cliente",
      listar_eventos:        "Listar Eventos",
      criar_evento:          "Criar Evento",
      atualizar_evento:      "Atualizar Evento",
      registrar_movimentacao:"Registrar Movimentação",
      listar_movimentacoes:  "Listar Movimentações",
      ver_resumo_financeiro: "Resumo Financeiro",
      relatorio_evento:      "Relatório do Evento",
      listar_fornecedores:   "Listar Fornecedores",
      criar_fornecedor:      "Criar Fornecedor",
      listar_categorias:     "Listar Categorias",
    })[name] || name;
  }

  // ── UI helpers ────────────────────────────────────────────────────────────
  function _mostrarBoasVindas() {
    document.getElementById("lion-messages").innerHTML = `
      <div class="lion-welcome">
        <div class="lion-welcome-icon"><svg viewBox="0 0 48 48" fill="none" stroke="#38BDF8" stroke-width="2" width="40" height="40"><circle cx="24" cy="24" r="18"/><circle cx="24" cy="22" r="7"/><path d="M14 38c0-6 4.5-10 10-10s10 4 10 10"/></svg></div>
        <h2>Olá! Sou o Lion</h2>
        <p>Seu gerente de inteligência artificial do Gestify.</p>
        <p>Posso consultar clientes, eventos, finanças, criar registros e muito mais.</p>
        <div class="lion-examples">
          <button class="lion-example-btn" onclick="Lion.exemplo(this)">Quais são os próximos eventos?</button>
          <button class="lion-example-btn" onclick="Lion.exemplo(this)">Resumo financeiro do mês</button>
          <button class="lion-example-btn" onclick="Lion.exemplo(this)">Quantos clientes temos?</button>
          <button class="lion-example-btn" onclick="Lion.exemplo(this)">Qual o lucro total?</button>
        </div>
      </div>
    `;
  }

  function _mostrarTyping(show) {
    document.getElementById("lion-typing").style.display = show ? "flex" : "none";
  }

  function _habilitarInput(enabled) {
    document.getElementById("lion-input").disabled = !enabled;
    document.getElementById("lion-send-btn").disabled = !enabled;
  }

  function _scrollParaBaixo() {
    const msgs = document.getElementById("lion-messages");
    msgs.scrollTop = msgs.scrollHeight;
  }

  function _toast(msg, type) {
    if (typeof App !== "undefined" && App.toast) {
      App.toast(msg, type);
    } else {
      console.warn("[Lion]", msg);
    }
  }

  // ── Markdown simples ──────────────────────────────────────────────────────
  function _renderMarkdown(text) {
    if (!text) return "";
    // Blocos de código primeiro (antes de qualquer outra substituição)
    const codeBlocks = [];
    text = text.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) => {
      codeBlocks.push(`<pre><code>${_escHtml(code.trim())}</code></pre>`);
      return `%%CODE_BLOCK_${codeBlocks.length - 1}%%`;
    });
    // Código inline
    text = text.replace(/`([^`\n]+)`/g, (_, c) => `<code>${_escHtml(c)}</code>`);
    // Negrito e itálico
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\*([^*\n]+)\*/g,   "<em>$1</em>");
    // Títulos
    text = text.replace(/^### (.+)$/gm, "<h4>$1</h4>");
    text = text.replace(/^## (.+)$/gm,  "<h3>$1</h3>");
    text = text.replace(/^# (.+)$/gm,   "<h2>$1</h2>");
    // Listas
    text = text.replace(/^[ \t]*[-•*]\s+(.+)$/gm, "<li>$1</li>");
    text = text.replace(/^[ \t]*\d+\.\s+(.+)$/gm,  "<li>$1</li>");
    text = text.replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>");
    // Quebras de linha → <br> (mas não dentro de tags HTML)
    text = text.replace(/\n\n+/g, "</p><p>");
    text = text.replace(/\n/g,    "<br>");
    // Restaura blocos de código
    text = text.replace(/%%CODE_BLOCK_(\d+)%%/g, (_, i) => codeBlocks[parseInt(i)]);
    return `<p>${text}</p>`;
  }

  // ── Utilitários ───────────────────────────────────────────────────────────
  function _escHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Escapa para uso em atributos HTML data-*
  function _escAttr(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function _formatarData(iso) {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit", month: "2-digit",
        hour: "2-digit", minute: "2-digit"
      });
    } catch { return iso; }
  }

  async function _api(url, opts = {}) {
    const options = {
      method: opts.method || "GET",
      headers: { "Content-Type": "application/json" },
    };
    if (opts.body !== undefined) options.body = JSON.stringify(opts.body);
    const resp = await fetch(url, options);
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${resp.status}`);
    }
    return resp.json();
  }

  // ── API pública ───────────────────────────────────────────────────────────
  return { init, exemplo };
})();
