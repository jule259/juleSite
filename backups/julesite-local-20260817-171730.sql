--
-- PostgreSQL database dump
--

\restrict VnXBN76JE3Ygm8DrI9M01fx4GRaAeHqyhejBKzIm4hOc8HhL2jROvaOetxKeHCZ

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- Name: Game; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Game" (
    id text NOT NULL,
    title text NOT NULL,
    "titleZh" text,
    platforms text[] DEFAULT ARRAY[]::text[],
    genres text[] DEFAULT ARRAY[]::text[],
    status text DEFAULT 'backlog'::text NOT NULL,
    rating integer,
    difficulty integer,
    "playTimeHours" double precision,
    "completionPct" integer,
    "playYear" integer,
    "playDate" timestamp(3) without time zone,
    developer text,
    publisher text,
    "steamAppId" text,
    "coverImageUrl" text,
    screenshots jsonb DEFAULT '[]'::jsonb NOT NULL,
    notes text,
    "isRecommended" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Game" OWNER TO postgres;

--
-- Name: UpcomingGame; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UpcomingGame" (
    id text NOT NULL,
    title text NOT NULL,
    "titleZh" text,
    "releaseDate" timestamp(3) without time zone,
    platforms text[] DEFAULT ARRAY[]::text[],
    genres text[] DEFAULT ARRAY[]::text[],
    price text,
    summary text,
    "coverImageUrl" text,
    screenshots jsonb DEFAULT '[]'::jsonb NOT NULL,
    "steamAppId" text,
    developer text,
    publisher text,
    "isInterested" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UpcomingGame" OWNER TO postgres;

--
-- Data for Name: Game; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Game" (id, title, "titleZh", platforms, genres, status, rating, difficulty, "playTimeHours", "completionPct", "playYear", "playDate", developer, publisher, "steamAppId", "coverImageUrl", screenshots, notes, "isRecommended", "createdAt", "updatedAt") FROM stdin;
cmq666e9f00003g6n1wm6dsrp	The Witcher 3: Wild Hunt	巫师3：狂猎	{PC,PS5}	{RPG,"Open World"}	completed	10	7	120	95	2015	\N	CD Projekt Red	\N	292030	https://shared.steamstatic.com/store_item_assets/steam/apps/292030/header.jpg	[]	史上最佳 RPG 之一。剧情、世界观、支线任务都是顶级水准。DLC「血与酒」堪称典范。	t	2026-06-09 13:58:44.019	2026-06-09 13:58:44.019
cmq666elv00013g6n4nytumap	Elden Ring	艾尔登法环	{PC,PS5}	{"Action RPG",Souls-like}	completed	10	9	150	100	2022	\N	FromSoftware	\N	1245620	https://shared.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg	[]	第一次接触魂系游戏，被难度和探索感深深吸引。交界地的世界设计无与伦比。	t	2026-06-09 13:58:44.467	2026-06-09 13:58:44.467
cmq666et500023g6nws947gao	Hollow Knight	空洞骑士	{PC,Switch}	{Metroidvania,Action}	completed	9	8	50	85	2019	\N	Team Cherry	\N	367520	https://shared.steamstatic.com/store_item_assets/steam/apps/367520/header.jpg	[]	手绘美术风格精美绝伦，战斗手感出色。期待续作「丝之歌」。	t	2026-06-09 13:58:44.729	2026-06-09 13:58:44.729
cmq666evm00033g6nqzd9d0gc	Stardew Valley	星露谷物语	{PC,Switch}	{Simulation,Farming}	playing	9	3	80	60	2020	\N	ConcernedApe	\N	413150	https://shared.steamstatic.com/store_item_assets/steam/apps/413150/header.jpg	[]	一人开发的奇迹。种田、钓鱼、挖矿、社交，总有做不完的事情。	t	2026-06-09 13:58:44.818	2026-06-09 13:58:44.818
cmq666f2w00063g6nb1m8ffna	Hades	哈迪斯	{PC,Switch}	{Roguelike,Action}	dropped	9	7	45	80	2023	\N	\N	\N	1145360	https://shared.steamstatic.com/store_item_assets/steam/apps/1145360/header.jpg	[]	\N	t	2026-06-09 13:58:45.08	2026-06-09 07:03:37.753
cmq666f0j00053g6n2c899j5j	Baldur's Gate 3	博德之门3	{PC}	{CRPG,Turn-based}	backlog	\N	\N	\N	\N	\N	\N	Larian Studios	Larian Studios	1086940	https://shared.steamstatic.com/store_item_assets/steam/apps/1086940/header.jpg	["https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc81fj.jpg", "https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc81fh.jpg", "https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc81ff.jpg", "https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc81fl.jpg"]	实在是不喜欢DND跑团这种形式，\n做任何决策都需要掷骰子，太不稳定了。	f	2026-06-09 13:58:44.995	2026-08-06 07:38:52.774
cmq666ey300043g6n81l06l0b	Cyberpunk 2077	赛博朋克2077	{PC}	{Shooter,"Role-playing (RPG)",Adventure}	completed	8	5	90	90	2023	\N	CD Projekt RED	CD Projekt	1091500	https://images.igdb.com/igdb/image/upload/t_cover_big/coaih8.jpg	["https://images.igdb.com/igdb/image/upload/t_screenshot_big/vnv5cd9kvonsjvazpotx.jpg", "https://images.igdb.com/igdb/image/upload/t_screenshot_big/quphnww1axg2mmsvxfux.jpg", "https://images.igdb.com/igdb/image/upload/t_screenshot_big/scxw04.jpg", "https://images.igdb.com/igdb/image/upload/t_screenshot_big/scxw02.jpg"]	游戏的首发表现无疑是灾难级别的，各种BUG泛滥，半成品的表现等等。但这部作品的底子很好，游戏故事的世界观，枪械的设计手感很不错。\n\n遇到了著名的黑梦BUG：在强尼银手大闹荒坂塔被一枪打晕进入回忆时，整个画面几乎全黑，只能靠声音判断游戏的状态。沉浸感太强，以至于当时完全没觉得这是个BUG。	t	2026-06-09 13:58:44.907	2026-08-17 07:15:48.029
\.


--
-- Data for Name: UpcomingGame; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UpcomingGame" (id, title, "titleZh", "releaseDate", platforms, genres, price, summary, "coverImageUrl", screenshots, "steamAppId", developer, publisher, "isInterested", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: Game Game_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Game"
    ADD CONSTRAINT "Game_pkey" PRIMARY KEY (id);


--
-- Name: UpcomingGame UpcomingGame_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UpcomingGame"
    ADD CONSTRAINT "UpcomingGame_pkey" PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict VnXBN76JE3Ygm8DrI9M01fx4GRaAeHqyhejBKzIm4hOc8HhL2jROvaOetxKeHCZ

