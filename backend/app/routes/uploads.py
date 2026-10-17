import uuid
from flask import Blueprint, request, jsonify, Response
from ..extensions import db
from ..models import UploadedImage
from ..utils import roles_required

uploads_bp = Blueprint("uploads", __name__)

MIME = {"jpg": "image/jpeg", "png": "image/png", "webp": "image/webp"}


def detect_ext(head):
    """Identify the image type from its first bytes (don't trust the filename)."""
    if head.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp"
    return None


@uploads_bp.post("")
@roles_required("provider", "admin")
def upload_image():
    file = request.files.get("file")
    if not file or not file.filename:
        return jsonify(error="No file uploaded."), 400

    data = file.stream.read()
    ext = detect_ext(data[:12])
    if not ext:
        return jsonify(error="Only JPG, PNG or WebP images are allowed."), 400

    image_id = uuid.uuid4().hex
    db.session.add(UploadedImage(id=image_id, content_type=MIME[ext], data=data))
    db.session.commit()
    return jsonify(url=f"/api/uploads/{image_id}"), 201


@uploads_bp.get("/<image_id>")
def serve_image(image_id):
    image = db.session.get(UploadedImage, image_id)
    if not image:
        return jsonify(error="Not found."), 404
    response = Response(bytes(image.data), mimetype=image.content_type)
    response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return response


@uploads_bp.app_errorhandler(413)
def too_large(_):
    return jsonify(error="Image is too large (max 5 MB)."), 413
