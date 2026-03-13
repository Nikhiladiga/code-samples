import { component$, useSignal } from "@builder.io/qwik";
import type { Book } from "../types/Book";

interface BookCardProps {
  book: Book;
}

export const BookCard = component$<BookCardProps>(({ book }) => {
  const {
    title,
    authors,
    publication_year,
    image_url,
    average_rating,
    ratings_count,
  } = book;

  const imageError = useSignal(false);
  const hasRating = typeof average_rating === "number" && average_rating > 0;
  const starCount = hasRating ? Math.round(average_rating) : 0;

  return (
    <div class="flex gap-6 p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      <div class="shrink-0 w-32 h-48 bg-gray-100 rounded-md overflow-hidden">
        {image_url && !imageError.value ? (
          <img
            src={image_url}
            alt={title}
            width="128"
            height="192"
            class="w-full h-full object-cover"
            onError$={() => {
              imageError.value = true;
            }}
          />
        ) : (
          <div class="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>
      <div class="flex-1 flex flex-col">
        <h3 class="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {title}
        </h3>
        <p class="text-gray-600 mb-1 text-sm">
          By: {authors && authors.length > 0 ? authors.join(", ") : "Unknown"}
        </p>
        {publication_year && (
          <p class="text-gray-500 text-xs mb-2">
            Published: {publication_year}
          </p>
        )}
        <div class="mt-auto pt-2 flex items-center">
          {hasRating ? (
            <>
              <div class="text-amber-500 text-lg leading-none">
                {"★".repeat(starCount)}
                {"☆".repeat(5 - starCount)}
              </div>
              <span class="ml-2 text-xs text-gray-600">
                {typeof average_rating === "number"
                  ? average_rating.toFixed(1)
                  : "0.0"}{" "}
                {typeof ratings_count === "number" &&
                  `(${ratings_count.toLocaleString()} ratings)`}
              </span>
            </>
          ) : (
            <span class="text-xs text-gray-400">No ratings yet</span>
          )}
        </div>
      </div>
    </div>
  );
});
