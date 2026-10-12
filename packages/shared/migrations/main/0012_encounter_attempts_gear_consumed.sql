CREATE TABLE "encounter_attempts" (
	"encounter_id" uuid NOT NULL,
	"attempt_no" smallint NOT NULL,
	"float_id" text,
	"bait_id" text,
	"position" real NOT NULL,
	"chance" real NOT NULL,
	"success" boolean NOT NULL,
	"gear_consumed" boolean DEFAULT true NOT NULL,
	"release_reason" text,
	"fish_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "encounter_attempts_encounter_id_attempt_no_pk" PRIMARY KEY("encounter_id","attempt_no")
);
--> statement-breakpoint
ALTER TABLE "encounter_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "regions" ALTER COLUMN "special_map_chance" SET DEFAULT 0.001;--> statement-breakpoint
ALTER TABLE "bite_attempts" ADD COLUMN "gear_consumed" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "bite_attempts" ADD COLUMN "release_reason" text;--> statement-breakpoint
ALTER TABLE "encounter_attempts" ADD CONSTRAINT "encounter_attempts_encounter_id_special_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."special_encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter_attempts" ADD CONSTRAINT "encounter_attempts_float_id_items_id_fk" FOREIGN KEY ("float_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter_attempts" ADD CONSTRAINT "encounter_attempts_bait_id_items_id_fk" FOREIGN KEY ("bait_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounter_attempts" ADD CONSTRAINT "encounter_attempts_fish_id_fish_id_fk" FOREIGN KEY ("fish_id") REFERENCES "public"."fish"("id") ON DELETE set null ON UPDATE no action;