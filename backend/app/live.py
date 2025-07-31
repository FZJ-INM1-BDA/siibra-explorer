from fastapi.routing import APIRouter
from fastapi.requests import Request
from fastapi.responses import PlainTextResponse

from app.config import PATH_TO_IP_DB

router = APIRouter()

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