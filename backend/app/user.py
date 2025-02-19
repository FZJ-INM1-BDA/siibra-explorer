from starlette.requests import Request
from starlette.responses import Response
from fastapi import APIRouter
from functools import wraps
from inspect import iscoroutine

import json
from .const import PROFILE_KEY
from .auth import _store

class NotAuthenticatedEx(Exception): ...

def get_user_from_request(request: Request):
    if PROFILE_KEY not in request.session:
        return None
    
    profile_uuid = request.session[PROFILE_KEY]
    user = _store.get(profile_uuid)
    
    return json.loads(user) if user else None

no_cache_header = {
    "cache-control": "no-cache"
}

def is_authenticated(fn):

    not_authenticated_response = Response("Not authenticated", 401, headers=no_cache_header)

    @wraps(fn)
    async def async_wrapper(*args, request: Request, **kwargs):
        user = get_user_from_request(request)
        if not user:
            return not_authenticated_response
        request.state.user = user
        resp = await fn(*args, request=request, **kwargs)
        if not isinstance(resp, Response):
            return Response("is_authenticated did not return response", 500)
        resp.headers["cache-control"] = "no-cache"
        return resp

    @wraps(fn)
    def sync_wrapper(*args, request: Request, **kwargs):
        user = get_user_from_request(request)
        if not user:
            return not_authenticated_response
        request.state.user = user
        resp = fn(*args, request=request, **kwargs)
        if not isinstance(resp, Response):
            return Response("is_authenticated did not return response", 500)
        resp.headers["cache-control"] = "no-cache"
        return resp
    return async_wrapper if iscoroutine(fn) else sync_wrapper
    

router = APIRouter()

@router.get("")
@router.get("/")
@is_authenticated
def route_get_user(request: Request):
    try:
        user = request.state.user
        if user:
            return Response(json.dumps(user), 200, headers=no_cache_header)
        else:
            return Response(None, 401, headers=no_cache_header)
    except:
        return Response(None, 500, headers=no_cache_header)
