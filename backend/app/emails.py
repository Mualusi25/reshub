import json
import logging
import os
import smtplib
import threading
import urllib.request
from email.message import EmailMessage
from email.utils import parseaddr

from flask import current_app

log = logging.getLogger("reshub.mail")


def _cfg(name, default=""):
    return current_app.config.get(name, default)


def _base_url():
    return str(_cfg("FRONTEND_URL", "http://localhost:5173")).rstrip("/")


def _first(name):
    return (name or "").split(" ")[0] or "there"


def _send_via_brevo(settings, to, subject, body):
    """Send over HTTPS with Brevo's transactional email API (works where SMTP is blocked)."""
    name, address = parseaddr(settings["from"])
    payload = json.dumps(
        {
            "sender": {"name": name or "ResHub", "email": address},
            "to": [{"email": to}],
            "subject": subject,
            "textContent": body,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=payload,
        method="POST",
        headers={
            "api-key": settings["brevo_key"],
            "content-type": "application/json",
            "accept": "application/json",
            "user-agent": "reshub/1.0",
        },
    )
    with urllib.request.urlopen(request, timeout=15):
        pass


def _send_via_smtp(settings, to, subject, body):
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings["from"]
    message["To"] = to
    message.set_content(body)
    with smtplib.SMTP(settings["server"], settings["port"], timeout=15) as smtp:
        if settings["use_tls"]:
            smtp.starttls()
        if settings["username"]:
            smtp.login(settings["username"], settings["password"])
        smtp.send_message(message)


def _deliver(settings, to, subject, body):
    """Deliver one email. Returns True on success and never raises."""
    try:
        if settings["brevo_key"]:
            _send_via_brevo(settings, to, subject, body)
        elif settings["server"]:
            _send_via_smtp(settings, to, subject, body)
        else:
            print(
                "\n--- EMAIL (console mode: no mail provider configured) ---\n"
                f"To: {to}\nSubject: {subject}\n\n{body}\n--- END EMAIL ---\n",
                flush=True,
            )
        return True
    except Exception as exc:
        detail = ""
        if hasattr(exc, "read"):
            try:
                detail = exc.read().decode("utf-8", "replace")[:300]
            except Exception:
                pass
        log.warning("Could not send email to %s: %s %s", to, exc, detail)
        return False


def send_email(to, subject, body, wait=False):
    """Send an email. wait=True blocks and returns success; otherwise it runs in the background."""
    if not to:
        return False
    settings = {
        "brevo_key": os.getenv("BREVO_API_KEY", "").strip(),
        "from": _cfg("MAIL_FROM", "ResHub <no-reply@reshub.co.za>"),
        "server": _cfg("MAIL_SERVER", ""),
        "port": _cfg("MAIL_PORT", 587),
        "username": _cfg("MAIL_USERNAME", ""),
        "password": _cfg("MAIL_PASSWORD", ""),
        "use_tls": _cfg("MAIL_USE_TLS", True),
    }
    if wait:
        return _deliver(settings, to, subject, body)
    threading.Thread(target=_deliver, args=(settings, to, subject, body), daemon=True).start()
    return True


def send_verification_email(user, token):
    """Email the account-verification link. Returns True if it was handed off successfully."""
    link = f"{_base_url()}/verify-email?token={token}"
    return send_email(
        user.email,
        "Verify your ResHub email address",
        f"Hi {_first(user.full_name)},\n\n"
        "Welcome to ResHub! Please confirm your email address to activate your account:\n\n"
        f"{link}\n\n"
        "This link works for 24 hours. If you did not create a ResHub account, you can ignore "
        "this email.\n\n"
        "The ResHub team\n",
        wait=True,
    )


def notify_new_enquiry(enquiry):
    """Email the provider when a student requests a viewing."""
    listing = enquiry.listing
    provider = listing.provider
    student = enquiry.student
    if not provider:
        return
    send_email(
        provider.email,
        f"New viewing request for {listing.name}",
        f"Hi {_first(provider.full_name)},\n\n"
        f"{student.full_name} has asked to view {listing.name}.\n\n"
        f"Preferred move-in date: {enquiry.move_in_date:%d %B %Y}\n"
        f"Student email: {student.email}\n\n"
        f"Their message:\n{enquiry.message}\n\n"
        f"Approve or decline the request here:\n{_base_url()}/provider\n\n"
        "The ResHub team\n",
    )


def notify_enquiry_response(enquiry):
    """Email the student when a provider approves or declines."""
    listing = enquiry.listing
    student = enquiry.student
    provider = listing.provider
    approved = enquiry.status == "approved"
    base = _base_url()

    lines = [
        f"Hi {_first(student.full_name)},",
        "",
        f"Your viewing request for {listing.name} was {'approved' if approved else 'declined'}.",
    ]
    if enquiry.provider_note:
        lines += ["", "Note from the provider:", enquiry.provider_note]
    if approved and provider:
        lines += [
            "",
            f"Contact the provider to arrange the viewing: {provider.full_name} <{provider.email}>",
        ]
    elif not approved:
        lines += ["", f"You can keep looking here: {base}/accommodation"]
    lines += ["", f"See all your enquiries: {base}/my-enquiries", "", "The ResHub team", ""]

    send_email(
        student.email,
        f"Your viewing request for {listing.name} was {'approved' if approved else 'declined'}",
        "\n".join(lines),
    )