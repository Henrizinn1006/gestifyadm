"""
memory.py — Gerenciamento de memória conversacional do Lion.

Salva e recupera sessões e mensagens do banco SQLite.
Mantém o histórico de conversa para contexto multi-turno.
"""

import json
from datetime import datetime
from sqlalchemy.orm import Session

from ...models import LionSessao, LionMensagem


# ─── SESSÕES ──────────────────────────────────────────────────────────────────

def criar_sessao(db: Session, canal: str = "web", contato: str = None, titulo: str = None) -> LionSessao:
    """Cria uma nova sessão de conversa."""
    titulo = titulo or f"Conversa {datetime.now().strftime('%d/%m %H:%M')}"
    sessao = LionSessao(canal=canal, contato=contato, titulo=titulo)
    db.add(sessao)
    db.commit()
    db.refresh(sessao)
    return sessao


def listar_sessoes(db: Session, canal: str = None, limit: int = 20) -> list:
    """Lista sessões recentes."""
    q = db.query(LionSessao).filter(LionSessao.ativa == True)
    if canal:
        q = q.filter(LionSessao.canal == canal)
    sessoes = q.order_by(LionSessao.updated_at.desc()).limit(limit).all()
    return [s.to_dict() for s in sessoes]


def get_sessao(db: Session, sessao_id: int) -> LionSessao | None:
    """Retorna uma sessão pelo ID."""
    return db.query(LionSessao).filter(LionSessao.id == sessao_id).first()


def get_ou_criar_sessao_whatsapp(db: Session, contato: str) -> LionSessao:
    """
    Para WhatsApp: retorna sessão ativa do contato ou cria uma nova.
    Cada número de WhatsApp tem uma sessão contínua.
    """
    sessao = (
        db.query(LionSessao)
        .filter(LionSessao.canal == "whatsapp", LionSessao.contato == contato, LionSessao.ativa == True)
        .first()
    )
    if not sessao:
        sessao = criar_sessao(db, canal="whatsapp", contato=contato, titulo=f"WhatsApp: {contato}")
    return sessao


def atualizar_titulo_sessao(db: Session, sessao_id: int, titulo: str):
    """Atualiza o título da sessão (ex: extraído da primeira mensagem)."""
    sessao = db.query(LionSessao).filter(LionSessao.id == sessao_id).first()
    if sessao:
        sessao.titulo = titulo[:255]
        db.commit()


def encerrar_sessao(db: Session, sessao_id: int):
    """Marca sessão como inativa."""
    sessao = db.query(LionSessao).filter(LionSessao.id == sessao_id).first()
    if sessao:
        sessao.ativa = False
        db.commit()


# ─── MENSAGENS ────────────────────────────────────────────────────────────────

def salvar_mensagem(db: Session, sessao_id: int, role: str, content: str,
                    tool_calls: list = None, tokens: int = 0) -> LionMensagem:
    """Salva uma mensagem no histórico da sessão."""
    msg = LionMensagem(
        sessao_id=sessao_id,
        role=role,
        content=content,
        tool_calls=json.dumps(tool_calls) if tool_calls else None,
        tokens=tokens,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Atualiza updated_at da sessão
    sessao = db.query(LionSessao).filter(LionSessao.id == sessao_id).first()
    if sessao:
        db.commit()

    return msg


def get_historico_openai(db: Session, sessao_id: int, limit: int = 20) -> list:
    """
    Retorna o histórico de mensagens no formato que a OpenAI espera.
    Limite para não estourar contexto.
    """
    msgs = (
        db.query(LionMensagem)
        .filter(LionMensagem.sessao_id == sessao_id)
        .order_by(LionMensagem.created_at.asc())
        .limit(limit).all()
    )

    historico = []
    for m in msgs:
        entry = {"role": m.role, "content": m.content}
        if m.tool_calls and m.role == "assistant":
            try:
                entry["tool_calls"] = json.loads(m.tool_calls)
            except Exception:
                pass
        historico.append(entry)

    return historico


def get_historico_display(db: Session, sessao_id: int, limit: int = 50) -> list:
    """Retorna histórico formatado para exibição no frontend."""
    msgs = (
        db.query(LionMensagem)
        .filter(LionMensagem.sessao_id == sessao_id)
        .order_by(LionMensagem.created_at.asc())
        .limit(limit).all()
    )
    return [m.to_dict() for m in msgs]
