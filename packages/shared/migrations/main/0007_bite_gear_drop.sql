ALTER TABLE "rare_bites" DROP CONSTRAINT "rare_bites_float_id_items_id_fk";
--> statement-breakpoint
ALTER TABLE "rare_bites" DROP CONSTRAINT "rare_bites_bait_id_items_id_fk";
--> statement-breakpoint
ALTER TABLE "rare_bites" DROP COLUMN "float_id";--> statement-breakpoint
ALTER TABLE "rare_bites" DROP COLUMN "bait_id";