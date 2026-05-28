// ─── Dashboard ────────────────────────────────────────────────────────────────
class DashboardResumo {
  final double totalReceitas;
  final double totalDespesas;
  final double lucroTotal;
  final double totalPendente;
  final double receitasMes;
  final double despesasMes;
  final double lucroMes;
  final int qtdEventos;
  final int qtdClientes;
  final int qtdFornecedores;
  final List<ProximoEvento> proximosEventos;

  DashboardResumo({
    required this.totalReceitas, required this.totalDespesas,
    required this.lucroTotal, required this.totalPendente,
    required this.receitasMes, required this.despesasMes,
    required this.lucroMes, required this.qtdEventos,
    required this.qtdClientes, required this.qtdFornecedores,
    required this.proximosEventos,
  });

  factory DashboardResumo.fromJson(Map<String, dynamic> j) => DashboardResumo(
    totalReceitas: (j['total_receitas'] ?? 0).toDouble(),
    totalDespesas: (j['total_despesas'] ?? 0).toDouble(),
    lucroTotal:    (j['lucro_total']    ?? 0).toDouble(),
    totalPendente: (j['total_pendente'] ?? 0).toDouble(),
    receitasMes:   (j['receitas_mes']   ?? 0).toDouble(),
    despesasMes:   (j['despesas_mes']   ?? 0).toDouble(),
    lucroMes:      (j['lucro_mes']      ?? 0).toDouble(),
    qtdEventos:    (j['qtd_eventos']    ?? 0).toInt(),
    qtdClientes:   (j['qtd_clientes']   ?? 0).toInt(),
    qtdFornecedores:(j['qtd_fornecedores'] ?? 0).toInt(),
    proximosEventos: (j['proximos_eventos'] as List? ?? [])
        .map((e) => ProximoEvento.fromJson(e)).toList(),
  );
}

class ProximoEvento {
  final int id;
  final String nome;
  final String? dataEvento;
  final String? local;
  final String status;

  ProximoEvento({required this.id, required this.nome,
    this.dataEvento, this.local, required this.status});

  factory ProximoEvento.fromJson(Map<String, dynamic> j) => ProximoEvento(
    id: j['id'], nome: j['nome'] ?? '',
    dataEvento: j['data_evento'], local: j['local'], status: j['status'] ?? '',
  );
}

// ─── Cliente ──────────────────────────────────────────────────────────────────
class Cliente {
  final int id;
  final String nome;
  final String? telefone;
  final String? email;
  final String? endereco;
  final String? observacoes;

  Cliente({required this.id, required this.nome,
    this.telefone, this.email, this.endereco, this.observacoes});

  factory Cliente.fromJson(Map<String, dynamic> j) => Cliente(
    id: j['id'], nome: j['nome'] ?? '',
    telefone: j['telefone'], email: j['email'],
    endereco: j['endereco'], observacoes: j['observacoes'],
  );

  Map<String, dynamic> toJson() => {
    'nome': nome, 'telefone': telefone, 'email': email,
    'endereco': endereco, 'observacoes': observacoes,
  };
}

// ─── Evento ───────────────────────────────────────────────────────────────────
class Evento {
  final int id;
  final String nome;
  final String status;
  final String? dataEvento;
  final String? local;
  final double? orcamentoPrevisto;
  final double? valorFechado;
  final String? observacoes;
  final String? clienteNome;

  Evento({required this.id, required this.nome, required this.status,
    this.dataEvento, this.local, this.orcamentoPrevisto,
    this.valorFechado, this.observacoes, this.clienteNome});

  factory Evento.fromJson(Map<String, dynamic> j) => Evento(
    id: j['id'], nome: j['nome'] ?? '', status: j['status'] ?? 'planejado',
    dataEvento: j['data_evento'], local: j['local'],
    orcamentoPrevisto: (j['orcamento_previsto'] as num?)?.toDouble(),
    valorFechado: (j['valor_fechado'] as num?)?.toDouble(),
    observacoes: j['observacoes'],
    clienteNome: j['cliente_nome'],
  );
}

// ─── Movimentação Financeira ──────────────────────────────────────────────────
class Movimentacao {
  final int id;
  final String tipo;
  final String descricao;
  final double valor;
  final String? data;
  final String? status;
  final String? formaPagamento;
  final String? eventNome;
  final String? clienteNome;
  final String? categoriaNome;

  Movimentacao({required this.id, required this.tipo,
    required this.descricao, required this.valor,
    this.data, this.status, this.formaPagamento,
    this.eventNome, this.clienteNome, this.categoriaNome});

  factory Movimentacao.fromJson(Map<String, dynamic> j) => Movimentacao(
    id: j['id'], tipo: j['tipo'] ?? '',
    descricao: j['descricao'] ?? '',
    valor: (j['valor'] as num).toDouble(),
    data: j['data'], status: j['status'],
    formaPagamento: j['forma_pagamento'],
    eventNome: j['evento_nome'],
    clienteNome: j['cliente_nome'],
    categoriaNome: j['categoria_nome'],
  );
}

// ─── Lion AI ──────────────────────────────────────────────────────────────────
class LionSessao {
  final int id;
  final String titulo;
  final String? updatedAt;

  LionSessao({required this.id, required this.titulo, this.updatedAt});

  factory LionSessao.fromJson(Map<String, dynamic> j) => LionSessao(
    id: j['id'], titulo: j['titulo'] ?? 'Conversa',
    updatedAt: j['updated_at'],
  );
}

class LionMensagem {
  final String role;
  final String content;
  final String? createdAt;

  LionMensagem({required this.role, required this.content, this.createdAt});

  factory LionMensagem.fromJson(Map<String, dynamic> j) => LionMensagem(
    role: j['role'] ?? 'user', content: j['content'] ?? '',
    createdAt: j['created_at'],
  );
}
