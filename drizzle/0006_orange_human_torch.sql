CREATE TABLE "thread" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text,
	"model_key" text DEFAULT 'flash' NOT NULL,
	"provider_options" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "thread_user_idx" ON "thread" USING btree ("user_id","updated_at");