-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.damage_reports (
  damage_id uuid NOT NULL DEFAULT gen_random_uuid(),
  rental_id uuid,
  reporter_id uuid,
  description text NOT NULL,
  image_before_url text,
  image_after_url text,
  damage_heatmap_url text,
  verification_score double precision,
  verified_by_agent boolean DEFAULT false,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'resolved'::text, 'rejected'::text])),
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT damage_reports_pkey PRIMARY KEY (damage_id),
  CONSTRAINT damage_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(user_id),
  CONSTRAINT damage_reports_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(rental_id)
);
CREATE TABLE public.enterprises (
  enterprise_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid,
  email text NOT NULL,
  phone text,
  address text,
  logo_url text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT enterprises_pkey PRIMARY KEY (enterprise_id),
  CONSTRAINT enterprises_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.items (
  item_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  description text,
  category text,
  image_url text,
  condition text,
  price_per_day numeric NOT NULL,
  available boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  enterprise_id uuid,
  dynamic_pricing_enabled boolean DEFAULT false,
  CONSTRAINT items_pkey PRIMARY KEY (item_id),
  CONSTRAINT items_enterprise_id_fkey FOREIGN KEY (enterprise_id) REFERENCES public.enterprises(enterprise_id),
  CONSTRAINT items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.payments (
  payment_id uuid NOT NULL DEFAULT gen_random_uuid(),
  rental_id uuid,
  user_id uuid,
  amount numeric NOT NULL,
  payment_method text NOT NULL CHECK (payment_method = ANY (ARRAY['card'::text, 'upi'::text, 'wallet'::text, 'cod'::text])),
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])),
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (payment_id),
  CONSTRAINT payments_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(rental_id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.ratings (
  rating_id uuid NOT NULL DEFAULT gen_random_uuid(),
  rental_id uuid,
  rated_user_id uuid,
  reviewer_user_id uuid,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  review text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT ratings_pkey PRIMARY KEY (rating_id),
  CONSTRAINT ratings_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(rental_id),
  CONSTRAINT ratings_rated_user_id_fkey FOREIGN KEY (rated_user_id) REFERENCES public.users(user_id),
  CONSTRAINT ratings_reviewer_user_id_fkey FOREIGN KEY (reviewer_user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.rentals (
  rental_id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid,
  renter_id uuid,
  lender_id uuid,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'completed'::text, 'cancelled'::text])),
  total_cost numeric,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  item_type text,
  CONSTRAINT rentals_pkey PRIMARY KEY (rental_id),
  CONSTRAINT rentals_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(item_id),
  CONSTRAINT rentals_renter_id_fkey FOREIGN KEY (renter_id) REFERENCES public.users(user_id),
  CONSTRAINT rentals_lender_id_fkey FOREIGN KEY (lender_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.users (
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  password_hash text NOT NULL,
  profile_pic text,
  address text,
  credibility_score numeric DEFAULT 0.0,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  latitude double precision,
  longitude double precision,
  CONSTRAINT users_pkey PRIMARY KEY (user_id)
);