import os
import json
import pandas as pd
import torch
import typesense
from dotenv import load_dotenv
from app.core.typesense import client
from app.core.models import model, EMBEDDING_DIM

def parse_genres(x):
    try:
        if pd.isna(x) or not x:
            return []
        data = json.loads(x)
        return [item['name'] for item in data]
    except Exception:
        return []

def parse_cast(x):
    try:
        if pd.isna(x) or not x:
            return []
        data = json.loads(x)
        # Limit to top 3 cast members to save memory
        return [item['name'] for item in data[:3]]
    except Exception:
        return []

def parse_director(x):
    try:
        if pd.isna(x) or not x:
            return ""
        data = json.loads(x)
        for item in data:
            if item.get('job') == 'Director':
                return item.get('name', '')
        return ""
    except Exception:
        return ""

def parse_year(x):
    try:
        if pd.isna(x) or not x:
            return None
        parts = str(x).split('-')
        if len(parts) > 0 and parts[0].isdigit():
            return int(parts[0])
        return None
    except Exception:
        return None

def main():
    # 1. Load the Datasets
    print("Loading TMDB CSV files...")
    movies_path = "data/tmdb_5000_movies.csv"
    credits_path = "data/tmdb_5000_credits.csv"
    
    if not os.path.exists(movies_path) or not os.path.exists(credits_path):
        print("Error: CSV files not found in data/ folder!")
        return

    movies_df = pd.read_csv(movies_path)
    credits_df = pd.read_csv(credits_path)

    # Keep only the essential columns before merging to minimize RAM usage
    movies_df = movies_df[['id', 'title', 'overview', 'genres', 'release_date']]
    credits_df = credits_df[['movie_id', 'cast', 'crew']]

    # Merge on movie ID
    print("Merging datasets...")
    df = pd.merge(movies_df, credits_df, left_on='id', right_on='movie_id')

    # Process and clean fields
    print("Processing and cleaning movie metadata...")
    df['genres'] = df['genres'].apply(parse_genres)
    df['cast'] = df['cast'].apply(parse_cast)
    df['director'] = df['crew'].apply(parse_director)
    df['release_year'] = df['release_date'].apply(parse_year)
    
    # Fill missing values
    df['overview'] = df['overview'].fillna("")
    df['title'] = df['title'].fillna("")

    # Drop columns no longer needed
    df = df.drop(columns=['release_date', 'movie_id', 'crew'])

    # 2. Create or Recreate Typesense Collection
    print("Setting up Typesense collection schema...")
    schema = {
        'name': 'movies',
        'fields': [
            {'name': 'id', 'type': 'string'},
            {'name': 'title', 'type': 'string'},
            {'name': 'overview', 'type': 'string', 'optional': True},
            {'name': 'genres', 'type': 'string[]', 'facet': True, 'optional': True},
            {'name': 'release_year', 'type': 'int32', 'facet': True, 'sort': True, 'optional': True},
            {'name': 'cast', 'type': 'string[]', 'facet': True, 'optional': True},
            {'name': 'director', 'type': 'string', 'facet': True, 'optional': True},
            {'name': 'embedding', 'type': 'float[]', 'num_dim': EMBEDDING_DIM}
        ]
    }

    try:
        client.collections['movies'].delete()
        print("Deleted existing 'movies' collection.")
    except Exception:
        pass

    client.collections.create(schema)
    print("Created 'movies' collection.")

    # 4. Generate Embeddings and Seed Data
    print("Generating embeddings and seeding collection...")
    documents = []
    total_movies = len(df)
    
    for i, row in df.iterrows():
        # Build text string to represent the movie semantically
        genres_str = ", ".join(row['genres']) if row['genres'] else ""
        cast_str = ", ".join(row['cast']) if row['cast'] else ""
        
        texts = []
        texts.append(f"Title: {row['title']}")
        if row['overview']:
            texts.append(f"Overview: {row['overview']}")
        if genres_str:
            texts.append(f"Genres: {genres_str}")
        if cast_str:
            texts.append(f"Cast: {cast_str}")
        if row['director']:
            texts.append(f"Director: {row['director']}")
            
        doc_text = ". ".join(texts) + "."
        
        # Prepare Typesense document
        doc = {
            'id': str(row['id']),
            'title': str(row['title']),
            'overview': str(row['overview']),
            'genres': list(row['genres']),
            'cast': list(row['cast']),
            'director': str(row['director'])
        }
        
        if row['release_year'] is not None and not pd.isna(row['release_year']):
            doc['release_year'] = int(row['release_year'])
            
        # We store the text to encode along with doc to batch encode them
        documents.append((doc, doc_text))

    # Batch encode and insert
    batch_size = 100
    for idx in range(0, len(documents), batch_size):
        batch = documents[idx:idx + batch_size]
        batch_docs = [item[0] for item in batch]
        batch_texts = [item[1] for item in batch]
        
        # Encode the texts
        embeddings = model.encode(batch_texts, normalize_embeddings=True)
        
        # Add embeddings to documents
        for doc, emb in zip(batch_docs, embeddings):
            doc['embedding'] = emb.tolist()
            
        # Import to Typesense
        try:
            client.collections['movies'].documents.import_(batch_docs, {'action': 'upsert'})
            print(f"Seeded {min(idx + batch_size, total_movies)} / {total_movies} movies...")
        except Exception as e:
            print(f"Error seeding batch starting at index {idx}: {e}")

    print("Data ingestion complete!")

if __name__ == "__main__":
    main()
