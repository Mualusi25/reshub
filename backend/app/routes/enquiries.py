from datetime import date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt
from ..extensions import db
from ..models import Enquiry, Listing
from ..utils import roles_required, current_user_id

enquiries_bp = Blueprint("enquiries", __name__)


def owns(enquiry):
    return get_jwt().get("role") == "admin" or enquiry.listing.provider_id == current_user_id()


@enquiries_bp.post("")
@roles_required("student")
def create_enquiry():
    data = request.get_json(silent=True) or {}

    try:
        listing_id = int(data.get("listingId"))
    except (TypeError, ValueError):
        return jsonify(error="A valid listing is required."), 400

    listing = db.session.get(Listing, listing_id)
    if not listing:
        return jsonify(error="Listing not found."), 404
    if listing.status == "booked":
        return jsonify(error="This property is fully booked."), 409

    message = (data.get("message") or "").strip()
    if len(message) < 10:
        return jsonify(error="Message must be at least 10 characters."), 400

    try:
        move_in = date.fromisoformat(data.get("moveInDate") or "")
    except (TypeError, ValueError):
        return jsonify(error="Enter a valid move-in date."), 400
    if move_in < date.today():
        return jsonify(error="Move-in date cannot be in the past."), 400

    uid = current_user_id()
    if Enquiry.query.filter_by(student_id=uid, listing_id=listing.id, status="pending").first():
        return jsonify(error="You already have a pending enquiry for this property."), 409

    enquiry = Enquiry(listing_id=listing.id, student_id=uid, message=message, move_in_date=move_in)
    db.session.add(enquiry)
    db.session.commit()
    return jsonify(enquiry=enquiry.to_dict()), 201


@enquiries_bp.get("/mine")
@roles_required("student")
def my_enquiries():
    items = Enquiry.query.filter_by(student_id=current_user_id()).order_by(Enquiry.id.desc()).all()
    return jsonify(enquiries=[e.to_dict() for e in items])


@enquiries_bp.get("/received")
@roles_required("provider", "admin")
def received_enquiries():
    query = Enquiry.query.join(Listing, Enquiry.listing_id == Listing.id)
    if get_jwt().get("role") != "admin":
        query = query.filter(Listing.provider_id == current_user_id())
    items = query.order_by(Enquiry.id.desc()).all()
    return jsonify(enquiries=[e.to_dict(include_student=True) for e in items])


@enquiries_bp.patch("/<int:enquiry_id>")
@roles_required("provider", "admin")
def respond(enquiry_id):
    enquiry = db.session.get(Enquiry, enquiry_id)
    if not enquiry:
        return jsonify(error="Enquiry not found."), 404
    if not owns(enquiry):
        return jsonify(error="You can only respond to enquiries on your own listings."), 403

    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in ("approved", "declined"):
        return jsonify(error="Status must be 'approved' or 'declined'."), 400
    if enquiry.status != "pending":
        return jsonify(error=f"This enquiry was already {enquiry.status}."), 409

    enquiry.status = status
    enquiry.provider_note = (data.get("providerNote") or "").strip()[:500]
    db.session.commit()
    return jsonify(enquiry=enquiry.to_dict(include_student=True))


@enquiries_bp.post("/<int:enquiry_id>/cancel")
@roles_required("student")
def cancel(enquiry_id):
    enquiry = db.session.get(Enquiry, enquiry_id)
    if not enquiry or enquiry.student_id != current_user_id():
        return jsonify(error="Enquiry not found."), 404
    if enquiry.status != "pending":
        return jsonify(error=f"This enquiry was already {enquiry.status}."), 409

    enquiry.status = "cancelled"
    db.session.commit()
    return jsonify(enquiry=enquiry.to_dict())
