from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.quickstart import router as quickstart_router
from app.sane_url import router as saneurl_router, vip_routes
from app.config import HOST_PATHNAME, SESSION_SECRET, PATH_TO_PUBLIC
from app.dev_banner import router as devbanner_router
from app.index_html import router as index_router
from app.plugin import router as plugin_router
from app.auth import router as auth_router
from app.user import router as user_router
from app.config import HOST_PATHNAME

app = FastAPI()

app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET)

for vip_route in vip_routes:
    @app.get(f"/{vip_route}")
    async def get_vip_route(request: Request):
        *_, vip = request.url.path.split("/")
        return RedirectResponse(f"{HOST_PATHNAME}/go/{vip}")

app.include_router(quickstart_router, prefix="/quickstart")
app.include_router(saneurl_router, prefix="/saneUrl")
app.include_router(saneurl_router, prefix="/go")
app.include_router(plugin_router, prefix="/plugins")
app.include_router(user_router, prefix="/user")

app.include_router(auth_router)
app.include_router(devbanner_router)
app.include_router(index_router)

app.mount("/.well-known", StaticFiles(directory=Path(__file__).parent / "well-known"), name="well-known")
app.mount("/", StaticFiles(directory=Path(PATH_TO_PUBLIC)), name="static")

# if HOST_PATHNAME is defined, mount on a specific route
# this may be necessary, if the reverse proxy is not under our control
# and/or we cannot easily strip the route path

if HOST_PATHNAME:
    assert HOST_PATHNAME[0] == "/", f"HOST_PATHNAME, if defined, must start with /: {HOST_PATHNAME!r}"
    assert HOST_PATHNAME[-1] != "/", f"HOST_PATHNAME, if defined, must not end with /: {HOST_PATHNAME!r}"

    _app = app
    app = FastAPI()
    app.mount(HOST_PATHNAME, _app)
