CREATE TYPE "public"."visibility" AS ENUM('public', 'hidden');--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "content" varchar(2000);--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "visibility" "visibility" DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "content" varchar(2000);--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "visibility" "visibility" DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "toPost" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "isPosted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" DROP COLUMN "is_profile";
