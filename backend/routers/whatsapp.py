"""
whatsapp.py — Blueprint Flask para integração WhatsApp via Evolution API.

Como funciona:
  1. A Evolution API recebe mensagens do WhatsApp
  2. Chama nosso webhook POST /whatsapp/webhook
  3. Nós processamos a mensagem com o Lion
  4. Enviamos a resposta de volta via Evolution API

Setup:
  1. Instale e configure a Evolution API (ver docs: https://doc.evolution-api.com)
  2. Configure o webhook apontando para http://SEU_IP:8000/whatsapp/webhook
  3. Preencha EVOLUTION_API_URL e EVOLUTION_API_KEY no .env
"""

import os
import json
import httpx
from flask import Blueprint, jsonify, request

from ..database import SessionLocal
from ..ai.lion import memory, core

bp = Blueprint("whatsapp", __name__, url_prefix="/whatsapp")


def _enviar_mensagem_whatsapp(numero: str, texto: str) -> bool:
    """Envia uma mensagem de texto via Evolution API."""
    api_url  = os.environ.get("EVOLUTION_API_URL", "").rstrip("/")
    api_key  = os.environ.get("EVOLUTION_API_KEY", "")
    instance = os.environ.get("EVOLUTION_INSTANCE", "gestify")

    if not api_url or not api_key:
        print("[WhatsApp] EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurados")
        return False

    url = f"{api_url}/message/sendText/{instance}"
    payload = {
        "number": numero,
        "text": texto,
        "delay": 500,  # ms antes de enviar (simula digitação)
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(
                url,
                headers={"apikey": api_key, "Content-Type": "application/json"},
                json=payload,
            )
            resp.raise_for_status()
            return True
    except Exception as e:
        print(f"[WhatsApp] Erro ao enviar mensagem: {e}")
        return False


@bp.route("/webhook", methods=["POST"])
def webhook():
    """
    Recebe eventos da Evolution API.
    Tipos de evento relevantes:
      - MESSAGES_UPSERT: nova mensagem recebida
    """
    payload = request.get_json(silent=True) or {}

    event = payload.get("event", "")
    data  = payload.get("data", {})

    # Só processa mensagens recebidas (não as enviadas por nós)
    if event != "MESSAGES_UPSERT":
        return jsonify({"status": "ignored"}), 200

    # Extrai dados da mensagem
    key = data.get("key", {})
    from_me = key.get("fromMe", False)
    if from_me:
        return jsonify({"status": "ignored_own_message"}), 200

    # Número do remetente (remove @s.whatsapp.net se presente)
    remote_jid = key.get("remoteJid", "")
    numero = remote_jid.replace("@s.whatsapp.net", "").replace("@g.us", "")

    # Ignora grupos por enquanto (JID com @g.us)
    if "@g.us" in remote_jid:
        return jsonify({"status": "group_ignored"}), 200

    # Texto da mensagem
    message = data.get("message", {})
    texto = (
        message.get("conversation") or
        message.get("extendedTextMessage", {}).get("text") or
        ""
    ).strip()

    if not texto:
        return jsonify({"status": "no_text"}), 200

    print(f"[WhatsApp] Mensagem de {numero}: {texto[:100]}")

    # Processa com o Lion
    db = SessionLocal()
    try:
        sessao = memory.get_ou_criar_sessao_whatsapp(db, numero)
        resposta = core.chat(db, sessao.id, texto, canal="whatsapp")
        _enviar_mensagem_whatsapp(numero, resposta)
        return jsonify({"status": "ok", "sessao_id": sessao.id}), 200
    except Exception as e:
        print(f"[WhatsApp] Erro ao processar mensagem: {e}")
        _enviar_mensagem_whatsapp(numero, "❌ Erro interno. Tente novamente em instantes.")
        return jsonify({"status": "error", "detail": str(e)}), 500
    finally:
        db.close()


@bp.route("/status", methods=["GET"])
def status():
    """Retorna o status da integração WhatsApp."""
    api_url  = os.environ.get("EVOLUTION_API_URL", "")
    api_key  = os.environ.get("EVOLUTION_API_KEY", "")
    instance = os.environ.get("EVOLUTION_INSTANCE", "gestify")

    configurado = bool(api_url and api_key)

    return jsonify({
        "whatsapp": "configurado" if configurado else "não_configurado",
        "instance": instance,
        "api_url": api_url or "(não definido)",
        "webhook_url": "http://SEU_IP:8000/whatsapp/webhook",
    })


@bp.route("/sessoes", methods=["GET"])
def listar_sessoes_whatsapp():
    """Lista sessões abertas do WhatsApp."""
    db = SessionLocal()
    try:
        sessoes = memory.listar_sessoes(db, canal="whatsapp")
        return jsonify(sessoes)
    finally:
        db.close()
