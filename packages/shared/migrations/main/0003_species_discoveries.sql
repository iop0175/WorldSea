CREATE TABLE "species_discoveries" (
	"species_id" text PRIMARY KEY NOT NULL,
	"discoverer_id" uuid,
	"discovered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "species_discoveries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "species_discoveries" ADD CONSTRAINT "species_discoveries_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "species_discoveries" ADD CONSTRAINT "species_discoveries_discoverer_id_players_id_fk" FOREIGN KEY ("discoverer_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;