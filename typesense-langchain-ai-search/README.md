# LangChain AI Movie Search with Typesense

A conversational AI-powered movie search and recommendation chat assistant. Features structured natural language query parsing, strict metadata-driven hybrid vector search via Typesense, parallel live streaming availability enrichment from the Movie of the Night (MOTN) API, conversational recommendation synthesis, and a real-time chat interface built with Chainlit.

---

## Tech Stack

- **Python 3.10+**
- **LangChain** (for AI orchestration)
- **Typesense** (for hybrid vector & keyword search)
- **Chainlit** (for the real-time chat UI)
- **OpenAI** (`gpt-4o-mini` & `text-embedding-3-small` for parser/recommendation engines)
- **Docker** (for running Typesense)

---

## Prerequisites

- **Python 3.10+** installed
- **Docker** (to run Typesense)
- **OpenAI API Key**
- **Movie of the Night API Key** (RapidAPI)
- **Kaggle TMDB 5000 Movies Dataset**

---

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/typesense/code-samples.git
cd typesense-langchain-ai-search
```

### 2. Install dependencies
Create a virtual environment and install the required Python packages:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Start Typesense
Start Typesense locally using Docker:
```bash
docker run -d \
  -p 8108:8108 \
  -v typesense-data:/data \
  typesense/typesense:26.0 \
  --data-dir /data \
  --api-key=xyz \
  --enable-cors
```

### 4. Configure environment variables
Create a `.env` file in the root directory:
```env
# Typesense Configuration
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=xyz
TYPESENSE_COLLECTION_NAME=movies

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
LLM_MODEL=gpt-4o-mini
LLM_BASE_URL=https://api.openai.com/v1

# Movie of the Night API Configuration
MOTN_API_KEY=your-movie-of-the-night-api-key
```

### 5. Ingest the dataset
1. Download `tmdb_5000_movies.csv` and `tmdb_5000_credits.csv` from the [TMDB 5000 Movie Dataset](https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata) on Kaggle.
2. Create a folder named `data/` at the root of the project and place both CSV files inside it.
3. Run the seeding script to clean, vectorize, and import the movies into Typesense:
```bash
python seed.py
```
*(Note: When seeding large datasets in production, be mindful of OpenAI embedding costs. Typesense also supports built-in, local machine learning models like `SentenceTransformers` to generate embeddings locally).*

### 6. Run the chat assistant
Start the Chainlit server:
```bash
chainlit run app/main.py --watch
```
Open `http://localhost:8000` in your browser. You can now chat with your movie database using natural language!

---

## Project Structure

```text
├── app/
│   ├── core/
│   │   ├── __init__.py
│   │   ├── env.py              # Environment variable utility functions
│   │   ├── models.py           # Model configurations (LLM & Embeddings)
│   │   └── typesense.py        # Typesense client connection pool
│   ├── logic/
│   │   ├── __init__.py
│   │   ├── query_parser.py     # Pydantic parsing of query into structured filters
│   │   └── recommendation.py   # AI conversational recommendation synthesis
│   ├── services/
│   │   ├── __init__.py
│   │   └── motn.py             # LangChain @tool fetching live streaming providers
│   ├── public/
│   │   └── langchain.png       # UI Assets
│   └── main.py                 # Chainlit handlers & query orchestrator
├── data/                       # Datasets folder (git-ignored)
├── .gitignore
├── requirements.txt
├── seed.py                     # Cleaning & ingestion script
└── README.md
```