ALTER TABLE "expeditions" ADD COLUMN "waiting_for_stamina" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "expeditions" ADD COLUMN "premium_spent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "fish" ADD COLUMN "expedition_id" uuid;--> statement-breakpoint
ALTER TABLE "fish" ADD COLUMN "pending_claim" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "rare_bites" ADD COLUMN "paused_repeat" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "fish" ADD CONSTRAINT "fish_expedition_id_expeditions_id_fk" FOREIGN KEY ("expedition_id") REFERENCES "public"."expeditions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fish_expedition_idx" ON "fish" USING btree ("expedition_id");--> statement-breakpoint
ALTER TABLE "expeditions" ADD CONSTRAINT "expeditions_premium_spent_nonneg" CHECK ("expeditions"."premium_spent" >= 0);
