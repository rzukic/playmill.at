--
-- PostgreSQL database dump
--

-- Dumped from database version 15.2
-- Dumped by pg_dump version 15.2

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

CREATE DATABASE mill WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.UTF-8';


ALTER DATABASE mill OWNER TO postgres;

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

--
-- Name: pg_cron; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION pg_cron; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL';


--
-- Name: check_if_max_badges(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_if_max_badges() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    begin
        if (select count(active) from user_badges where uid=old.uid and active=true) >= 3
            then
            return old;
        end if;
        return new;
    end;
$$;


ALTER FUNCTION public.check_if_max_badges() OWNER TO postgres;

--
-- Name: check_ranked(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_ranked() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   IF old.elo_visible = false AND (SELECT COUNT(*) FROM games WHERE wuid = old.uid OR buid = old.uid) > 10
        then
        UPDATE users SET elo_visible = true WHERE uid = old.uid;
   end if;
   return new;
END;
$$;


ALTER FUNCTION public.check_ranked() OWNER TO postgres;

--
-- Name: check_session_count_insert(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_session_count_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    begin
        if(select count(session_key) from sessions where uid = new.uid) >= 3
            then
            return null;
        end if;
        return new;
    end;
$$;


ALTER FUNCTION public.check_session_count_insert() OWNER TO postgres;

--
-- Name: clean_expired_games(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.clean_expired_games() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE games g
        SET notation = NULL
        FROM users u1 JOIN users u2 ON g.buid = u2.uid
        WHERE
            notation IS NOT NULL
        AND wuid = u1.uid
        AND (now() - played_at ) > 7
        AND u1.premium = false
        AND u2.premium = false;
END;
$$;


ALTER FUNCTION public.clean_expired_games() OWNER TO postgres;

--
-- Name: game_badges(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.game_badges() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE gamecountw int;
    DECLARE gamecountb int;
    DECLARE tenid int default 1;
    DECLARE hunid int default 2;
    DECLARE thoid int default 3;
    BEGIN
        SELECT gamecount(new.wuid) INTO gamecountw;
        SELECT gamecount(new.buid) INTO gamecountb;
        IF tenid NOT IN (SELECT badge_id from user_badges where uid = new.wuid) AND gamecountw >= 10 THEN
            INSERT INTO user_badges (uid, badge_id) VALUES (new.wuid, tenid);
        ELSEIF hunid NOT IN (SELECT badge_id from user_badges where uid = new.wuid) AND gamecountw >= 100 THEN
            INSERT INTO user_badges (uid, badge_id) VALUES (new.wuid, hunid);
        ELSEIF thoid NOT IN (SELECT badge_id from user_badges where uid = new.wuid) AND gamecountw >= 1000 THEN
            INSERT INTO user_badges (uid, badge_id) VALUES (new.wuid, thoid);
        end if;
        IF tenid NOT IN (SELECT badge_id from user_badges where uid = new.buid) AND gamecountw >= 10 THEN
            INSERT INTO user_badges (uid, badge_id) VALUES (new.buid, tenid);
        ELSEIF hunid NOT IN (SELECT badge_id from user_badges where uid = new.buid) AND gamecountw >= 100 THEN
            INSERT INTO user_badges (uid, badge_id) VALUES (new.buid, hunid);
        ELSEIF thoid NOT IN (SELECT badge_id from user_badges where uid = new.buid) AND gamecountw >= 1000 THEN
            INSERT INTO user_badges (uid, badge_id) VALUES (new.buid, thoid);
        end if;
        RETURN new;
    end;
$$;


ALTER FUNCTION public.game_badges() OWNER TO postgres;

--
-- Name: gamecount(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.gamecount(id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
    DECLARE count int;
    BEGIN
        SELECT COUNT(*) FROM games where buid = id or wuid = id INTO count;
        RETURN count;
    end;
    $$;


ALTER FUNCTION public.gamecount(id integer) OWNER TO postgres;

--
-- Name: no_double_friends(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.no_double_friends() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    begin
        if (select count(friends_since) from friends where (user1 = new.user1 AND user2 = new.user2) OR (user1 = new.user2 AND user2 = new.user1)) > 0
            then
            return null;
        end if;
        return new;
    end;
$$;


ALTER FUNCTION public.no_double_friends() OWNER TO postgres;

--
-- Name: no_double_requests(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.no_double_requests() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF (SELECT COUNT(requesting) FROM friend_requests WHERE requesting = NEW.requested AND requested = NEW.requesting) > 0 THEN
        INSERT INTO friends (user1, user2) VALUES (NEW.requested, NEW.requesting);
        DELETE FROM friend_requests WHERE requesting = NEW.requested AND requested = NEW.requesting;
        RETURN null;
    end if;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.no_double_requests() OWNER TO postgres;

--
-- Name: no_friends_already(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.no_friends_already() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    begin
        if (select count(friends_since) from friends where (user1 = new.requested AND user2 = new.requesting) OR (user1 = new.requesting AND user2 = new.requested)) > 0
            then
            return null;
        end if;
        return new;
    end;
$$;


ALTER FUNCTION public.no_friends_already() OWNER TO postgres;

--
-- Name: set_premium(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_premium() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        IF new.premium = true AND old.premium = false THEN
            INSERT INTO user_badges (uid, badge_id) VALUES (old.uid, 6);
        ELSEIF new.premium = false AND old.premium = true THEN
            DELETE FROM user_badges WHERE uid = old.uid AND badge_id = 6;
        end if;
        RETURN new;
    end;
$$;


ALTER FUNCTION public.set_premium() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: badges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.badges (
    badge_id integer NOT NULL,
    badge_text text NOT NULL,
    bg_color character varying NOT NULL,
    txt_color character varying NOT NULL,
    border_color character varying NOT NULL,
    badge_description text
);


ALTER TABLE public.badges OWNER TO postgres;

--
-- Name: badges_badge_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.badges_badge_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.badges_badge_id_seq OWNER TO postgres;

--
-- Name: badges_badge_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.badges_badge_id_seq OWNED BY public.badges.badge_id;


--
-- Name: countries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.countries (
    country_code character(2) NOT NULL,
    country_name text NOT NULL
);


ALTER TABLE public.countries OWNER TO postgres;

--
-- Name: friend_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.friend_requests (
    requesting integer NOT NULL,
    requested integer NOT NULL,
    message text DEFAULT ''::text,
    CONSTRAINT no_self_add CHECK ((requested <> requesting))
);


ALTER TABLE public.friend_requests OWNER TO postgres;

--
-- Name: friends; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.friends (
    user1 integer NOT NULL,
    user2 integer NOT NULL,
    friends_since timestamp without time zone DEFAULT now()
);


ALTER TABLE public.friends OWNER TO postgres;

--
-- Name: game_modes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.game_modes (
    mode_id integer NOT NULL,
    mode_name text NOT NULL,
    mode_description text NOT NULL,
    counts_elo boolean DEFAULT false,
    minutes integer DEFAULT 5
);


ALTER TABLE public.game_modes OWNER TO postgres;

--
-- Name: game_modes_mode_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.game_modes_mode_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.game_modes_mode_id_seq OWNER TO postgres;

--
-- Name: game_modes_mode_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.game_modes_mode_id_seq OWNED BY public.game_modes.mode_id;


--
-- Name: games; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.games (
    game_id integer NOT NULL,
    wuid integer NOT NULL,
    buid integer NOT NULL,
    winner character varying DEFAULT 'playing'::character varying NOT NULL,
    welo integer,
    belo integer,
    played_at timestamp without time zone DEFAULT now(),
    mode_id integer NOT NULL,
    notation text
);


ALTER TABLE public.games OWNER TO postgres;

--
-- Name: games_game_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.games_game_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.games_game_id_seq OWNER TO postgres;

--
-- Name: games_game_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.games_game_id_seq OWNED BY public.games.game_id;


--
-- Name: invites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invites (
    inviting integer NOT NULL,
    invited integer NOT NULL,
    mode_id integer,
    invited_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.invites OWNER TO postgres;

--
-- Name: puzzle_packs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.puzzle_packs (
    pack_id integer NOT NULL,
    pack_name text,
    premium boolean,
    hidden boolean DEFAULT false
);


ALTER TABLE public.puzzle_packs OWNER TO postgres;

--
-- Name: puzzle_packs_pack_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.puzzle_packs_pack_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.puzzle_packs_pack_id_seq OWNER TO postgres;

--
-- Name: puzzle_packs_pack_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.puzzle_packs_pack_id_seq OWNED BY public.puzzle_packs.pack_id;


--
-- Name: puzzles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.puzzles (
    puzzle_id integer NOT NULL,
    board json,
    color character(1),
    moves json,
    pack_id integer
);


ALTER TABLE public.puzzles OWNER TO postgres;

--
-- Name: puzzles_puzzle_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.puzzles_puzzle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.puzzles_puzzle_id_seq OWNER TO postgres;

--
-- Name: puzzles_puzzle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.puzzles_puzzle_id_seq OWNED BY public.puzzles.puzzle_id;


--
-- Name: queue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.queue (
    uid integer NOT NULL,
    mode_id integer NOT NULL,
    queuing_since timestamp without time zone DEFAULT now()
);


ALTER TABLE public.queue OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    session_key text NOT NULL,
    uid integer NOT NULL,
    session_begin timestamp without time zone DEFAULT now(),
    ip text,
    device text,
    os text
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_badges (
    uid integer NOT NULL,
    badge_id integer NOT NULL,
    active boolean DEFAULT false
);


ALTER TABLE public.user_badges OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    uid integer NOT NULL,
    username character varying NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    elo_visible boolean DEFAULT false,
    elo integer DEFAULT 1000 NOT NULL,
    country_code character(2) NOT NULL,
    description text DEFAULT ''::text,
    registered_date timestamp without time zone DEFAULT now(),
    admin boolean DEFAULT false,
    active boolean DEFAULT true NOT NULL,
    premium boolean DEFAULT false NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    verification_key text,
    deactivation_reason text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_pictures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_pictures (
    uid integer NOT NULL,
    image text NOT NULL
);


ALTER TABLE public.users_pictures OWNER TO postgres;

--
-- Name: users_uid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_uid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_uid_seq OWNER TO postgres;

--
-- Name: users_uid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_uid_seq OWNED BY public.users.uid;


--
-- Name: badges badge_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.badges ALTER COLUMN badge_id SET DEFAULT nextval('public.badges_badge_id_seq'::regclass);


--
-- Name: game_modes mode_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.game_modes ALTER COLUMN mode_id SET DEFAULT nextval('public.game_modes_mode_id_seq'::regclass);


--
-- Name: games game_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games ALTER COLUMN game_id SET DEFAULT nextval('public.games_game_id_seq'::regclass);


--
-- Name: puzzle_packs pack_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.puzzle_packs ALTER COLUMN pack_id SET DEFAULT nextval('public.puzzle_packs_pack_id_seq'::regclass);


--
-- Name: puzzles puzzle_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.puzzles ALTER COLUMN puzzle_id SET DEFAULT nextval('public.puzzles_puzzle_id_seq'::regclass);


--
-- Name: users uid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN uid SET DEFAULT nextval('public.users_uid_seq'::regclass);


--
-- Data for Name: job; Type: TABLE DATA; Schema: cron; Owner: postgres
--

COPY cron.job (jobid, schedule, command, nodename, nodeport, database, username, active, jobname) FROM stdin;
1	0 0 * * *	SELECT clean_expired_games()	localhost	5432	mill	postgres	t	\N
\.


--
-- Data for Name: job_run_details; Type: TABLE DATA; Schema: cron; Owner: postgres
--

COPY cron.job_run_details (jobid, runid, job_pid, database, username, command, status, return_message, start_time, end_time) FROM stdin;
\.


--
-- Data for Name: badges; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.badges (badge_id, badge_text, bg_color, txt_color, border_color, badge_description) FROM stdin;
1	10	blue.600	white	transparent	10games
2	100	blue.600	white	transparent	100games
3	1000	blue.600	white	transparent	1000games
4	GM	red.600	white	transparent	gm
5	MM	white	red.600	red.600	mm
6	premium	yellow.500	teal.900	transparent	premium
7	10	orange.600	white	transparent	10puzzle
8	100	orange.600	white	transparent	100puzzle
9	1000	orange.600	white	transparent	1000puzzle
\.


--
-- Data for Name: countries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.countries (country_code, country_name) FROM stdin;
AF	Afghanistan
AX	Aland Islands
AL	Albania
DZ	Algeria
AS	American Samoa
AD	Andorra
AO	Angola
AI	Anguilla
AQ	Antarctica
AG	Antigua and Barbuda
AR	Argentina
AM	Armenia
AW	Aruba
AU	Australia
AT	Austria
AZ	Azerbaijan
BS	Bahamas
BH	Bahrain
BD	Bangladesh
BB	Barbados
BY	Belarus
BE	Belgium
BZ	Belize
BJ	Benin
BM	Bermuda
BT	Bhutan
BO	Bolivia
BA	Bosnia and Herzegovina
BW	Botswana
BV	Bouvet Island
BR	Brazil
IO	British Indian Ocean Territory
BN	Brunei Darussalam
BG	Bulgaria
BF	Burkina Faso
BI	Burundi
KH	Cambodia
CM	Cameroon
CA	Canada
CV	Cape Verde
KY	Cayman Islands
CF	Central African Republic
TD	Chad
CL	Chile
TW	China, The Republic of
CN	China, The People's Republic of
CX	Christmas Island
CC	Cocos (Keeling) Islands
CO	Colombia
KM	Comoros
CG	Congo
CD	Congo, The Democratic Republic of The
CK	Cook Islands
CR	Costa Rica
CI	Cote D'ivoire
HR	Croatia
CU	Cuba
CY	Cyprus
CZ	Czech Republic
DK	Denmark
DJ	Djibouti
DM	Dominica
DO	Dominican Republic
EC	Ecuador
EG	Egypt
SV	El Salvador
GQ	Equatorial Guinea
ER	Eritrea
EE	Estonia
ET	Ethiopia
FK	Falkland Islands (Malvinas)
FO	Faroe Islands
FJ	Fiji
FI	Finland
FR	France
GF	French Guiana
PF	French Polynesia
TF	French Southern Territories
GA	Gabon
GM	Gambia
GE	Georgia
DE	Germany
GH	Ghana
GI	Gibraltar
GR	Greece
GL	Greenland
GD	Grenada
GP	Guadeloupe
GU	Guam
GT	Guatemala
GG	Guernsey
GN	Guinea
GW	Guinea-bissau
GY	Guyana
HT	Haiti
HM	Heard Island and Mcdonald Islands
VA	Holy See (Vatican City State)
HN	Honduras
HK	Hong Kong
HU	Hungary
IS	Iceland
IN	India
ID	Indonesia
IR	Iran, Islamic Republic of
IQ	Iraq
IE	Ireland
IM	Isle of Man
IL	Israel
IT	Italy
JM	Jamaica
JP	Japan
JE	Jersey
JO	Jordan
KZ	Kazakhstan
KE	Kenya
KI	Kiribati
KP	Korea, Democratic People's Republic of
KR	Korea, Republic of
XK	Kosovo
KW	Kuwait
KG	Kyrgyzstan
LA	Lao People's Democratic Republic
LV	Latvia
LB	Lebanon
LS	Lesotho
LR	Liberia
LY	Libyan Arab Jamahiriya
LI	Liechtenstein
LT	Lithuania
LU	Luxembourg
MO	Macao
MK	Macedonia, The Former Yugoslav Republic of
MG	Madagascar
MW	Malawi
MY	Malaysia
MV	Maldives
ML	Mali
MT	Malta
MH	Marshall Islands
MQ	Martinique
MR	Mauritania
MU	Mauritius
YT	Mayotte
MX	Mexico
FM	Micronesia, Federated States of
MD	Moldova, Republic of
MC	Monaco
MN	Mongolia
ME	Montenegro
MS	Montserrat
MA	Morocco
MZ	Mozambique
MM	Myanmar
NA	Namibia
NR	Nauru
NP	Nepal
NL	Netherlands
AN	Netherlands Antilles
NC	New Caledonia
NZ	New Zealand
NI	Nicaragua
NE	Niger
NG	Nigeria
NU	Niue
NF	Norfolk Island
MP	Northern Mariana Islands
NO	Norway
OM	Oman
PK	Pakistan
PW	Palau
PS	Palestine
PA	Panama
PG	Papua New Guinea
PY	Paraguay
PE	Peru
PH	Philippines
PN	Pitcairn
PL	Poland
PT	Portugal
PR	Puerto Rico
QA	Qatar
RE	Reunion
RO	Romania
RU	Russian Federation
RW	Rwanda
SH	Saint Helena
KN	Saint Kitts and Nevis
LC	Saint Lucia
PM	Saint Pierre and Miquelon
VC	Saint Vincent and The Grenadines
WS	Samoa
SM	San Marino
ST	Sao Tome and Principe
SA	Saudi Arabia
SN	Senegal
RS	Serbia
SC	Seychelles
SL	Sierra Leone
SG	Singapore
SK	Slovakia
SI	Slovenia
SB	Solomon Islands
SO	Somalia
ZA	South Africa
GS	South Georgia and The South Sandwich Islands
ES	Spain
LK	Sri Lanka
SD	Sudan
SR	Suriname
SJ	Svalbard and Jan Mayen
SZ	Swaziland
SE	Sweden
CH	Switzerland
SY	Syrian Arab Republic
TJ	Tajikistan
TZ	Tanzania, United Republic of
TH	Thailand
TL	Timor-leste
TG	Togo
TK	Tokelau
TO	Tonga
TT	Trinidad and Tobago
TN	Tunisia
TR	Turkey
TM	Turkmenistan
TC	Turks and Caicos Islands
TV	Tuvalu
UG	Uganda
UA	Ukraine
AE	United Arab Emirates
GB	United Kingdom
US	United States
UM	United States Minor Outlying Islands
UY	Uruguay
UZ	Uzbekistan
VU	Vanuatu
VE	Venezuela
VN	Viet Nam
VG	Virgin Islands, British
VI	Virgin Islands, U.S.
WF	Wallis and Futuna
EH	Western Sahara
YE	Yemen
ZM	Zambia
ZW	Zimbabwe
\.


--
-- Data for Name: friend_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.friend_requests (requesting, requested, message) FROM stdin;
\.


--
-- Data for Name: friends; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.friends (user1, user2, friends_since) FROM stdin;
\.


--
-- Data for Name: game_modes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.game_modes (mode_id, mode_name, mode_description, counts_elo, minutes) FROM stdin;
1	Normal	This is the normal mill game mode. In this mode you play for elo points.	t	5
2	Casual	In This game mode you play the same game as in the normal mode. The only difference is that you don't play for elo.	f	5
\.


--
-- Data for Name: games; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.games (game_id, wuid, buid, winner, welo, belo, played_at, mode_id, notation) FROM stdin;
\.


--
-- Data for Name: invites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invites (inviting, invited, mode_id, invited_at) FROM stdin;
\.


--
-- Data for Name: puzzle_packs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.puzzle_packs (pack_id, pack_name, premium, hidden) FROM stdin;
1	Easy	f	f
3	Premium	t	f
4	Dailys	t	t
2	Normal	f	f
\.


--
-- Data for Name: puzzles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.puzzles (puzzle_id, board, color, moves, pack_id) FROM stdin;
3	{\n  "a1": "w",\n  "a4": "x",\n  "a7": "w",\n  "d7": "b",\n  "g7": "x",\n  "g4": "x",\n  "g1": "b",\n  "d1": "w",\n  "d2": "w",\n  "b2": "b",\n  "b4": "w",\n  "b6": "w",\n  "d6": "w",\n  "f6": "b",\n  "f4": "x",\n  "f2": "b",\n  "d3": "b",\n  "c3": "w",\n  "c4": "b",\n  "c5": "w",\n  "d5": "b",\n  "e5": "x",\n  "e4": "x",\n  "e3": "x",\n  "wside": [],\n  "bside": [\n    "b"\n  ]\n}	b	[\n          {\n            "action": "move",\n            "color": "b",\n            "from": "x",\n            "to": "a4"\n          }\n        ]	1
4	{\n         "a1": "x",\n         "a4": "x",\n         "a7": "b",\n         "d7": "b",\n         "g7": "w",\n         "g4": "x",\n         "g1": "x",\n         "d1": "x",\n         "d2": "x",\n         "b2": "x",\n         "b4": "x",\n         "b6": "x",\n         "d6": "w",\n         "f6": "w",\n         "f4": "b",\n         "f2": "x",\n         "d3": "x",\n         "c3": "x",\n         "c4": "x",\n         "c5": "x",\n         "d5": "x",\n         "e5": "x",\n         "e4": "x",\n         "e3": "x",\n         "bside": [\n           "w",\n           "w",\n           "w",\n           "w",\n           "w",\n           "w"\n         ],\n         "wside": [\n           "b",\n           "b",\n           "b",\n           "b",\n           "b",\n           "b"\n         ]\n       }\n        	b	[\n          {\n            "action": "move",\n            "color": "b",\n            "from": [\n              "a7",\n              "d7",\n              "f4"\n            ],\n            "to": "b6"\n          }\n        ]	1
5	{\n         "a1": "x",\n         "a4": "x",\n         "a7": "x",\n         "d7": "b",\n         "g7": "x",\n         "g4": "x",\n         "g1": "x",\n         "d1": "x",\n         "d2": "b",\n         "b2": "w",\n         "b4": "x",\n         "b6": "w",\n         "d6": "x",\n         "f6": "w",\n         "f4": "x",\n         "f2": "b",\n         "d3": "x",\n         "c3": "x",\n         "c4": "x",\n         "c5": "x",\n         "d5": "w",\n         "e5": "x",\n         "e4": "x",\n         "e3": "x",\n         "bside": [\n           "w",\n           "w",\n           "w",\n           "w",\n           "w",\n           "w"\n         ],\n         "wside": [\n           "b",\n           "b",\n           "b",\n           "b",\n           "b",\n           "b"\n         ]\n       }\n        	b	[\n          {\n            "action": "move",\n            "color": "b",\n            "from": ["d2","f2","d7"],\n            "to": "d6"\n          }        ]	1
6	{\n         "a1": "x",\n         "a4": "x",\n         "a7": "x",\n         "d7": "x",\n         "g7": "x",\n         "g4": "x",\n         "g1": "x",\n         "d1": "x",\n         "d2": "x",\n         "b2": "x",\n         "b4": "x",\n         "b6": "x",\n         "d6": "b",\n         "f6": "w",\n         "f4": "x",\n         "f2": "w",\n         "d3": "x",\n         "c3": "x",\n         "c4": "x",\n         "c5": "x",\n         "d5": "x",\n         "e5": "x",\n         "e4": "x",\n         "e3": "x",\n         "bside": [\n           "b",\n           "b",\n           "b",\n           "b",\n           "b",\n           "b",\n           "b",\n           "b"\n         ],\n         "wside": [\n           "w",\n           "w",\n           "w",\n           "w",\n           "w",\n           "w",\n           "w"\n         ]\n       }	b	[\n          {\n            "action": "move",\n            "color": "b",\n            "from": "x",\n            "to": "f4"\n          }\n        ]	1
7	{\n  "a1": "b",\n  "a4": "b",\n  "a7": "w",\n  "d7": "x",\n  "g7": "w",\n  "g4": "b",\n  "g1": "w",\n  "d1": "b",\n  "d2": "w",\n  "b2": "b",\n  "b4": "w",\n  "b6": "x",\n  "d6": "x",\n  "f6": "b",\n  "f4": "w",\n  "f2": "b",\n  "d3": "x",\n  "c3": "x",\n  "c4": "x",\n  "c5": "x",\n  "d5": "x",\n  "e5": "w",\n  "e4": "x",\n  "e3": "w",\n  "bside": [\n    "w"\n  ],\n  "wside": [\n    "b"\n  ]\n}	w	[\n          {\n            "action": "move",\n            "color": "w",\n            "from": "f4",\n            "to": "e4"\n          },\n          {\n            "action": "take",\n            "color": "w",\n            "from": [\n              "f6",\n              "f2",\n              "g4"\n            ]\n          }\n        ]	1
8	{\n  "a1": "b",\n  "a4": "x",\n  "a7": "x",\n  "d7": "b",\n  "g7": "w",\n  "g4": "b",\n  "g1": "b",\n  "d1": "w",\n  "d2": "w",\n  "b2": "b",\n  "b4": "w",\n  "b6": "x",\n  "d6": "w",\n  "f6": "b",\n  "f4": "w",\n  "f2": "b",\n  "d3": "x",\n  "c3": "b",\n  "c4": "w",\n  "c5": "x",\n  "d5": "w",\n  "e5": "b",\n  "e4": "w",\n  "e3": "x",\n  "bside": [],\n  "wside": []\n}	w	[\n          {\n            "action": "move",\n            "color": "w",\n            "from": "e4",\n            "to": "e3"\n          },\n          {\n            "action": "move",\n            "color": "b",\n            "from": "c3",\n            "to": "d3"\n          },\n          {\n            "action": "move",\n            "color": "w",\n            "from": "c4",\n            "to": "c3"\n          },\n          {\n            "action": "move",\n            "color": "b",\n            "from": "a1",\n            "to": "a4"\n          },\n          {\n            "action": "move",\n            "color": "w",\n            "from": "d5",\n            "to": "c5"\n          },\n          {\n            "action": "move",\n            "color": "b",\n            "from": "e5",\n            "to": "d5"\n          },\n          {\n            "action": "move",\n            "color": "w",\n            "from": "b4",\n            "to": "c4"\n          },\n          {\n            "action": "take",\n            "color": "w",\n            "from": "d3"\n          }\n        ]	3
9	{\n  "a1": "x",\n  "a4": "x",\n  "a7": "x",\n  "d7": "x",\n  "g7": "x",\n  "g4": "x",\n  "g1": "x",\n  "d1": "b",\n  "d2": "x",\n  "b2": "w",\n  "b4": "x",\n  "b6": "b",\n  "d6": "x",\n  "f6": "w",\n  "f4": "x",\n  "f2": "x",\n  "d3": "x",\n  "c3": "x",\n  "c4": "x",\n  "c5": "x",\n  "d5": "x",\n  "e5": "x",\n  "e4": "x",\n  "e3": "x",\n  "wside": ["w","w","w","w","w","w","w"],\n  "bside": ["b","b","b","b","b","b","b"]\n}	w	[\n          {\n            "action": "move",\n            "color": "w",\n            "from": "x",\n            "to": "f2"\n          },\n          {\n            "action": "move",\n            "color": "b",\n            "from": "x",\n            "to": "f4"\n          },\n          {\n            "action": "move",\n            "color": "w",\n            "from": "x",\n            "to": "d2"\n          }\n        ]	2
10	{\n  "a1": "x",\n  "a4": "x",\n  "a7": "x",\n  "d7": "x",\n  "g7": "x",\n  "g4": "x",\n  "g1": "x",\n  "d1": "x",\n  "d2": "w",\n  "b2": "b",\n  "b4": "x",\n  "b6": "x",\n  "d6": "x",\n  "f6": "x",\n  "f4": "w",\n  "f2": "b",\n  "d3": "x",\n  "c3": "x",\n  "c4": "x",\n  "c5": "x",\n  "d5": "x",\n  "e5": "x",\n  "e4": "x",\n  "e3": "x",\n  "wside": ["w","w","w","w","w","w","w"],\n  "bside": ["b","b","b","b","b","b","b"]\n}	w	[\n          {\n            "action": "move",\n            "color": "w",\n            "from": "x",\n            "to": "e3"\n          },\n          {\n            "action": "move",\n            "color": "b",\n            "from": "x",\n            "to": "d3"\n          },\n          {\n            "action": "move",\n            "color": "w",\n            "from": "x",\n            "to": "e4"\n          },\n          {\n            "action": "move",\n            "color": "b",\n            "from": "x",\n            "to": "g4"\n          },\n          {\n            "action": "move",\n            "color": "w",\n            "from": "x",\n            "to": "e5"\n          }\n        ]	2
11	{\n  "a1": "x",\n  "a4": "x",\n  "a7": "x",\n  "d7": "x",\n  "g7": "x",\n  "g4": "x",\n  "g1": "x",\n  "d1": "x",\n  "d2": "w",\n  "b2": "b",\n  "b4": "x",\n  "b6": "x",\n  "d6": "x",\n  "f6": "x",\n  "f4": "w",\n  "f2": "x",\n  "d3": "x",\n  "c3": "x",\n  "c4": "x",\n  "c5": "x",\n  "d5": "x",\n  "e5": "x",\n  "e4": "x",\n  "e3": "x",\n  "wside": ["w","w","w","w","w","w"],\n  "bside": ["b","b","b","b","b","b","b"]\n}	b	[\n          {\n            "action": "move",\n            "color": "b",\n            "from": "x",\n            "to": [\n              "b3",\n              "d3",\n              "e3",\n              "e4",\n              "e5",\n              "g4",\n              "d1"\n            ]\n          }\n        ]	2
12	{\n  "a1": "x",\n  "a4": "x",\n  "a7": "x",\n  "d7": "x",\n  "g7": "x",\n  "g4": "x",\n  "g1": "x",\n  "d1": "w",\n  "d2": "w",\n  "b2": "b",\n  "b4": "x",\n  "b6": "x",\n  "d6": "x",\n  "f6": "x",\n  "f4": "w",\n  "f2": "x",\n  "d3": "x",\n  "c3": "x",\n  "c4": "x",\n  "c5": "x",\n  "d5": "x",\n  "e5": "x",\n  "e4": "x",\n  "e3": "b",\n  "wside": ["w","w","w","w","w"],\n  "bside": ["b","b","b","b","b","b"]\n}	b	[\n          {\n            "action": "move",\n            "color": "b",\n            "from": "x",\n            "to": "d3"\n          },\n          {\n            "action": "move",\n            "color": "w",\n            "from": "x",\n            "to": "c3"\n          },\n          {\n            "action": "move",\n            "color": "b",\n            "from": "x",\n            "to": "g4"\n          }\n        ]	2
13	{\n  "a1": "x",\n  "a4": "b",\n  "a7": "x",\n  "d7": "b",\n  "g7": "x",\n  "g4": "x",\n  "g1": "x",\n  "d1": "x",\n  "d2": "x",\n  "b2": "b",\n  "b4": "b",\n  "b6": "w",\n  "d6": "b",\n  "f6": "x",\n  "f4": "x",\n  "f2": "x",\n  "d3": "x",\n  "c3": "x",\n  "c4": "w",\n  "c5": "b",\n  "d5": "w",\n  "e5": "x",\n  "e4": "x",\n  "e3": "b",\n  "bside": ["w","w","w","w","w","w"],\n  "wside": ["b","b"]\n}	b	[\n                  {\n                    "action": "move",\n                    "color": "b",\n                    "from": "e3",\n                    "to": ["e4", "d3"]\n                  },\n                  {\n                    "action": "move",\n                    "color": "w",\n                    "from": "b6",\n                    "to": "a7"\n                  },\n                  {\n                    "action": "move",\n                    "color": "b",\n                    "from": "d6",\n                    "to": "b6"\n                  },\n                  {\n                    "action": "take",\n                    "color": "b",\n                    "from": [\n                      "a7",\n                      "c4",\n                      "d5"\n                    ]\n                  }\n                ]	2
\.


--
-- Data for Name: queue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.queue (uid, mode_id, queuing_since) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (session_key, uid, session_begin, ip, device, os) FROM stdin;
\.


--
-- Data for Name: user_badges; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_badges (uid, badge_id, active) FROM stdin;
1	6	f
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (uid, username, email, password, elo_visible, elo, country_code, description, registered_date, admin, active, premium, verified, verification_key, deactivation_reason) FROM stdin;
1	Admin	admin@playmill.at	$2b$10$rG5Cy5Ym894iW.6BSSh5M.ygUxWFC76N0S1gYb0rEV9vvAsbM6ECC	f	1000	AT		2023-04-14 11:44:36.641767	t	t	t	t	\N	\N
\.


--
-- Data for Name: users_pictures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_pictures (uid, image) FROM stdin;
\.


--
-- Name: jobid_seq; Type: SEQUENCE SET; Schema: cron; Owner: postgres
--

SELECT pg_catalog.setval('cron.jobid_seq', 1, true);


--
-- Name: runid_seq; Type: SEQUENCE SET; Schema: cron; Owner: postgres
--

SELECT pg_catalog.setval('cron.runid_seq', 1, false);


--
-- Name: badges_badge_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.badges_badge_id_seq', 9, true);


--
-- Name: game_modes_mode_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.game_modes_mode_id_seq', 2, true);


--
-- Name: games_game_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.games_game_id_seq', 1, false);


--
-- Name: puzzle_packs_pack_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.puzzle_packs_pack_id_seq', 1, false);


--
-- Name: puzzles_puzzle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.puzzles_puzzle_id_seq', 1, false);


--
-- Name: users_uid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_uid_seq', 1, false);


--
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (badge_id);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (country_code);


--
-- Name: friend_requests friend_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_pkey PRIMARY KEY (requesting, requested);


--
-- Name: friends friends_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_pkey PRIMARY KEY (user1, user2);


--
-- Name: game_modes game_modes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.game_modes
    ADD CONSTRAINT game_modes_pkey PRIMARY KEY (mode_id);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (game_id);


--
-- Name: invites invites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_pkey PRIMARY KEY (inviting, invited);


--
-- Name: queue queue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue
    ADD CONSTRAINT queue_pkey PRIMARY KEY (uid);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (session_key, uid);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (uid, badge_id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users_pictures users_pictures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_pictures
    ADD CONSTRAINT users_pictures_pkey PRIMARY KEY (uid);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (uid);


--
-- Name: friend_requests both_add; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER both_add BEFORE INSERT ON public.friend_requests FOR EACH ROW EXECUTE FUNCTION public.no_double_requests();


--
-- Name: sessions check_session_count; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER check_session_count BEFORE INSERT ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.check_session_count_insert();


--
-- Name: friend_requests friend_requests_no_friends_already; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER friend_requests_no_friends_already BEFORE INSERT ON public.friend_requests FOR EACH ROW EXECUTE FUNCTION public.no_friends_already();


--
-- Name: friends friend_requests_no_friends_already; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER friend_requests_no_friends_already BEFORE INSERT ON public.friends FOR EACH ROW EXECUTE FUNCTION public.no_double_friends();


--
-- Name: games trigger_game_badges; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_game_badges AFTER INSERT ON public.games FOR EACH ROW EXECUTE FUNCTION public.game_badges();


--
-- Name: users trigger_set_premium; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_set_premium AFTER UPDATE OF premium ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_premium();


--
-- Name: user_badges user_badges_max_activated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER user_badges_max_activated BEFORE UPDATE ON public.user_badges FOR EACH ROW WHEN ((new.active = true)) EXECUTE FUNCTION public.check_if_max_badges();


--
-- Name: users users_ranked; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER users_ranked AFTER UPDATE ON public.users FOR EACH ROW WHEN ((new.elo_visible = false)) EXECUTE FUNCTION public.check_ranked();


--
-- Name: friend_requests friend_requests_requested_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_requested_fkey FOREIGN KEY (requested) REFERENCES public.users(uid);


--
-- Name: friend_requests friend_requests_requesting_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_requesting_fkey FOREIGN KEY (requesting) REFERENCES public.users(uid);


--
-- Name: friends friends_user1_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_user1_fkey FOREIGN KEY (user1) REFERENCES public.users(uid);


--
-- Name: friends friends_user2_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_user2_fkey FOREIGN KEY (user2) REFERENCES public.users(uid);


--
-- Name: games games_buid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_buid_fkey FOREIGN KEY (buid) REFERENCES public.users(uid);


--
-- Name: games games_mode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_mode_id_fkey FOREIGN KEY (mode_id) REFERENCES public.game_modes(mode_id);


--
-- Name: games games_wuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_wuid_fkey FOREIGN KEY (wuid) REFERENCES public.users(uid);


--
-- Name: invites invites_invited_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_invited_fkey FOREIGN KEY (invited) REFERENCES public.users(uid);


--
-- Name: invites invites_inviting_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_inviting_fkey FOREIGN KEY (inviting) REFERENCES public.users(uid);


--
-- Name: invites invites_mode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_mode_id_fkey FOREIGN KEY (mode_id) REFERENCES public.game_modes(mode_id);


--
-- Name: queue queue_mode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue
    ADD CONSTRAINT queue_mode_id_fkey FOREIGN KEY (mode_id) REFERENCES public.game_modes(mode_id);


--
-- Name: queue queue_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue
    ADD CONSTRAINT queue_uid_fkey FOREIGN KEY (uid) REFERENCES public.users(uid);


--
-- Name: sessions sessions_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_uid_fkey FOREIGN KEY (uid) REFERENCES public.users(uid);


--
-- Name: user_badges user_badges_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(badge_id);


--
-- Name: user_badges user_badges_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_uid_fkey FOREIGN KEY (uid) REFERENCES public.users(uid);


--
-- Name: users users_country_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_country_code_fkey FOREIGN KEY (country_code) REFERENCES public.countries(country_code);


--
-- Name: users_pictures users_pictures_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_pictures
    ADD CONSTRAINT users_pictures_uid_fkey FOREIGN KEY (uid) REFERENCES public.users(uid);


--
-- Name: job; Type: ROW SECURITY; Schema: cron; Owner: postgres
--

ALTER TABLE cron.job ENABLE ROW LEVEL SECURITY;

--
-- Name: job_run_details; Type: ROW SECURITY; Schema: cron; Owner: postgres
--

ALTER TABLE cron.job_run_details ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

