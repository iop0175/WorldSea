CREATE TABLE "bite_attempts" (
	"bite_id" uuid NOT NULL,
	"attempt_no" smallint NOT NULL,
	"float_id" text,
	"bait_id" text,
	"position" real,
	"is_auto" boolean DEFAULT false NOT NULL,
	"success" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bite_attempts_bite_id_attempt_no_pk" PRIMARY KEY("bite_id","attempt_no")
);
--> statement-breakpoint
ALTER TABLE "bite_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rare_bites" ADD COLUMN "attempts_used" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bite_attempts" ADD CONSTRAINT "bite_attempts_bite_id_rare_bites_id_fk" FOREIGN KEY ("bite_id") REFERENCES "public"."rare_bites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bite_attempts" ADD CONSTRAINT "bite_attempts_float_id_items_id_fk" FOREIGN KEY ("float_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bite_attempts" ADD CONSTRAINT "bite_attempts_bait_id_items_id_fk" FOREIGN KEY ("bait_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rare_bites" ADD CONSTRAINT "rare_bites_attempts_range" CHECK ("rare_bites"."attempts_used" between 0 and 10);