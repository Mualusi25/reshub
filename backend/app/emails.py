import logging
import smtplib
import threading
from email.message import EmailMessage

from flask import current_app

log = logging.getLogger("reshub.mail")


def _first(name):
    return (name or "").split(" ")[0] or "there"


def _deliver(settings, message):
    """Runs in a background thread. Email problems must never break a request."""
    try:
        if not settings["server"]:
            print(
                "\n--- EMAIL (console mode: MAIL_SERVER is not set) ---\n"
                f"To: {message['To']}\nSubject: {message['Subject']}\n\n"
                f"{message.get_content()}"
                "--- END EMAIL ---\n",
                flush=True,
            )
            return
        with smtplib.SMTP(settings["server"], settings["port"], timeout=15) as smtp:
            if settings["use_tls"]:
                smtp.starttls()
            if settings["username"]:
                smtp.login(settings["username"], settings["password"])
            smtp.send_message(message)
    except Exception as exc:
        log.warning("Could not send email to %s: %s", message["To"], exc)


def send_email(to, subject, body):
    if not to:
        return
    cfg = current_app.config
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = cfg["MAIL_FROM"]
    message["To"] = to
    message.set_content(body)
    settings = {
        "server": cfg["MAIL_SERVER"],
        "port": cfg["MAIL_PORT"],
        "username": cfg["MAIL_USERNAME"],
        "password": cfg["MAIL_PASSWORD"],
        "use_tls": cfg["MAIL_USE_TLS"],
    }
    threading.Thread(target=_deliver, args=(settings, message), daemon=True).start()


def notify_new_enquiry(enquiry):
    """Email the provider when a student requests a viewing."""
    listing = enquiry.listing
    provider = listing.provider
    student = enquiry.student
    if not provider:
        return
    link = f"{current_app.config['FRONTEND_URL']}/provider"
    send_email(
        provider.email,
        f"New viewing request for {listing.name}",
        f"Hi {_first(provider.full_name)},\n\n"
        f"{student.full_name} has asked to view {listing.name}.\n\n"
        f"Preferred move-in date: {enquiry.move_in_date:%d %B %Y}\n"
        f"Student email: {student.email}\n\n"
        f"Their message:\n{enquiry.message}\n\n"
        f"Approve or decline the request here:\n{link}\n\n"
        "The ResHub team\n",
    )


def notify_enquiry_response(enquiry):
    """Email the student when a provider approves or declines."""
    listing = enquiry.listing
    student = enquiry.student
    provider = listing.provider
    approved = enquiry.status == "approved"
    base = current_app.config["FRONTEND_URL"]

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
