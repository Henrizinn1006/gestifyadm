from flask import Blueprint, jsonify, request, abort
from ..database import SessionLocal
from .. import crud

bp = Blueprint("categorias", __name__, url_prefix="/categorias")


@bp.route("/", methods=["GET"])
def listar():
    db = SessionLocal()
    try:
        items = crud.get_categorias(db, tipo=request.args.get("tipo"))
        return jsonify(items)
    finally:
        db.close()


@bp.route("/<int:cid>", methods=["GET"])
def obter(cid):
    db = SessionLocal()
    try:
        obj = crud.get_categoria(db, cid)
        if not obj:
            abort(404, description="Categoria não encontrada")
        return jsonify(obj)
    finally:
        db.close()


@bp.route("/", methods=["POST"])
def criar():
    db = SessionLocal()
    try:
        obj = crud.create_categoria(db, request.get_json())
        return jsonify(obj), 201
    finally:
        db.close()


@bp.route("/<int:cid>", methods=["PUT"])
def atualizar(cid):
    db = SessionLocal()
    try:
        obj = crud.update_categoria(db, cid, request.get_json())
        if not obj:
            abort(404, description="Categoria não encontrada")
        return jsonify(obj)
    finally:
        db.close()


@bp.route("/<int:cid>", methods=["DELETE"])
def excluir(cid):
    db = SessionLocal()
    try:
        obj = crud.delete_categoria(db, cid)
        if not obj:
            abort(404, description="Categoria não encontrada")
        return jsonify({"mensagem": "Categoria excluída com sucesso", "id": cid})
    finally:
        db.close()
