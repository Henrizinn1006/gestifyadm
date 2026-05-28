"""
crud.py — Operações de banco de dados (Create, Read, Update, Delete).

Toda a lógica de acesso ao banco fica aqui, separada dos routers.
Todas as funções retornam dicts prontos para JSON.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case
from datetime import date, datetime
from typing import Optional

from . import models


# ─────────────────────────────────────────────────────────────────────────────
# HELPER: serializar valores (date/datetime → string ISO)
# ─────────────────────────────────────────────────────────────────────────────
def _v(val):
    if isinstance(val, (datetime, date)):
        return val.isoformat()
    return val


def _enrich_movimentacao(mov: models.Movimentacao) -> dict:
    d = {c.name: _v(getattr(mov, c.name)) for c in mov.__table__.columns}
    d["categoria_nome"]  = mov.categoria.nome  if mov.categoria  else None
    d["evento_nome"]     = mov.evento.nome      if mov.evento     else None
    d["cliente_nome"]    = mov.cliente.nome     if mov.cliente    else None
    d["fornecedor_nome"] = mov.fornecedor.nome  if mov.fornecedor else None
    return d


def _enrich_evento(ev: models.Evento) -> dict:
    d = {c.name: _v(getattr(ev, c.name)) for c in ev.__table__.columns}
    d["cliente_nome"] = ev.cliente.nome if ev.cliente else None
    return d


# ═════════════════════════════════════════════════════════════════════════════
# CLIENTES
# ═════════════════════════════════════════════════════════════════════════════
def get_clientes(db: Session, skip: int = 0, limit: int = 500, busca: str = ""):
    q = db.query(models.Cliente)
    if busca:
        q = q.filter(models.Cliente.nome.ilike(f"%{busca}%"))
    rows = q.order_by(models.Cliente.nome).offset(skip).limit(limit).all()
    return [r.to_dict() for r in rows]


def get_cliente(db: Session, cliente_id: int):
    r = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    return r.to_dict() if r else None


def create_cliente(db: Session, dados: dict):
    obj = models.Cliente(**dados)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj.to_dict()


def update_cliente(db: Session, cliente_id: int, dados: dict):
    obj = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not obj:
        return None
    for k, v in dados.items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj.to_dict()


def delete_cliente(db: Session, cliente_id: int):
    obj = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not obj:
        return None
    db.delete(obj)
    db.commit()
    return {"id": cliente_id}


# ═════════════════════════════════════════════════════════════════════════════
# FORNECEDORES
# ═════════════════════════════════════════════════════════════════════════════
def get_fornecedores(db: Session, skip: int = 0, limit: int = 500, busca: str = ""):
    q = db.query(models.Fornecedor)
    if busca:
        q = q.filter(models.Fornecedor.nome.ilike(f"%{busca}%"))
    rows = q.order_by(models.Fornecedor.nome).offset(skip).limit(limit).all()
    return [r.to_dict() for r in rows]


def get_fornecedor(db: Session, fornecedor_id: int):
    r = db.query(models.Fornecedor).filter(models.Fornecedor.id == fornecedor_id).first()
    return r.to_dict() if r else None


def create_fornecedor(db: Session, dados: dict):
    obj = models.Fornecedor(**dados)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj.to_dict()


def update_fornecedor(db: Session, fornecedor_id: int, dados: dict):
    obj = db.query(models.Fornecedor).filter(models.Fornecedor.id == fornecedor_id).first()
    if not obj:
        return None
    for k, v in dados.items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj.to_dict()


def delete_fornecedor(db: Session, fornecedor_id: int):
    obj = db.query(models.Fornecedor).filter(models.Fornecedor.id == fornecedor_id).first()
    if not obj:
        return None
    db.delete(obj)
    db.commit()
    return {"id": fornecedor_id}


# ═════════════════════════════════════════════════════════════════════════════
# CATEGORIAS
# ═════════════════════════════════════════════════════════════════════════════
def get_categorias(db: Session, tipo: Optional[str] = None):
    q = db.query(models.Categoria)
    if tipo:
        q = q.filter(models.Categoria.tipo == tipo)
    rows = q.order_by(models.Categoria.tipo, models.Categoria.nome).all()
    return [r.to_dict() for r in rows]


def get_categoria(db: Session, categoria_id: int):
    r = db.query(models.Categoria).filter(models.Categoria.id == categoria_id).first()
    return r.to_dict() if r else None


def create_categoria(db: Session, dados: dict):
    obj = models.Categoria(**dados)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj.to_dict()


def update_categoria(db: Session, categoria_id: int, dados: dict):
    obj = db.query(models.Categoria).filter(models.Categoria.id == categoria_id).first()
    if not obj:
        return None
    for k, v in dados.items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj.to_dict()


def delete_categoria(db: Session, categoria_id: int):
    obj = db.query(models.Categoria).filter(models.Categoria.id == categoria_id).first()
    if not obj:
        return None
    db.delete(obj)
    db.commit()
    return {"id": categoria_id}


# ═════════════════════════════════════════════════════════════════════════════
# EVENTOS
# ═════════════════════════════════════════════════════════════════════════════
def get_eventos(db: Session, skip=0, limit=500, status=None, cliente_id=None, busca=""):
    q = db.query(models.Evento)
    if status:
        q = q.filter(models.Evento.status == status)
    if cliente_id:
        q = q.filter(models.Evento.cliente_id == cliente_id)
    if busca:
        q = q.filter(models.Evento.nome.ilike(f"%{busca}%"))
    rows = q.order_by(models.Evento.data_evento.desc()).offset(skip).limit(limit).all()
    return [_enrich_evento(e) for e in rows]


def get_evento(db: Session, evento_id: int):
    ev = db.query(models.Evento).filter(models.Evento.id == evento_id).first()
    return _enrich_evento(ev) if ev else None


def create_evento(db: Session, dados: dict):
    d = dict(dados)
    if "data_evento" in d:
        d["data_evento"] = _parse_date(d["data_evento"])
    obj = models.Evento(**d)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _enrich_evento(obj)


def update_evento(db: Session, evento_id: int, dados: dict):
    obj = db.query(models.Evento).filter(models.Evento.id == evento_id).first()
    if not obj:
        return None
    d = dict(dados)
    if "data_evento" in d:
        d["data_evento"] = _parse_date(d["data_evento"])
    for k, v in d.items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return _enrich_evento(obj)


def delete_evento(db: Session, evento_id: int):
    obj = db.query(models.Evento).filter(models.Evento.id == evento_id).first()
    if not obj:
        return None
    db.delete(obj)
    db.commit()
    return {"id": evento_id}


# ═════════════════════════════════════════════════════════════════════════════
# MOVIMENTAÇÕES FINANCEIRAS
# ═════════════════════════════════════════════════════════════════════════════
def get_movimentacoes(db: Session, skip=0, limit=500, tipo=None, status=None,
                      evento_id=None, cliente_id=None, mes=None, ano=None):
    q = db.query(models.Movimentacao)
    if tipo:       q = q.filter(models.Movimentacao.tipo == tipo)
    if status:     q = q.filter(models.Movimentacao.status == status)
    if evento_id:  q = q.filter(models.Movimentacao.evento_id == evento_id)
    if cliente_id: q = q.filter(models.Movimentacao.cliente_id == cliente_id)
    if mes:        q = q.filter(extract("month", models.Movimentacao.data) == mes)
    if ano:        q = q.filter(extract("year",  models.Movimentacao.data) == ano)
    rows = q.order_by(models.Movimentacao.data.desc()).offset(skip).limit(limit).all()
    return [_enrich_movimentacao(m) for m in rows]


def get_movimentacao(db: Session, mov_id: int):
    m = db.query(models.Movimentacao).filter(models.Movimentacao.id == mov_id).first()
    return _enrich_movimentacao(m) if m else None


def _parse_date(val):
    """Converte string ISO (YYYY-MM-DD) ou date para date. Ignora None."""
    if val is None:
        return None
    if isinstance(val, date):
        return val
    try:
        return date.fromisoformat(str(val)[:10])
    except Exception:
        return None


def create_movimentacao(db: Session, dados: dict):
    d = dict(dados)
    if "data" in d:
        d["data"] = _parse_date(d["data"])
    obj = models.Movimentacao(**d)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _enrich_movimentacao(obj)


def update_movimentacao(db: Session, mov_id: int, dados: dict):
    obj = db.query(models.Movimentacao).filter(models.Movimentacao.id == mov_id).first()
    if not obj:
        return None
    d = dict(dados)
    if "data" in d:
        d["data"] = _parse_date(d["data"])
    for k, v in d.items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return _enrich_movimentacao(obj)


def delete_movimentacao(db: Session, mov_id: int):
    obj = db.query(models.Movimentacao).filter(models.Movimentacao.id == mov_id).first()
    if not obj:
        return None
    db.delete(obj)
    db.commit()
    return {"id": mov_id}


# ═════════════════════════════════════════════════════════════════════════════
# DASHBOARD
# ═════════════════════════════════════════════════════════════════════════════
def get_dashboard_resumo(db: Session) -> dict:
    hoje = date.today()
    mes_atual, ano_atual = hoje.month, hoje.year

    def soma_tipo(tipo, excluir="cancelado"):
        r = db.query(func.sum(models.Movimentacao.valor)).filter(
            models.Movimentacao.tipo == tipo,
            models.Movimentacao.status != excluir,
        ).scalar()
        return float(r or 0)

    def soma_tipo_mes(tipo, mes, ano):
        r = db.query(func.sum(models.Movimentacao.valor)).filter(
            models.Movimentacao.tipo == tipo,
            models.Movimentacao.status == "pago",
            extract("month", models.Movimentacao.data) == mes,
            extract("year",  models.Movimentacao.data) == ano,
        ).scalar()
        return float(r or 0)

    total_receitas = soma_tipo("receita")
    total_despesas = soma_tipo("despesa")
    total_pendente = float(
        db.query(func.sum(models.Movimentacao.valor))
        .filter(models.Movimentacao.status == "pendente").scalar() or 0
    )
    receitas_mes = soma_tipo_mes("receita", mes_atual, ano_atual)
    despesas_mes = soma_tipo_mes("despesa", mes_atual, ano_atual)

    qtd_eventos      = db.query(func.count(models.Evento.id)).scalar()
    qtd_clientes     = db.query(func.count(models.Cliente.id)).scalar()
    qtd_fornecedores = db.query(func.count(models.Fornecedor.id)).scalar()

    proximos = (
        db.query(models.Evento)
        .filter(models.Evento.data_evento >= hoje, models.Evento.status != "cancelado")
        .order_by(models.Evento.data_evento.asc())
        .limit(5).all()
    )
    proximos_eventos = [
        {
            "id": e.id, "nome": e.nome,
            "data_evento": e.data_evento.isoformat() if e.data_evento else None,
            "local": e.local, "status": e.status,
            "cliente_nome": e.cliente.nome if e.cliente else None,
        }
        for e in proximos
    ]

    nomes_mes = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
    grafico_mensal = []
    for i in range(5, -1, -1):
        m, a = mes_atual - i, ano_atual
        while m <= 0:
            m += 12; a -= 1
        grafico_mensal.append({
            "mes": f"{nomes_mes[m-1]}/{str(a)[2:]}",
            "receitas": soma_tipo_mes("receita", m, a),
            "despesas": soma_tipo_mes("despesa", m, a),
        })

    cat_rows = (
        db.query(models.Categoria.nome, func.sum(models.Movimentacao.valor).label("total"))
        .join(models.Movimentacao, models.Movimentacao.categoria_id == models.Categoria.id)
        .filter(models.Movimentacao.tipo == "despesa", models.Movimentacao.status == "pago")
        .group_by(models.Categoria.nome)
        .order_by(func.sum(models.Movimentacao.valor).desc())
        .limit(8).all()
    )
    grafico_categorias = [{"label": r.nome, "valor": float(r.total)} for r in cat_rows]

    lucro_expr = func.sum(case(
        (models.Movimentacao.tipo == "receita", models.Movimentacao.valor),
        else_=-models.Movimentacao.valor
    ))
    ev_rows = (
        db.query(models.Evento.id, models.Evento.nome, lucro_expr.label("lucro"))
        .join(models.Movimentacao, models.Movimentacao.evento_id == models.Evento.id)
        .filter(models.Movimentacao.status == "pago")
        .group_by(models.Evento.id, models.Evento.nome)
        .order_by(lucro_expr.desc()).limit(8).all()
    )
    grafico_eventos = [{"label": r.nome, "valor": float(r.lucro)} for r in ev_rows]

    return {
        "total_receitas": total_receitas, "total_despesas": total_despesas,
        "lucro_total": total_receitas - total_despesas,
        "total_pendente": total_pendente,
        "qtd_eventos": qtd_eventos, "qtd_clientes": qtd_clientes,
        "qtd_fornecedores": qtd_fornecedores,
        "receitas_mes": receitas_mes, "despesas_mes": despesas_mes,
        "lucro_mes": receitas_mes - despesas_mes,
        "proximos_eventos": proximos_eventos,
        "grafico_mensal": grafico_mensal,
        "grafico_categorias": grafico_categorias,
        "grafico_eventos": grafico_eventos,
    }


# ═════════════════════════════════════════════════════════════════════════════
# RELATÓRIO POR EVENTO
# ═════════════════════════════════════════════════════════════════════════════
def get_relatorio_evento(db: Session, evento_id: int):
    ev = db.query(models.Evento).filter(models.Evento.id == evento_id).first()
    if not ev:
        return None
    movs = (
        db.query(models.Movimentacao)
        .filter(models.Movimentacao.evento_id == evento_id,
                models.Movimentacao.status != "cancelado")
        .order_by(models.Movimentacao.data).all()
    )
    total_receitas = sum(m.valor for m in movs if m.tipo == "receita" and m.status == "pago")
    total_despesas = sum(m.valor for m in movs if m.tipo == "despesa" and m.status == "pago")
    return {
        "evento": _enrich_evento(ev),
        "cliente_nome": ev.cliente.nome if ev.cliente else None,
        "total_receitas": total_receitas,
        "total_despesas": total_despesas,
        "lucro_evento": total_receitas - total_despesas,
        "movimentacoes": [_enrich_movimentacao(m) for m in movs],
    }
