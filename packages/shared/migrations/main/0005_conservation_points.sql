ALTER TABLE "players" ADD COLUMN "conservation_points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "shop_exp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_conservation_nonneg" CHECK ("players"."conservation_points" >= 0);--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_shop_exp_nonneg" CHECK ("players"."shop_exp" >= 0);