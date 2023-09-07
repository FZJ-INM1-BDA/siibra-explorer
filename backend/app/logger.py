import logging
from logging.handlers import TimedRotatingFileHandler
from .config import LOGGER_DIR

main_logger = logging.getLogger(__name__)
main_logger.setLevel(logging.INFO)

logger = logging.getLogger(__name__ + ".info")
access_logger = logging.getLogger(__name__ + ".access_log")
ch = logging.StreamHandler()

formatter = logging.Formatter("[%(name)s:%(levelname)s]  %(message)s")
ch.setFormatter(formatter)
logger.addHandler(ch)
logger.setLevel("INFO")


log_dir = LOGGER_DIR

if log_dir:
    log_dir += "" if log_dir.endswith("/") else "/"

if log_dir:
    import socket
    filename = log_dir + f"{socket.gethostname()}.access.log"
    access_log_handler = TimedRotatingFileHandler(filename, when="d", encoding="utf-8")
else:
    access_log_handler = logging.StreamHandler()

access_format = logging.Formatter("%(asctime)s - %(resp_status)s - %(process_time_ms)sms - %(hit_cache)s - %(message)s")
access_log_handler.setFormatter(access_format)
access_log_handler.setLevel(logging.INFO)
access_logger.addHandler(access_log_handler)


if log_dir:
    import socket
    filename = log_dir + f"{socket.gethostname()}.general.log"
    warn_fh = TimedRotatingFileHandler(filename, when="d", encoding="utf-8")
    warn_fh.setLevel(logging.INFO)
    warn_fh.setFormatter(formatter)
    logger.addHandler(warn_fh)
