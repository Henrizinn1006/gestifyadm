"""
database.py — Configuração do banco de dados SQLAlchemy.

Para migrar para PostgreSQL/MySQL, basta alterar DATABASE_URL:
  PostgreSQL: "postgresql://usuario:senha@localhost:5432/gestify"
  MySQL:      "mysql+pymysql://usuario:senha@localhost:3306/gestify"
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# ─── Configuração do banco ───────────────────────────────────────────────────
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DEFAULT_DB = f"sqlite:///{os.path.join(_BASE_DIR, 'gestify.db')}"
DATABASE_URL = os.getenv("DATABASE_URL", _DEFAULT_DB)

# Render fornece URLs com prefixo "postgres://" mas SQLAlchemy 2.x exige "postgresql://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# connect_args apenas necessário para SQLite (multithreading)
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,  # True para ver SQL no console (útil em debug)
)

# Fábrica de sessões
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Base declarativa para todos os modelos
Base = declarative_base()


# ─── Dependency para injeção de sessão nos routers ──────────────────────────
def get_db():
    """
    Dependency do FastAPI que fornece uma sessão de banco por requisição.
    Garante que a sessão é sempre fechada, mesmo em caso de erro.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
