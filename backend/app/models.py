from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from .extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="student")  # student | provider | admin
    is_active = db.Column(db.Boolean, nullable=False, default=True, server_default=db.text("true"))
        # Email verification. server_default=true means accounts that already existed when this
    # was added count as verified; the register route creates new sign-ups as unverified.
    email_verified = db.Column(db.Boolean, nullable=False, default=False, server_default=db.text("true"))
    verification_version = db.Column(db.Integer, nullable=False, default=0, server_default="0")
    verification_sent_at = db.Column(db.DateTime, nullable=True)
    is_verified = db.Column(db.Boolean, nullable=False, default=False, server_default=db.text("false"))
    created_at = db.Column(db.DateTime, default=utcnow)

    listings = db.relationship("Listing", backref="provider", lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "fullName": self.full_name,
            "email": self.email,
            "role": self.role,
            "isVerified": self.is_verified,
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class Listing(db.Model):
    __tablename__ = "listings"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    description = db.Column(db.Text, default="")
    price = db.Column(db.Integer, nullable=False)          # rand per month
    distance = db.Column(db.Float, nullable=False)         # km from campus
    area = db.Column(db.String(120), nullable=False)
    campus = db.Column(db.String(160), nullable=False)
    rating = db.Column(db.Float, default=0)
    reviews = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default="available")  # available | limited | booked
    is_verified = db.Column(db.Boolean, nullable=False, default=False, server_default=db.text("false"))
    image_url = db.Column(db.String(500), default="")
    images = db.Column(db.JSON, nullable=True)  # photo URLs; the first is the cover
    provider_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow)

    def photos(self):
        """Photo URLs, cover first. Falls back to the old single image_url."""
        return list(self.images or ([self.image_url] if self.image_url else []))

    @property
    def is_public(self):
        """Visible to students: verified, and the provider account is active."""
        return bool(self.is_verified and self.provider and self.provider.is_active)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": self.price,
            "distance": self.distance,
            "area": self.area,
            "campus": self.campus,
            "rating": self.rating,
            "reviews": self.reviews,
            "status": self.status,
            "imageUrl": self.image_url,
            "images": self.photos(),
            "providerId": self.provider_id,
            "isVerified": self.is_verified,
            "providerName": self.provider.full_name if self.provider else None,
            "providerVerified": bool(self.provider and self.provider.is_verified),
        }


class ContactMessage(db.Model):
    __tablename__ = "contact_messages"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, nullable=False, default=False, server_default=db.text("false"))
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "message": self.message,
            "isRead": self.is_read,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class SavedListing(db.Model):
    __tablename__ = "saved_listings"
    __table_args__ = (db.UniqueConstraint("user_id", "listing_id", name="uq_saved_user_listing"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    listing_id = db.Column(db.Integer, db.ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=utcnow)

    listing = db.relationship("Listing")


class Enquiry(db.Model):
    __tablename__ = "enquiries"

    id = db.Column(db.Integer, primary_key=True)
    listing_id = db.Column(db.Integer, db.ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    message = db.Column(db.Text, nullable=False)
    move_in_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending")  # pending | approved | declined | cancelled
    provider_note = db.Column(db.String(500), default="")
    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    listing = db.relationship("Listing")
    student = db.relationship("User")

    def to_dict(self, include_student=False):
        data = {
            "id": self.id,
            "listingId": self.listing_id,
            "listing": {
                "id": self.listing.id,
                "name": self.listing.name,
                "area": self.listing.area,
                "price": self.listing.price,
            } if self.listing else None,
            "message": self.message,
            "moveInDate": self.move_in_date.isoformat() if self.move_in_date else None,
            "status": self.status,
            "providerNote": self.provider_note or "",
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
        if include_student and self.student:
            data["student"] = {"fullName": self.student.full_name, "email": self.student.email}
        return data


def iso_utc(dt):
    """ISO string the browser reads as UTC (so times show correctly in local time)."""
    if not dt:
        return None
    return dt.isoformat() + ("" if dt.tzinfo else "Z")


class Conversation(db.Model):
    __tablename__ = "conversations"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    agent_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = db.Column(db.String(20), nullable=False, default="open")  # open | closed
    student_last_read_id = db.Column(db.Integer, nullable=False, default=0, server_default="0")
    agent_last_read_id = db.Column(db.Integer, nullable=False, default=0, server_default="0")
    created_at = db.Column(db.DateTime, default=utcnow)
    last_message_at = db.Column(db.DateTime, default=utcnow, index=True)

    student = db.relationship("User", foreign_keys=[student_id])
    agent = db.relationship("User", foreign_keys=[agent_id])
    messages = db.relationship("ChatMessage", cascade="all, delete-orphan", passive_deletes=True)


class ChatMessage(db.Model):
    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(
        db.Integer, db.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    sender_role = db.Column(db.String(20), nullable=False)  # student | agent
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    sender = db.relationship("User", foreign_keys=[sender_id])

    def to_dict(self):
        return {
            "id": self.id,
            "senderRole": self.sender_role,
            "senderName": self.sender.full_name if self.sender else "ResHub",
            "body": self.body,
            "createdAt": iso_utc(self.created_at),
        }


class UploadedImage(db.Model):
    __tablename__ = "uploaded_images"

    id = db.Column(db.String(40), primary_key=True)  # random hex id used in the URL
    content_type = db.Column(db.String(50), nullable=False)
    data = db.Column(db.LargeBinary, nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)
