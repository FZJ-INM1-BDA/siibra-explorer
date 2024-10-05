from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response
from app.config import BUILD_HASH

class VersionHeaderMW(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        resp = await call_next(request)
        if (
            resp.headers.get("ETag") # if the route sets its own etag, do not interfere
            or request.method != "GET" # if the request is not a get method do not interfere
            or (300 <= resp.status_code < 400) # if the request is redirect, do not interfere
        ):
            return resp
        
        # allow for debugging, cache should be busted every 10 min
        resp.headers["ETag"] = BUILD_HASH
        if resp.headers.get("cache-control") is None:
            resp.headers["cache-control"] = "max-age=600"
        return resp
