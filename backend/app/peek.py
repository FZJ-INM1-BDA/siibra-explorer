from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
from .sane_url import data_proxy_store, SaneUrlDPStore

router = APIRouter()

txt_tmpl="""
saneurl: {short_id}
redirect: {hash_path}
expiry: {expiry}
"""

@router.get("/{short_id:str}")
async def peek_short_url(short_id:str):
    try:
        wrapped = data_proxy_store.get_wrapped(short_id)
        expiry = wrapped.get("expiry")
        hash_path = wrapped.get("value", {}).get("hashPath")
        return PlainTextResponse(txt_tmpl.format(short_id=short_id, hash_path=hash_path, expiry=expiry))
    except SaneUrlDPStore.NotFound:
        return PlainTextResponse("saneurl not found", 404)

