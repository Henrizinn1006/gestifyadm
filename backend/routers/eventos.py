from flask import Blueprint, jsonify, request, abort
from ..database import SessionLocal
from .. import crud

bp = Blueprint("eventos", __name__, url_prefix="/eventos")


@bp.route("/", methods=["GET"])
def listar():
    db = SessionLocal()
    try:
        items = crud.get_eventos(
            db,
            skip=request.args.get("skip", 0, type=int),
            limit=request.args.get("limit", 500, type=int),
            status=request.args.get("status"),
            cliente_id=request.args.get("cliente_id", type=int),
            busca=request.args.get("busca", ""),
        )
        return jsonify(items)
    finally:
        db.close()


@bp.route("/<int:eid>", methods=["GET"])
def obter(eid):
    db = SessionLocal()
    try:
        obj = crud.get_evento(db, eid)
        if not obj:
            abort(404, description="Evento não encontrado")
        return jsonify(obj)
    finally:
        db.close()


@bp.route("/", methods=["POST"])
def criar():
    db = SessionLocal()
    try:
        obj = crud.create_evento(db, request.get_json())
        return jsonify(obj), 201
    finally:
        db.close()


@bp.route("/<int:eid>", methods=["PUT"])
def atualizar(eid):
    db = SessionLocal()
    try:
        obj = crud.update_evento(db, eid, request.get_json())
        if not obj:
            abort(404, description="Evento não encontrado")
        return jsonify(obj)
    finally:
        db.close()


@bp.route("/<int:eid>", methods=["DELETE"])
def excluir(eid):
    db = SessionLocal()
    try:
        obj = crud.delete_evento(db, eid)
        if not obj:
            abort(404, description="Evento não encontrado")
        return jsonify({"mensagem": "Evento excluído com sucesso", "id": eid})
    finally:
        db.close()
