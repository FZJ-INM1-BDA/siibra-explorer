from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class CorsMW(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.method == "OPTIONS":
            res = Response(b"", 200, {
                "Access-Control-Allow-Origin": "*"
            })
            return res

        resp = await call_next(request)
        resp.headers["Access-Control-Allow-Origin"] = "*"
        return resp
