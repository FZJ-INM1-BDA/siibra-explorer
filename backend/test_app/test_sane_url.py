from app.app import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_annotation_redirect():
    resp = client.get("/go/stnr", headers={
        "Accept": "text/html"
    }, follow_redirects=False)
    loc = resp.headers.get("Location")
    assert loc, "Expected location header to be present, but was not"
    assert "x-user-anntn:stnr" in loc, f"Expected the string 'x-user-anntn:stnr' in {loc!r}, but was not"

