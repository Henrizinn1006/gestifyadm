"""
core.py - Orquestrador principal do Lion AI.
"""

import json
from typing import Generator
from sqlalchemy.orm import Session

from .openai_client import chat_completion, chat_completion_stream
from .prompts import build_system_prompt, build_whatsapp_prompt
from .context import build_business_context
from .memory import salvar_mensagem, get_historico_openai, atualizar_titulo_sessao
from .tools import TOOLS, executar_ferramenta

MAX_TOOL_LOOPS = 5


def _build_messages(db, sessao_id, user_message, canal="web"):
    context = build_business_context(db)
    system_prompt = build_whatsapp_prompt(context) if canal == "whatsapp" else build_system_prompt(context)
    historico = get_historico_openai(db, sessao_id, limit=30)
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(historico)
    messages.append({"role": "user", "content": user_message})
    return messages


def chat(db: Session, sessao_id: int, user_message: str, canal: str = "web") -> str:
    _auto_titulo(db, sessao_id, user_message)
    salvar_mensagem(db, sessao_id, "user", user_message)
    messages = _build_messages(db, sessao_id, user_message, canal)

    for _ in range(MAX_TOOL_LOOPS):
        resp = chat_completion(messages, tools=TOOLS)
        choice = resp["choices"][0]
        msg = choice["message"]
        finish = choice["finish_reason"]

        if finish == "tool_calls":
            tool_calls = msg.get("tool_calls", [])
            messages.append({
                "role": "assistant",
                "content": msg.get("content") or "",
                "tool_calls": tool_calls,
            })
            for tc in tool_calls:
                fn_name = tc["function"]["name"]
                try:
                    fn_args = json.loads(tc["function"].get("arguments", "{}"))
                except Exception:
                    fn_args = {}
                resultado = executar_ferramenta(fn_name, fn_args, db)
                messages.append({"role": "tool", "tool_call_id": tc["id"], "content": resultado})

            salvar_mensagem(
                db, sessao_id, "assistant",
                "[ferramentas: " + ", ".join(tc["function"]["name"] for tc in tool_calls) + "]",
                tool_calls=tool_calls
            )
            continue

        resposta = msg.get("content", "")
        tokens = resp.get("usage", {}).get("completion_tokens", 0)
        salvar_mensagem(db, sessao_id, "assistant", resposta, tokens=tokens)
        return resposta

    return "Desculpe, atingi o limite de iteracoes. Tente reformular."


def stream_chat(db: Session, sessao_id: int, user_message: str) -> Generator[str, None, None]:
    _auto_titulo(db, sessao_id, user_message)
    salvar_mensagem(db, sessao_id, "user", user_message)
    messages = _build_messages(db, sessao_id, user_message, "web")
    full_response = ""

    try:
        for loop_i in range(MAX_TOOL_LOOPS):
            tool_calls_buffer = []
            chunk_content = ""

            for chunk_str in chat_completion_stream(messages, tools=TOOLS):
                try:
                    chunk = json.loads(chunk_str)
                except Exception:
                    continue

                ctype = chunk.get("type")

                if ctype == "text":
                    chunk_content += chunk["text"]
                    full_response += chunk["text"]
                    yield "data: " + json.dumps({"type": "text", "text": chunk["text"]}) + "\n\n"

                elif ctype == "tool_calls":
                    tool_calls_buffer = chunk["tool_calls"]

                elif ctype == "done":
                    if not tool_calls_buffer:
                        salvar_mensagem(db, sessao_id, "assistant", full_response)
                        yield "data: " + json.dumps({"type": "done"}) + "\n\n"
                        return

            if tool_calls_buffer:
                openai_tool_calls = [
                    {
                        "id": tc.get("id") or "call_" + str(i),
                        "type": "function",
                        "function": {"name": tc["name"], "arguments": tc.get("arguments", "{}")},
                    }
                    for i, tc in enumerate(tool_calls_buffer)
                ]

                messages.append({
                    "role": "assistant",
                    "content": chunk_content or "",
                    "tool_calls": openai_tool_calls,
                })

                for i, tc in enumerate(tool_calls_buffer):
                    fn_name = tc["name"]
                    try:
                        fn_args = json.loads(tc.get("arguments", "{}"))
                    except Exception:
                        fn_args = {}

                    yield "data: " + json.dumps({"type": "tool_start", "name": fn_name}) + "\n\n"
                    resultado = executar_ferramenta(fn_name, fn_args, db)
                    yield "data: " + json.dumps({"type": "tool_result", "name": fn_name, "preview": resultado[:200]}) + "\n\n"

                    messages.append({
                        "role": "tool",
                        "tool_call_id": openai_tool_calls[i]["id"],
                        "content": resultado,
                    })

                salvar_mensagem(
                    db, sessao_id, "assistant",
                    "[ferramentas: " + ", ".join(tc["name"] for tc in tool_calls_buffer) + "]",
                    tool_calls=tool_calls_buffer
                )
                full_response = ""
                chunk_content = ""
                continue

            break

        if full_response:
            salvar_mensagem(db, sessao_id, "assistant", full_response)
        yield "data: " + json.dumps({"type": "done"}) + "\n\n"

    except Exception as e:
        yield "data: " + json.dumps({"type": "error", "message": str(e)}) + "\n\n"


def _auto_titulo(db: Session, sessao_id: int, user_message: str):
    from ...models import LionSessao
    sessao = db.query(LionSessao).filter(LionSessao.id == sessao_id).first()
    if sessao and sessao.titulo.startswith("Conversa "):
        titulo = user_message[:50].strip()
        if len(user_message) > 50:
            titulo += "..."
        atualizar_titulo_sessao(db, sessao_id, titulo)
