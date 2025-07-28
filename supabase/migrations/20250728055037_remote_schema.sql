

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."current_user_role"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Select the role from the profiles table for the currently authenticated user
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  -- Return the fetched role. It will be NULL if no profile exists.
  RETURN user_role;
END;
$$;


ALTER FUNCTION "public"."current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_best_supply_options"() RETURNS TABLE("fuel_name" "text", "base_name" "text", "company_name" "text", "best_price" numeric, "savings" numeric)
    LANGUAGE "sql"
    AS $$
  WITH latest_prices AS (
    SELECT
      (fuel_data ->> 'name') as fuel_name,
      b.name as base_name,
      c.name as company_name,
      (price_data ->> 'price')::numeric as price,
      pe.entry_date,
      ROW_NUMBER() OVER(PARTITION BY (fuel_data ->> 'name'), b.name ORDER BY (price_data ->> 'price')::numeric ASC, pe.entry_date DESC) as rn,
      AVG((price_data ->> 'price')::numeric) OVER(PARTITION BY (fuel_data ->> 'name'), b.name) as avg_price
    FROM
      public.price_entries pe
      JOIN public.companies c ON pe.company_id = c.id
      JOIN public.bases b ON pe.base_id = b.id,
      jsonb_array_elements(pe.fuels) as fuel_data,
      jsonb_array_elements(fuel_data -> 'prices') as price_data
    WHERE (fuel_data ->> 'has_product')::boolean IS NOT FALSE
  )
  SELECT
    lp.fuel_name,
    lp.base_name,
    lp.company_name,
    lp.price as best_price,
    (lp.avg_price - lp.price) as savings
  FROM latest_prices lp
  WHERE lp.rn = 1;
$$;


ALTER FUNCTION "public"."get_best_supply_options"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_kpis"() RETURNS TABLE("avg_gasoline" numeric, "gasoline_change" numeric, "avg_diesel" numeric, "diesel_change" numeric, "avg_ethanol" numeric, "ethanol_change" numeric, "latest_usd_rate" numeric, "usd_change" numeric)
    LANGUAGE "sql"
    AS $$
  WITH fuel_prices AS (
    SELECT
      (fuel_data ->> 'name') as fuel_name,
      (price_data ->> 'price')::numeric as price,
      pe.entry_date
    FROM
      public.price_entries pe,
      jsonb_array_elements(pe.fuels) as fuel_data,
      jsonb_array_elements(fuel_data -> 'prices') as price_data
    WHERE pe.entry_date >= (now() - '7 days'::interval)
  ),
  fuel_calcs AS (
    SELECT
      avg(price) FILTER (WHERE lower(fuel_name) LIKE '%gasolina%') as avg_gasoline,
      (avg(price) FILTER (WHERE lower(fuel_name) LIKE '%gasolina%' AND entry_date = current_date) - avg(price) FILTER (WHERE lower(fuel_name) LIKE '%gasolina%' AND entry_date = current_date - 1)) / NULLIF(avg(price) FILTER (WHERE lower(fuel_name) LIKE '%gasolina%' AND entry_date = current_date - 1), 0) * 100 as gasoline_change,
      avg(price) FILTER (WHERE lower(fuel_name) LIKE '%diesel%') as avg_diesel,
      (avg(price) FILTER (WHERE lower(fuel_name) LIKE '%diesel%' AND entry_date = current_date) - avg(price) FILTER (WHERE lower(fuel_name) LIKE '%diesel%' AND entry_date = current_date - 1)) / NULLIF(avg(price) FILTER (WHERE lower(fuel_name) LIKE '%diesel%' AND entry_date = current_date - 1), 0) * 100 as diesel_change,
      avg(price) FILTER (WHERE lower(fuel_name) LIKE '%etanol%') as avg_ethanol,
      (avg(price) FILTER (WHERE lower(fuel_name) LIKE '%etanol%' AND entry_date = current_date) - avg(price) FILTER (WHERE lower(fuel_name) LIKE '%etanol%' AND entry_date = current_date - 1)) / NULLIF(avg(price) FILTER (WHERE lower(fuel_name) LIKE '%etanol%' AND entry_date = current_date - 1), 0) * 100 as ethanol_change
    FROM fuel_prices
  ),
  usd_rates AS (
    SELECT
      sell_rate,
      rate_date,
      LAG(sell_rate, 1) OVER (ORDER BY rate_date) as prev_rate
    FROM public.dollar_rates
    ORDER BY rate_date DESC
    LIMIT 2
  ),
  usd_calcs AS (
    SELECT
      (SELECT sell_rate FROM usd_rates ORDER BY rate_date DESC LIMIT 1) as latest_usd_rate,
      (SELECT (sell_rate - prev_rate) / NULLIF(prev_rate, 0) * 100 FROM usd_rates WHERE prev_rate IS NOT NULL LIMIT 1) as usd_change
  )
  SELECT * FROM fuel_calcs, usd_calcs;
$$;


ALTER FUNCTION "public"."get_dashboard_kpis"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_price_trends"("days_period" integer) RETURNS TABLE("entry_day" "date", "avg_gasoline" numeric, "avg_diesel" numeric, "avg_ethanol" numeric)
    LANGUAGE "sql"
    AS $$
  WITH daily_prices AS (
    SELECT
      pe.entry_date,
      (fuel_data ->> 'name') as fuel_name,
      (price_data ->> 'price')::numeric as price
    FROM
      public.price_entries pe,
      jsonb_array_elements(pe.fuels) as fuel_data,
      jsonb_array_elements(fuel_data -> 'prices') as price_data
    WHERE pe.entry_date >= (now() - (days_period || ' days')::interval)
  )
  SELECT
    dp.entry_date as entry_day,
    avg(dp.price) FILTER (WHERE lower(dp.fuel_name) LIKE '%gasolina%') as avg_gasoline,
    avg(dp.price) FILTER (WHERE lower(dp.fuel_name) LIKE '%diesel%') as avg_diesel,
    avg(dp.price) FILTER (WHERE lower(dp.fuel_name) LIKE '%etanol%') as avg_ethanol
  FROM daily_prices dp
  GROUP BY dp.entry_date
  ORDER BY dp.entry_date;
$$;


ALTER FUNCTION "public"."get_price_trends"("days_period" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'viewer' -- Default role for new users
  );
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "city" "text",
    "state_code" character(2),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."carriers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."carriers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dollar_rates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rate_date" "date" NOT NULL,
    "buy_rate" numeric(10,4) NOT NULL,
    "sell_rate" numeric(10,4) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dollar_rates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."freights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "origin_base_id" "uuid",
    "destination_city" "text" NOT NULL,
    "cost_per_liter" numeric(10,4) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "carrier_id" "uuid",
    "destination_station_id" "uuid"
);


ALTER TABLE "public"."freights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "event_type" "text" NOT NULL,
    "impact_level" "text" NOT NULL,
    "event_date" "date" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."market_events" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."price_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "legend_id" "uuid",
    "entry_date" "date" NOT NULL,
    "fuels" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid",
    "base_id" "uuid",
    "is_white_label" boolean DEFAULT false,
    "has_unavailable_product" boolean DEFAULT false
);


ALTER TABLE "public"."price_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."price_legends" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."price_legends" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "role" "text" DEFAULT 'viewer'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "brand" "text",
    "city" "text" NOT NULL,
    "state_code" character(2) NOT NULL,
    "address" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stations" OWNER TO "postgres";


ALTER TABLE ONLY "public"."bases"
    ADD CONSTRAINT "bases_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."bases"
    ADD CONSTRAINT "bases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carriers"
    ADD CONSTRAINT "carriers_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."carriers"
    ADD CONSTRAINT "carriers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dollar_rates"
    ADD CONSTRAINT "dollar_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dollar_rates"
    ADD CONSTRAINT "dollar_rates_rate_date_key" UNIQUE ("rate_date");



ALTER TABLE ONLY "public"."freights"
    ADD CONSTRAINT "freights_origin_base_id_destination_city_key" UNIQUE ("origin_base_id", "destination_city");



ALTER TABLE ONLY "public"."freights"
    ADD CONSTRAINT "freights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_events"
    ADD CONSTRAINT "market_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."price_entries"
    ADD CONSTRAINT "price_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."price_legends"
    ADD CONSTRAINT "price_legends_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."price_legends"
    ADD CONSTRAINT "price_legends_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stations"
    ADD CONSTRAINT "stations_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "handle_stations_updated_at" BEFORE UPDATE ON "public"."stations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_price_entries_updated_at" BEFORE UPDATE ON "public"."price_entries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."freights"
    ADD CONSTRAINT "freights_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "public"."carriers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."freights"
    ADD CONSTRAINT "freights_destination_station_id_fkey" FOREIGN KEY ("destination_station_id") REFERENCES "public"."stations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."freights"
    ADD CONSTRAINT "freights_origin_base_id_fkey" FOREIGN KEY ("origin_base_id") REFERENCES "public"."bases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."market_events"
    ADD CONSTRAINT "market_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."price_entries"
    ADD CONSTRAINT "price_entries_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "public"."bases"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."price_entries"
    ADD CONSTRAINT "price_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."price_entries"
    ADD CONSTRAINT "price_entries_legend_id_fkey" FOREIGN KEY ("legend_id") REFERENCES "public"."price_legends"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Authenticated users can view carriers" ON "public"."carriers" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view dollar rates" ON "public"."dollar_rates" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view freights" ON "public"."freights" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view market events." ON "public"."market_events" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."current_user_role"() IS NOT NULL)));



CREATE POLICY "Authenticated users can view stations" ON "public"."stations" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Only owners can delete profiles." ON "public"."profiles" FOR DELETE USING (("public"."current_user_role"() = 'owner'::"text"));



CREATE POLICY "Owners and editors can manage carriers" ON "public"."carriers" USING (("public"."current_user_role"() = ANY (ARRAY['owner'::"text", 'editor'::"text"])));



CREATE POLICY "Owners and editors can manage dollar rates" ON "public"."dollar_rates" USING (("public"."current_user_role"() = ANY (ARRAY['owner'::"text", 'editor'::"text"])));



CREATE POLICY "Owners and editors can manage freights" ON "public"."freights" USING (("public"."current_user_role"() = ANY (ARRAY['owner'::"text", 'editor'::"text"])));



CREATE POLICY "Owners and editors can manage market events." ON "public"."market_events" USING (("public"."current_user_role"() = ANY (ARRAY['owner'::"text", 'editor'::"text"])));



CREATE POLICY "Owners and editors can manage stations" ON "public"."stations" USING (("public"."current_user_role"() = ANY (ARRAY['owner'::"text", 'editor'::"text"])));



CREATE POLICY "Owners can update any profile, others can update their own." ON "public"."profiles" FOR UPDATE USING ((("auth"."uid"() = "id") OR ("public"."current_user_role"() = 'owner'::"text")));



CREATE POLICY "Owners can view all profiles, others can view their own." ON "public"."profiles" FOR SELECT USING ((("auth"."uid"() = "id") OR ("public"."current_user_role"() = 'owner'::"text")));



CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."carriers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dollar_rates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."freights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stations" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_best_supply_options"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_best_supply_options"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_best_supply_options"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_kpis"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_kpis"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_kpis"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_price_trends"("days_period" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_price_trends"("days_period" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_price_trends"("days_period" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."bases" TO "anon";
GRANT ALL ON TABLE "public"."bases" TO "authenticated";
GRANT ALL ON TABLE "public"."bases" TO "service_role";



GRANT ALL ON TABLE "public"."carriers" TO "anon";
GRANT ALL ON TABLE "public"."carriers" TO "authenticated";
GRANT ALL ON TABLE "public"."carriers" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."dollar_rates" TO "anon";
GRANT ALL ON TABLE "public"."dollar_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."dollar_rates" TO "service_role";



GRANT ALL ON TABLE "public"."freights" TO "anon";
GRANT ALL ON TABLE "public"."freights" TO "authenticated";
GRANT ALL ON TABLE "public"."freights" TO "service_role";



GRANT ALL ON TABLE "public"."market_events" TO "anon";
GRANT ALL ON TABLE "public"."market_events" TO "authenticated";
GRANT ALL ON TABLE "public"."market_events" TO "service_role";



GRANT ALL ON TABLE "public"."price_entries" TO "anon";
GRANT ALL ON TABLE "public"."price_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."price_entries" TO "service_role";



GRANT ALL ON TABLE "public"."price_legends" TO "anon";
GRANT ALL ON TABLE "public"."price_legends" TO "authenticated";
GRANT ALL ON TABLE "public"."price_legends" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."stations" TO "anon";
GRANT ALL ON TABLE "public"."stations" TO "authenticated";
GRANT ALL ON TABLE "public"."stations" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
