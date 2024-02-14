PROFILE_KEY = "sxplr-session-uuid"
ERROR_KEY = "sxplr-error"

COOKIE_KWARGS = {
    "httponly": True,
    "samesite": "strict",
}

EBRAINS_IAM_DISCOVERY_URL = "https://iam.ebrains.eu/auth/realms/hbp"

SCOPES =  [
  'openid',
  'email',
  'profile',
  'collab.drive',
  "team"
]

DATA_ERROR_ATTR = "data-error"

OVERWRITE_SAPI_ENDPOINT_ATTR = "x-sapi-base-url"

OVERWRITE_SPATIAL_BACKEND_ATTR = "x-spatial-backend-url"
