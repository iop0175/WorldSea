CREATE TYPE "public"."catch_source" AS ENUM('expedition', 'rare_bite', 'special_map', 'legend_sighting');--> statement-breakpoint
CREATE TYPE "public"."currency_kind" AS ENUM('gold', 'premium', 'stamina', 'time_ticket', 'vip_points');--> statement-breakpoint
CREATE TYPE "public"."population_reason" AS ENUM('catch', 'bite_reserve', 'bite_return', 'release', 'regen', 'event', 'admin');--> statement-breakpoint
CREATE TYPE "public"."trade_kind" AS ENUM('npc_sale', 'auction_sale', 'auction_buyout');--> statement-breakpoint
CREATE TABLE "action_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"player_id" uuid NOT NULL,
	"action" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catch_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"player_id" uuid NOT NULL,
	"species_id" text NOT NULL,
	"fish_id" uuid,
	"region_id" text NOT NULL,
	"source" "catch_source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currency_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"player_id" uuid NOT NULL,
	"currency" "currency_kind" NOT NULL,
	"delta" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"reason" text NOT NULL,
	"ref_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gacha_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"player_id" uuid NOT NULL,
	"pool" text NOT NULL,
	"result_id" text NOT NULL,
	"grade" text NOT NULL,
	"premium_spent" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "population_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"species_id" text NOT NULL,
	"delta" integer NOT NULL,
	"count_after" integer NOT NULL,
	"reason" "population_reason" NOT NULL,
	"actor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kind" "trade_kind" NOT NULL,
	"seller_id" uuid NOT NULL,
	"buyer_id" uuid,
	"fish_id" uuid NOT NULL,
	"species_id" text NOT NULL,
	"morph_key" text,
	"price" integer NOT NULL,
	"fee" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "action_logs_player_time_idx" ON "action_logs" USING btree ("player_id","created_at");--> statement-breakpoint
CREATE INDEX "catch_logs_player_time_idx" ON "catch_logs" USING btree ("player_id","created_at");--> statement-breakpoint
CREATE INDEX "catch_logs_species_time_idx" ON "catch_logs" USING btree ("species_id","created_at");--> statement-breakpoint
CREATE INDEX "currency_logs_player_time_idx" ON "currency_logs" USING btree ("player_id","created_at");--> statement-breakpoint
CREATE INDEX "gacha_logs_player_time_idx" ON "gacha_logs" USING btree ("player_id","created_at");--> statement-breakpoint
CREATE INDEX "population_logs_species_time_idx" ON "population_logs" USING btree ("species_id","created_at");--> statement-breakpoint
CREATE INDEX "trade_logs_seller_time_idx" ON "trade_logs" USING btree ("seller_id","created_at");--> statement-breakpoint
CREATE INDEX "trade_logs_buyer_time_idx" ON "trade_logs" USING btree ("buyer_id","created_at");--> statement-breakpoint
CREATE INDEX "trade_logs_species_time_idx" ON "trade_logs" USING btree ("species_id","created_at");