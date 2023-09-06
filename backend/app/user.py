from typing import Any, Coroutine
from starlette.requests import Request
from starlette.responses import Response
from fastapi import FastAPI, APIRouter
from functools import wraps
from inspect import iscoroutine

import json
from .const import PROFILE_KEY
from .auth import _store

def is_authenticated(fn):

    class NotAuthenticatedEx(Exception): ...

    def check_auth(request: Request):
        if PROFILE_KEY not in request.session:
            raise NotAuthenticatedEx
        
        profile_uuid = request.session[PROFILE_KEY]
        user = _store.get(profile_uuid)
        if not user:
            raise NotAuthenticatedEx

        request.state.user = json.loads(user)

    @wraps(fn)
    async def async_wrapper(*args, request: Request, **kwargs):
        try:
            check_auth(request)
        except NotAuthenticatedEx:
            return Response("Not authenticated", 401)
        return await fn(*args, request=request, **kwargs)

    @wraps(fn)
    def sync_wrapper(*args, request: Request, **kwargs):
        try:
            check_auth(request)
        except NotAuthenticatedEx:
            return Response("Not authenticated", 401)
        return fn(*args, request=request, **kwargs)
    return async_wrapper if iscoroutine(fn) else sync_wrapper
    

router = APIRouter()

@router.get("/foo")
@is_authenticated
def foo(request: Request):
    return "foo"

@router.get("")
@router.get("/")
@is_authenticated
def get_user(request: Request):
    try:
        user = request.state.user
        if user:
            return Response(json.dumps(user), 200)
        else:
            return Response(None, 401)
    except:
        return Response(None, 500)
