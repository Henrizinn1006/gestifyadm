"""
context.py — Constrói contexto de negócio do Gestify para injetar no prompt do Lion.

Busca dados reais do banco (eventos, financeiro, clientes) e formata
como texto que o Lion pode usar para contextualizar suas respostas.
"""

from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from ...models import Evento, Cliente, Fornecedor, Movimentacao, Categoria


def build_business_context(db: Session) -> str:
    """
    Retorna uma string de contexto com os principais dados do negócio.
    Injeta no system prompt do Lion para que ele conheça o estado atual.
    """
    hoje = date.today()
    mes, ano = hoje.month, hoje.year

    lines = [f"📅 Data de hoje: {hoje.strftime('%d/%m/%Y')}"]

    # ── Contadores gerais ────────────────────────────────────────────────────
    qtd_clientes     = db.query(func.count(Cliente.id)).scalar() or 0
    qtd_fornecedores = db.query(func.count(Fornecedor.id)).scalar() or 0
    qtd_eventos      = db.query(func.count(Evento.id)).scalar() or 0

    lines.append(f"\n📊 Totais: {qtd_clientes} clientes | {qtd_fornecedores} fornecedores | {qtd_eventos} eventos")

    # ── Próximos eventos ─────────────────────────────────────────────────────
    proximos = (
        db.query(Evento)
        .filter(Evento.data_evento >= hoje, Evento.status != "cancelado")
        .order_by(Evento.data_evento.asc())
        .limit(5).all()
    )
    if proximos:
        lines.append("\n📅 Próximos eventos:")
        for ev in proximos:
            dt = ev.data_evento.strftime("%d/%m/%Y") if ev.data_evento else "sem data"
            cliente = ev.cliente.nome if ev.cliente else "sem cliente"
            lines.append(f"  • [{ev.id}] {ev.nome} — {dt} — {ev.status} — Cliente: {cliente}")
    else:
        lines.append("\n📅 Nenhum evento futuro cadastrado.")

    # ── Financeiro do mês atual ──────────────────────────────────────────────
    def soma_mes(tipo):
        r = db.query(func.sum(Movimentacao.valor)).filter(
            Movimentacao.tipo == tipo,
            Movimentacao.status == "pago",
            extract("month", Movimentacao.data) == mes,
            extract("year",  Movimentacao.data) == ano,
        ).scalar()
        return float(r or 0)

    rec_mes = soma_mes("receita")
    desp_mes = soma_mes("despesa")
    lines.append(f"\n💰 Financeiro de {hoje.strftime('%B/%Y')}:")
    lines.append(f"  Receitas pagas: R$ {rec_mes:,.2f}")
    lines.append(f"  Despesas pagas: R$ {desp_mes:,.2f}")
    lines.append(f"  Lucro do mês:   R$ {rec_mes - desp_mes:,.2f}")

    # ── Pendências financeiras ────────────────────────────────────────────────
    pendentes = db.query(func.sum(Movimentacao.valor)).filter(
        Movimentacao.status == "pendente"
    ).scalar() or 0
    if pendentes:
        lines.append(f"\n⚠️ Valor pendente (a receber/pagar): R$ {float(pendentes):,.2f}")

    # ── Eventos por status ───────────────────────────────────────────────────
    status_counts = (
        db.query(Evento.status, func.count(Evento.id))
        .group_by(Evento.status).all()
    )
    if status_counts:
        status_str = " | ".join(f"{s}: {c}" for s, c in status_counts)
        lines.append(f"\n🎪 Eventos por status: {status_str}")

    return "\n".join(lines)
