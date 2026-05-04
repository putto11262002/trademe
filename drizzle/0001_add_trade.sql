CREATE TYPE "public"."trade_side" AS ENUM('buy', 'sell');--> statement-breakpoint
CREATE TYPE "public"."trade_source" AS ENUM('manual');--> statement-breakpoint
CREATE TABLE "trade" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"ticker" text NOT NULL,
	"side" "trade_side" NOT NULL,
	"quantity" numeric(18, 8) NOT NULL,
	"price_per_share" numeric(18, 4) NOT NULL,
	"fees" numeric(18, 4) DEFAULT '0' NOT NULL,
	"fx_rate" numeric(18, 6),
	"traded_at" timestamp with time zone NOT NULL,
	"source" "trade_source" DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "trade_user_ticker_idx" ON "trade" USING btree ("user_id","ticker");--> statement-breakpoint
CREATE INDEX "trade_user_traded_at_idx" ON "trade" USING btree ("user_id","traded_at");