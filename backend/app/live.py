import json
import datetime

from fastapi.routing import APIRouter
from fastapi.requests import Request
from fastapi.responses import PlainTextResponse, JSONResponse
import requests

from app.config import PATH_TO_IP_DB, INCIDENTS_ENDPOINT
from app._store import RedisEphStore

router = APIRouter()

_store = RedisEphStore.Ephemeral()
STORAGE_KEY = "SERVER_MESSAGE_KEY"
TTL = 60 * 10 # check once every 10 minute

@router.get("/geolocation")
def geolocation(request: Request):
    if not PATH_TO_IP_DB:
        return PlainTextResponse("Not configured to decode IP", 501)
    
    import geoip2.database as ip_db
    host_ip = request.client.host
    print(request.client.host)
    with ip_db.Reader(PATH_TO_IP_DB) as reader:
        c = reader.country(host_ip)
    _dict = c.to_dict()
    _dict.pop("traits", None)
    return _dict

@router.get("/messages")
def messages():
    cached_svmsg_str = _store.get(STORAGE_KEY)
    currenttime = datetime.datetime.now()

    if cached_svmsg_str:
        cached_server_message = json.loads(cached_svmsg_str)
        if cached_server_message.get("exp") > currenttime.timestamp():
            return cached_server_message.get("payload")

    resp = requests.get(INCIDENTS_ENDPOINT)
    resp.raise_for_status()
    payload = resp.json()
    svmsg_str = json.dumps({
        "exp": currenttime.timestamp() + TTL,
        "payload": payload
    })
    _store.set(STORAGE_KEY, svmsg_str)
    return JSONResponse(payload, headers={
        "cache-control": f"public, max-age={TTL}"
    })
