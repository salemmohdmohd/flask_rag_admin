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

    root = logging.getLogger()
    root.setLevel(level)

    # Clear default handlers to avoid duplicate logs
    root.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    if json_enabled:
        handler.setFormatter(JsonFormatter())
    else:
        # key=value style to make extra fields readable
        formatter = KeyValueFormatter(
            fmt=(
                "%(asctime)s level=%(levelname)s logger=%(name)s "
                "msg='%(message)s' method=%(method)s path=%(path)s status=%(status)s "
                "duration_ms=%(duration_ms)s ip=%(ip)s user_id=%(user_id)s request_id=%(request_id)s"
            ),
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
        handler.setFormatter(formatter)
    root.addHandler(handler)

    # Control Werkzeug access logs
    wlog = logging.getLogger("werkzeug")
    if log_werkzeug:
        wlog.setLevel(level)
    else:
        wlog.setLevel(logging.WARNING)
