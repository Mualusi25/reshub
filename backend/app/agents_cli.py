import re
import click
from .extensions import db
from .models import User


def _create_user(role, name, email, password):
    email = email.strip().lower()
    if not re.match(r"^\S+@\S+\.\S+$", email):
        raise click.ClickException("Enter a valid email address.")
    if len(password) < 8:
        raise click.ClickException("Password must be at least 8 characters.")
    if User.query.filter_by(email=email).first():
        raise click.ClickException("A user with that email already exists.")

    user = User(full_name=name.strip(), email=email, role=role, email_verified=True)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    click.echo(f"{role.capitalize()} created: {email}")


def register_agent_commands(app):
    @app.cli.command("create-agent")
    @click.option("--name", prompt="Full name")
    @click.option("--email", prompt="Email")
    @click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True)
    def create_agent(name, email, password):
        """Create a support agent account."""
        _create_user("agent", name, email, password)

    @app.cli.command("create-admin")
    @click.option("--name", prompt="Full name")
    @click.option("--email", prompt="Email")
    @click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True)
    def create_admin(name, email, password):
        """Create an administrator account."""
        _create_user("admin", name, email, password)

    @app.cli.command("set-password")
    @click.option("--email", prompt="Account email")
    @click.option("--password", prompt="New password", hide_input=True, confirmation_prompt=True)
    def set_password(email, password):
        """Set a new password for an existing account."""
        if len(password) < 8:
            raise click.ClickException("Password must be at least 8 characters.")
        user = User.query.filter_by(email=email.strip().lower()).first()
        if not user:
            raise click.ClickException("No account with that email in this database.")
        user.set_password(password)
        db.session.commit()
        status = "active" if user.is_active else "SUSPENDED"
        click.echo(f"Password updated for {user.email} (role: {user.role}, {status}).")