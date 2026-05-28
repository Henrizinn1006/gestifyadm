from flask import Blueprint, jsonify, request, abort
from ..database import SessionLocal
from .. import crud

bp = Blueprint("financeiro", __name__, url_prefix="/financeiro")


@bp.route("/", methods=["GET"])
def listar():
    db = SessionLocal()
    try:
        items = crud.get_movimentacoes(
            db,
            skip=request.args.get("skip", 0, type=int),
            limit=request.args.get("limit", 500, type=int),
            tipo=request.args.get("tipo"),
            status=request.args.get("status"),
            evento_id=request.args.get("evento_id", type=int),
            cliente_id=request.args.get("cliente_id", type=int),
            mes=request.args.get("mes", type=int),
            ano=request.args.get("ano", type=int),
        )
        return jsonify(items)
    finally:
        db.close()


@bp.route("/<int:mid>", methods=["GET"])
def obter(mid):
    db = SessionLocal()
    try:
        obj = crud.get_movimentacao(db, mid)
        if not obj:
            abort(404, description="Movimentação não encontrada")
        return jsonify(obj)
    finally:
        db.close()


@bp.route("/", methods=["POST"])
def criar():
    db = SessionLocal()
    try:
        obj = crud.create_movimentacao(db, request.get_json())
        return jsonify(obj), 201
    except Exception as exc:
        db.rollback()
        abort(400, description=str(exc))
    finally:
        db.close()


@bp.route("/<int:mid>", methods=["PUT"])
def atualizar(mid):
    db = SessionLocal()
    try:
        obj = crud.update_movimentacao(db, mid, request.get_json())
        if not obj:
            abort(404, description="Movimentação não encontrada")
        return jsonify(obj)
    except Exception as exc:
        db.rollback()
        abort(400, description=str(exc))
    finally:
        db.close()


@bp.route("/<int:mid>", methods=["DELETE"])
def excluir(mid):
    db = SessionLocal()
    try:
        obj = crud.delete_movimentacao(db, mid)
        if not obj:
            abort(404, description="Movimentação não encontrada")
        return jsonify({"mensagem": "Movimentação excluída com sucesso", "id": mid})
    finally:
        db.close()
