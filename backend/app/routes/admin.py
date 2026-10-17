from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models import ContactMessage, Enquiry, Listing, User
from ..utils import roles_required

admin_bp = Blueprint("admin", __name__)


@admin_bp.get("/stats")
@roles_required("admin")
def stats():
    return jsonify(
        students=User.query.filter_by(role="student").count(),
        providers=User.query.filter_by(role="provider").count(),
        pendingProviders=User.query.filter_by(role="provider", is_verified=False, is_active=True).count(),
        listings=Listing.query.count(),
        pendingListings=Listing.query.filter_by(is_verified=False).count(),
        unreadMessages=ContactMessage.query.filter_by(is_read=False).count(),
        enquiries=Enquiry.query.count(),
    )


# ---------- users ----------

@admin_bp.get("/users")
@roles_required("admin")
def list_users():
    query = User.query
    role = request.args.get("role", "")
    q = request.args.get("q", "").strip()

    if role in ("student", "provider", "agent", "admin"):
        query = query.filter_by(role=role)
    if q:
        like = f"%{q}%"
        query = query.filter(db.or_(User.full_name.ilike(like), User.email.ilike(like)))

    users = query.order_by(User.id.desc()).limit(500).all()
    return jsonify(users=[u.to_dict() for u in users])


@admin_bp.patch("/users/<int:user_id>")
@roles_required("admin")
def update_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(error="User not found."), 404

    data = request.get_json(silent=True) or {}

    if "isActive" in data:
        if not isinstance(data["isActive"], bool):
            return jsonify(error="isActive must be true or false."), 400
        if user.role == "admin":
            return jsonify(error="Administrator accounts cannot be suspended."), 400
        user.is_active = data["isActive"]

    if "isVerified" in data:
        if not isinstance(data["isVerified"], bool):
            return jsonify(error="isVerified must be true or false."), 400
        if user.role != "provider":
            return jsonify(error="Only providers can be verified."), 400
        user.is_verified = data["isVerified"]

    db.session.commit()
    return jsonify(user=user.to_dict())


# ---------- listings ----------

@admin_bp.get("/listings")
@roles_required("admin")
def list_listings():
    query = Listing.query
    review = request.args.get("review", "")
    q = request.args.get("q", "").strip()

    if review == "pending":
        query = query.filter(Listing.is_verified.is_(False))
    elif review == "verified":
        query = query.filter(Listing.is_verified.is_(True))
    if q:
        like = f"%{q}%"
        query = query.filter(db.or_(Listing.name.ilike(like), Listing.area.ilike(like)))

    items = query.order_by(Listing.is_verified, Listing.id.desc()).limit(500).all()
    return jsonify(listings=[l.to_dict() for l in items])


@admin_bp.patch("/listings/<int:listing_id>")
@roles_required("admin")
def update_listing(listing_id):
    listing = db.session.get(Listing, listing_id)
    if not listing:
        return jsonify(error="Listing not found."), 404

    data = request.get_json(silent=True) or {}
    if not isinstance(data.get("isVerified"), bool):
        return jsonify(error="isVerified must be true or false."), 400

    listing.is_verified = data["isVerified"]
    db.session.commit()
    return jsonify(listing=listing.to_dict())


# ---------- contact messages ----------

@admin_bp.get("/messages")
@roles_required("admin")
def list_messages():
    items = ContactMessage.query.order_by(ContactMessage.is_read, ContactMessage.id.desc()).all()
    return jsonify(messages=[m.to_dict() for m in items])


@admin_bp.patch("/messages/<int:message_id>")
@roles_required("admin")
def update_message(message_id):
    message = db.session.get(ContactMessage, message_id)
    if not message:
        return jsonify(error="Message not found."), 404

    data = request.get_json(silent=True) or {}
    if not isinstance(data.get("isRead"), bool):
        return jsonify(error="isRead must be true or false."), 400

    message.is_read = data["isRead"]
    db.session.commit()
    return jsonify(message=message.to_dict())


@admin_bp.delete("/messages/<int:message_id>")
@roles_required("admin")
def delete_message(message_id):
    message = db.session.get(ContactMessage, message_id)
    if not message:
        return jsonify(error="Message not found."), 404
    db.session.delete(message)
    db.session.commit()
    return jsonify(message="Message deleted.")
