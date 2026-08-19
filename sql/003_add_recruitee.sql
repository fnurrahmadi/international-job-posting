ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_ats_type_check;
ALTER TABLE companies ADD CONSTRAINT companies_ats_type_check
  CHECK (ats_type IN ('greenhouse', 'lever', 'ashby', 'smartrecruiters', 'recruitee'));
