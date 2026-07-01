CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"authors" json DEFAULT '[]' NOT NULL,
	"publication_year" integer,
	"average_rating" numeric(3, 2),
	"image_url" varchar(255),
	"ratings_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp
);
