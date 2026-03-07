-- =============================================================================
-- id-nav-chatbot MVP: PostgreSQL DDL
-- DB: idnav | User: idnav | Host: idnav-db (Docker, HostPort: 5433)
-- PostgreSQL 16 + PostGIS 3.4
-- 재실행 가능 (DROP TABLE IF EXISTS ... CASCADE 포함)
-- =============================================================================

-- PostGIS 확장 (이미 설치된 경우 무시됨)
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- 1. admin_users — 관리자 계정
-- =============================================================================
DROP TABLE IF EXISTS admin_users CASCADE;

CREATE TABLE admin_users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(80)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,           -- bcrypt
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 2. anchors — QR 앵커 위치
-- =============================================================================
DROP TABLE IF EXISTS anchors CASCADE;

CREATE TABLE anchors (
    id                   SERIAL PRIMARY KEY,
    anchor_code          VARCHAR(50)  NOT NULL UNIQUE,   -- 예: 'B1-A01'
    label                VARCHAR(200) NOT NULL,           -- 예: '9호선 승강장 중앙'
    floor                VARCHAR(10)  NOT NULL,           -- 'B1' | 'B2'
    map_x                INTEGER,                         -- SVG 평면도 픽셀 x (임시)
    map_y                INTEGER,                         -- SVG 평면도 픽셀 y (임시)
    elev_x               INTEGER,                         -- 입면도 픽셀 x (임시)
    elev_y               INTEGER,                         -- 입면도 픽셀 y (임시)
    is_exit              BOOLEAN      NOT NULL DEFAULT FALSE,
    is_elevator          BOOLEAN      NOT NULL DEFAULT FALSE,
    is_destination       BOOLEAN      NOT NULL DEFAULT FALSE,
    destination_category VARCHAR(50),                     -- 'boarding' | 'facility' | 'other' | NULL
    qr_code_svg          TEXT,                            -- QR SVG (생성 시 저장)
    qr_url               VARCHAR(500),                    -- 스캔 시 접속 URL
    qr_hmac_sig          VARCHAR(64),                     -- HMAC-SHA256 서명
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- destination_category 값 제약
ALTER TABLE anchors
    ADD CONSTRAINT chk_anchors_destination_category
    CHECK (destination_category IN ('boarding', 'facility', 'other') OR destination_category IS NULL);

-- floor 값 제약
ALTER TABLE anchors
    ADD CONSTRAINT chk_anchors_floor
    CHECK (floor IN ('B1', 'B2'));

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_anchors_updated_at
    BEFORE UPDATE ON anchors
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- =============================================================================
-- 3. nav_graph_edges — 경로 그래프 엣지
-- =============================================================================
DROP TABLE IF EXISTS nav_graph_edges CASCADE;

CREATE TABLE nav_graph_edges (
    id              SERIAL PRIMARY KEY,
    from_anchor_id  INTEGER        NOT NULL REFERENCES anchors(id) ON DELETE CASCADE,
    to_anchor_id    INTEGER        NOT NULL REFERENCES anchors(id) ON DELETE CASCADE,
    distance_m      NUMERIC(8, 2)  NOT NULL DEFAULT 0,    -- 미터 단위 (임시값)
    edge_type       VARCHAR(20)    NOT NULL DEFAULT 'walk', -- 'walk' | 'elevator' | 'stairs'
    is_accessible   BOOLEAN        NOT NULL DEFAULT TRUE,  -- 교통약자 이용 가능
    UNIQUE (from_anchor_id, to_anchor_id)
);

-- edge_type 값 제약
ALTER TABLE nav_graph_edges
    ADD CONSTRAINT chk_edges_edge_type
    CHECK (edge_type IN ('walk', 'elevator', 'stairs'));

-- =============================================================================
-- 4. nav_sessions — 내비게이션 세션
-- =============================================================================
DROP TABLE IF EXISTS nav_sessions CASCADE;

CREATE TABLE nav_sessions (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    start_anchor_id       INTEGER      NOT NULL REFERENCES anchors(id),
    current_anchor_id     INTEGER      NOT NULL REFERENCES anchors(id),
    destination_anchor_id INTEGER      REFERENCES anchors(id),   -- nullable
    is_mobility_impaired  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_seen_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    ended_at              TIMESTAMPTZ,                            -- nullable
    arrived_at            TIMESTAMPTZ                            -- nullable
);

-- =============================================================================
-- 5. nav_events — 앵커 스캔 이력
-- =============================================================================
DROP TABLE IF EXISTS nav_events CASCADE;

CREATE TABLE nav_events (
    id          SERIAL      PRIMARY KEY,
    session_id  UUID        NOT NULL REFERENCES nav_sessions(id) ON DELETE CASCADE,
    anchor_id   INTEGER     NOT NULL REFERENCES anchors(id),
    event_type  VARCHAR(20) NOT NULL,   -- 'start' | 'scan' | 'arrived'
    scanned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- event_type 값 제약
ALTER TABLE nav_events
    ADD CONSTRAINT chk_events_event_type
    CHECK (event_type IN ('start', 'scan', 'arrived'));

-- =============================================================================
-- 인덱스
-- =============================================================================
CREATE INDEX idx_anchors_floor            ON anchors(floor);
CREATE INDEX idx_anchors_is_destination   ON anchors(is_destination);
CREATE INDEX idx_edges_from_anchor        ON nav_graph_edges(from_anchor_id);
CREATE INDEX idx_edges_to_anchor          ON nav_graph_edges(to_anchor_id);
CREATE INDEX idx_sessions_current_anchor  ON nav_sessions(current_anchor_id);
CREATE INDEX idx_events_session_id        ON nav_events(session_id);
CREATE INDEX idx_events_anchor_id         ON nav_events(anchor_id);
