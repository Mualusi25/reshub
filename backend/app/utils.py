from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from .extensions import db
from .models import User


def current_user_id():
    return int(get_jwt_identity())


def roles_required(*roles):
    """Require a valid JWT for an active user whose role is one of `roles`."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user = db.session.get(User, current_user_id())
            if not user or not user.is_active:
                return jsonify(error="Your account is not active."), 403
            if user.role not in roles:
                return jsonify(error="You do not have permission to do that."), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
