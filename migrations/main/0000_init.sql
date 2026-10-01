CREATE TYPE "public"."auction_status" AS ENUM('active', 'sold', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."bite_status" AS ENUM('pending', 'caught', 'escaped', 'expired');--> statement-breakpoint
CREATE TYPE "public"."breeding_status" AS ENUM('active', 'hatched', 'failed');--> statement-breakpoint
CREATE TYPE "public"."conservation_status" AS ENUM('stable', 'vulnerable', 'protected', 'extinct_wild');--> statement-breakpoint
CREATE TYPE "public"."daily_counter_kind" AS ENUM('attendance', 'ad_gold', 'ad_premium', 'ad_stamina', 'ad_time_ticket', 'buy_stamina', 'buy_time_ticket', 'ancient_entry');--> statement-breakpoint
CREATE TYPE "public"."device_platform" AS ENUM('android', 'ios');--> statement-breakpoint
CREATE TYPE "public"."encounter_status" AS ENUM('active', 'finished', 'expired');--> statement-breakpoint
CREATE TYPE "public"."expedition_status" AS ENUM('active', 'completed', 'claimed');--> statement-breakpoint
CREATE TYPE "public"."fish_origin" AS ENUM('wild', 'farmed');--> statement-breakpoint
CREATE TYPE "public"."fish_status" AS ENUM('holding', 'tank', 'display', 'breeding', 'auction', 'released', 'sold', 'dead');--> statement-breakpoint
CREATE TYPE "public"."friend_status" AS ENUM('pending', 'accepted');--> statement-breakpoint
CREATE TYPE "public"."guild_role" AS ENUM('leader', 'officer', 'member');--> statement-breakpoint
CREATE TYPE "public"."high_grade_bite_mode" AS ENUM('auto', 'notify');--> statement-breakpoint
CREATE TYPE "public"."item_kind" AS ENUM('float', 'bait', 'growth');--> statement-breakpoint
CREATE TYPE "public"."payment_platform" AS ENUM('revenuecat', 'stripe');--> statement-breakpoint
CREATE TYPE "public"."progress_status" AS ENUM('active', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."rarity" AS ENUM('common', 'uncommon', 'rare', 'epic', 'legendary');--> statement-breakpoint
CREATE TYPE "public"."region_kind" AS ENUM('freshwater', 'sea', 'ancient');--> statement-breakpoint
CREATE TYPE "public"."salinity" AS ENUM('fresh', 'brackish', 'marine', 'euryhaline');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."tank_purpose" AS ENUM('breeding', 'display', 'holding');--> statement-breakpoint
CREATE TABLE "aquarium_ratings" (
	"season" smallint NOT NULL,
	"visitor_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"score" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "aquarium_ratings_season_visitor_id_owner_id_pk" PRIMARY KEY("season","visitor_id","owner_id"),
	CONSTRAINT "aquarium_ratings_score_range" CHECK ("aquarium_ratings"."score" between 1 and 5),
	CONSTRAINT "aquarium_ratings_not_self" CHECK ("aquarium_ratings"."visitor_id" <> "aquarium_ratings"."owner_id")
);
--> statement-breakpoint
ALTER TABLE "aquarium_ratings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auction_bids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auction_id" uuid NOT NULL,
	"bidder_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auction_bids" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auctions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"fish_id" uuid NOT NULL,
	"start_price" bigint NOT NULL,
	"buyout_price" bigint,
	"current_bid" bigint,
	"current_bidder_id" uuid,
	"fee_rate" real NOT NULL,
	"status" "auction_status" DEFAULT 'active' NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"version" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "auctions_buyout_gte_start" CHECK ("auctions"."buyout_price" is null or "auctions"."buyout_price" >= "auctions"."start_price")
);
--> statement-breakpoint
ALTER TABLE "auctions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "breedings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"tank_id" uuid NOT NULL,
	"parent_a_id" uuid NOT NULL,
	"parent_b_id" uuid NOT NULL,
	"status" "breeding_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ready_at" timestamp with time zone NOT NULL,
	"offspring_count" smallint,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "breedings_distinct_parents" CHECK ("breedings"."parent_a_id" <> "breedings"."parent_b_id")
);
--> statement-breakpoint
ALTER TABLE "breedings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "daily_counters" (
	"player_id" uuid NOT NULL,
	"day" date NOT NULL,
	"kind" "daily_counter_kind" NOT NULL,
	"count" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "daily_counters_player_id_day_kind_pk" PRIMARY KEY("player_id","day","kind")
);
--> statement-breakpoint
ALTER TABLE "daily_counters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "dex_entries" (
	"player_id" uuid NOT NULL,
	"species_id" text NOT NULL,
	"morph_key" text DEFAULT '' NOT NULL,
	"first_obtained_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dex_entries_player_id_species_id_morph_key_pk" PRIMARY KEY("player_id","species_id","morph_key")
);
--> statement-breakpoint
ALTER TABLE "dex_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "expeditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"hunter_id" uuid NOT NULL,
	"region_id" text NOT NULL,
	"status" "expedition_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"stamina_cost" smallint NOT NULL,
	"used_time_ticket" boolean DEFAULT false NOT NULL,
	"result" jsonb,
	"claimed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "expeditions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "fish" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid,
	"species_id" text NOT NULL,
	"origin" "fish_origin" NOT NULL,
	"sex" "sex" NOT NULL,
	"generation" smallint DEFAULT 0 NOT NULL,
	"genotype" jsonb NOT NULL,
	"morph_key" text NOT NULL,
	"size_cm" real NOT NULL,
	"health" real NOT NULL,
	"growth_rate" real NOT NULL,
	"inbreeding" real DEFAULT 0 NOT NULL,
	"maturity" real DEFAULT 0 NOT NULL,
	"stats_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"parent_a_id" uuid,
	"parent_b_id" uuid,
	"tank_id" uuid,
	"status" "fish_status" DEFAULT 'holding' NOT NULL,
	"caught_region_id" text,
	"nickname" varchar(20),
	"born_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fish_health_range" CHECK ("fish"."health" between 0 and 100),
	CONSTRAINT "fish_inbreeding_range" CHECK ("fish"."inbreeding" between 0 and 1),
	CONSTRAINT "fish_maturity_range" CHECK ("fish"."maturity" between 0 and 1)
);
--> statement-breakpoint
ALTER TABLE "fish" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "friendships" (
	"requester_id" uuid NOT NULL,
	"addressee_id" uuid NOT NULL,
	"status" "friend_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "friendships_requester_id_addressee_id_pk" PRIMARY KEY("requester_id","addressee_id"),
	CONSTRAINT "friendships_not_self" CHECK ("friendships"."requester_id" <> "friendships"."addressee_id")
);
--> statement-breakpoint
ALTER TABLE "friendships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "guild_members" (
	"player_id" uuid PRIMARY KEY NOT NULL,
	"guild_id" uuid NOT NULL,
	"role" "guild_role" DEFAULT 'member' NOT NULL,
	"contribution" integer DEFAULT 0 NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guild_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "guild_quest_contributions" (
	"quest_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "guild_quest_contributions_quest_id_player_id_pk" PRIMARY KEY("quest_id","player_id")
);
--> statement-breakpoint
ALTER TABLE "guild_quest_contributions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "guild_quests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"species_id" text NOT NULL,
	"target_count" integer NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"status" "progress_status" DEFAULT 'active' NOT NULL,
	"reward" jsonb NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guild_quests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "guilds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(20) NOT NULL,
	"leader_id" uuid,
	"level" smallint DEFAULT 1 NOT NULL,
	"member_limit" smallint DEFAULT 20 NOT NULL,
	"notice" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guilds_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "guilds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "hunters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(20) NOT NULL,
	"level" smallint DEFAULT 1 NOT NULL,
	"skills" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hunters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "items" (
	"id" text PRIMARY KEY NOT NULL,
	"name_ko" varchar(40) NOT NULL,
	"kind" "item_kind" NOT NULL,
	"grade" "rarity" NOT NULL,
	"chance_bonus" real DEFAULT 0 NOT NULL,
	"target_species_id" text,
	"price_gold" bigint,
	"price_premium" integer,
	"sort_order" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "market_prices" (
	"species_id" text PRIMARY KEY NOT NULL,
	"current_price" integer NOT NULL,
	"supply_index" real DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "market_prices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "morph_discoveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"species_id" text NOT NULL,
	"morph_key" text NOT NULL,
	"discoverer_id" uuid,
	"fish_id" uuid,
	"name" varchar(30),
	"discovered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"named_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "morph_discoveries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "player_items" (
	"player_id" uuid NOT NULL,
	"item_id" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "player_items_player_id_item_id_pk" PRIMARY KEY("player_id","item_id"),
	CONSTRAINT "player_items_count_nonneg" CHECK ("player_items"."count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "player_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nickname" varchar(20) NOT NULL,
	"level" smallint DEFAULT 1 NOT NULL,
	"exp" integer DEFAULT 0 NOT NULL,
	"gold" bigint DEFAULT 0 NOT NULL,
	"premium" integer DEFAULT 0 NOT NULL,
	"stamina" integer NOT NULL,
	"stamina_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"time_tickets" smallint DEFAULT 0 NOT NULL,
	"tickets_granted_on" date,
	"vip_points" integer DEFAULT 0 NOT NULL,
	"vip_tier" smallint DEFAULT 0 NOT NULL,
	"shop_stage" smallint DEFAULT 1 NOT NULL,
	"tutorial_step" smallint DEFAULT 0 NOT NULL,
	"auto_minigame" boolean DEFAULT false NOT NULL,
	"high_grade_bite_mode" "high_grade_bite_mode" DEFAULT 'notify' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_nickname_unique" UNIQUE("nickname"),
	CONSTRAINT "players_gold_nonneg" CHECK ("players"."gold" >= 0),
	CONSTRAINT "players_premium_nonneg" CHECK ("players"."premium" >= 0),
	CONSTRAINT "players_stamina_nonneg" CHECK ("players"."stamina" >= 0),
	CONSTRAINT "players_tickets_nonneg" CHECK ("players"."time_tickets" >= 0)
);
--> statement-breakpoint
ALTER TABLE "players" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"platform" "payment_platform" NOT NULL,
	"transaction_id" text NOT NULL,
	"product_id" text NOT NULL,
	"premium_granted" integer DEFAULT 0 NOT NULL,
	"vip_points_granted" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "purchases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "push_tokens" (
	"token" text PRIMARY KEY NOT NULL,
	"player_id" uuid NOT NULL,
	"platform" "device_platform" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "push_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rare_bites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expedition_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"species_id" text NOT NULL,
	"status" bite_status DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"minigame_seed" integer NOT NULL,
	"float_id" text,
	"bait_id" text,
	"is_auto" boolean DEFAULT false NOT NULL,
	"fish_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "rare_bites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "regions" (
	"id" text PRIMARY KEY NOT NULL,
	"name_ko" varchar(40) NOT NULL,
	"kind" "region_kind" NOT NULL,
	"unlock_stage" smallint NOT NULL,
	"required_level" smallint NOT NULL,
	"requires_time_ticket" boolean DEFAULT false NOT NULL,
	"special_map_chance" real DEFAULT 0.01 NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "regions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "restoration_contributions" (
	"event_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "restoration_contributions_event_id_player_id_pk" PRIMARY KEY("event_id","player_id")
);
--> statement-breakpoint
ALTER TABLE "restoration_contributions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "restoration_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(60) NOT NULL,
	"species_id" text,
	"target_count" integer NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"status" "progress_status" DEFAULT 'active' NOT NULL,
	"reward" jsonb NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "restoration_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "special_encounters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"expedition_id" uuid,
	"region_id" text NOT NULL,
	"species_id" text NOT NULL,
	"chances_left" smallint DEFAULT 5 NOT NULL,
	"status" "encounter_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "special_chances_range" CHECK ("special_encounters"."chances_left" between 0 and 5)
);
--> statement-breakpoint
ALTER TABLE "special_encounters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "species" (
	"id" text PRIMARY KEY NOT NULL,
	"name_ko" varchar(40) NOT NULL,
	"scientific_name" varchar(80),
	"region_id" text NOT NULL,
	"rarity" "rarity" NOT NULL,
	"is_original" boolean DEFAULT false NOT NULL,
	"is_special_map_only" boolean DEFAULT false NOT NULL,
	"breedable" boolean DEFAULT true NOT NULL,
	"auctionable" boolean DEFAULT true NOT NULL,
	"temp_min" real NOT NULL,
	"temp_max" real NOT NULL,
	"salinity" "salinity" NOT NULL,
	"max_size_cm" real NOT NULL,
	"min_tank_size" smallint DEFAULT 1 NOT NULL,
	"base_price" integer NOT NULL,
	"gene_loci" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"initial_population" integer NOT NULL,
	"regen_rate_per_day" real DEFAULT 0.02 NOT NULL,
	CONSTRAINT "species_temp_range" CHECK ("species"."temp_min" <= "species"."temp_max")
);
--> statement-breakpoint
ALTER TABLE "species" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"player_id" uuid PRIMARY KEY NOT NULL,
	"platform" "payment_platform" NOT NULL,
	"product_id" text NOT NULL,
	"active_until" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tanks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(20),
	"purpose" "tank_purpose" NOT NULL,
	"salinity" "salinity" NOT NULL,
	"size_class" smallint DEFAULT 1 NOT NULL,
	"capacity" smallint NOT NULL,
	"is_ancient" boolean DEFAULT false NOT NULL,
	"temperature" real NOT NULL,
	"water_quality" real DEFAULT 100 NOT NULL,
	"quality_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"equipment" jsonb DEFAULT '{"filter":0,"heater":0,"feeder":0}'::jsonb NOT NULL,
	"pos_x" smallint DEFAULT 0 NOT NULL,
	"pos_y" smallint DEFAULT 0 NOT NULL,
	"skin_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tanks_quality_range" CHECK ("tanks"."water_quality" between 0 and 100)
);
--> statement-breakpoint
ALTER TABLE "tanks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wild_populations" (
	"species_id" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"hidden_reserve" integer DEFAULT 0 NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"status" "conservation_status" DEFAULT 'stable' NOT NULL,
	"last_regen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "wild_count_nonneg" CHECK ("wild_populations"."count" >= 0),
	CONSTRAINT "wild_reserved_nonneg" CHECK ("wild_populations"."reserved" >= 0),
	CONSTRAINT "wild_hidden_nonneg" CHECK ("wild_populations"."hidden_reserve" >= 0)
);
--> statement-breakpoint
ALTER TABLE "wild_populations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "aquarium_ratings" ADD CONSTRAINT "aquarium_ratings_visitor_id_players_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aquarium_ratings" ADD CONSTRAINT "aquarium_ratings_owner_id_players_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction_bids" ADD CONSTRAINT "auction_bids_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auction_bids" ADD CONSTRAINT "auction_bids_bidder_id_players_id_fk" FOREIGN KEY ("bidder_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_seller_id_players_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_fish_id_fish_id_fk" FOREIGN KEY ("fish_id") REFERENCES "public"."fish"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_current_bidder_id_players_id_fk" FOREIGN KEY ("current_bidder_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breedings" ADD CONSTRAINT "breedings_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breedings" ADD CONSTRAINT "breedings_tank_id_tanks_id_fk" FOREIGN KEY ("tank_id") REFERENCES "public"."tanks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breedings" ADD CONSTRAINT "breedings_parent_a_id_fish_id_fk" FOREIGN KEY ("parent_a_id") REFERENCES "public"."fish"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breedings" ADD CONSTRAINT "breedings_parent_b_id_fish_id_fk" FOREIGN KEY ("parent_b_id") REFERENCES "public"."fish"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_counters" ADD CONSTRAINT "daily_counters_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dex_entries" ADD CONSTRAINT "dex_entries_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dex_entries" ADD CONSTRAINT "dex_entries_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expeditions" ADD CONSTRAINT "expeditions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expeditions" ADD CONSTRAINT "expeditions_hunter_id_hunters_id_fk" FOREIGN KEY ("hunter_id") REFERENCES "public"."hunters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expeditions" ADD CONSTRAINT "expeditions_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fish" ADD CONSTRAINT "fish_owner_id_players_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fish" ADD CONSTRAINT "fish_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fish" ADD CONSTRAINT "fish_parent_a_id_fish_id_fk" FOREIGN KEY ("parent_a_id") REFERENCES "public"."fish"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fish" ADD CONSTRAINT "fish_parent_b_id_fish_id_fk" FOREIGN KEY ("parent_b_id") REFERENCES "public"."fish"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fish" ADD CONSTRAINT "fish_tank_id_tanks_id_fk" FOREIGN KEY ("tank_id") REFERENCES "public"."tanks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fish" ADD CONSTRAINT "fish_caught_region_id_regions_id_fk" FOREIGN KEY ("caught_region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_players_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addressee_id_players_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_members" ADD CONSTRAINT "guild_members_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_members" ADD CONSTRAINT "guild_members_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_quest_contributions" ADD CONSTRAINT "guild_quest_contributions_quest_id_guild_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."guild_quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_quest_contributions" ADD CONSTRAINT "guild_quest_contributions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_quests" ADD CONSTRAINT "guild_quests_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_quests" ADD CONSTRAINT "guild_quests_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guilds" ADD CONSTRAINT "guilds_leader_id_players_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hunters" ADD CONSTRAINT "hunters_owner_id_players_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_target_species_id_species_id_fk" FOREIGN KEY ("target_species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_prices" ADD CONSTRAINT "market_prices_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "morph_discoveries" ADD CONSTRAINT "morph_discoveries_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "morph_discoveries" ADD CONSTRAINT "morph_discoveries_discoverer_id_players_id_fk" FOREIGN KEY ("discoverer_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "morph_discoveries" ADD CONSTRAINT "morph_discoveries_fish_id_fish_id_fk" FOREIGN KEY ("fish_id") REFERENCES "public"."fish"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_items" ADD CONSTRAINT "player_items_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_items" ADD CONSTRAINT "player_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rare_bites" ADD CONSTRAINT "rare_bites_expedition_id_expeditions_id_fk" FOREIGN KEY ("expedition_id") REFERENCES "public"."expeditions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rare_bites" ADD CONSTRAINT "rare_bites_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rare_bites" ADD CONSTRAINT "rare_bites_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rare_bites" ADD CONSTRAINT "rare_bites_float_id_items_id_fk" FOREIGN KEY ("float_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rare_bites" ADD CONSTRAINT "rare_bites_bait_id_items_id_fk" FOREIGN KEY ("bait_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rare_bites" ADD CONSTRAINT "rare_bites_fish_id_fish_id_fk" FOREIGN KEY ("fish_id") REFERENCES "public"."fish"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restoration_contributions" ADD CONSTRAINT "restoration_contributions_event_id_restoration_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."restoration_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restoration_contributions" ADD CONSTRAINT "restoration_contributions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restoration_events" ADD CONSTRAINT "restoration_events_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_encounters" ADD CONSTRAINT "special_encounters_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_encounters" ADD CONSTRAINT "special_encounters_expedition_id_expeditions_id_fk" FOREIGN KEY ("expedition_id") REFERENCES "public"."expeditions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_encounters" ADD CONSTRAINT "special_encounters_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_encounters" ADD CONSTRAINT "special_encounters_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "species" ADD CONSTRAINT "species_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tanks" ADD CONSTRAINT "tanks_owner_id_players_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wild_populations" ADD CONSTRAINT "wild_populations_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "aquarium_ratings_owner_idx" ON "aquarium_ratings" USING btree ("season","owner_id");--> statement-breakpoint
CREATE INDEX "auction_bids_auction_idx" ON "auction_bids" USING btree ("auction_id","amount");--> statement-breakpoint
CREATE INDEX "auctions_active_ends_idx" ON "auctions" USING btree ("ends_at") WHERE "auctions"."status" = 'active';--> statement-breakpoint
CREATE INDEX "auctions_seller_idx" ON "auctions" USING btree ("seller_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auctions_one_active_per_fish" ON "auctions" USING btree ("fish_id") WHERE "auctions"."status" = 'active';--> statement-breakpoint
CREATE INDEX "breedings_player_status_idx" ON "breedings" USING btree ("player_id","status");--> statement-breakpoint
CREATE INDEX "expeditions_player_status_idx" ON "expeditions" USING btree ("player_id","status");--> statement-breakpoint
CREATE INDEX "expeditions_active_ends_idx" ON "expeditions" USING btree ("ends_at") WHERE "expeditions"."status" = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "expeditions_one_active_per_hunter" ON "expeditions" USING btree ("hunter_id") WHERE "expeditions"."status" = 'active';--> statement-breakpoint
CREATE INDEX "fish_owner_status_idx" ON "fish" USING btree ("owner_id","status");--> statement-breakpoint
CREATE INDEX "fish_tank_idx" ON "fish" USING btree ("tank_id");--> statement-breakpoint
CREATE INDEX "fish_species_morph_idx" ON "fish" USING btree ("species_id","morph_key");--> statement-breakpoint
CREATE INDEX "friendships_addressee_idx" ON "friendships" USING btree ("addressee_id");--> statement-breakpoint
CREATE INDEX "guild_members_guild_idx" ON "guild_members" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "guild_quests_guild_status_idx" ON "guild_quests" USING btree ("guild_id","status");--> statement-breakpoint
CREATE INDEX "hunters_owner_idx" ON "hunters" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "morph_discoveries_uidx" ON "morph_discoveries" USING btree ("species_id","morph_key");--> statement-breakpoint
CREATE UNIQUE INDEX "purchases_tx_uidx" ON "purchases" USING btree ("platform","transaction_id");--> statement-breakpoint
CREATE INDEX "purchases_player_idx" ON "purchases" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "push_tokens_player_idx" ON "push_tokens" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "rare_bites_player_status_idx" ON "rare_bites" USING btree ("player_id","status");--> statement-breakpoint
CREATE INDEX "rare_bites_pending_expires_idx" ON "rare_bites" USING btree ("expires_at") WHERE "rare_bites"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "restoration_contrib_rank_idx" ON "restoration_contributions" USING btree ("event_id","amount");--> statement-breakpoint
CREATE INDEX "restoration_events_status_idx" ON "restoration_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "special_encounters_player_idx" ON "special_encounters" USING btree ("player_id","status");--> statement-breakpoint
CREATE INDEX "species_region_idx" ON "species" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "tanks_owner_idx" ON "tanks" USING btree ("owner_id");