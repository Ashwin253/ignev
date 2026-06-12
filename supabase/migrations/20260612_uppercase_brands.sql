-- SQL migration to clean existing brand names and enforce uppercase brand names in the database

-- 1. Clean existing records and merge TATA to TATA MOTORS
UPDATE public.evlistings SET brand = UPPER(TRIM(brand));
UPDATE public.ev_energy_comparisons SET brand = UPPER(TRIM(brand)) WHERE brand IS NOT NULL AND brand != '';

UPDATE public.evlistings SET brand = 'TATA MOTORS' WHERE brand = 'TATA';
UPDATE public.ev_energy_comparisons SET brand = 'TATA MOTORS' WHERE brand = 'TATA';

-- 2. Create trigger to enforce uppercase brand names on evlistings
CREATE OR REPLACE FUNCTION public.clean_brand_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.brand = UPPER(TRIM(NEW.brand));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER enforce_uppercase_brand
  BEFORE INSERT OR UPDATE ON public.evlistings
  FOR EACH ROW EXECUTE FUNCTION public.clean_brand_name();

-- 3. Create trigger to enforce uppercase brand names on ev_energy_comparisons
CREATE OR REPLACE FUNCTION public.clean_energy_brand_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.brand = UPPER(TRIM(NEW.brand));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER enforce_uppercase_energy_brand
  BEFORE INSERT OR UPDATE ON public.ev_energy_comparisons
  FOR EACH ROW EXECUTE FUNCTION public.clean_energy_brand_name();
