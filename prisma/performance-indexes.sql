-- Database Performance Optimization Indexes
-- Run these SQL commands on your database for better query performance

-- Index on uptimes table for common queries
CREATE INDEX IF NOT EXISTS idx_uptimes_date ON uptimes(date);
CREATE INDEX IF NOT EXISTS idx_uptimes_status ON uptimes(status);
CREATE INDEX IF NOT EXISTS idx_uptimes_date_status ON uptimes(date, status);

-- Indexes on power supply foreign keys for faster joins
CREATE INDEX IF NOT EXISTS idx_uptimes_ejigbo_id ON uptimes("ejigboId");
CREATE INDEX IF NOT EXISTS idx_uptimes_isolo_id ON uptimes("isoloId");
CREATE INDEX IF NOT EXISTS idx_uptimes_gen1_id ON uptimes("gen1Id");
CREATE INDEX IF NOT EXISTS idx_uptimes_gen2_id ON uptimes("gen2Id");
CREATE INDEX IF NOT EXISTS idx_uptimes_gen3_id ON uptimes("gen3Id");
CREATE INDEX IF NOT EXISTS idx_uptimes_gen4_id ON uptimes("gen4Id");
CREATE INDEX IF NOT EXISTS idx_uptimes_gen5_id ON uptimes("gen5Id");
CREATE INDEX IF NOT EXISTS idx_uptimes_gen6_id ON uptimes("gen6Id");
CREATE INDEX IF NOT EXISTS idx_uptimes_gen7_id ON uptimes("gen7Id");
CREATE INDEX IF NOT EXISTS idx_uptimes_gen8_id ON uptimes("gen8Id");
CREATE INDEX IF NOT EXISTS idx_uptimes_gen9_id ON uptimes("gen9Id");
CREATE INDEX IF NOT EXISTS idx_uptimes_gen10_id ON uptimes("gen10Id");
CREATE INDEX IF NOT EXISTS idx_uptimes_gen11_id ON uptimes("gen11Id");
CREATE INDEX IF NOT EXISTS idx_uptimes_gen12_id ON uptimes("gen12Id");

-- Composite index for the most common query pattern (date range with status)
CREATE INDEX IF NOT EXISTS idx_uptimes_date_range_status ON uptimes(date DESC, status);
