import json
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from app.core.models import LLM_MODEL, LLM_BASE_URL, LLM_API_KEY

from pydantic import BaseModel, Field
from typing import List, Optional, Literal

from langchain_core.output_parsers import PydanticOutputParser

class QueryFilters(BaseModel):
    cast: Optional[List[str]] = Field(
        default=None,
        description="List of specific actor or actress names mentioned in the query."
    )
    cast_operator: Literal["AND", "OR"] = Field(
        default="AND",
        description="Logical relationship between cast members: 'AND' if all/both must match, 'OR' if any/either can match."
    )
    director: Optional[List[str]] = Field(
        default=None,
        description="List of specific director names mentioned."
    )
    director_operator: Literal["AND", "OR"] = Field(
        default="AND",
        description="Logical relation for directors."
    )
    genre: Optional[List[str]] = Field(
        default=None,
        description="List of specific genres mentioned. MUST be mapped strictly to allowed database categories: 'Drama', 'Comedy', 'Thriller', 'Action', 'Romance', 'Adventure', 'Crime', 'Science Fiction', 'Horror', 'Family', 'Fantasy', 'Mystery', 'Animation', 'History', 'Music', 'War', 'Documentary', 'Western', 'Foreign', 'TV Movie'. (e.g., map 'Animated' to 'Animation', and 'Sci-Fi' to 'Science Fiction')."
    )
    genre_operator: Literal["AND", "OR"] = Field(
        default="AND",
        description="Logical relation for genres."
    )
    year: Optional[str] = Field(
        default=None,
        description="Specific release year mentioned."
    )
    exclude_titles: Optional[List[str]] = Field(
        default=None,
        description="List of specific movie titles to exclude, or reference movies (e.g. 'movies like Interstellar' -> ['Interstellar'])."
    )

class MovieSearchQuery(BaseModel):
    filters: QueryFilters = Field(
        description="Extracted hard filter constraints."
    )
    semantic_query: Optional[str] = Field(
        default=None,
        description="Thematic description, plot elements, mood, tone. Do NOT include cast names, director names, or genres here."
    )


# Mapping of common variations of genres to the exact database values
GENRE_MAP = {
    "animated": "Animation",
    "animation": "Animation",
    "anime": "Animation",
    "sci-fi": "Science Fiction",
    "scifi": "Science Fiction",
    "science fiction": "Science Fiction",
    "science-fiction": "Science Fiction",
    "sci fi": "Science Fiction",
    "tv movie": "TV Movie",
    "tv-movie": "TV Movie",
    "tvmovie": "TV Movie",
    "romantic": "Romance",
    "romance": "Romance",
    "drama": "Drama",
    "comedy": "Comedy",
    "thriller": "Thriller",
    "action": "Action",
    "adventure": "Adventure",
    "crime": "Crime",
    "horror": "Horror",
    "family": "Family",
    "fantasy": "Fantasy",
    "mystery": "Mystery",
    "history": "History",
    "music": "Music",
    "war": "War",
    "documentary": "Documentary",
    "western": "Western",
    "foreign": "Foreign"
}


def parse_query(user_query: str) -> dict:
    """
    Uses LangChain and PydanticOutputParser to parse the user's query into concrete filters
    and semantic search themes.
    """
    try:
        llm = ChatOpenAI(
            model=LLM_MODEL,
            temperature=0.0,
            openai_api_key=LLM_API_KEY,
            base_url=LLM_BASE_URL
        )

        pydantic_parser = PydanticOutputParser(pydantic_object=MovieSearchQuery)

        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a movie search query parser. Extract hard filters and semantic search themes.\n"
                       "Your output must conform to the JSON schema instructions below:\n"
                       "{format_instructions}\n"
                       "Do not include actor names, director names, or genres in the semantic query.\n"
                       "If the user asks for movies 'like' or 'similar to' a specific movie, add that movie to exclude_titles.\n"
                       "Do not infer or guess values; only extract what is explicitly mentioned.\n"
                       "IMPORTANT: Allowed genres are: 'Drama', 'Comedy', 'Thriller', 'Action', 'Romance', "
                       "'Adventure', 'Crime', 'Science Fiction', 'Horror', 'Family', 'Fantasy', 'Mystery', "
                       "'Animation', 'History', 'Music', 'War', 'Documentary', 'Western', 'Foreign', 'TV Movie'. "
                       "You must normalize extracted genres to match these database names exactly. "
                       "For example, map 'Animated' to 'Animation', 'Sci-fi' to 'Science Fiction', and 'Romance' to 'Romance'.\n"
                       "Return ONLY the raw JSON output matching the schema with no extra text."),
            ("user", "Query: {query}")
        ])

        chain = prompt | llm | StrOutputParser()
        result = chain.invoke({
            "query": user_query,
            "format_instructions": pydantic_parser.get_format_instructions()
        })

        # Strip markdown fences if LLM adds them despite instructions
        cleaned = result.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        parsed_obj = pydantic_parser.parse(cleaned)
        parsed = parsed_obj.model_dump()
        print(f"[Query Parser] Structured: '{user_query}' → {parsed}")
        return parsed

    except Exception as e:
        print(f"[WARNING] Structured query parsing failed: {e}. Falling back to raw query.")
        return {
            "filters": {},
            "semantic_query": user_query
        }


def build_filter_string(filters: dict, user_query: str = "") -> str | None:
    """
    Converts extracted filter dict into a Typesense filter_by string.

    Example output:
        'cast:=["Will Smith"] && cast:=["Tommy Lee Jones"] && genres:=["Action"]'

    Returns None if no filters are present.
    """
    conditions = []
    q_lower = user_query.lower()

    # Handle cast
    cast = filters.get("cast")
    cast_operator = filters.get("cast_operator", "AND")
    if cast:
        if isinstance(cast, str):
            cast_list = [c.strip() for c in cast.split(",") if c.strip() and c.strip().lower() != "null"]
        elif isinstance(cast, list):
            cast_list = [c for c in cast if c and str(c).lower() != "null"]
        else:
            cast_list = []
            
        if cast_list:
            if cast_operator == "OR" or " or " in q_lower:
                quoted_actors = ", ".join(f'"{actor}"' for actor in cast_list)
                conditions.append(f'cast:=[{quoted_actors}]')
            else:
                for actor in cast_list:
                    conditions.append(f'cast:=["{actor}"]')

    # Handle director
    director = filters.get("director")
    director_operator = filters.get("director_operator", "AND")
    if director:
        if isinstance(director, str):
            director_list = [d.strip() for d in director.split(",") if d.strip() and d.strip().lower() != "null"]
        elif isinstance(director, list):
            director_list = [d for d in director if d and str(d).lower() != "null"]
        else:
            director_list = []
            
        if director_list:
            if director_operator == "OR" or " or " in q_lower:
                quoted_dirs = ", ".join(f'"{dir_name}"' for dir_name in director_list)
                conditions.append(f'director:=[{quoted_dirs}]')
            else:
                for dir_name in director_list:
                    conditions.append(f'director:="{dir_name}"')

    # Handle genre
    genre = filters.get("genre")
    genre_operator = filters.get("genre_operator", "AND")
    if genre:
        if isinstance(genre, str):
            genre_list = [g.strip() for g in genre.split(",") if g.strip() and g.strip().lower() != "null"]
        elif isinstance(genre, list):
            genre_list = [g for g in genre if g and str(g).lower() != "null"]
        else:
            genre_list = []
            
        if genre_list:
            normalized_genres = []
            for g in genre_list:
                norm = GENRE_MAP.get(g.strip().lower(), g.strip())
                # Capitalize nicely if not found in mapping dictionary
                if norm not in GENRE_MAP.values():
                    norm = norm.title()
                normalized_genres.append(norm)
                
            if genre_operator == "OR" or " or " in q_lower:
                quoted_genres = ", ".join(f'"{g_name}"' for g_name in normalized_genres)
                conditions.append(f'genres:=[{quoted_genres}]')
            else:
                for g_name in normalized_genres:
                    conditions.append(f'genres:=["{g_name}"]')

    # Handle year
    year = filters.get("year")
    if year and str(year).lower() != "null":
        try:
            conditions.append(f'release_year:={int(year)}')
        except ValueError:
            pass  # Ignore malformed year

    # Handle exclude_titles
    exclude_titles = filters.get("exclude_titles")
    if exclude_titles:
        if isinstance(exclude_titles, str):
            exclude_list = [t.strip() for t in exclude_titles.split(",") if t.strip() and t.strip().lower() != "null"]
        elif isinstance(exclude_titles, list):
            exclude_list = [t for t in exclude_titles if t and str(t).lower() != "null"]
        else:
            exclude_list = []
            
        for t_name in exclude_list:
            conditions.append(f'title:!="{t_name}"')

    result = " && ".join(conditions) if conditions else None
    print(f"[Filter Builder] filter_by → {result}")
    return result
