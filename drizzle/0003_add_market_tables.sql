CREATE TYPE "public"."market_sentiment" AS ENUM('positive', 'negative', 'neutral');--> statement-breakpoint
CREATE TABLE "market_bar" (
	"ticker" text NOT NULL,
	"date" date NOT NULL,
	"open" numeric(18, 4) NOT NULL,
	"high" numeric(18, 4) NOT NULL,
	"low" numeric(18, 4) NOT NULL,
	"close" numeric(18, 4) NOT NULL,
	"volume" bigint NOT NULL,
	"adjusted_close" numeric(18, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "market_bar_ticker_date_pk" PRIMARY KEY("ticker","date")
);
--> statement-breakpoint
CREATE TABLE "market_fx_bar" (
	"from_currency" text NOT NULL,
	"to_currency" text NOT NULL,
	"date" date NOT NULL,
	"rate" numeric(18, 6) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "market_fx_bar_from_currency_to_currency_date_pk" PRIMARY KEY("from_currency","to_currency","date")
);
--> statement-breakpoint
CREATE TABLE "market_news_article" (
	"id" text PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"headline" text NOT NULL,
	"summary" text,
	"url" text NOT NULL,
	"source" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"sentiment" "market_sentiment",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_fundamentals" (
	"ticker" text NOT NULL,
	"as_of" date NOT NULL,
	"market_cap" numeric(20, 2),
	"pe_ratio" numeric(18, 4),
	"eps" numeric(18, 4),
	"revenue" numeric(20, 2),
	"week_52_high" numeric(18, 4),
	"week_52_low" numeric(18, 4),
	"dividend_yield" numeric(10, 6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "market_fundamentals_ticker_as_of_pk" PRIMARY KEY("ticker","as_of")
);
--> statement-breakpoint
CREATE TABLE "market_earnings_event" (
	"ticker" text NOT NULL,
	"date" date NOT NULL,
	"estimated_eps" numeric(18, 4),
	"actual_eps" numeric(18, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "market_earnings_event_ticker_date_pk" PRIMARY KEY("ticker","date")
);
--> statement-breakpoint
CREATE TABLE "market_company_profile" (
	"ticker" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"exchange" text NOT NULL,
	"sector" text,
	"industry" text,
	"logo_url" text,
	"website" text,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "market_news_article_ticker_published_idx" ON "market_news_article" USING btree ("ticker","published_at" desc);