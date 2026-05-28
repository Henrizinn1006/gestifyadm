"""
tools.py - Ferramentas (function calling) do Lion AI.
"""

import json
from datetime import date, datetime
from sqlalchemy.orm import Session

from ... import crud


def _parse_date(val):
    """Converte string YYYY-MM-DD para objeto date do Python."""
    if val is None:
        return None
    if isinstance(val, date):
        return val
    try:
        return datetime.strptime(str(val), "%Y-%m-%d").date()
    except ValueError:
        return date.today()


TOOLS = [
    # ── CLIENTES ──────────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "listar_clientes",
            "description": "Lista todos os clientes cadastrados. Use para buscar clientes por nome.",
            "parameters": {
                "type": "object",
                "properties": {
                    "busca": {"type": "string", "description": "Filtrar clientes pelo nome (opcional)"},
                    "limit": {"type": "integer", "description": "Maximo de resultados (padrao 20)"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "criar_cliente",
            "description": "Cria um novo cliente no sistema.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nome":        {"type": "string"},
                    "telefone":    {"type": "string"},
                    "email":       {"type": "string"},
                    "endereco":    {"type": "string"},
                    "observacoes": {"type": "string"},
                },
                "required": ["nome"],
            },
        },
    },
    # ── EVENTOS ───────────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "listar_eventos",
            "description": "Lista eventos. Pode filtrar por status (planejado, em_andamento, concluido, cancelado) e nome.",
            "parameters": {
                "type": "object",
                "properties": {
                    "status":     {"type": "string"},
                    "busca":      {"type": "string"},
                    "cliente_id": {"type": "integer"},
                    "limit":      {"type": "integer"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "criar_evento",
            "description": "Cria um novo evento no sistema.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nome":               {"type": "string"},
                    "cliente_id":         {"type": "integer"},
                    "data_evento":        {"type": "string", "description": "Data no formato YYYY-MM-DD"},
                    "local":              {"type": "string"},
                    "orcamento_previsto": {"type": "number"},
                    "valor_fechado":      {"type": "number"},
                    "status":             {"type": "string", "description": "planejado, em_andamento, concluido, cancelado"},
                    "observacoes":        {"type": "string"},
                },
                "required": ["nome"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "atualizar_evento",
            "description": "Atualiza dados de um evento existente.",
            "parameters": {
                "type": "object",
                "properties": {
                    "evento_id":          {"type": "integer"},
                    "nome":               {"type": "string"},
                    "status":             {"type": "string"},
                    "data_evento":        {"type": "string"},
                    "local":              {"type": "string"},
                    "orcamento_previsto": {"type": "number"},
                    "valor_fechado":      {"type": "number"},
                    "observacoes":        {"type": "string"},
                },
                "required": ["evento_id"],
            },
        },
    },
    # ── FINANCEIRO ────────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "registrar_movimentacao",
            "description": "Registra uma receita ou despesa financeira.",
            "parameters": {
                "type": "object",
                "properties": {
                    "tipo":             {"type": "string", "description": "receita ou despesa"},
                    "descricao":        {"type": "string"},
                    "valor":            {"type": "number"},
                    "data":             {"type": "string", "description": "YYYY-MM-DD (padrao: hoje)"},
                    "evento_id":        {"type": "integer"},
                    "cliente_id":       {"type": "integer"},
                    "fornecedor_id":    {"type": "integer"},
                    "categoria_id":     {"type": "integer"},
                    "forma_pagamento":  {"type": "string", "description": "pix, dinheiro, cartao, boleto, transferencia"},
                    "status":           {"type": "string", "description": "pago ou pendente"},
                    "observacoes":      {"type": "string"},
                },
                "required": ["tipo", "descricao", "valor"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "listar_movimentacoes",
            "description": "Lista movimentacoes financeiras com filtros.",
            "parameters": {
                "type": "object",
                "properties": {
                    "tipo":       {"type": "string"},
                    "status":     {"type": "string"},
                    "evento_id":  {"type": "integer"},
                    "cliente_id": {"type": "integer"},
                    "mes":        {"type": "integer"},
                    "ano":        {"type": "integer"},
                    "limit":      {"type": "integer"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "ver_resumo_financeiro",
            "description": "Retorna o resumo financeiro geral: receitas, despesas, lucro, pendencias.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "relatorio_evento",
            "description": "Gera relatorio financeiro completo de um evento.",
            "parameters": {
                "type": "object",
                "properties": {
                    "evento_id": {"type": "integer"},
                },
                "required": ["evento_id"],
            },
        },
    },
    # ── FORNECEDORES ──────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "listar_fornecedores",
            "description": "Lista fornecedores/prestadores de servico.",
            "parameters": {
                "type": "object",
                "properties": {
                    "busca": {"type": "string"},
                    "limit": {"type": "integer"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "criar_fornecedor",
            "description": "Cadastra um novo fornecedor.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nome":              {"type": "string"},
                    "telefone":          {"type": "string"},
                    "email":             {"type": "string"},
                    "categoria_servico": {"type": "string"},
                    "observacoes":       {"type": "string"},
                },
                "required": ["nome"],
            },
        },
    },
    # ── CATEGORIAS ────────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "listar_categorias",
            "description": "Lista categorias financeiras disponíveis.",
            "parameters": {
                "type": "object",
                "properties": {
                    "tipo": {"type": "string", "description": "receita ou despesa"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "criar_categoria",
            "description": "Cria uma nova categoria financeira.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nome": {"type": "string"},
                    "tipo": {"type": "string", "description": "receita ou despesa"},
                },
                "required": ["nome", "tipo"],
            },
        },
    },
]


def executar_ferramenta(nome: str, args: dict, db: Session) -> str:
    """Executa uma ferramenta e retorna o resultado como string JSON."""
    try:
        result = _executar(nome, args, db)
        return json.dumps(result, ensure_ascii=False, default=str)
    except Exception as e:
        try:
            db.rollback()
        except Exception:
            pass
        return json.dumps({"erro": str(e)}, ensure_ascii=False)


def _executar(nome: str, args: dict, db: Session):
    hoje = date.today().isoformat()

    if nome == "listar_clientes":
        return crud.get_clientes(db, limit=args.get("limit", 20), busca=args.get("busca", ""))

    elif nome == "criar_cliente":
        return crud.create_cliente(db, args)

    elif nome == "listar_eventos":
        return crud.get_eventos(
            db,
            limit=args.get("limit", 10),
            status=args.get("status"),
            cliente_id=args.get("cliente_id"),
            busca=args.get("busca", ""),
        )

    elif nome == "criar_evento":
        dados = dict(args)
        if dados.get("data_evento"):
            dados["data_evento"] = _parse_date(dados["data_evento"])
        else:
            dados.pop("data_evento", None)
        return crud.create_evento(db, dados)

    elif nome == "atualizar_evento":
        evento_id = args.get("evento_id")
        dados = {k: v for k, v in args.items() if k != "evento_id" and v is not None}
        if "data_evento" in dados:
            dados["data_evento"] = _parse_date(dados["data_evento"])
        result = crud.update_evento(db, evento_id, dados)
        if not result:
            return {"erro": "Evento " + str(evento_id) + " nao encontrado"}
        return result

    elif nome == "registrar_movimentacao":
        dados = dict(args)
        if dados.get("data"):
            dados["data"] = _parse_date(dados["data"])
        else:
            dados["data"] = _parse_date(hoje)
        return crud.create_movimentacao(db, dados)

    elif nome == "listar_movimentacoes":
        return crud.get_movimentacoes(
            db,
            limit=args.get("limit", 20),
            tipo=args.get("tipo"),
            status=args.get("status"),
            evento_id=args.get("evento_id"),
            cliente_id=args.get("cliente_id"),
            mes=args.get("mes"),
            ano=args.get("ano"),
        )

    elif nome == "ver_resumo_financeiro":
        resumo = crud.get_dashboard_resumo(db)
        return {
            "total_receitas":   resumo["total_receitas"],
            "total_despesas":   resumo["total_despesas"],
            "lucro_total":      resumo["lucro_total"],
            "total_pendente":   resumo["total_pendente"],
            "receitas_mes":     resumo["receitas_mes"],
            "despesas_mes":     resumo["despesas_mes"],
            "lucro_mes":        resumo["lucro_mes"],
            "qtd_eventos":      resumo["qtd_eventos"],
            "qtd_clientes":     resumo["qtd_clientes"],
            "qtd_fornecedores": resumo["qtd_fornecedores"],
            "proximos_eventos": resumo["proximos_eventos"],
        }

    elif nome == "relatorio_evento":
        result = crud.get_relatorio_evento(db, args["evento_id"])
        if not result:
            return {"erro": "Evento " + str(args["evento_id"]) + " nao encontrado"}
        return result

    elif nome == "listar_fornecedores":
        return crud.get_fornecedores(db, limit=args.get("limit", 20), busca=args.get("busca", ""))

    elif nome == "criar_fornecedor":
        return crud.create_fornecedor(db, args)

    elif nome == "listar_categorias":
        return crud.get_categorias(db, tipo=args.get("tipo"))

    elif nome == "criar_categoria":
        return crud.create_categoria(db, args)

    else:
        return {"erro": "Ferramenta desconhecida: " + nome}
