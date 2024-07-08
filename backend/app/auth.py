from authlib.integrations.starlette_client import OAuth
from authlib.integrations.requests_client.oauth2_session import OAuth2Session
from authlib.oauth2.auth import OAuth2Token
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from uuid import uuid4
import json

from .const import EBRAINS_IAM_DISCOVERY_URL, SCOPES, PROFILE_KEY
from .config import HBP_CLIENTID_V2, HBP_CLIENTSECRET_V2, HOST_PATHNAME
from ._store import RedisEphStore

_store = RedisEphStore.Ephemeral()

oauth = OAuth()

oauth.register(
    name="ebrains",
    server_metadata_url=f"{EBRAINS_IAM_DISCOVERY_URL}/.well-known/openid-configuration",
    client_id=HBP_CLIENTID_V2,
    client_secret=HBP_CLIENTSECRET_V2,
    client_kwargs={
        "scope": " ".join(SCOPES),
    },
)

def process_ebrains_user(resp):
    userinfo = resp.get("userinfo")
    given_name = userinfo.get("given_name")
    family_name = userinfo.get("family_name")
    return {
        'id': f'hbp-oidc-v2:{userinfo.get("sub")}',
        'name': f'{given_name} {family_name}',
        'type': 'hbp-oidc-v2',
        'idToken': resp.get("id_token"),
        'accessToken': resp.get("access_token"),
    }

router = APIRouter()

@router.get("/hbp-oidc-v2/auth")
async def login_via_ebrains(request: Request, state: str = None):
    kwargs = {}
    if state:
        kwargs["state"] = state
    base_url = str(request.base_url).replace("http://", "https://", 1)
    redirect_uri = base_url.rstrip("/") + HOST_PATHNAME + "/hbp-oidc-v2/cb"
    return await oauth.ebrains.authorize_redirect(request, redirect_uri=redirect_uri, **kwargs)

@router.get("/hbp-oidc-v2/cb")
async def ebrains_callback(request: Request):
    if PROFILE_KEY not in request.session:
        request.session[PROFILE_KEY] = str(uuid4())
    token: OAuth2Token = await oauth.ebrains.authorize_access_token(request)
    _store.set(
        request.session[PROFILE_KEY],
        json.dumps(process_ebrains_user(token))
    )
    redirect = HOST_PATHNAME if HOST_PATHNAME else "/"
    return RedirectResponse(redirect)

@router.get("/logout")
def logout(request: Request):    
    _store.delete(
        request.session.pop(PROFILE_KEY, None)
    )
    return RedirectResponse(HOST_PATHNAME)
