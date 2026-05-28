/**
 * api.js — Camada de comunicação com o backend FastAPI.
 *
 * Toda chamada HTTP passa por aqui, garantindo:
 *   - URL base centralizada
 *   - Tratamento de erros consistente
 *   - Toast de feedback automático em erros
 */

const API_BASE = '';  // Mesmo host/porta — FastAPI serve frontend e API juntos

/**
 * Faz uma requisição HTTP para a API.
 * @param {string} endpoint   - caminho sem barra inicial (ex: "clientes")
 * @param {string} method     - GET | POST | PUT | DELETE
 * @param {object|null} body  - payload JSON (opcional)
 * @returns {Promise<any>}    - dado retornado ou lança erro
 */
async function apiFetch(endpoint, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== null) {
    opts.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE}/${endpoint}`, opts);

    if (!res.ok) {
      let mensagem = `Erro ${res.status}`;
      try {
        const err = await res.json();
        mensagem = err.detail || err.message || mensagem;
      } catch (_) { /* ignora */ }
      throw new Error(mensagem);
    }

    // 204 No Content não tem body
    if (res.status === 204) return null;
    return await res.json();

  } catch (err) {
    if (err.name === 'TypeError') {
      // Erro de rede (API fora do ar)
      Toast.show('Não foi possível conectar à API. O servidor está rodando?', 'error');
    }
    throw err;
  }
}

// ─── Atalhos semânticos ────────────────────────────────────────────────────
const api = {
  get:    (endpoint)         => apiFetch(endpoint, 'GET'),
  post:   (endpoint, data)   => apiFetch(endpoint, 'POST',   data),
  put:    (endpoint, data)   => apiFetch(endpoint, 'PUT',    data),
  delete: (endpoint)         => apiFetch(endpoint, 'DELETE'),
};

// ─── Toast de notificação ──────────────────────────────────────────────────
const Toast = {
  _timer: null,

  show(msg, tipo = 'success') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = `toast ${tipo} show`;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      el.classList.remove('show');
    }, 3500);
  },
};

// ─── Modal genérico ────────────────────────────────────────────────────────
const Modal = {
  abrir(titulo, htmlBody) {
    document.getElementById('modal-title').textContent = titulo;
    document.getElementById('modal-body').innerHTML = htmlBody;
    document.getElementById('modalOverlay').classList.add('open');
  },

  fechar() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.getElementById('modal-body').innerHTML = '';
  },

  fecharSeFora(e) {
    if (e.target === document.getElementById('modalOverlay')) this.fechar();
  },

  abrirConfirm(mensagem, onConfirm) {
    document.getElementById('confirm-msg').textContent = mensagem;
    document.getElementById('confirmOverlay').classList.add('open');
    const btn = document.getElementById('confirm-btn');
    btn.onclick = () => {
      this.fecharConfirm();
      onConfirm();
    };
  },

  fecharConfirm() {
    document.getElementById('confirmOverlay').classList.remove('open');
  },
};

// ─── Utilitários de formatação ─────────────────────────────────────────────
const Fmt = {
  moeda(v) {
    const n = parseFloat(v) || 0;
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  data(d) {
    if (!d) return '—';
    // Recebe string "YYYY-MM-DD"
    const [y, m, dia] = d.split('-');
    return `${dia}/${m}/${y}`;
  },

  badge(valor, classe) {
    return `<span class="badge badge-${classe}">${valor}</span>`;
  },

  statusEvento(s) {
    const mapa = {
      planejado:    ['Planejado',    'planejado'],
      em_andamento: ['Em Andamento', 'em_andamento'],
      concluido:    ['Concluído',    'concluido'],
      cancelado:    ['Cancelado',    'cancelado'],
    };
    const [label, cls] = mapa[s] || [s, s];
    return Fmt.badge(label, cls);
  },

  statusMov(s) {
    const mapa = {
      pago:      ['Pago',      'pago'],
      pendente:  ['Pendente',  'pendente'],
      cancelado: ['Cancelado', 'cancelado'],
    };
    const [label, cls] = mapa[s] || [s, s];
    return Fmt.badge(label, cls);
  },

  tipoBadge(t) {
    return t === 'receita'
      ? Fmt.badge('Receita', 'receita')
      : Fmt.badge('Despesa', 'despesa');
  },

  formaPag(f) {
    const mapa = {
      pix: 'PIX', dinheiro: 'Dinheiro', credito: 'Crédito',
      debito: 'Débito', boleto: 'Boleto', transferencia: 'Transferência', outro: 'Outro',
    };
    return mapa[f] || f;
  },

  str(v) { return v || '—'; },
};
