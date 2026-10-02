CREATE TYPE "public"."iucn_category" AS ENUM('LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'DD', 'NE');--> statement-breakpoint
CREATE TYPE "public"."population_tier" AS ENUM('very_common', 'common', 'uncommon', 'scarce', 'very_scarce');--> statement-breakpoint
CREATE TYPE "public"."population_trend" AS ENUM('increasing', 'stable', 'decreasing', 'unknown');--> statement-breakpoint
ALTER TABLE "species" ADD COLUMN "iucn_category" "iucn_category";--> statement-breakpoint
ALTER TABLE "species" ADD COLUMN "iucn_year" smallint;--> statement-breakpoint
ALTER TABLE "species" ADD COLUMN "population_tier" "population_tier";--> statement-breakpoint
ALTER TABLE "species" ADD COLUMN "population_trend" "population_trend";--> statement-breakpoint
ALTER TABLE "species" ADD COLUMN "real_population_note" text;--> statement-breakpoint
ALTER TABLE "species" ADD COLUMN "data_source" text;