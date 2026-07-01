import os
import sys
import base64

# Prevent Engine.IO socket payload limit errors during fast hot-reloads
from engineio.payload import Payload
Payload.max_decode_packets = 256

# Add project root to sys.path so 'app' imports work when executed via chainlit CLI
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import chainlit as cl
from app.core.typesense import client
from app.core.models import model
from app.logic.query_parser import parse_query, build_filter_string
from app.services.motn import fetch_motn_info
from app.logic.recommendation import synthesize_recommendations
from concurrent.futures import ThreadPoolExecutor


# ---------------------------------------------------------------------------
# Chainlit Handlers
# ---------------------------------------------------------------------------
# @cl.on_chat_start
# async def start():
#     # Read and send chainlit.md content dynamically based on this file's location
#     welcome_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chainlit.md")
#     with open(welcome_path, "r", encoding="utf-8") as f:
#         content = f.read()
#     await cl.Message(content=content).send()

@cl.on_chat_start
async def start():
    content = f"""
<div style="text-align: center; margin-top: 2rem; margin-bottom: 2rem;">
  <h1 style="font-size: 2.5rem; font-weight: 700; margin: 0 0 0.5rem 0; border: none; padding: 0;">AI Powered Movie Search</h1>
  <div style="font-size: 1rem; color: #64748b; display: flex; align-items: center; justify-content: center; gap: 8px;">
    <span>powered by</span>
    <a href="https://typesense.org/" target="_blank" style="color: #d52b7f; text-decoration: none; font-family: monospace; font-size: 1.1rem;">
      type<b>sense</b>|
    </a>
    <span>&amp;</span>
    <a href="https://www.langchain.com/" target="_blank" style="display: inline-flex; align-items: center; text-decoration: none;">
      🦜⛓️‍💥 LangChain
    </a>
  </div>
</div>

---
### Try searching for:
* *Will Smith movies with aliens and guns*
* *a cool sci-fi movie similar to Interstellar*
* *mind-bending thrillers directed by Christopher Nolan*
* *heartwarming animations about family*
"""
    await cl.Message(content=content).send()

@cl.on_message
async def main(message: cl.Message):
    user_query = message.content.strip()
    if not user_query:
        return

    # ------------------------------------------------------------------
    # Step 1 — Parse query into hard filters + semantic theme
    # ------------------------------------------------------------------
    async with cl.Step(name="Parsing query") as step:
        step.input = user_query
        parsed = parse_query(user_query)

        semantic_query = parsed.get("semantic_query")
        if not semantic_query or str(semantic_query).lower().strip() in ("null", "none"):
            semantic_query = user_query
        filters = parsed.get("filters", {})
        filter_by = build_filter_string(filters, user_query)

        active_filters = {k: v for k, v in filters.items() if v}
        filter_summary = f"Filters: {active_filters}" if active_filters else "No hard filters detected."
        step.output = f"Semantic query: '{semantic_query}'\n{filter_summary}"

    # ------------------------------------------------------------------
    # Step 2 — Embed semantic query + run Typesense hybrid search
    # ------------------------------------------------------------------
    async with cl.Step(name="Searching movie database") as step:
        # Embed only the semantic/thematic part of the query
        query_vector = model.encode(semantic_query).tolist()

        # Build Typesense search request
        # k:20 retrieves more candidates; flat_search_cutoff:20 forces exact ranking
        # when the filtered set is small (e.g. only 20 Will Smith movies exist)
        search_params = {
            'collection': 'movies',
            'q': '*',
            'vector_query': f'embedding:([{",".join(map(str, query_vector))}], k:20, flat_search_cutoff: 20)'
        }

        # Attach hard filters if present — this narrows candidates BEFORE vector ranking
        if filter_by:
            search_params['filter_by'] = filter_by

        try:
            search_requests = {'searches': [search_params]}
            response = client.multi_search.perform(search_requests, {})
            search_results = response['results'][0]
            hits = search_results.get("hits", [])[:5]  # Top 5 from the broader k:20 pool
            step.input = f"Semantic: '{semantic_query}' | filter_by: {filter_by or 'None'}"
            step.output = f"Found {len(hits)} matching documents in Typesense."
        except Exception as e:
            step.output = f"Error during vector search: {e}"
            await cl.Message(content=f"❌ Error performing search: {e}").send()
            return

    if not hits:
        # Provide a helpful message if filters were too restrictive
        no_result_msg = f"Sorry, I couldn't find any movies matching: *\"{user_query}\"*"
        if filter_by:
            no_result_msg += f"\n\n> ℹ️ Search was filtered by: `{filter_by}`. Try rephrasing if this seems too strict."
        await cl.Message(content=no_result_msg).send()
        return

    # ------------------------------------------------------------------
    # Step 3 — Enrich results with MOTN watch providers + posters
    # ------------------------------------------------------------------
    async with cl.Step(name="Retrieving streaming availability") as step:

        movies = []
        
        # Run MOTN info fetches in parallel
        with ThreadPoolExecutor(max_workers=len(hits)) as executor:
            # Map future to corresponding hit document
            future_to_hit = {}
            for hit in hits:
                doc = hit.get("document", {})
                movie_id = doc.get("id")
                future = executor.submit(fetch_motn_info.invoke, {"movie_id": movie_id})
                future_to_hit[future] = hit
            
            # Retrieve results in order of submissions
            for future in future_to_hit:
                hit = future_to_hit[future]
                doc = hit.get("document", {})
                try:
                    motn_info = future.result()
                except Exception as e:
                    print(f"[WARNING] Failed to fetch parallel MOTN info: {e}")
                    motn_info = {
                        "poster_url": None,
                        "watch_providers": {"streaming": [], "rent": [], "buy": []}
                    }
                
                movie_item = {
                    "title": doc.get("title"),
                    "overview": doc.get("overview"),
                    "genres": doc.get("genres", []),
                    "release_year": doc.get("release_year"),
                    "cast": doc.get("cast", []),
                    "director": doc.get("director"),
                    "poster_url": motn_info["poster_url"],
                    "watch_providers": motn_info["watch_providers"],
                    "score": hit.get("vector_distance")
                }
                movies.append(movie_item)
                
        step.output = f"Fetched watch providers and poster details for {len(movies)} movies in parallel."

    # ------------------------------------------------------------------
    # Step 4 — Format and send final response
    # ------------------------------------------------------------------
    response_content = "### Here are movies that I recommend:\n\n"

    for movie in movies:
        providers = movie.get("watch_providers", {})
        streaming = providers.get("streaming", [])
        rent = providers.get("rent", [])

        stream_str = ", ".join(streaming) if streaming else "Not available on subscription streaming"
        rent_str = ", ".join(rent[:4]) if rent else "Not listed"

        response_content += f"#### 🎥 {movie['title']} ({movie.get('release_year', 'N/A')})\n"

        if movie.get("poster_url"):
            response_content += f"![Poster]({movie['poster_url']})\n\n"

        response_content += f"**Director:** {movie.get('director', 'Unknown')} | **Genres:** {', '.join(movie.get('genres', []))}\n"
        response_content += f"**Cast:** {', '.join(movie.get('cast', []))}\n"
        response_content += f"**Relevance Score:** {(1 - movie['score']):.3f}\n"
        response_content += f"**Synopsis:** {movie['overview']}\n\n"
        response_content += f"📺 **Stream (US):** {stream_str}\n"
        response_content += f"💳 **Rent/Buy:** {rent_str}\n\n"
        response_content += "---\n\n"

    await cl.Message(content=response_content).send()
