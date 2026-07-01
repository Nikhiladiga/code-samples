import numpy as np
from app.core.env import get_env

# Configure OpenAI Settings
LLM_BASE_URL = get_env("LLM_BASE_URL", "https://api.openai.com/v1")
LLM_MODEL = get_env("LLM_MODEL", "gpt-4o-mini")
LLM_API_KEY = get_env("OPENAI_API_KEY")
EMBEDDING_DIM = 1536

class OpenAIEmbeddingAdapter:
    def __init__(self, api_key: str, base_url: str):
        from langchain_openai import OpenAIEmbeddings
        self._embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=api_key,
            openai_api_base=base_url
        )

    def encode(self, text: str | list[str], *args, **kwargs):
        if isinstance(text, str):
            res = self._embeddings.embed_query(text)
            return np.array(res)
        elif isinstance(text, list):
            res = self._embeddings.embed_documents(text)
            return np.array(res)
        else:
            raise TypeError("Expected string or list of strings")

model = OpenAIEmbeddingAdapter(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)
