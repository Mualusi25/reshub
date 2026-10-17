import re
from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models import ContactMessage
from ..utils import roles_required

contact_bp = Blueprint("contact", __name__)

EMAIL_RE = re.compile(r"^\S+@\S+\.\S+$")


@contact_bp.post("")
def send_message():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    message = (data.get("message") or "").strip()

    if not name:
        return jsonify(error="Name is required."), 400
    if not EMAIL_RE.match(email):
        return jsonify(error="Enter a valid email address."), 400
    if len(message) < 10:
        return jsonify(error="Message must be at least 10 characters."), 400

    db.session.add(ContactMessage(name=name, email=email, message=message))
    db.session.commit()
    return jsonify(message="Thanks! We will get back to you soon."), 201


@contact_bp.get("")
@roles_required("admin")
def list_messages():
    items = ContactMessage.query.order_by(ContactMessage.id.desc()).all()
    return jsonify(messages=[m.to_dict() for m in items])
