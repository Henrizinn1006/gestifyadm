from flask import Blueprint, jsonify
from ..database import SessionLocal
from .. import crud

bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")


@bp.route("/resumo", methods=["GET"])
def resumo():
    db = SessionLocal()
    try:
        return jsonify(crud.get_dashboard_resumo(db))
    finally:
        db.close()
