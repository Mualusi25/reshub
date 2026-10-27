import click
from .extensions import db
from .models import User, Listing


def register_commands(app):
    @app.cli.command("seed")
    def seed():
        """Create demo users and listings (only on an empty database)."""
        if User.query.first():
            click.echo("Database already has data, skipping.")
            return

        admin = User(
            full_name="ResHub Admin",
            email="admin@reshub.co.za",
            role="admin",
        )
        admin.set_password("Admin@1234")

        provider = User(
            full_name="Demo Provider",
            email="provider@reshub.co.za",
            role="provider",
        )
        provider.set_password("Provider@1234")

        student = User(
            full_name="Demo Student",
            email="student@reshub.co.za",
            role="student",
        )
        student.set_password("Student@1234")

        db.session.add_all([admin, provider, student])
        db.session.flush()

        UP, UNISA, TUT = (
            "University of Pretoria",
            "University of South Africa",
            "Tshwane University of Technology",
        )

        rows = [
            ("Sunrise Apartments", 4500, 0.8, "Hatfield", UP, 4.5, 28, "limited"),
            ("Campus View Residence", 3800, 1.2, "Arcadia", UP, 4.3, 18, "available"),
            ("Maple House", 4200, 0.5, "Hatfield", UP, 4.6, 32, "booked"),
            ("Urban Nest", 3600, 1.5, "Pretoria Central", TUT, 4.2, 12, "available"),
            ("Greenfield Studios", 5200, 0.9, "Brooklyn", UP, 4.7, 41, "available"),
            ("Hillcrest Lodge", 2900, 2.1, "Sunnyside", UNISA, 4.0, 9, "available"),
        ]

        for name, price, distance, area, campus, rating, reviews, status in rows:
            db.session.add(
                Listing(
                    name=name,
                    price=price,
                    distance=distance,
                    area=area,
                    campus=campus,
                    rating=rating,
                    reviews=reviews,
                    status=status,
                    provider_id=provider.id,
                )
            )

        # Mark the demo accounts as email-verified before committing.
        for user in (admin, provider, student):
            user.email_verified = True

        db.session.commit()

        click.echo("Seeded. Demo logins (change these!):")
        click.echo("  admin@reshub.co.za    / Admin@1234")
        click.echo("  provider@reshub.co.za / Provider@1234")
        click.echo("  student@reshub.co.za  / Student@1234")