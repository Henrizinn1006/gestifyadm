from flask import Blueprint, jsonify, abort
from ..database import SessionLocal
from .. import crud

bp = Blueprint("relatorios", __name__, url_prefix="/relatorios")


@bp.route("/evento/<int:evento_id>", methods=["GET"])
def relatorio_evento(evento_id):
    db = SessionLocal()
    try:
        resultado = crud.get_relatorio_evento(db, evento_id)
        if not resultado:
            abort(404, description="Evento não encontrado")
        return jsonify(resultado)
    finally:
        db.close()
