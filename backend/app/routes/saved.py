from flask import Blueprint, jsonify
from ..extensions import db
from ..models import Listing, SavedListing
from ..utils import roles_required, current_user_id

saved_bp = Blueprint("saved", __name__)


@saved_bp.get("")
@roles_required("student")
def list_saved():
    rows = (
        SavedListing.query.filter_by(user_id=current_user_id())
        .order_by(SavedListing.id.desc())
        .all()
    )
    return jsonify(
        listings=[r.listing.to_dict() for r in rows],
        ids=[r.listing_id for r in rows],
    )


@saved_bp.post("/<int:listing_id>")
@roles_required("student")
def save_listing(listing_id):
    if not db.session.get(Listing, listing_id):
        return jsonify(error="Listing not found."), 404
    uid = current_user_id()
    if not SavedListing.query.filter_by(user_id=uid, listing_id=listing_id).first():
        db.session.add(SavedListing(user_id=uid, listing_id=listing_id))
        db.session.commit()
    return jsonify(saved=True), 201


@saved_bp.delete("/<int:listing_id>")
@roles_required("student")
def unsave_listing(listing_id):
    SavedListing.query.filter_by(user_id=current_user_id(), listing_id=listing_id).delete()
    db.session.commit()
    return jsonify(saved=False)
