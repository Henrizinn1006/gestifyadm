"""
openai_client.py — Cliente httpx direto para a OpenAI API.

Não usa o openai SDK oficial (incompatível com Python 3.14/pydantic).
Faz chamadas HTTP diretamente ao endpoint da OpenAI.
"""

import os
import json
import httpx
from typing import Generator

OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"


def _get_api_key() -> str:
    key = os.environ.get("OPENAI_API_KEY", "")
    if not key:
        raise RuntimeError("OPENAI_API_KEY não configurada. Crie um arquivo .env com sua chave.")
    return key


def _get_model() -> str:
    return os.environ.get("OPENAI_MODEL", "gpt-4o-mini")


def chat_completion(messages: list, tools: list = None, temperature: float = 0.7) -> dict:
    """
    Faz uma chamada de chat completion (sem streaming).
    Retorna o dict completo da resposta OpenAI.
    """
    payload = {
        "model": _get_model(),
        "messages": messages,
        "temperature": temperature,
    }
    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = "auto"

    with httpx.Client(timeout=60.0) as client:
        resp = client.post(
            OPENAI_API_URL,
            headers={
                "Authorization": f"Bearer {_get_api_key()}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()


def chat_completion_stream(messages: list, tools: list = None, temperature: float = 0.7) -> Generator[str, None, None]:
    """
    Faz uma chamada com streaming (SSE).
    Gera pedaços de texto conforme chegam da OpenAI.
    Também detecta tool_calls no stream e os retorna como um evento especial.
    """
    payload = {
        "model": _get_model(),
        "messages": messages,
        "temperature": temperature,
        "stream": True,
    }
    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = "auto"

    with httpx.Client(timeout=120.0) as client:
        with client.stream(
            "POST",
            OPENAI_API_URL,
            headers={
                "Authorization": f"Bearer {_get_api_key()}",
                "Content-Type": "application/json",
            },
            json=payload,
        ) as resp:
            resp.raise_for_status()

            # Acumula tool_calls durante o stream
            tool_calls_acc: dict = {}  # index → {id, name, arguments}
            full_content = ""

            for line in resp.iter_lines():
                if not line or line == "data: [DONE]":
                    continue
                if not line.startswith("data: "):
                    continue

                data_str = line[6:]
                try:
                    chunk = json.loads(data_str)
                except json.JSONDecodeError:
                    continue

                choice = chunk.get("choices", [{}])[0]
                delta = choice.get("delta", {})

                # Conteúdo texto normal
                content_piece = delta.get("content")
                if content_piece:
                    full_content += content_piece
                    yield json.dumps({"type": "text", "text": content_piece})

                # Tool calls no stream
                tc_deltas = delta.get("tool_calls")
                if tc_deltas:
                    for tc in tc_deltas:
                        idx = tc.get("index", 0)
                        if idx not in tool_calls_acc:
                            tool_calls_acc[idx] = {"id": "", "name": "", "arguments": ""}
                        if tc.get("id"):
                            tool_calls_acc[idx]["id"] = tc["id"]
                        fn = tc.get("function", {})
                        if fn.get("name"):
                            tool_calls_acc[idx]["name"] += fn["name"]
                        if fn.get("arguments"):
                            tool_calls_acc[idx]["arguments"] += fn["arguments"]

                finish = choice.get("finish_reason")
                if finish == "tool_calls" and tool_calls_acc:
                    yield json.dumps({"type": "tool_calls", "tool_calls": list(tool_calls_acc.values())})
                elif finish == "stop":
                    yield json.dumps({"type": "done", "full_content": full_content})
