from flask import Blueprint, jsonify, request, abort
from ..database import SessionLocal
from .. import crud

bp = Blueprint("clientes", __name__, url_prefix="/clientes")


@bp.route("/", methods=["GET"])
def listar():
    db = SessionLocal()
    try:
        items = crud.get_clientes(
            db,
            skip=request.args.get("skip", 0, type=int),
            limit=request.args.get("limit", 500, type=int),
            busca=request.args.get("busca", ""),
        )
        return jsonify(items)
    finally:
        db.close()


@bp.route("/<int:cid>", methods=["GET"])
def obter(cid):
    db = SessionLocal()
    try:
        obj = crud.get_cliente(db, cid)
        if not obj:
            abort(404, description="Cliente não encontrado")
        return jsonify(obj)
    finally:
        db.close()


@bp.route("/", methods=["POST"])
def criar():
    db = SessionLocal()
    try:
        obj = crud.create_cliente(db, request.get_json())
        return jsonify(obj), 201
    finally:
        db.close()


@bp.route("/<int:cid>", methods=["PUT"])
def atualizar(cid):
    db = SessionLocal()
    try:
        obj = crud.update_cliente(db, cid, request.get_json())
        if not obj:
            abort(404, description="Cliente não encontrado")
        return jsonify(obj)
    finally:
        db.close()


@bp.route("/<int:cid>", methods=["DELETE"])
def excluir(cid):
    db = SessionLocal()
    try:
        obj = crud.delete_cliente(db, cid)
        if not obj:
            abort(404, description="Cliente não encontrado")
        return jsonify({"mensagem": "Cliente excluído com sucesso", "id": cid})
    finally:
        db.close()
