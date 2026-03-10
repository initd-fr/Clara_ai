-- Drop unused StoreDisplay table
DROP TABLE IF EXISTS "StoreDisplay";

-- Drop Models.temperature (marked as temporary in schema)
ALTER TABLE "Models" DROP COLUMN IF EXISTS "temperature";

-- Drop iaLlm.rating and iaLlm.ratingCount (unused)
ALTER TABLE "iaLlm" DROP COLUMN IF EXISTS "rating";
ALTER TABLE "iaLlm" DROP COLUMN IF EXISTS "ratingCount";
