-- AddColumn: seller data fields and KSeF token on User model
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerNip"          TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerName"         TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerAddress"      TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerCity"         TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerZip"          TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ksefTokenEncrypted" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ksefEnvironment"    TEXT DEFAULT 'test';
