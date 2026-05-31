"""
main.py — Aplicação Flask do Gestify.

Como rodar (a partir da pasta gestifyadm/):
  python run.py
"""

import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS

# Carrega variáveis do .env antes de qualquer outra coisa
from dotenv import load_dotenv
load_dotenv()

from .database import engine
from . import models

# Criar tabelas automaticamente no banco
models.Base.metadata.create_all(bind=engine)

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")

app = Flask(__name__, static_folder=None)  # desabilita o /static/ interno do Flask
app.url_map.strict_slashes = False  # /clientes == /clientes/
CORS(app)  # habilita CORS para todos os endpoints

# ── Registrar blueprints (routers) ───────────────────────────────────────────
from .routers.clientes    import bp as clientes_bp
from .routers.fornecedores import bp as fornecedores_bp
from .routers.categorias  import bp as categorias_bp
from .routers.eventos     import bp as eventos_bp
from .routers.financeiro  import bp as financeiro_bp
from .routers.dashboard   import bp as dashboard_bp
from .routers.relatorios  import bp as relatorios_bp
from .routers.lion        import bp as lion_bp
from .routers.whatsapp    import bp as whatsapp_bp

app.register_blueprint(clientes_bp)
app.register_blueprint(fornecedores_bp)
app.register_blueprint(categorias_bp)
app.register_blueprint(eventos_bp)
app.register_blueprint(financeiro_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(relatorios_bp)
app.register_blueprint(lion_bp)
app.register_blueprint(whatsapp_bp)


# ── Servir frontend estático ──────────────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/static/<path:path>")
def static_files(path):
    # O index.html referencia /static/css/... e /static/js/...
    return send_from_directory(FRONTEND_DIR, path)


@app.route("/<path:path>")
def catch_all(path):
    return send_from_directory(FRONTEND_DIR, path)


# ── Respostas de erro em JSON ─────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({"detail": str(e)}), 404


@app.errorhandler(400)
def bad_request(e):
    return jsonify({"detail": str(e)}), 400


@app.errorhandler(500)
def server_error(e):
    return jsonify({"detail": "Erro interno do servidor"}), 500
