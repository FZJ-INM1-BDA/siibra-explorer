import os

SESSION_SECRET = os.getenv("SESSION_SECRET", "hey joline, remind me to set a more secure session secret")

HOST_PATHNAME = os.getenv("HOST_PATHNAME", "")

OVERWRITE_API_ENDPOINT = os.getenv("OVERWRITE_API_ENDPOINT")

OVERWRITE_SPATIAL_ENDPOINT = os.getenv("OVERWRITE_SPATIAL_ENDPOINT")

LOCAL_CDN = os.getenv("LOCAL_CDN")

HBP_CLIENTID_V2 = os.getenv("HBP_CLIENTID_V2", "no hbp id")
HBP_CLIENTSECRET_V2 = os.getenv("HBP_CLIENTSECRET_V2", "no hbp client secret")

BUILD_TEXT = os.getenv("BUILD_TEXT", "")

# REDIS env var

REDIS_ADDR = os.getenv("REDIS_ADDR") or os.getenv("REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_ADDR") or "localhost"
REDIS_PORT = os.getenv("REDIS_PORT") or os.getenv("REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_PORT") or "6379"
REDIS_USERNAME = os.getenv("REDIS_USERNAME")
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")

V2_7_PLUGIN_URLS = os.getenv("V2_7_PLUGIN_URLS", "")
V2_7_STAGING_PLUGIN_URLS = os.getenv("V2_7_STAGING_PLUGIN_URLS", "")

SXPLR_EBRAINS_IAM_SA_CLIENT_ID = os.getenv("SXPLR_EBRAINS_IAM_SA_CLIENT_ID")
SXPLR_EBRAINS_IAM_SA_CLIENT_SECRET = os.getenv("SXPLR_EBRAINS_IAM_SA_CLIENT_SECRET")

SXPLR_BUCKET_NAME = os.getenv("SXPLR_BUCKET_NAME", "interactive-atlas-viewer")

LOGGER_DIR = os.getenv("LOGGER_DIR")

PATH_TO_PUBLIC = os.getenv("PATH_TO_PUBLIC", "../dist/aot")

BUILD_HASH = os.getenv("BUILD_HASH", "devbuild")

ENABLE_PROXY = os.getenv("ENABLE_PROXY")

ENABLE_CORS = os.getenv("ENABLE_CORS")

PATH_TO_IP_DB = os.getenv("PATH_TO_IP_DB")

INCIDENTS_ENDPOINT = os.getenv("INCIDENTS_ENDPOINT", "https://raw.githubusercontent.com/FZJ-INM1-BDA/siibra-infrastructure-incidents/refs/heads/main/incidents.json")
