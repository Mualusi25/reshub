from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity, verify_jwt_in_request
from ..extensions import db
from ..models import Listing, User
from ..utils import roles_required, current_user_id

listings_bp = Blueprint("listings", __name__)

STATUSES = {"available", "limited", "booked"}
MAX_IMAGES = 8

# Providers editing any of these on a verified listing sends it back for admin re-review
REVIEWED_FIELDS = ("name", "description", "area", "campus", "image_url")

PRICE_RANGES = {
    "under-3000": (0, 3000),
    "3000-4000": (3000, 4000),
    "4000-5000": (4000, 5000),
    "5000-plus": (5000, None),
}


def clean_payload(data, creating):
    out, errors = {}, []

    for field in ("name", "area", "campus", "description"):
        if field in data:
            out[field] = str(data[field]).strip()
    if "imageUrl" in data:
        out["image_url"] = str(data["imageUrl"]).strip()

    for field, cast in (("price", int), ("distance", float)):
        if field in data:
            try:
                out[field] = cast(data[field])
            except (TypeError, ValueError):
                errors.append(f"{field} must be a number.")

    if "status" in data:
        if data["status"] in STATUSES:
            out["status"] = data["status"]
        else:
            errors.append("status must be available, limited or booked.")

    # Photos: a list of our own upload URLs. The first one is the cover.
    if "images" in data:
        before = len(errors)
        raw = data["images"]
        images = []
        if not isinstance(raw, list):
            errors.append("images must be a list.")
        else:
            for item in raw:
                url = str(item).strip()
                if not url.startswith("/api/uploads/") or len(url) > 120:
                    errors.append("One of the photos is not valid.")
                    break
                if url not in images:
                    images.append(url)
            if len(images) > MAX_IMAGES:
                errors.append(f"You can add up to {MAX_IMAGES} photos.")
        if len(errors) == before:
            out["images"] = images
            out["image_url"] = images[0] if images else ""

    if creating:
        for field in ("name", "price", "area", "campus", "distance"):
            if field not in out or out[field] in ("", None):
                errors.append(f"{field} is required.")

    if "price" in out and out["price"] <= 0:
        errors.append("price must be greater than 0.")
    if "distance" in out and out["distance"] < 0:
        errors.append("distance cannot be negative.")

    return out, errors


def can_edit(listing):
    return get_jwt().get("role") == "admin" or listing.provider_id == current_user_id()


def optional_viewer():
    """(user_id, role) of the logged-in viewer, or (None, None) for visitors."""
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            return int(identity), get_jwt().get("role")
    except Exception:
        pass
    return None, None


@listings_bp.get("")
def list_listings():
    # Students only see verified listings from active providers
    query = Listing.query.join(User, Listing.provider_id == User.id).filter(
        Listing.is_verified.is_(True), User.is_active.is_(True)
    )

    location = request.args.get("location", "").strip()
    institution = request.args.get("institution", "").strip()
    price = request.args.get("price", "")

    if location:
        like = f"%{location}%"
        query = query.filter(db.or_(Listing.name.ilike(like), Listing.area.ilike(like)))
    if institution:
        query = query.filter(Listing.campus == institution)
    if price in PRICE_RANGES:
        low, high = PRICE_RANGES[price]
        query = query.filter(Listing.price >= low)
        if high is not None:
            query = query.filter(Listing.price < high)

    items = query.order_by(Listing.id).all()
    return jsonify(listings=[l.to_dict() for l in items], count=len(items))


@listings_bp.get("/mine")
@roles_required("provider", "admin")
def my_listings():
    items = Listing.query.filter_by(provider_id=current_user_id()).order_by(Listing.id).all()
    return jsonify(listings=[l.to_dict() for l in items], count=len(items))


@listings_bp.get("/<int:listing_id>")
def get_listing(listing_id):
    listing = db.session.get(Listing, listing_id)
    if not listing:
        return jsonify(error="Listing not found."), 404

    if not listing.is_public:
        # Unverified listings are only visible to their owner and to admins
        uid, role = optional_viewer()
        if not (role == "admin" or (uid is not None and uid == listing.provider_id)):
            return jsonify(error="Listing not found."), 404

    return jsonify(listing=listing.to_dict())


@listings_bp.post("")
@roles_required("provider", "admin")
def create_listing():
    data = request.get_json(silent=True) or {}
    payload, errors = clean_payload(data, creating=True)
    if errors:
        return jsonify(error=" ".join(errors)), 400

    listing = Listing(
        **payload,
        provider_id=current_user_id(),
        is_verified=(get_jwt().get("role") == "admin"),  # providers wait for admin review
    )
    db.session.add(listing)
    db.session.commit()
    return jsonify(listing=listing.to_dict()), 201


@listings_bp.put("/<int:listing_id>")
@roles_required("provider", "admin")
def update_listing(listing_id):
    listing = db.session.get(Listing, listing_id)
    if not listing:
        return jsonify(error="Listing not found."), 404
    if not can_edit(listing):
        return jsonify(error="You can only edit your own listings."), 403

    data = request.get_json(silent=True) or {}
    payload, errors = clean_payload(data, creating=False)
    if errors:
        return jsonify(error=" ".join(errors)), 400

    if get_jwt().get("role") != "admin" and listing.is_verified:
        changed = any(getattr(listing, f) != payload[f] for f in REVIEWED_FIELDS if f in payload)
        if "images" in payload and payload["images"] != listing.photos():
            changed = True
        if changed:
            listing.is_verified = False

    for key, value in payload.items():
        setattr(listing, key, value)
    db.session.commit()
    return jsonify(listing=listing.to_dict())


@listings_bp.delete("/<int:listing_id>")
@roles_required("provider", "admin")
def delete_listing(listing_id):
    listing = db.session.get(Listing, listing_id)
    if not listing:
        return jsonify(error="Listing not found."), 404
    if not can_edit(listing):
        return jsonify(error="You can only delete your own listings."), 403

    db.session.delete(listing)
    db.session.commit()
    return jsonify(message="Listing deleted.")
