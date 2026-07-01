import time
import requests
from app.core.env import get_env
from urllib3.util import Retry
from requests.adapters import HTTPAdapter

from langchain_core.tools import tool

def _make_motn_session() -> requests.Session:
    """Creates a fresh Movie of the Night session with retry strategy"""
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "accept": "application/json"
    })
    retry_strategy = Retry(
        total=3,
        backoff_factor=1.0,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
        raise_on_status=False
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session

def _motn_get(url: str, headers: dict, max_retries: int = 3) -> requests.Response | None:
    """
    GET with manual retry for ConnectionResetError.
    Creates a fresh session per retry instead of reusing a potentially
    stale pooled connection.
    """
    for attempt in range(max_retries):
        session = _make_motn_session()
        try:
            resp = session.get(url, headers=headers, timeout=8)
            return resp
        except (ConnectionError, requests.exceptions.ConnectionError) as e:
            if attempt < max_retries - 1:
                wait = 1.0 * (attempt + 1)
                print(f"[MOTN] Connection reset on attempt {attempt + 1}, retrying in {wait}s...")
                time.sleep(wait)
            else:
                print(f"[MOTN] All {max_retries} attempts failed for {url}: {e}")
                return None
        finally:
            session.close()
    return None

@tool
def fetch_motn_info(movie_id: str) -> dict:
    """Fetches watch providers (streaming/rent/buy) and poster paths from the Movie of the Night API using the movie's TMDB ID."""
    motn_key = get_env("MOTN_API_KEY")
    info = {
        "poster_url": None,
        "watch_providers": {
            "streaming": [], 
            "rent": [],
            "buy": []
        }
    }

    print(f"[MOTN] Fetching info for movie_id={movie_id}")

    if not motn_key or motn_key == "1234":
        return info

    headers = {
        "X-API-Key": motn_key
    }

    try:
        url = f"https://api.movieofthenight.com/v4/shows/movie/{movie_id}"
        resp = _motn_get(url, headers)
        if resp and resp.status_code == 200:
            data = resp.json()
            
            # Fetch poster
            image_set = data.get("imageSet", {})
            vertical_poster = image_set.get("verticalPoster", {})
            info["poster_url"] = vertical_poster.get("w480") or vertical_poster.get("w360") or vertical_poster.get("original")

            # Fetch watch providers for US
            streaming_options = data.get("streamingOptions", {})
            us_providers = streaming_options.get("us", [])
            
            for provider in us_providers:
                service_name = provider.get("service", {}).get("name", "")
                stream_type = provider.get("type", "")
                
                if stream_type == "subscription":
                    info["watch_providers"]["streaming"].append(service_name)
                elif stream_type == "rent":
                    info["watch_providers"]["rent"].append(service_name)
                elif stream_type == "buy":
                    info["watch_providers"]["buy"].append(service_name)
                    
            # Deduplicate provider lists
            for k in info["watch_providers"]:
                info["watch_providers"][k] = list(set(info["watch_providers"][k]))

    except Exception as e:
        print(f"[WARNING] Failed to fetch MOTN info for movie {movie_id}: {e}")

    return info
