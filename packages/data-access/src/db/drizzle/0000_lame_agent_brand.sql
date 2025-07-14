CREATE TYPE "public"."role" AS ENUM('user', 'runner', 'admin');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"privyDID" char(35) NOT NULL,
	"email" varchar(255),
	"username" char(15) NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"stravaUsername" varchar(255),
	"stravaID" integer,
	"profilePictureUrl" varchar DEFAULT 'https://rsg5uys7zq.ufs.sh/f/AMgtrA9DGKkFTTUitgzI9xWiHtmo3wu4PcnYaCGO1jX0bRBQ' NOT NULL,
	"walletAddress" char(42) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "privyDIDIdx" ON "users" USING btree ("privyDID");--> statement-breakpoint
CREATE UNIQUE INDEX "emailIdx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "usernameIdx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "walletAddressIdx" ON "users" USING btree ("walletAddress");