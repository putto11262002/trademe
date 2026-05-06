CREATE TYPE "public"."trade_settlement_currency" AS ENUM('USD', 'THB');--> statement-breakpoint
ALTER TABLE "trade" ADD COLUMN "settlement_currency" "trade_settlement_currency";--> statement-breakpoint
UPDATE "trade" SET "settlement_currency" = CASE WHEN "fx_rate" IS NOT NULL THEN 'THB'::trade_settlement_currency ELSE 'USD'::trade_settlement_currency END;--> statement-breakpoint
ALTER TABLE "trade" ALTER COLUMN "settlement_currency" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "trade" ALTER COLUMN "settlement_currency" SET DEFAULT 'THB';
