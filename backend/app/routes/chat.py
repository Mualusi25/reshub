from flask import Blueprint, request, jsonify
from sqlalchemy import and_, exists
from sqlalchemy.exc import IntegrityError
from ..extensions import db
from ..models import ChatMessage, Conversation, User, iso_utc, utcnow
from ..utils import roles_required, current_user_id

chat_bp = Blueprint("chat", __name__)

MAX_LEN = 1000
HISTORY_LIMIT = 200


# ---------- helpers ----------

def read_body():
    data = request.get_json(silent=True) or {}
    body = str(data.get("body") or "").strip()
    if not body:
        return None, "Message cannot be empty."
    if len(body) > MAX_LEN:
        return None, f"Message is too long (max {MAX_LEN} characters)."
    return body, None


def fetch_messages(conv, after):
    """Messages newer than `after`; with after=0 the latest HISTORY_LIMIT messages."""
    query = ChatMessage.query.filter(ChatMessage.conversation_id == conv.id)
    if after > 0:
        rows = query.filter(ChatMessage.id > after).order_by(ChatMessage.id).all()
    else:
        rows = list(reversed(query.order_by(ChatMessage.id.desc()).limit(HISTORY_LIMIT).all()))
    return [m.to_dict() for m in rows]


def latest_id(conv):
    return (
        db.session.query(db.func.max(ChatMessage.id))
        .filter(ChatMessage.conversation_id == conv.id)
        .scalar()
        or 0
    )


def unread_for_student(conv):
    return ChatMessage.query.filter(
        ChatMessage.conversation_id == conv.id,
        ChatMessage.sender_role == "agent",
        ChatMessage.id > conv.student_last_read_id,
    ).count()


def unread_for_agent(conv):
    return ChatMessage.query.filter(
        ChatMessage.conversation_id == conv.id,
        ChatMessage.sender_role == "student",
        ChatMessage.id > conv.agent_last_read_id,
    ).count()


def student_view(conv):
    return {
        "id": conv.id,
        "status": conv.status,
        "agentName": conv.agent.full_name if conv.agent else None,
    }


def agent_view(conv):
    return {
        "id": conv.id,
        "status": conv.status,
        "student": {
            "id": conv.student.id,
            "fullName": conv.student.full_name,
            "email": conv.student.email,
        },
        "agentName": conv.agent.full_name if conv.agent else None,
        "unread": unread_for_agent(conv),
        "lastMessageAt": iso_utc(conv.last_message_at),
    }


# ---------- student side ----------

@chat_bp.get("/mine")
@roles_required("student")
def my_chat():
    conv = Conversation.query.filter_by(student_id=current_user_id()).first()
    if not conv:
        return jsonify(conversation=None, messages=[], unread=0)

    after = request.args.get("after", 0, type=int)
    messages = fetch_messages(conv, after)

    # The widget is open on screen: everything up to now counts as read
    if request.args.get("open") == "1":
        newest = latest_id(conv)
        if newest > conv.student_last_read_id:
            conv.student_last_read_id = newest
            db.session.commit()

    return jsonify(
        conversation=student_view(conv), messages=messages, unread=unread_for_student(conv)
    )


@chat_bp.post("/mine")
@roles_required("student")
def student_send():
    body, error = read_body()
    if error:
        return jsonify(error=error), 400

    uid = current_user_id()
    conv = Conversation.query.filter_by(student_id=uid).first()
    if not conv:
        conv = Conversation(student_id=uid)
        db.session.add(conv)
        try:
            db.session.flush()
        except IntegrityError:  # two first messages at once: use the one that won
            db.session.rollback()
            conv = Conversation.query.filter_by(student_id=uid).first()

    conv.status = "open"  # a new message reopens a resolved chat
    conv.last_message_at = utcnow()
    message = ChatMessage(conversation_id=conv.id, sender_id=uid, sender_role="student", body=body)
    db.session.add(message)
    db.session.commit()

    return jsonify(message=message.to_dict(), conversation=student_view(conv)), 201


# ---------- agent side ----------

@chat_bp.get("/summary")
@roles_required("agent", "admin")
def summary():
    unread = Conversation.query.filter(
        Conversation.status == "open",
        exists().where(
            and_(
                ChatMessage.conversation_id == Conversation.id,
                ChatMessage.sender_role == "student",
                ChatMessage.id > Conversation.agent_last_read_id,
            )
        ),
    ).count()
    return jsonify(unread=unread)


@chat_bp.get("/conversations")
@roles_required("agent", "admin")
def list_conversations():
    status = request.args.get("status", "open")
    q = request.args.get("q", "").strip()

    query = Conversation.query.join(User, Conversation.student_id == User.id)
    if status in ("open", "closed"):
        query = query.filter(Conversation.status == status)
    if q:
        like = f"%{q}%"
        query = query.filter(db.or_(User.full_name.ilike(like), User.email.ilike(like)))

    rows = query.order_by(Conversation.last_message_at.desc()).limit(100).all()

    out = []
    for conv in rows:
        item = agent_view(conv)
        last = (
            ChatMessage.query.filter_by(conversation_id=conv.id)
            .order_by(ChatMessage.id.desc())
            .first()
        )
        item["lastMessage"] = (
            {"body": last.body[:120], "senderRole": last.sender_role} if last else None
        )
        out.append(item)
    return jsonify(conversations=out)


@chat_bp.get("/conversations/<int:conv_id>")
@roles_required("agent", "admin")
def get_conversation(conv_id):
    conv = db.session.get(Conversation, conv_id)
    if not conv:
        return jsonify(error="Conversation not found."), 404

    after = request.args.get("after", 0, type=int)
    messages = fetch_messages(conv, after)

    # An agent is looking at this thread: mark everything read
    newest = latest_id(conv)
    if newest > conv.agent_last_read_id:
        conv.agent_last_read_id = newest
        db.session.commit()

    return jsonify(conversation=agent_view(conv), messages=messages)


@chat_bp.post("/conversations/<int:conv_id>/messages")
@roles_required("agent", "admin")
def agent_send(conv_id):
    conv = db.session.get(Conversation, conv_id)
    if not conv:
        return jsonify(error="Conversation not found."), 404

    body, error = read_body()
    if error:
        return jsonify(error=error), 400

    uid = current_user_id()
    if conv.agent_id is None:
        conv.agent_id = uid  # the first agent to reply handles the chat
    conv.status = "open"
    conv.last_message_at = utcnow()
    message = ChatMessage(conversation_id=conv.id, sender_id=uid, sender_role="agent", body=body)
    db.session.add(message)
    db.session.commit()

    return jsonify(message=message.to_dict(), conversation=agent_view(conv)), 201


@chat_bp.patch("/conversations/<int:conv_id>")
@roles_required("agent", "admin")
def update_conversation(conv_id):
    conv = db.session.get(Conversation, conv_id)
    if not conv:
        return jsonify(error="Conversation not found."), 404

    status = (request.get_json(silent=True) or {}).get("status")
    if status not in ("open", "closed"):
        return jsonify(error="Status must be 'open' or 'closed'."), 400

    conv.status = status
    db.session.commit()
    return jsonify(conversation=agent_view(conv))
