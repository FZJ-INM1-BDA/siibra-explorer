from fastapi import Request
from fastapi.routing import APIRouter
from fastapi.responses import Response
import requests

"""This module showcase an example on how an ad-hoc proxy can be setup, in order to test resources that are normally not accessible (requiring an auth header, for example)"""

router = APIRouter()

TOKEN = "ey.."

path_ = "https://data-proxy.ebrains.eu/api/v1/buckets/{bucket}/{filename}?redirect=False"

bucket = "foobar"

sess = requests.Session()

@router.get("/{path_proxy:path}")
def proxy(path_proxy: str, request:Request):
    
    url = path_.format(filename=path_proxy, bucket=bucket)
    resp = sess.get(url, headers={
        "Authorization": f"Bearer {TOKEN}"
    })
    json_obj = resp.json()
    tmp_url = json_obj.get("url")
    resp = sess.get(tmp_url, headers=request.headers)
    resp.raise_for_status()
    
    if path_proxy.endswith("info"):
        return resp.json()
    return Response(resp.content, 200)
