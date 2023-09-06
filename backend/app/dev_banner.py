from fastapi.routing import APIRouter
from fastapi.responses import PlainTextResponse
from .config import BUILD_TEXT
from .logger import main_logger

router = APIRouter()

main_logger.info(f"BUILD_TEXT: {BUILD_TEXT}")

css_string = "body::after {{ content: '{BUILD_TEXT}' }}".format(
    BUILD_TEXT="dev build" if BUILD_TEXT is None else BUILD_TEXT
)

@router.get("/version.css")
def build_text():
    return PlainTextResponse(
        css_string,
        headers={
            "content-type": "text/css; charset=UTF-8",
            "cache-control": "public, max-age={age_seconds}".format(age_seconds=60*60*24)
        },
    )
