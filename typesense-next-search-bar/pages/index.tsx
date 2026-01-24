import { InstantSearch } from "react-instantsearch";
import { typesenseInstantSearchAdapter } from "../lib/instantSearchAdapter";
import { SearchBar } from "../components/SearchBar";
import { BookList } from "../components/BookList";
import Head from "next/head";
import Heading from "../components/Heading";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <Head>
        <title>Next.js Search Bar</title>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <meta
          name="description"
          content="Search through our collection of books"
        />
      </Head>

      <div className="max-w-7xl mx-auto">
        <InstantSearch
          searchClient={typesenseInstantSearchAdapter.searchClient}
          indexName={process.env.NEXT_PUBLIC_TYPESENSE_INDEX || "books"}
        >
          <Heading />
          <SearchBar />
          <BookList />
        </InstantSearch>
      </div>
    </div>
  );
}
