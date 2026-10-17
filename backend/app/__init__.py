from flask import Flask, jsonify
from config import Config
from .extensions import db, jwt, cors, migrate


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db, render_as_batch=True)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    from . import models  # noqa: F401
    from .routes.auth import auth_bp
    from .routes.listings import listings_bp
    from .routes.contact import contact_bp
    from .routes.saved import saved_bp
    from .routes.enquiries import enquiries_bp
    from .routes.uploads import uploads_bp
    from .routes.admin import admin_bp
    from .routes.chat import chat_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(listings_bp, url_prefix="/api/listings")
    app.register_blueprint(contact_bp, url_prefix="/api/contact")
    app.register_blueprint(saved_bp, url_prefix="/api/saved")
    app.register_blueprint(enquiries_bp, url_prefix="/api/enquiries")
    app.register_blueprint(uploads_bp, url_prefix="/api/uploads")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")

    @app.get("/")
    def index():
        return jsonify(name="ResHub API", status="running", docs="Try /api/health or /api/listings")

    @app.get("/api/health")
    def health():
        return jsonify(status="ok")

    @app.errorhandler(404)
    def not_found(_):
        return jsonify(error="Not found."), 404

    @app.errorhandler(405)
    def method_not_allowed(_):
        return jsonify(error="Method not allowed."), 405

    @jwt.unauthorized_loader
    def missing_token(_):
        return jsonify(error="Authentication required."), 401

    @jwt.invalid_token_loader
    def bad_token(_):
        return jsonify(error="Invalid token."), 401

    @jwt.expired_token_loader
    def expired_token(_header, _payload):
        return jsonify(error="Session expired. Please sign in again."), 401

    from .seed import register_commands
    from .agents_cli import register_agent_commands

    register_commands(app)
    register_agent_commands(app)

    return app
