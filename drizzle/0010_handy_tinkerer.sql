CREATE TABLE "ai_run" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"thread_id" text,
	"type" text NOT NULL,
	"model" text NOT NULL,
	"step_count" integer NOT NULL,
	"input_tokens" integer NOT NULL,
	"cache_read_tokens" integer DEFAULT 0 NOT NULL,
	"cache_write_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer NOT NULL,
	"reasoning_tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd" numeric(12, 8) NOT NULL,
	"duration_ms" integer NOT NULL,
	"finish_reason" text NOT NULL,
	"tools_used" text[] DEFAULT '{}' NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_run" ADD CONSTRAINT "ai_run_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_run_user_idx" ON "ai_run" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_run_thread_idx" ON "ai_run" USING btree ("thread_id");