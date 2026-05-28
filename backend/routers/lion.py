"""
lion.py — Blueprint Flask para os endpoints do Lion AI.

Endpoints:
  POST /lion/sessoes                  — Criar nova sessão
  GET  /lion/sessoes                  — Listar sessões
  GET  /lion/sessoes/<id>/historico   — Histórico de uma sessão
  POST /lion/chat                     — Chat simples (sem stream)
  POST /lion/stream                   — Chat com streaming SSE
  DELETE /lion/sessoes/<id>           — Encerrar sessão
"""

import json
from flask import Blueprint, jsonify, request, abort, Response, stream_with_context

from ..database import SessionLocal
from ..ai.lion import memory, core

bp = Blueprint("lion", __name__, url_prefix="/lion")


# ─── SESSÕES ──────────────────────────────────────────────────────────────────

@bp.route("/sessoes", methods=["GET"])
def listar_sessoes():
    db = SessionLocal()
    try:
        canal = request.args.get("canal")
        sessoes = memory.listar_sessoes(db, canal=canal)
        return jsonify(sessoes)
    finally:
        db.close()


@bp.route("/sessoes", methods=["POST"])
def criar_sessao():
    db = SessionLocal()
    try:
        dados = request.get_json(silent=True) or {}
        sessao = memory.criar_sessao(
            db,
            canal=dados.get("canal", "web"),
            contato=dados.get("contato"),
            titulo=dados.get("titulo"),
        )
        return jsonify(sessao.to_dict()), 201
    finally:
        db.close()


@bp.route("/sessoes/<int:sessao_id>", methods=["DELETE"])
def encerrar_sessao(sessao_id):
    db = SessionLocal()
    try:
        memory.encerrar_sessao(db, sessao_id)
        return jsonify({"mensagem": "Sessão encerrada", "id": sessao_id})
    finally:
        db.close()


@bp.route("/sessoes/<int:sessao_id>/historico", methods=["GET"])
def historico(sessao_id):
    db = SessionLocal()
    try:
        sess = memory.get_sessao(db, sessao_id)
        if not sess:
            abort(404, description="Sessão não encontrada")
        msgs = memory.get_historico_display(db, sessao_id)
        return jsonify({
            "sessao": sess.to_dict(),
            "mensagens": msgs,
        })
    finally:
        db.close()


# ─── CHAT SIMPLES (sem streaming) ─────────────────────────────────────────────

@bp.route("/chat", methods=["POST"])
def chat():
    """
    Body JSON:
      { "sessao_id": 1, "mensagem": "Quais são os próximos eventos?" }

    Se sessao_id não fornecido, cria nova sessão automaticamente.
    """
    db = SessionLocal()
    try:
        dados = request.get_json(silent=True) or {}
        mensagem = dados.get("mensagem", "").strip()
        if not mensagem:
            abort(400, description="Campo 'mensagem' é obrigatório")

        sessao_id = dados.get("sessao_id")
        if not sessao_id:
            sessao = memory.criar_sessao(db)
            sessao_id = sessao.id

        sess = memory.get_sessao(db, sessao_id)
        if not sess:
            abort(404, description="Sessão não encontrada")

        resposta = core.chat(db, sessao_id, mensagem, canal=sess.canal)
        return jsonify({
            "sessao_id": sessao_id,
            "resposta": resposta,
        })

    except RuntimeError as e:
        # Erro de configuração (ex: OPENAI_API_KEY ausente)
        return jsonify({"detail": str(e)}), 503
    except Exception as e:
        return jsonify({"detail": f"Erro interno: {str(e)}"}), 500
    finally:
        db.close()


# ─── CHAT COM STREAMING SSE ───────────────────────────────────────────────────

@bp.route("/stream", methods=["POST"])
def stream():
    """
    Body JSON:
      { "sessao_id": 1, "mensagem": "Liste os clientes" }

    Retorna Server-Sent Events (SSE).
    O frontend usa EventSource ou fetch com ReadableStream.
    """
    dados = request.get_json(silent=True) or {}
    mensagem = dados.get("mensagem", "").strip()
    if not mensagem:
        return jsonify({"detail": "Campo 'mensagem' é obrigatório"}), 400

    sessao_id = dados.get("sessao_id")

    def generate():
        db = SessionLocal()
        try:
            nonlocal sessao_id
            if not sessao_id:
                sessao = memory.criar_sessao(db)
                sessao_id = sessao.id
                # Envia o sessao_id para o frontend primeiro
                yield f"data: {json.dumps({'type': 'sessao_id', 'sessao_id': sessao_id})}\n\n"

            sess = memory.get_sessao(db, sessao_id)
            if not sess:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Sessão não encontrada'})}\n\n"
                return

            yield from core.stream_chat(db, sessao_id, mensagem)

        except RuntimeError as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'Erro: {str(e)}'})}\n\n"
        finally:
            db.close()

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ─── STATUS / HEALTH ──────────────────────────────────────────────────────────

@bp.route("/status", methods=["GET"])
def status():
    """Verifica se o Lion está configurado e operacional."""
    import os
    has_key = bool(os.environ.get("OPENAI_API_KEY", "").strip())
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    return jsonify({
        "lion": "online" if has_key else "sem_api_key",
        "modelo": model,
        "configurado": has_key,
    })
