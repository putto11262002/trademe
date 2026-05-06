ALTER TABLE "market_company_profile" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "market_company_profile" ADD COLUMN "currency" text;--> statement-breakpoint
ALTER TABLE "market_company_profile" ADD COLUMN "ipo_date" date;--> statement-breakpoint
ALTER TABLE "market_company_profile" ADD COLUMN "last_refreshed_at" timestamp with time zone;--> statement-breakpoint
UPDATE "trade" SET "ticker" = UPPER("ticker") WHERE "ticker" <> UPPER("ticker");--> statement-breakpoint
INSERT INTO "market_company_profile" ("ticker", "name", "exchange")
SELECT DISTINCT t."ticker", t."ticker", 'UNKNOWN'
FROM "trade" t
LEFT JOIN "market_company_profile" p ON p."ticker" = t."ticker"
WHERE p."ticker" IS NULL;--> statement-breakpoint
ALTER TABLE "trade" ADD CONSTRAINT "trade_ticker_market_company_profile_ticker_fk" FOREIGN KEY ("ticker") REFERENCES "public"."market_company_profile"("ticker") ON DELETE no action ON UPDATE no action;
