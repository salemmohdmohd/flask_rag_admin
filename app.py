import os
import click
from backend import create_app


def main():
    app = create_app()
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_PORT", "5000"))
    debug = os.getenv("FLASK_ENV", "development") == "development"

    # This check ensures the startup message is printed only by the reloader's main process
    if debug and os.getenv("WERKZEUG_RUN_MAIN") == "true":
        click.echo(click.style("=" * 40, fg="cyan"))
        click.echo(click.style("🚀 Backend server is ready!", fg="cyan", bold=True))
        click.echo(f"   - Mode: {'Debug' if debug else 'Production'}")
        click.echo(f"   - Listening on: http://{host}:{port}")
        click.echo(click.style("=" * 40, fg="cyan"))

    app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    main()
