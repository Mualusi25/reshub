import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required
from ..extensions import db
from ..models import User
from ..utils import current_user_id

auth_bp = Blueprint("auth", __name__)

EMAIL_RE = re.compile(r"^\S+@\S+\.\S+$")
SELF_SERVICE_ROLES = {"student", "provider"}  # admins are created via the seed command


def token_for(user):
    return create_access_token(identity=str(user.id), additional_claims={"role": user.role})


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    full_name = (data.get("fullName") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = data.get("role", "student")

    if not full_name:
        return jsonify(error="Full name is required."), 400
    if not EMAIL_RE.match(email):
        return jsonify(error="Enter a valid email address."), 400
    if len(password) < 8:
        return jsonify(error="Password must be at least 8 characters."), 400
    if role not in SELF_SERVICE_ROLES:
        return jsonify(error="Role must be 'student' or 'provider'."), 400
    if User.query.filter_by(email=email).first():
        return jsonify(error="An account with this email already exists."), 409

    user = User(full_name=full_name, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify(token=token_for(user), user=user.to_dict()), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    expected_role = data.get("role")  # sent by the student/provider/admin login pages

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify(error="Invalid email or password."), 401
    if expected_role and user.role != expected_role:
        return jsonify(error="This account cannot sign in on this page."), 403

    return jsonify(token=token_for(user), user=user.to_dict())


@auth_bp.get("/me")
@jwt_required()
def me():
    user = db.session.get(User, current_user_id())
    if not user:
        return jsonify(error="User not found."), 404
    return jsonify(user=user.to_dict())
