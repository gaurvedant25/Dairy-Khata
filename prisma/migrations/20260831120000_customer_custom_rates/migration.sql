-- Per-customer price overrides, keyed by product name (JSON object).
ALTER TABLE "Customer" ADD COLUMN "customRates" JSONB;
