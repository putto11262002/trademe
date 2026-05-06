CREATE TYPE "public"."trade_slip_status" AS ENUM('parsed', 'attached');--> statement-breakpoint
ALTER TYPE "public"."trade_source" ADD VALUE 'slip';--> statement-breakpoint
CREATE TABLE "trade_slip" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"status" "trade_slip_status" DEFAULT 'parsed' NOT NULL,
	"extraction" jsonb NOT NULL,
	"extraction_model" text NOT NULL,
	"parsed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trade" ADD COLUMN "broker" text;--> statement-breakpoint
ALTER TABLE "trade" ADD COLUMN "slip_id" uuid;--> statement-breakpoint
CREATE INDEX "trade_slip_user_idx" ON "trade_slip" USING btree ("user_id","parsed_at");--> statement-breakpoint
ALTER TABLE "trade" ADD CONSTRAINT "trade_slip_id_trade_slip_id_fk" FOREIGN KEY ("slip_id") REFERENCES "public"."trade_slip"("id") ON DELETE set null ON UPDATE no action;