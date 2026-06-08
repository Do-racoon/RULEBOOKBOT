import json
import sys
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen


BUCKET_ID = "rulebooks"
OBJECT_PATH = "tichu/tichu-rulebook.pdf"
VERSION_LABEL = "Tichu Korean PDF Rulebook"


def load_env(path: Path) -> dict[str, str]:
    values = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key] = value
    return values


def request_json(url: str, api_key: str, method: str = "GET", body=None, headers=None):
    data = None
    request_headers = {
        "apikey": api_key,
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        **(headers or {}),
    }

    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")

    request = Request(url, data=data, method=method, headers=request_headers)

    try:
        with urlopen(request, timeout=30) as response:
            text = response.read().decode("utf-8")
            return response.status, json.loads(text) if text else None
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        return error.code, detail


def request_bytes(url: str, api_key: str, method: str, data: bytes, content_type: str):
    request = Request(
        url,
        data=data,
        method=method,
        headers={
            "apikey": api_key,
            "Authorization": f"Bearer {api_key}",
            "Content-Type": content_type,
            "x-upsert": "true",
        },
    )

    try:
        with urlopen(request, timeout=60) as response:
            text = response.read().decode("utf-8")
            return response.status, json.loads(text) if text else None
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        return error.code, detail


def supabase_rest(base_url: str, api_key: str, rest_path: str, method: str = "GET", body=None):
    status, payload = request_json(
        f"{base_url}/rest/v1/{rest_path}",
        api_key,
        method=method,
        body=body,
        headers={"Prefer": "return=representation"} if body is not None else None,
    )

    if status >= 400:
        raise RuntimeError(f"{status} {payload}")

    return payload


def main() -> None:
    pdf_path = Path(sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\dodoc\Downloads\티츄룰북.pdf")
    env = load_env(Path(".env.local"))
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    service_role_key = env.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url:
        raise RuntimeError("NEXT_PUBLIC_SUPABASE_URL is missing.")

    if not service_role_key:
        raise RuntimeError(
            "SUPABASE_SERVICE_ROLE_KEY is missing in .env.local. "
            "Bucket creation and private storage writes require the service role key."
        )

    status, buckets = request_json(f"{supabase_url}/storage/v1/bucket", service_role_key)
    if status >= 400:
        raise RuntimeError(f"Could not list buckets: {status} {buckets}")

    bucket_exists = any(bucket.get("id") == BUCKET_ID for bucket in buckets)

    if not bucket_exists:
        status, payload = request_json(
            f"{supabase_url}/storage/v1/bucket",
            service_role_key,
            method="POST",
            body={
                "id": BUCKET_ID,
                "name": BUCKET_ID,
                "public": True,
                "file_size_limit": 10485760,
                "allowed_mime_types": ["application/pdf"],
            },
        )

        if status >= 400:
            raise RuntimeError(f"Could not create bucket: {status} {payload}")

    pdf_bytes = pdf_path.read_bytes()
    encoded_path = "/".join(quote(part) for part in OBJECT_PATH.split("/"))
    status, upload_payload = request_bytes(
        f"{supabase_url}/storage/v1/object/{BUCKET_ID}/{encoded_path}",
        service_role_key,
        method="POST",
        data=pdf_bytes,
        content_type="application/pdf",
    )

    if status >= 400:
        raise RuntimeError(f"Could not upload PDF: {status} {upload_payload}")

    public_url = f"{supabase_url}/storage/v1/object/public/{BUCKET_ID}/{encoded_path}"
    games = supabase_rest(supabase_url, service_role_key, "board_games?slug=eq.tichu&select=id&limit=1")

    if not games:
        raise RuntimeError("Tichu board_games row is missing. Run upload_tichu_pdf_text.py first.")

    game_id = games[0]["id"]
    rulebooks = supabase_rest(
        supabase_url,
        service_role_key,
        f"rulebooks?board_game_id=eq.{game_id}&version_label=eq.Tichu%20Korean%20PDF%20Rulebook&select=id,metadata&limit=1",
    )

    if not rulebooks:
        raise RuntimeError("Tichu rulebook row is missing. Run upload_tichu_pdf_text.py first.")

    metadata = rulebooks[0].get("metadata") or {}
    metadata.update(
        {
            "storageStatus": "uploaded",
            "bucket": BUCKET_ID,
            "objectPath": OBJECT_PATH,
            "publicUrl": public_url,
        }
    )

    updated = supabase_rest(
        supabase_url,
        service_role_key,
        f"rulebooks?id=eq.{rulebooks[0]['id']}",
        method="PATCH",
        body={
            "source_url": public_url,
            "metadata": metadata,
        },
    )

    print(
        json.dumps(
            {
                "bucket": BUCKET_ID,
                "objectPath": OBJECT_PATH,
                "publicUrl": public_url,
                "updatedRulebook": updated[0] if updated else None,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
