from flask import Blueprint, jsonify, request, abort
from ..database import SessionLocal
from .. import crud

bp = Blueprint("fornecedores", __name__, url_prefix="/fornecedores")


@bp.route("/", methods=["GET"])
def listar():
    db = SessionLocal()
    try:
        items = crud.get_fornecedores(
            db,
            skip=request.args.get("skip", 0, type=int),
            limit=request.args.get("limit", 500, type=int),
            busca=request.args.get("busca", ""),
        )
        return jsonify(items)
    finally:
        db.close()


@bp.route("/<int:fid>", methods=["GET"])
def obter(fid):
    db = SessionLocal()
    try:
        obj = crud.get_fornecedor(db, fid)
        if not obj:
            abort(404, description="Fornecedor não encontrado")
        return jsonify(obj)
    finally:
        db.close()


@bp.route("/", methods=["POST"])
def criar():
    db = SessionLocal()
    try:
        obj = crud.create_fornecedor(db, request.get_json())
        return jsonify(obj), 201
    finally:
        db.close()


@bp.route("/<int:fid>", methods=["PUT"])
def atualizar(fid):
    db = SessionLocal()
    try:
        obj = crud.update_fornecedor(db, fid, request.get_json())
        if not obj:
            abort(404, description="Fornecedor não encontrado")
        return jsonify(obj)
    finally:
        db.close()


@bp.route("/<int:fid>", methods=["DELETE"])
def excluir(fid):
    db = SessionLocal()
    try:
        obj = crud.delete_fornecedor(db, fid)
        if not obj:
            abort(404, description="Fornecedor não encontrado")
        return jsonify({"mensagem": "Fornecedor excluído com sucesso", "id": fid})
    finally:
        db.close()
