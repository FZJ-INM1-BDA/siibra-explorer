from fastapi.routing import APIRouter
from fastapi.responses import HTMLResponse
from pathlib import Path
from markdown import markdown
import json

helper_content: str = None
markdown_content: str = None

router = APIRouter()


@router.get("")
@router.get("/")
async def quickstart():
    global helper_content
    global markdown_content
    if not helper_content:
        path_to_helper = Path(__file__).parent / ".." / ".." / "common/helpOnePager.md"
        with open(path_to_helper, "r") as fp:
            helper_content = fp.read()
            markdown_content = markdown(helper_content, extensions=["markdown.extensions.admonition", "markdown.extensions.codehilite", "markdown.extensions.tables"])
    
    html_response = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
  <script src="https://unpkg.com/dompurify@latest/dist/purify.min.js"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Siibra Explorer Quickstart</title>
  <style>
    .padded { padding: 1.5rem; }
  </style>
</head>
<body class="padded">
  
</body>
<script>
(() => {
  const markdown = """+ json.dumps(helper_content) + """
  const dirty = """ + json.dumps(markdown_content) + """
  const clean = DOMPurify.sanitize(dirty)
  document.body.innerHTML = clean
})()
</script>
</html>
"""
    return HTMLResponse(html_response)
    

__all__ = [
    "router"
]
