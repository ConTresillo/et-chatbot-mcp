ALTER TABLE "widgets" ALTER COLUMN "default_provider" SET DEFAULT 'openai-compatible';--> statement-breakpoint
ALTER TABLE "widgets" ADD COLUMN "model" varchar(255);--> statement-breakpoint
ALTER TABLE "widgets" ADD COLUMN "base_url" varchar(2048);--> statement-breakpoint
ALTER TABLE "widgets" ADD COLUMN "api_key" text;