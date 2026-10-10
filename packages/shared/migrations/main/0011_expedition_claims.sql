CREATE TABLE "expedition_claims" (
	"player_id" uuid NOT NULL,
	"request_key" varchar(128) NOT NULL,
	"target" text NOT NULL,
	"response" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expedition_claims_player_id_request_key_pk" PRIMARY KEY("player_id","request_key")
);
--> statement-breakpoint
ALTER TABLE "expedition_claims" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "expedition_claims" ADD CONSTRAINT "expedition_claims_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;