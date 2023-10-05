from fastapi import APIRouter, Request
from fastapi.responses import Response, JSONResponse, RedirectResponse
from fastapi.exceptions import HTTPException
from authlib.integrations.requests_client import OAuth2Session
import requests
import json
from typing import Union, Dict, Optional, Any
import time
from io import StringIO
from pydantic import BaseModel

from .config import SXPLR_EBRAINS_IAM_SA_CLIENT_ID, SXPLR_EBRAINS_IAM_SA_CLIENT_SECRET, SXPLR_BUCKET_NAME, HOST_PATHNAME
from .const import EBRAINS_IAM_DISCOVERY_URL
from ._store import DataproxyStore
from .user import get_user

router = APIRouter()

endpoint = "https://data-proxy.ebrains.eu/api/v1/buckets/{bucket_name}/{object_name}"

vip_routes = [
    "human",
    "monkey",
    "rat",
    "mouse"
]


class SaneUrlDPStore(DataproxyStore):
    class AlreadyExists(Exception): ...
    class NotWritable(IOError): ...

    @staticmethod
    def GetTimeMs() -> int:
        return round(time.time()*1e3)
    
    @staticmethod
    def TransformKeyToObjName(key: str):
        return f"saneUrl/{key}.json"
    
    writable = False

    def __init__(self, expiry_s=3 * 24 * 60 * 60):
        if not (SXPLR_EBRAINS_IAM_SA_CLIENT_ID and SXPLR_EBRAINS_IAM_SA_CLIENT_SECRET):
            super().__init__(None, SXPLR_BUCKET_NAME)
            return
        resp = requests.get(f"{EBRAINS_IAM_DISCOVERY_URL}/.well-known/openid-configuration")
        resp.raise_for_status()
        resp_json = resp.json()
        assert "token_endpoint" in resp_json, f"authorization_endpoint must be in openid configuration"
        self._token_endpoint: str = resp_json["token_endpoint"]

        scopes=["openid", "team", "roles", "group"]
        oauth2_session = OAuth2Session(SXPLR_EBRAINS_IAM_SA_CLIENT_ID,
                                       SXPLR_EBRAINS_IAM_SA_CLIENT_SECRET,
                                       scope=" ".join(scopes))
        self.session = oauth2_session
        self.expiry_s: float = expiry_s
        self.token_expires_at: float = None
        self.token: str = None
        self._refresh_token()

        super().__init__(self.token, SXPLR_BUCKET_NAME)
        self.writable = True
    
    def _refresh_token(self):
        token_dict = self.session.fetch_token(self._token_endpoint, grant_type="client_credentials")
        self.token_expires_at = token_dict.get("expires_at")
        self.token = token_dict.get("access_token")
        
    def _get_bucket(self):
        token_expired = (self.token_expires_at - time.time()) < 30
        if token_expired:
            self._refresh_token()
        
        self.update_token(self.token)
        return super()._get_bucket()
    
    def _prepare_aux(self, request: Optional[Request]=None):
        user = get_user(request) if request else None
        return {
            "userId": user.get("id") if user else None,
            "expiry": None if user else SaneUrlDPStore.GetTimeMs() + (self.expiry_s * 1e3)
        }

    def get(self, key: str):
        try:
            object_name = SaneUrlDPStore.TransformKeyToObjName(key)
            resp = super().get(object_name)
            resp_content = json.loads(resp)
            expiry = resp_content.get("expiry")
            if expiry is not None and SaneUrlDPStore.GetTimeMs() > expiry:
                self.delete(key)
                raise SaneUrlDPStore.NotFound("expired")
            return resp_content.get("value")
        except SaneUrlDPStore.NotFound as e:
            raise e from e
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                raise SaneUrlDPStore.NotFound(str(e)) from e
            raise SaneUrlDPStore.GenericException(str(e)) from e
        except Exception as e:
            raise SaneUrlDPStore.GenericException(str(e)) from e

    def set(self, key: str, value: Union[str, Dict], request: Optional[Request]=None):
        if not self.writable:
            raise SaneUrlDPStore.NotWritable
        object_name = SaneUrlDPStore.TransformKeyToObjName(key)
        try:
            super().get(object_name)
            raise SaneUrlDPStore.AlreadyExists
        except SaneUrlDPStore.NotFound as e:
            pass

        bucket = self._get_bucket()

        sio = StringIO()
        json.dump({
            "value": value,
            **self._prepare_aux(request)
        }, fp=sio)
        sio.seek(0)
        bucket.upload(sio, object_name)

    def delete(self, key: str):
        object_name = SaneUrlDPStore.TransformKeyToObjName(key)
        content = super().get(object_name)

        curr = SaneUrlDPStore.GetTimeMs()
        super().set(f"deleted/{object_name}.{curr}", content)

        super().delete(object_name)

data_proxy_store = SaneUrlDPStore()

@router.get("/{short_id:str}")
async def get_short(short_id:str, request: Request):
    try:
        existing_json: Dict[str, Any] = data_proxy_store.get(short_id)
        accept = request.headers.get("Accept", "")
        if "text/html" in accept:
            hashed_path = existing_json.get("hashPath")
            extra_routes = []
            for key in existing_json:
                if key.startswith("x-"):
                    extra_routes.append(f"{key}:{short_id}")
                    continue

            extra_routes_str = "" if len(extra_routes) == 0 else ("/" + "/".join(extra_routes))

            return RedirectResponse(f"{HOST_PATHNAME}/#{hashed_path}{extra_routes_str}")
        return JSONResponse(existing_json)
    except DataproxyStore.NotFound as e:
        raise HTTPException(404, str(e))
    except DataproxyStore.GenericException as e:
        raise HTTPException(500, str(e))


class SaneUrlModel(BaseModel):
    ver: str
    hashPath: str # camel case for backwards compat


@router.post("/{short_id:str}")
async def post_short(short_id: str, saneurl: SaneUrlModel):
    try:
        data_proxy_store.set(short_id, saneurl.model_dump())
        return Response(status_code=201)
    except Exception as e:
        raise HTTPException(500, str(e))
