from typing import List
from fastapi import APIRouter
from fastapi.responses import JSONResponse
import json
import requests
import re
from urllib.parse import urlparse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from .config import V2_7_PLUGIN_URLS, V2_7_STAGING_PLUGIN_URLS
from .logger import logger
from ._store import RedisEphStore

router = APIRouter()
_redisstore = RedisEphStore.Persistent()

PLUGINS: List[str] = []
try:
    PLUGINS = [
        v
        for v in [*V2_7_PLUGIN_URLS.split(";"), *V2_7_STAGING_PLUGIN_URLS.split(";")]
        if v # remove empty strings
    ]
except Exception as e:
    logger.error(f"failed to parse plugins correctly: {str(e)}")
    

def _get_key(url: str):
    return f"plugin:manifest-cache:{url}"

def _get_manifest(url: str):
    
    key = _get_key(url)
    try:
        stored_manifest = _redisstore.get(key)
        try:
            if stored_manifest:
                return json.loads(stored_manifest)
        except:
            # If parsing json fails, fall back to fetch manifest
            pass

        resp = requests.get(url)
        resp.raise_for_status()
        manifest_json = resp.json()

        sxplr_flag = manifest_json.get("siibra-explorer")
        iframe_url = manifest_json.get("iframeUrl")

        if not sxplr_flag:
            logger.warn(f"plugin mainfest at {url} does not have siibra-explorer flag set")
            return None

        replace_obj = {}
        if not re.match(r"https:", iframe_url):
            parsed_url = urlparse(url)
            if iframe_url[0] == "/":
                new_name = iframe_url
            else:
                new_name = str(Path(parsed_url.path).with_name(iframe_url))
            replace_obj["iframeUrl"] = parsed_url._replace(path=new_name).geturl()
        return_obj = { **manifest_json, **replace_obj }
        _redisstore.set(key, json.dumps(return_obj))
        return return_obj

    except Exception as e:
        logger.error(f"Error retrieving: {url}")


@router.get("/manifests")
def plugin_manifests():
    with ThreadPoolExecutor() as ex:
        returned_obj = ex.map(
            _get_manifest,
            PLUGINS
        )
    returned_obj = [v for v in returned_obj if v]
    return JSONResponse(returned_obj, headers={
        "cache-control": "public, max-age={age_seconds}".format(age_seconds=60*60*24)
    })
