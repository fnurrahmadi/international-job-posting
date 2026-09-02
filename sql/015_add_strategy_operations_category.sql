ALTER TABLE saved_searches DROP CONSTRAINT IF EXISTS saved_searches_role_category_check;
ALTER TABLE saved_searches ADD CONSTRAINT saved_searches_role_category_check
  CHECK (role_category IN ('ANALYTICS', 'DATA_ML', 'PRODUCT', 'STRATEGY_OPS'));
