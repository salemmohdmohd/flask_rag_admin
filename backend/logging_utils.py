import logging
import json
import sys
from datetime import datetime


class JsonFormatter(logging.Formatter):
    def format(self, record):
        data = {
            "ts": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        # Include common extra fields when present
        for key in [
            "method",
            "path",
            "status",
            "duration_ms",
            "ip",
            "user_id",
            "request_id",
        ]:
            if hasattr(record, key):
                data[key] = getattr(record, key)
        if record.exc_info:
            data["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(data)


class KeyValueFormatter(logging.Formatter):
    missing_keys = [
        "method",
        "path",
        "status",
        "duration_ms",
        "ip",
        "user_id",
        "request_id",
    ]

    def format(self, record):
        for k in self.missing_keys:
            if not hasattr(record, k):
                setattr(record, k, "-")
        return super().format(record)


def configure_logging(app):
    level_name = app.config.get("LOG_LEVEL", "INFO").upper()
    json_enabled = str(app.config.get("LOG_JSON", "false")).lower() == "true"
    log_werkzeug = str(app.config.get("LOG_WERKZEUG", "false")).lower() == "true"

    level = getattr(logging, level_name, logging.INFO)

    # Define formatters
    if json_enabled:
        request_formatter = JsonFormatter()
        default_formatter = JsonFormatter()
    else:
        request_formatter = KeyValueFormatter(
            fmt=(
                "%(asctime)s level=%(levelname)-7s logger=%(name)-15s "
                "msg='%(message)s' method=%(method)s path=%(path)s status=%(status)s "
                "duration_ms=%(duration_ms)s ip=%(ip)s user_id=%(user_id)s request_id=%(request_id)s"
            ),
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
        default_formatter = logging.Formatter(
            fmt="%(asctime)s level=%(levelname)-7s logger=%(name)-15s msg='%(message)s'",
            datefmt="%Y-%m-%dT%H:%M:%S",
        )

    # Get root logger and clear existing handlers
    root = logging.getLogger()
    root.setLevel(level)
    root.handlers.clear()

    # Create a handler for stdout
    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setLevel(level)

    # Create a handler for stderr for ERROR level logs
    stderr_handler = logging.StreamHandler(sys.stderr)
    stderr_handler.setLevel(logging.ERROR)

    # Apply formatters to handlers
    stdout_handler.setFormatter(default_formatter)
    stderr_handler.setFormatter(default_formatter)

    # Add handlers to the root logger
    root.addHandler(stdout_handler)
    root.addHandler(stderr_handler)

    # Configure the 'request' logger to use the detailed formatter
    # and prevent it from propagating to the root logger to avoid duplicate logs.
    request_logger = logging.getLogger("request")
    request_logger.setLevel(level)
    request_logger.propagate = False
    request_handler = logging.StreamHandler(sys.stdout)
    request_handler.setFormatter(request_formatter)
    request_logger.addHandler(request_handler)

    # Control Werkzeug logs
    wlog = logging.getLogger("werkzeug")
    if log_werkzeug:
        wlog.setLevel(level)
    else:
        # Only show errors from Werkzeug by default
        wlog.setLevel(logging.ERROR)
