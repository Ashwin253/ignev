-- Create custom status types if they don't exist
DO $$ BEGIN
    CREATE TYPE battery_status AS ENUM ('available', 'charging', 'reserved', 'unavailable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE station_power_source AS ENUM ('battery', 'solar', 'grid', 'hybrid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE station_status AS ENUM ('open', 'busy', 'offline');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create batteries table
CREATE TABLE IF NOT EXISTS public.batteries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  location text NOT NULL,
  status battery_status NOT NULL DEFAULT 'available',
  available_quantity integer NOT NULL DEFAULT 0,
  total_quantity integer NOT NULL DEFAULT 0,
  battery_percentage integer NOT NULL DEFAULT 0 CHECK (battery_percentage >= 0 AND battery_percentage <= 100),
  estimated_ready_minutes integer NOT NULL DEFAULT 0,
  managed_by text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create charging_stations table
CREATE TABLE IF NOT EXISTS public.charging_stations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  address text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  power_source station_power_source NOT NULL DEFAULT 'grid',
  available_ports integer NOT NULL DEFAULT 0,
  occupied_ports integer NOT NULL DEFAULT 0,
  waiting_minutes integer NOT NULL DEFAULT 0,
  status station_status NOT NULL DEFAULT 'open',
  has_wifi boolean NOT NULL DEFAULT false,
  opening_time text,
  closing_time text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.batteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charging_stations ENABLE ROW LEVEL SECURITY;

-- Create policies (Public select, Authenticated write)
CREATE POLICY "Public select batteries" ON public.batteries FOR SELECT USING (true);
CREATE POLICY "Authenticated insert batteries" ON public.batteries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update batteries" ON public.batteries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete batteries" ON public.batteries FOR DELETE TO authenticated USING (true);

CREATE POLICY "Public select charging_stations" ON public.charging_stations FOR SELECT USING (true);
CREATE POLICY "Authenticated insert charging_stations" ON public.charging_stations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update charging_stations" ON public.charging_stations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete charging_stations" ON public.charging_stations FOR DELETE TO authenticated USING (true);

-- Add triggers to auto-update updated_at timestamp
DROP TRIGGER IF EXISTS batteries_updated_at ON public.batteries;
CREATE TRIGGER batteries_updated_at
  BEFORE UPDATE ON public.batteries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS charging_stations_updated_at ON public.charging_stations;
CREATE TRIGGER charging_stations_updated_at
  BEFORE UPDATE ON public.charging_stations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable Realtime updates
ALTER PUBLICATION supabase_realtime ADD TABLE batteries;
ALTER PUBLICATION supabase_realtime ADD TABLE charging_stations;
