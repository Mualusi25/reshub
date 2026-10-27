import re
from datetime import datetime, timedelta, timezone

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from ..emails import send_verification_email
from ..extensions import db
from ..models import User
from ..utils import current_user_id

auth_bp = Blueprint("auth", __name__)

EMAIL_RE = re.compile(r"^\S+@\S+\.\S+$")
SELF_SERVICE_ROLES = {"student", "provider"}  # staff accounts come from the command line tools
VERIFY_MAX_AGE = 24 * 60 * 60                 # verification links last 24 hours
RESEND_COOLDOWN = timedelta(seconds=60)


def token_for(user):
    return create_access_token(identity=str(user.id), additional_claims={"role": user.role})


def _signer():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="email-verify")


def _now():
    return datetime.now(timezone.utc).replace(tzinfo=None)  # naive UTC, like the database column


def issue_verification(user):
    """Email a fresh verification link. Returns 'sent', 'cooldown' or 'failed'."""
    now = _now()
    if user.verification_sent_at and now - user.verification_sent_at < RESEND_COOLDOWN:
        return "cooldown"

    user.verification_version = (user.verification_version or 0) + 1  # older links stop working
    user.verification_sent_at = now
    db.session.commit()

    token = _signer().dumps({"uid": user.id, "v": user.verification_version})
    if send_verification_email(user, token):
        return "sent"

    user.verification_sent_at = None  # let the person retry straight away
    db.session.commit()
    return "failed"


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

    user = User.query.filter_by(email=email).first()
    if user and user.email_verified:
        return jsonify(error="An account with this email already exists."), 409

    if user:
        # Signed up earlier but never verified: this new submission replaces it
        user.full_name = full_name
        user.role = role
    else:
        user = User(full_name=full_name, email=email, role=role)
        db.session.add(user)
    user.set_password(password)
    db.session.commit()

    status = issue_verification(user)
    return jsonify(
        message="Account created. Check your email to verify it.",
        email=email,
        emailStatus=status,
    ), 201


@auth_bp.post("/verify-email")
def verify_email():
    token = (request.get_json(silent=True) or {}).get("token") or ""
    try:
        data = _signer().loads(token, max_age=VERIFY_MAX_AGE)
    except SignatureExpired:
        return jsonify(error="This link has expired. Request a new one.", code="link_expired"), 400
    except BadSignature:
        return jsonify(error="This link is not valid.", code="link_invalid"), 400

    uid = data.get("uid") if isinstance(data, dict) else None
    user = db.session.get(User, uid) if uid else None
    if not user:
        return jsonify(error="This link is not valid.", code="link_invalid"), 400

    if user.email_verified:
        return jsonify(message="Your email is already verified. You can sign in.", alreadyVerified=True)
    if data.get("v") != user.verification_version:
        return jsonify(
            error="A newer verification email was sent. Please use the latest one.",
            code="link_replaced",
        ), 400
    if not user.is_active:
        return jsonify(error="This account has been suspended. Please contact support."), 403

    user.email_verified = True
    db.session.commit()
    return jsonify(
        message="Email verified. Welcome to ResHub!", token=token_for(user), user=user.to_dict()
    )


@auth_bp.post("/resend-verification")
def resend_verification():
    email = ((request.get_json(silent=True) or {}).get("email") or "").strip().lower()
    user = User.query.filter_by(email=email).first() if EMAIL_RE.match(email) else None
    if user and not user.email_verified and user.is_active:
        issue_verification(user)
    # Same answer whether or not the account exists, so this can't be used to look up emails
    return jsonify(message="If that account is waiting for verification, we have sent a new email.")


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    expected_role = data.get("role")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify(error="Invalid email or password."), 401
    if not user.is_active:
        return jsonify(error="This account has been suspended. Please contact support."), 403
    if not user.email_verified:
        return jsonify(
            error="Please verify your email address before signing in.",
            code="email_not_verified",
            email=user.email,
        ), 403
    if expected_role and user.role != expected_role:
        return jsonify(error="This account cannot sign in on this page."), 403

    return jsonify(token=token_for(user), user=user.to_dict())


@auth_bp.get("/me")
@jwt_required()
def me():
    user = db.session.get(User, current_user_id())
    if not user:
        return jsonify(error="User not found."), 404
    if not user.is_active:
        return jsonify(error="This account has been suspended."), 403
    return jsonify(user=user.to_dict())