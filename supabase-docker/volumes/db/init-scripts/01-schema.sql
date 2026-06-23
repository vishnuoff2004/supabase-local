-- ═══════════════════════════════════════════════════════════════
-- APPLICATION SCHEMA — Travel Agency PWA
-- Auto-generated from running database: 2026-06-23
-- ═══════════════════════════════════════════════════════════════
-- This file is mounted into the supabase-db container via
-- docker-compose.yml and executed on first startup.
-- ═══════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS public;

-- ENUMS

CREATE TYPE public."enum_Announcements_type" AS ENUM (
    'info', 'warning', 'alert'
);

CREATE TYPE public."enum_Bookings_status" AS ENUM (
    'Pending', 'Confirmed', 'On Trip', 'Completed', 'Cancelled'
);

CREATE TYPE public."enum_DriverAgencyRequests_status" AS ENUM (
    'Pending', 'Accepted', 'Denied'
);

CREATE TYPE public."enum_Drivers_vehicleType" AS ENUM (
    'Sedan', 'SUV', 'Hatchback', 'Van', 'Bus'
);

CREATE TYPE public."enum_Routes_status" AS ENUM (
    'active', 'completed', 'cancelled'
);

CREATE TYPE public."enum_Users_role" AS ENUM (
    'traveler', 'driver', 'agency_admin', 'admin'
);

CREATE TYPE public.enum_notifications_type AS ENUM (
    'info', 'booking', 'alert'
);

-- TABLES

CREATE TABLE IF NOT EXISTS public."Users" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255),
    phone character varying(255) NOT NULL,
    role public."enum_Users_role" DEFAULT 'traveler',
    active boolean DEFAULT true,
    "loginAttempts" integer DEFAULT 0,
    "lockedUntil" timestamp with time zone,
    "otpCode" character varying(6),
    "otpExpiry" timestamp with time zone,
    "isVerified" boolean DEFAULT false,
    "supabaseUid" uuid,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public."Agencies" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(255) NOT NULL,
    active boolean DEFAULT true,
    "createdBy" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "adminId" integer
);

CREATE TABLE IF NOT EXISTS public."Drivers" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "agencyId" integer,
    name character varying(255) NOT NULL,
    phone character varying(255) NOT NULL,
    "vehicleType" public."enum_Drivers_vehicleType",
    "vehicleReg" character varying(255),
    "licenseNo" character varying(255),
    available boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "licenseDocUrl" character varying(255),
    "vehicleRcUrl" character varying(255)
);

CREATE TABLE IF NOT EXISTS public."Routes" (
    id integer NOT NULL,
    "driverId" integer NOT NULL,
    source character varying(255) NOT NULL,
    destination character varying(255) NOT NULL,
    "departureTime" timestamp with time zone NOT NULL,
    "arrivalTime" timestamp with time zone NOT NULL,
    fare numeric(10,2) NOT NULL,
    capacity integer NOT NULL,
    available boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    status public."enum_Routes_status" DEFAULT 'active' NOT NULL
);

CREATE TABLE IF NOT EXISTS public."Bookings" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "routeId" integer NOT NULL,
    "driverId" integer NOT NULL,
    "seatCount" integer NOT NULL,
    "travelDate" date NOT NULL,
    status public."enum_Bookings_status" DEFAULT 'Pending',
    "cancelReason" character varying(255),
    "cancelledBy" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public."BookingStatusHistories" (
    id integer NOT NULL,
    "bookingId" integer NOT NULL,
    "fromStatus" character varying(255),
    "toStatus" character varying(255) NOT NULL,
    "changedBy" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public."DriverAgencyRequests" (
    id integer NOT NULL,
    "driverId" integer NOT NULL,
    "agencyId" integer NOT NULL,
    status public."enum_DriverAgencyRequests_status" DEFAULT 'Pending',
    message character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public."Events" (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    "startDate" timestamp with time zone NOT NULL,
    "endDate" timestamp with time zone NOT NULL,
    location character varying(255),
    "organizerId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public."Announcements" (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    body text NOT NULL,
    type public."enum_Announcements_type" DEFAULT 'info',
    active boolean DEFAULT true,
    "createdBy" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type public.enum_notifications_type DEFAULT 'info',
    title character varying(255) NOT NULL,
    body text,
    data json,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public."SequelizeMeta" (
    name character varying(255) NOT NULL
);

-- SEQUENCES

CREATE SEQUENCE IF NOT EXISTS public."Agencies_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public."Agencies_id_seq" OWNED BY public."Agencies".id;

CREATE SEQUENCE IF NOT EXISTS public."Announcements_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public."Announcements_id_seq" OWNED BY public."Announcements".id;

CREATE SEQUENCE IF NOT EXISTS public."BookingStatusHistories_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public."BookingStatusHistories_id_seq" OWNED BY public."BookingStatusHistories".id;

CREATE SEQUENCE IF NOT EXISTS public."Bookings_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public."Bookings_id_seq" OWNED BY public."Bookings".id;

CREATE SEQUENCE IF NOT EXISTS public."DriverAgencyRequests_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public."DriverAgencyRequests_id_seq" OWNED BY public."DriverAgencyRequests".id;

CREATE SEQUENCE IF NOT EXISTS public."Drivers_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public."Drivers_id_seq" OWNED BY public."Drivers".id;

CREATE SEQUENCE IF NOT EXISTS public."Events_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public."Events_id_seq" OWNED BY public."Events".id;

CREATE SEQUENCE IF NOT EXISTS public."Routes_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public."Routes_id_seq" OWNED BY public."Routes".id;

CREATE SEQUENCE IF NOT EXISTS public."Users_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public."Users_id_seq" OWNED BY public."Users".id;

CREATE SEQUENCE IF NOT EXISTS public.notifications_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;

-- DEFAULTS (auto-increment)

ALTER TABLE ONLY public."Agencies" ALTER COLUMN id SET DEFAULT nextval('public."Agencies_id_seq"'::regclass);
ALTER TABLE ONLY public."Announcements" ALTER COLUMN id SET DEFAULT nextval('public."Announcements_id_seq"'::regclass);
ALTER TABLE ONLY public."BookingStatusHistories" ALTER COLUMN id SET DEFAULT nextval('public."BookingStatusHistories_id_seq"'::regclass);
ALTER TABLE ONLY public."Bookings" ALTER COLUMN id SET DEFAULT nextval('public."Bookings_id_seq"'::regclass);
ALTER TABLE ONLY public."DriverAgencyRequests" ALTER COLUMN id SET DEFAULT nextval('public."DriverAgencyRequests_id_seq"'::regclass);
ALTER TABLE ONLY public."Drivers" ALTER COLUMN id SET DEFAULT nextval('public."Drivers_id_seq"'::regclass);
ALTER TABLE ONLY public."Events" ALTER COLUMN id SET DEFAULT nextval('public."Events_id_seq"'::regclass);
ALTER TABLE ONLY public."Routes" ALTER COLUMN id SET DEFAULT nextval('public."Routes_id_seq"'::regclass);
ALTER TABLE ONLY public."Users" ALTER COLUMN id SET DEFAULT nextval('public."Users_id_seq"'::regclass);
ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);

-- PRIMARY KEYS

ALTER TABLE ONLY public."Agencies" ADD CONSTRAINT "Agencies_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Announcements" ADD CONSTRAINT "Announcements_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."BookingStatusHistories" ADD CONSTRAINT "BookingStatusHistories_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Bookings" ADD CONSTRAINT "Bookings_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."DriverAgencyRequests" ADD CONSTRAINT "DriverAgencyRequests_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Drivers" ADD CONSTRAINT "Drivers_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Events" ADD CONSTRAINT "Events_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Routes" ADD CONSTRAINT "Routes_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."Users" ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public."SequelizeMeta" ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);

-- UNIQUE CONSTRAINTS

ALTER TABLE ONLY public."Agencies" ADD CONSTRAINT "Agencies_email_key" UNIQUE (email);
ALTER TABLE ONLY public."Drivers" ADD CONSTRAINT "Drivers_userId_key" UNIQUE ("userId");
ALTER TABLE ONLY public."Drivers" ADD CONSTRAINT "Drivers_vehicleReg_key" UNIQUE ("vehicleReg");
ALTER TABLE ONLY public."Users" ADD CONSTRAINT "Users_email_key" UNIQUE (email);
ALTER TABLE ONLY public."Users" ADD CONSTRAINT "Users_supabaseUid_key" UNIQUE ("supabaseUid");

-- FOREIGN KEYS

ALTER TABLE ONLY public."Agencies" ADD CONSTRAINT "Agencies_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public."BookingStatusHistories" ADD CONSTRAINT "BookingStatusHistories_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Bookings"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public."Bookings" ADD CONSTRAINT "Bookings_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public."Drivers"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public."Bookings" ADD CONSTRAINT "Bookings_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES public."Routes"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public."Bookings" ADD CONSTRAINT "Bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public."DriverAgencyRequests" ADD CONSTRAINT "DriverAgencyRequests_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES public."Agencies"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public."DriverAgencyRequests" ADD CONSTRAINT "DriverAgencyRequests_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public."Drivers"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public."Drivers" ADD CONSTRAINT "Drivers_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES public."Agencies"(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY public."Drivers" ADD CONSTRAINT "Drivers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public."Events" ADD CONSTRAINT "Events_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public."Routes" ADD CONSTRAINT "Routes_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public."Drivers"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- INDEXES

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications USING btree (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications USING btree (user_id, is_read);
