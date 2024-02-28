from fastapi import APIRouter, Request
from pathlib import Path
from fastapi.responses import Response
from typing import Dict
from .const import ERROR_KEY, DATA_ERROR_ATTR, OVERWRITE_SAPI_ENDPOINT_ATTR, COOKIE_KWARGS, OVERWRITE_SPATIAL_BACKEND_ATTR, OVERWRITE_EXPERIMENTAL_FLAG_ATTR
from .config import PATH_TO_PUBLIC, OVERWRITE_API_ENDPOINT, OVERWRITE_SPATIAL_ENDPOINT, EXPERIMENTAL_FLAG

path_to_index = Path(PATH_TO_PUBLIC) / "index.html"
index_html: str = None

router = APIRouter()

def _monkey_sanitize(value: str):
    return value.replace('"', "&quote;")

@router.get("/")
@router.get("/index.html")
async def get_index_html(request: Request):

    global index_html
    if index_html is None:
        with open(path_to_index, "r") as fp:
            index_html = fp.read()
    
    # TODO: LOCAL_CDN not yet ported over
    error = None
    attributes_to_append: Dict[str, str] = {}
    if ERROR_KEY in request.session:
        error = request.session[ERROR_KEY]
        attributes_to_append[DATA_ERROR_ATTR] = error
    
    if OVERWRITE_API_ENDPOINT:
        attributes_to_append[OVERWRITE_SAPI_ENDPOINT_ATTR] = OVERWRITE_API_ENDPOINT
    
    if OVERWRITE_SPATIAL_ENDPOINT:
        attributes_to_append[OVERWRITE_SPATIAL_BACKEND_ATTR] = OVERWRITE_SPATIAL_ENDPOINT

    if EXPERIMENTAL_FLAG:
        attributes_to_append[OVERWRITE_EXPERIMENTAL_FLAG_ATTR] = EXPERIMENTAL_FLAG

    attr_string = " ".join([f"{key}={_monkey_sanitize(value)}" for key, value in attributes_to_append.items()])

    resp_string = index_html.replace("<atlas-viewer>", f"<atlas-viewer {attr_string}>")
    
    resp = Response(resp_string, headers={
        "content-type": "text/html; charset=utf-8"
    })
    if ERROR_KEY in request.session:
        resp.delete_cookie(ERROR_KEY, **COOKIE_KWARGS)
    return resp
