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
        resp.headers["ETag"] = BUILD_HASH
        return resp
