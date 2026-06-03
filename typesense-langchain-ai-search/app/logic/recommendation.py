from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from app.core.models import LLM_MODEL, LLM_BASE_URL, LLM_API_KEY

def synthesize_recommendations(user_query: str, movies_data: list) -> str:
    """Uses LLM to write a personalized conversational recommendation response."""
    movies_text = ""
    for idx, movie in enumerate(movies_data, 1):
        providers = movie.get("watch_providers", {})
        streaming = ", ".join(providers.get("streaming", [])) if providers.get("streaming") else "Not streaming (Rent/Buy only)"
        rent = ", ".join(providers.get("rent", [])) if providers.get("rent") else "None"

        movies_text += f"{idx}. {movie['title']} ({movie.get('release_year', 'N/A')})\n"
        movies_text += f"   Director: {movie.get('director', 'N/A')}\n"
        movies_text += f"   Cast: {', '.join(movie.get('cast', []))}\n"
        movies_text += f"   Overview: {movie['overview']}\n"
        movies_text += f"   Streaming: {streaming}\n"
        movies_text += f"   Rent/Buy: {rent}\n\n"

    try:
        llm = ChatOpenAI(
            model=LLM_MODEL,
            temperature=0.7,
            openai_api_key=LLM_API_KEY,
            base_url=LLM_BASE_URL
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are CineSearch AI, a professional movie concierge. "
                       "You will synthesize the search results from the database into a friendly, "
                       "cinematic recommendation response. Explain why these movies fit the user's request. "
                       "Highlight where they are streaming (subscription) or if they are only available for rent/buy. "
                       "Be conversational, engaging, and professional. Use markdown formatting."),
            ("user", "User Request: {query}\n\nRetrieved Movies & Live Watch Providers:\n{movies}")
        ])

        chain = prompt | llm | StrOutputParser()
        response = chain.invoke({"query": user_query, "movies": movies_text})
        return response

    except Exception as e:
        print(f"[WARNING] LLM synthesis failed: {e}. Using rule-based fallback synthesis.")

        fallback = f"### Here are the top movie recommendations for your query: *\"{user_query}\"*\n\n"
        for idx, movie in enumerate(movies_data, 1):
            providers = movie.get("watch_providers", {})
            streaming = providers.get("streaming", [])
            rent = providers.get("rent", [])

            stream_info = f"Streaming on **{', '.join(streaming)}**" if streaming else "Not available on subscription streaming services."
            rent_info = f" Available to rent/buy on **{', '.join(rent[:4])}**." if rent else ""

            fallback += f"**{idx}. {movie['title']}** ({movie.get('release_year', 'N/A')})\n"
            fallback += f"- *Director*: {movie.get('director', 'N/A')} | *Cast*: {', '.join(movie.get('cast', []))}\n"
            fallback += f"- *Overview*: {movie['overview']}\n"
            fallback += f"- *Where to watch*: {stream_info}{rent_info}\n\n"

        fallback += "\n*(Note: LLM synthesis is running in rule-based fallback mode. Please update the OPENAI_API_KEY in your .env file to enable full conversational AI features.)*"
        return fallback
