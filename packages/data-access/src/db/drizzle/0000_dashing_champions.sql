CREATE TYPE "public"."role" AS ENUM('user', 'runner', 'admin');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"privy_did" char(35) NOT NULL,
	"email" varchar(255),
	"username" char(15) NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"strava_username" varchar(255),
	"strava_id" integer,
	"profile_picture_url" varchar DEFAULT 'https://rsg5uys7zq.ufs.sh/f/AMgtrA9DGKkFTTUitgzI9xWiHtmo3wu4PcnYaCGO1jX0bRBQ' NOT NULL,
	"wallet_address" char(42) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_privy_did_unique" UNIQUE("privy_did"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "privy_did_idx" ON "users" USING btree ("privy_did");--> statement-breakpoint
CREATE UNIQUE INDEX "username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_address_idx" ON "users" USING btree ("wallet_address");