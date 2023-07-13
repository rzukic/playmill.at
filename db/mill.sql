--
-- PostgreSQL database dump
--

-- Dumped from database version 12.12 (Ubuntu 12.12-0ubuntu0.20.04.1)
-- Dumped by pg_dump version 12.12 (Ubuntu 12.12-0ubuntu0.20.04.1)

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

--
-- Name: mill; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE mill WITH TEMPLATE = template0 ENCODING = 'UTF8' LC_COLLATE = 'en_US.UTF-8' LC_CTYPE = 'en_US.UTF-8';


ALTER DATABASE mill OWNER TO milldaemon;

\connect mill

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: games; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.games (
    id SERIAL,
    board text,
    phasew integer DEFAULT 0,
    phaseb integer DEFAULT 0,
    movesw integer DEFAULT 0,
    movesb integer DEFAULT 0,
    timew decimal DEFAULT 300.0,
    timeb decimal DEFAULT 300.0,
    actionw varchar(255) DEFAULT 'move',
    actionb varchar(255) DEFAULT 'wait',
    movehistoryw varchar DEFAULT '[]',
    movehistoryb varchar DEFAULT '[]',
    draww boolean DEFAULT false,
    drawb boolean DEFAULT false,
    lastmovew timestamp DEFAULT now(),
    lastmoveb timestamp DEFAULT now(),
    player1 character(1),
    player2 character(1)
);


ALTER TABLE public.games OWNER TO milldaemon;

--
-- Data for Name: games; Type: TABLE DATA; Schema: public; Owner: postgres
--


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

