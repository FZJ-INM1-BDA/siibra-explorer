import re
from enum import Enum
from urllib.parse import urlencode, quote_plus
from starlette.requests import Request
from starlette.responses import Response, RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
import json

from .util import encode_number, separator
from .logger import logger
from .config import HOST_PATHNAME
from .const import ERROR_KEY, COOKIE_KWARGS

waxholm_obj = {
  "aId": 'minds/core/parcellationatlas/v1.0.0/522b368e-49a3-49fa-88d3-0870a307974a',
  "id": 'minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8',
  "parc": {
    'Waxholm Space rat brain atlas v3': {
      "id": 'minds/core/parcellationatlas/v1.0.0/ebb923ba-b4d5-4b82-8088-fa9215c2e1fe'
      },
    'Whole Brain (v2.0)': {
      "id": 'minds/core/parcellationatlas/v1.0.0/2449a7f0-6dd0-4b5a-8f1e-aec0db03679d'
    },
    'Waxholm Space rat brain atlas v2': {
      "id": 'minds/core/parcellationatlas/v1.0.0/2449a7f0-6dd0-4b5a-8f1e-aec0db03679d'
      },
    'Waxholm Space rat brain atlas v1': {
      "id": 'minds/core/parcellationatlas/v1.0.0/11017b35-7056-4593-baad-3934d211daba'
    },
  }
}

allen_obj = {
  "aId": 'juelich/iav/atlas/v1.0.0/2',
  "id": 'minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9',
  "parc": {
    'Allen Mouse Common Coordinate Framework v3 2017': {
      "id": 'minds/core/parcellationatlas/v1.0.0/05655b58-3b6f-49db-b285-64b5a0276f83'
    },
    'Allen Mouse Brain Atlas': {
      "id": 'minds/core/parcellationatlas/v1.0.0/39a1384b-8413-4d27-af8d-22432225401f'
    },
    'Allen Mouse Common Coordinate Framework v3 2015': {
      "id": 'minds/core/parcellationatlas/v1.0.0/39a1384b-8413-4d27-af8d-22432225401f'
    },
  }
}

template_map = {
  'Big Brain (Histology)': {
    "aId": 'juelich/iav/atlas/v1.0.0/1',
    "id": 'minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588',
    "parc": {
      'Cytoarchitectonic Maps - v2.4': {
        "id": 'minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-290',
      },
      'Cytoarchitectonic Maps': {
        "id": 'minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-290',
      },
      'Cortical Layers Segmentation': {
        "id": 'juelich/iav/atlas/v1.0.0/3'
      },
      'Grey/White matter': {
        "id": 'juelich/iav/atlas/v1.0.0/4'
      }
    }
  },
  'MNI 152 ICBM 2009c Nonlinear Asymmetric': {
    "aId": 'juelich/iav/atlas/v1.0.0/1',
    "id": 'minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2',
    "parc": {
      'Cytoarchitectonic Maps - v2.5.1': {
        # redirect julich brain v251 to v290
        "id": 'minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-290'
      },
      'Short Fiber Bundles - HCP': {
        "id": 'juelich/iav/atlas/v1.0.0/79cbeaa4ee96d5d3dfe2876e9f74b3dc3d3ffb84304fb9b965b1776563a1069c'
      },
      'Cytoarchitectonic maps - v1.18': {
        "id": 'minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579'
      },
      'Long Bundle': {
        "id": 'juelich/iav/atlas/v1.0.0/5'
      },
      'fibre bundle short': {
        "id": 'juelich/iav/atlas/v1.0.0/6'
      },
      'DiFuMo Atlas (64 dimensions)': {
        "id": 'minds/core/parcellationatlas/v1.0.0/d80fbab2-ce7f-4901-a3a2-3c8ef8a3b721'
      },
      'DiFuMo Atlas (128 dimensions)': {
        "id": 'minds/core/parcellationatlas/v1.0.0/73f41e04-b7ee-4301-a828-4b298ad05ab8'
      },
      'DiFuMo Atlas (256 dimensions)': {
        "id": 'minds/core/parcellationatlas/v1.0.0/141d510f-0342-4f94-ace7-c97d5f160235'
      },
      'DiFuMo Atlas (512 dimensions)': {
        "id": 'minds/core/parcellationatlas/v1.0.0/63b5794f-79a4-4464-8dc1-b32e170f3d16'
      },
      'DiFuMo Atlas (1024 dimensions)': {
        "id": 'minds/core/parcellationatlas/v1.0.0/12fca5c5-b02c-46ce-ab9f-f12babf4c7e1'
      },
    },
  },
  'MNI Colin 27': {
    "aId": 'juelich/iav/atlas/v1.0.0/1',
    "id": 'minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992',
    "parc": {
      'Cytoarchitectonic Maps - v1.18': {
        "id": 'minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579'
      }
    }
  },
  'Waxholm Space rat brain MRI/DTI': waxholm_obj,
  'Waxholm Rat V2.0': waxholm_obj,
  'Allen Mouse Common Coordinate Framework v3': allen_obj,
  'Allen Mouse': allen_obj
}

def encode_id(_id: str):
    return re.sub(r'/\//', ':', _id)

class WarningStrings(Enum, str):
    PREVIEW_DSF_PARSE_ERROR="Preview dataset files cannot be processed properly."
    REGION_SELECT_ERROR="Region selected cannot be processed properly."
    TEMPLATE_ERROR="Template not found."

class BkwdCompatMW(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        standalone_volumes = request.query_params.get("standaloneVolumes")
        nifti_layers = request.query_params.get("niftiLayers")
        plugin_states = request.query_params.get("pluginStates")
        previewing_dataset_files = request.query_params.get("previewingDatasetFiles")
        template_selected = request.query_params.get("templateSelected")
        parcellation_selected = request.query_params.get("parcellationSelected")
        regions_selected = request.query_params.get("regionsSelected")
        c_regions_selected = request.query_params.get("cRegionsSelected")
        navigation = request.query_params.get("navigation")
        c_navigation = request.query_params.get("cNavigation")
        
        if not any([
            standalone_volumes,
            nifti_layers,
            plugin_states,
            previewing_dataset_files,
            template_selected,
            parcellation_selected,
            regions_selected,
            c_regions_selected,
            navigation,
            c_navigation,
        ]):
            return await super().dispatch(request, call_next)

        redirect_url = f"{HOST_PATHNAME or ''}/#"

        if regions_selected:
            logger.warn(f"regionSelected deprecated, but was used to access {regions_selected}")
        if nifti_layers:
            logger.warn(f"niftiLayers deprecated, but was used to access {nifti_layers}")
        if previewing_dataset_files:
            logger.warn(f"previewing_dataset_files deprecated, but was used to access {previewing_dataset_files}")
        
        new_search_param = {}

        nav = ""
        r = ""

        if navigation:
            try:
                _o, _po, _pz, _p, _z = navigation.split("__")
                o = map(float, _o.split("_"))
                po = map(float, _po.split("_"))
                pz = int(_pz)
                p = map(float, _p.split("_"))
                z = int(_z)
                
                v = f"{separator}{separator}".join([
                    separator.join([encode_number(_val, True) for _val in o]),
                    separator.join([encode_number(_val, True) for _val in po]),
                    encode_number(round(pz)),
                    separator.join([encode_number(round(_val)) for _val in p]),
                    encode_number(z)
                ])
                nav = f"/@:{v}"
            except Exception as e:
                logger.error(f"bkwds parsing navigation error, {str(e)}")

        if c_navigation:
            nav = f"/@:${c_navigation}"
        
        plugins = [p for p in (plugin_states or "").split("__") if p]
        if len(plugins) > 0:
            new_search_param["pl", json.dumps(plugins)]
        
        if c_regions_selected:
            logger.warn(f"cRegionSelected is deprecated, but used for {c_regions_selected}")
            # see util.py get_hash
        
        if standalone_volumes:
            new_search_param["standaloneVolumes"] = standalone_volumes
            if nav:
                redirect_url = redirect_url + nav
            if len(new_search_param) > 0:
                redirect_url = redirect_url + f"?{urlencode(new_search_param)}"
            return RedirectResponse(redirect_url)

        if not template_selected:
            resp = RedirectResponse(redirect_url)
            resp.set_cookie(ERROR_KEY, "template_selected is required, but not defined", **COOKIE_KWARGS)
            return resp

        error_msg = ""
        _tmpl = template_map.get(template_selected)
        if not _tmpl:
            resp =  RedirectResponse(template_selected)
            resp.set_cookie(ERROR_KEY, f"Template with id {template_selected} not found.", **COOKIE_KWARGS)
            return resp
        
        _tmpl_id = _tmpl.get("id")
        _atlas_id = _tmpl.get("aId")

        redirect_url += f"/a:{quote_plus(_atlas_id)}/t:{quote_plus(_tmpl_id)}"

        _parcs = _tmpl.get("parc")

        if parcellation_selected in _parcs:
            parc_id = _parcs[parcellation_selected].get("id")
        else:
            error_msg += f"parcellation with id {parcellation_selected} cannot be found"
            parc_id = list(_parcs.values())[0].get("id")

        redirect_url += f"/p:{quote_plus(parc_id)}"

        if r and parcellation_selected != "Cytoarchitectonic Maps - v2.5.1":
            redirect_url += r
        
        if nav:
            redirect_url += nav
        
        if len(new_search_param) > 0:
            redirect_url += urlencode(new_search_param)
        
        resp = RedirectResponse(redirect_url)
        if len(error_msg) > 0:
            resp.set_cookie(ERROR_KEY, error_msg, **COOKIE_KWARGS)
        
        return resp