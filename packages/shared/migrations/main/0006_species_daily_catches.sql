CREATE TABLE "species_daily_catches" (
	"player_id" uuid NOT NULL,
	"day" date NOT NULL,
	"species_id" text NOT NULL,
	"count" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "species_daily_catches_player_id_day_species_id_pk" PRIMARY KEY("player_id","day","species_id"),
	CONSTRAINT "species_daily_catches_nonneg" CHECK ("species_daily_catches"."count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "species_daily_catches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "species_daily_catches" ADD CONSTRAINT "species_daily_catches_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "species_daily_catches" ADD CONSTRAINT "species_daily_catches_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;