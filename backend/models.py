"""
models.py — Modelos SQLAlchemy (mapeamento objeto-relacional).

Cada classe representa uma tabela no banco de dados.
As tabelas são criadas automaticamente pelo main.py na inicialização.

TODO (futuro):
  - Adicionar tabela "usuarios" para sistema de login
  - Adicionar tabela "empresas" para multiempresa
  - Adicionar campo "empresa_id" em todos os modelos
"""

from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime,
    ForeignKey, Text, Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


# ─── CLIENTE ─────────────────────────────────────────────────────────────────
class Cliente(Base):
    """Representa um cliente da empresa de eventos."""
    __tablename__ = "clientes"

    id           = Column(Integer, primary_key=True, index=True)
    nome         = Column(String(255), nullable=False)
    telefone     = Column(String(30))
    email        = Column(String(255))
    endereco     = Column(String(500))
    observacoes  = Column(Text)
    ativo        = Column(Boolean, default=True)
    created_at   = Column(DateTime, server_default=func.now())
    updated_at   = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relacionamentos
    eventos       = relationship("Evento",       back_populates="cliente")
    movimentacoes = relationship("Movimentacao", back_populates="cliente")

    def to_dict(self):
        return {
            "id": self.id, "nome": self.nome, "telefone": self.telefone,
            "email": self.email, "endereco": self.endereco,
            "observacoes": self.observacoes, "ativo": self.ativo,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# ─── FORNECEDOR ───────────────────────────────────────────────────────────────
class Fornecedor(Base):
    """Representa um fornecedor/prestador de serviço."""
    __tablename__ = "fornecedores"

    id                = Column(Integer, primary_key=True, index=True)
    nome              = Column(String(255), nullable=False)
    telefone          = Column(String(30))
    email             = Column(String(255))
    categoria_servico = Column(String(255))
    observacoes       = Column(Text)
    ativo             = Column(Boolean, default=True)
    created_at        = Column(DateTime, server_default=func.now())
    updated_at        = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relacionamentos
    movimentacoes = relationship("Movimentacao", back_populates="fornecedor")

    def to_dict(self):
        return {
            "id": self.id, "nome": self.nome, "telefone": self.telefone,
            "email": self.email, "categoria_servico": self.categoria_servico,
            "observacoes": self.observacoes, "ativo": self.ativo,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# ─── CATEGORIA ────────────────────────────────────────────────────────────────
class Categoria(Base):
    """Categorias financeiras (ex: Flores, Transporte, Pagamento de Cliente)."""
    __tablename__ = "categorias"

    id         = Column(Integer, primary_key=True, index=True)
    nome       = Column(String(255), nullable=False)
    tipo       = Column(String(20),  nullable=False)  # "receita" | "despesa"
    created_at = Column(DateTime, server_default=func.now())

    # Relacionamentos
    movimentacoes = relationship("Movimentacao", back_populates="categoria")

    def to_dict(self):
        return {
            "id": self.id, "nome": self.nome, "tipo": self.tipo,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ─── EVENTO ───────────────────────────────────────────────────────────────────
class Evento(Base):
    """
    Representa um evento organizado pela empresa.
    Status: planejado → em_andamento → concluido | cancelado
    """
    __tablename__ = "eventos"

    id                = Column(Integer, primary_key=True, index=True)
    nome              = Column(String(255), nullable=False)
    cliente_id        = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    data_evento       = Column(Date, nullable=True)
    local             = Column(String(500))
    orcamento_previsto = Column(Float, default=0.0)
    valor_fechado     = Column(Float, default=0.0)
    status            = Column(String(20), default="planejado", nullable=False)
    observacoes       = Column(Text)
    created_at        = Column(DateTime, server_default=func.now())
    updated_at        = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relacionamentos
    cliente       = relationship("Cliente",      back_populates="eventos")
    movimentacoes = relationship("Movimentacao", back_populates="evento")


# ─── MOVIMENTAÇÃO FINANCEIRA ──────────────────────────────────────────────────
class Movimentacao(Base):
    """
    Representa uma entrada (receita) ou saída (despesa) financeira.

    Regras de negócio:
      - status='cancelado' → não entra em nenhum cálculo
      - status='pendente'  → mostrado separado das pagas
      - status='pago'      → entra nos totais de receita/despesa
      - Pode estar vinculada a evento, cliente e/ou fornecedor (todos opcionais)
      - Lucro do evento = sum(receitas do evento pagas) - sum(despesas do evento pagas)
    """
    __tablename__ = "movimentacoes"

    id              = Column(Integer, primary_key=True, index=True)
    tipo            = Column(String(20),  nullable=False)  # "receita" | "despesa"
    descricao       = Column(String(500), nullable=False)
    valor           = Column(Float,       nullable=False)
    data            = Column(Date,        nullable=False)
    categoria_id    = Column(Integer, ForeignKey("categorias.id"),   nullable=True)
    evento_id       = Column(Integer, ForeignKey("eventos.id"),      nullable=True)
    cliente_id      = Column(Integer, ForeignKey("clientes.id"),     nullable=True)
    fornecedor_id   = Column(Integer, ForeignKey("fornecedores.id"), nullable=True)
    forma_pagamento = Column(String(20), default="pix")
    status          = Column(String(20), default="pago", nullable=False)
    observacoes     = Column(Text)
    created_at      = Column(DateTime, server_default=func.now())
    updated_at      = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relacionamentos
    categoria  = relationship("Categoria",  back_populates="movimentacoes")
    evento     = relationship("Evento",     back_populates="movimentacoes")
    cliente    = relationship("Cliente",    back_populates="movimentacoes")
    fornecedor = relationship("Fornecedor", back_populates="movimentacoes")


# ─── LION AI — SESSÃO DE CONVERSA ────────────────────────────────────────────
class LionSessao(Base):
    """
    Representa uma sessão de conversa com o Lion AI.
    Cada sessão tem um conjunto de mensagens (histórico).
    canal: 'web' | 'whatsapp'
    """
    __tablename__ = "lion_sessoes"

    id         = Column(Integer, primary_key=True, index=True)
    titulo     = Column(String(255), default="Nova conversa")
    canal      = Column(String(20), default="web")       # web | whatsapp
    contato    = Column(String(255), nullable=True)       # número WhatsApp ou email
    ativa      = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relacionamentos
    mensagens = relationship("LionMensagem", back_populates="sessao",
                             order_by="LionMensagem.created_at", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id, "titulo": self.titulo, "canal": self.canal,
            "contato": self.contato, "ativa": self.ativa,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# ─── LION AI — MENSAGEM ───────────────────────────────────────────────────────
class LionMensagem(Base):
    """
    Uma mensagem dentro de uma sessão Lion.
    role: 'user' | 'assistant' | 'tool'
    """
    __tablename__ = "lion_mensagens"

    id         = Column(Integer, primary_key=True, index=True)
    sessao_id  = Column(Integer, ForeignKey("lion_sessoes.id"), nullable=False)
    role       = Column(String(20), nullable=False)      # user | assistant | tool
    content    = Column(Text, nullable=False)
    tool_calls = Column(Text, nullable=True)             # JSON de tool calls (se houver)
    tokens     = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    # Relacionamentos
    sessao = relationship("LionSessao", back_populates="mensagens")

    def to_dict(self):
        return {
            "id": self.id, "sessao_id": self.sessao_id, "role": self.role,
            "content": self.content, "tool_calls": self.tool_calls,
            "tokens": self.tokens,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
