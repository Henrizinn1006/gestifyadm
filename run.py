"""
run.py — Inicia o servidor Gestify.

Uso:
  python run.py          → acesso local (navegador no PC)
  python run.py --rede   → acesso pela rede local (celular/Flutter)
"""
import sys
from backend.main import app

if __name__ == "__main__":
    rede = "--rede" in sys.argv
    host = "0.0.0.0" if rede else "127.0.0.1"

    if rede:
        import socket
        ip = socket.gethostbyname(socket.gethostname())
        print(f"\n  ✓ Gestify rodando em modo REDE")
        print(f"  → PC:     http://localhost:8000")
        print(f"  → Celular: http://{ip}:8000")
        print(f"\n  Use esse IP no app Flutter (Configurações ⚙)\n")
    else:
        print("\n  ✓ Gestify iniciando em http://localhost:8000")
        print("  Dica: use 'python run.py --rede' para acessar pelo celular\n")

    app.run(debug=True, port=8000, host=host)
