-- =============================================================================
-- id-nav-chatbot MVP: 샛강역 샘플 데이터 (seed.sql)
-- schema.sql 실행 후 적용
-- =============================================================================

-- =============================================================================
-- 1. admin_users
--    password: admin1234
--    bcrypt hash: $2b$10$AYwEcx4n9KNzZzUc/rUI0.KWbDuijeYc9TA9Smq7KrNYidvjSbSzC
-- =============================================================================
INSERT INTO admin_users (username, password_hash) VALUES
    ('admin', '$2b$10$AYwEcx4n9KNzZzUc/rUI0.KWbDuijeYc9TA9Smq7KrNYidvjSbSzC')
ON CONFLICT (username) DO NOTHING;

-- =============================================================================
-- 2. anchors — 샛강역 12개 앵커 (임시 좌표)
-- =============================================================================

-- ─── B1 (8개) ────────────────────────────────────────────────────────────────
INSERT INTO anchors (
    anchor_code, label, floor,
    map_x, map_y, elev_x, elev_y,
    is_exit, is_elevator, is_destination,
    destination_category,
    qr_url, qr_hmac_sig
) VALUES
-- B1-A01: 9호선 승강장 동쪽
(
    'B1-A01', '9호선 승강장 동쪽', 'B1',
    800, 400, 475, 195,
    FALSE, FALSE, TRUE,
    'boarding',
    'https://id-nav.databuilder.co.kr/scan/B1-A01', 'placeholder'
),
-- B1-A02: 9호선 승강장 서쪽
(
    'B1-A02', '9호선 승강장 서쪽', 'B1',
    200, 400, 125, 195,
    FALSE, FALSE, TRUE,
    'boarding',
    'https://id-nav.databuilder.co.kr/scan/B1-A02', 'placeholder'
),
-- B1-A03: 개찰구 앞
(
    'B1-A03', '개찰구 앞', 'B1',
    500, 300, 300, 180,
    FALSE, FALSE, FALSE,
    NULL,
    'https://id-nav.databuilder.co.kr/scan/B1-A03', 'placeholder'
),
-- B1-A04: 1번 출구
(
    'B1-A04', '1번 출구', 'B1',
    150, 100, 140,  95,
    TRUE, FALSE, TRUE,
    'other',
    'https://id-nav.databuilder.co.kr/scan/B1-A04', 'placeholder'
),
-- B1-A05: 2번 출구
(
    'B1-A05', '2번 출구', 'B1',
    850, 100, 460,  95,
    TRUE, FALSE, TRUE,
    'other',
    'https://id-nav.databuilder.co.kr/scan/B1-A05', 'placeholder'
),
-- B1-A06: 엘리베이터
(
    'B1-A06', 'B1 엘리베이터', 'B1',
    500, 200, 300, 215,
    FALSE, TRUE, FALSE,
    NULL,
    'https://id-nav.databuilder.co.kr/scan/B1-A06', 'placeholder'
),
-- B1-A07: 편의점 앞
(
    'B1-A07', '편의점 앞', 'B1',
    350, 300, 230, 225,
    FALSE, FALSE, TRUE,
    'facility',
    'https://id-nav.databuilder.co.kr/scan/B1-A07', 'placeholder'
),
-- B1-A08: 환승 통로 입구
(
    'B1-A08', '환승 통로 입구', 'B1',
    500, 500, 370, 225,
    FALSE, FALSE, FALSE,
    NULL,
    'https://id-nav.databuilder.co.kr/scan/B1-A08', 'placeholder'
);

-- ─── B2 (4개) ────────────────────────────────────────────────────────────────
INSERT INTO anchors (
    anchor_code, label, floor,
    map_x, map_y, elev_x, elev_y,
    is_exit, is_elevator, is_destination,
    destination_category,
    qr_url, qr_hmac_sig
) VALUES
-- B2-A01: 신림선 승강장 북쪽
(
    'B2-A01', '신림선 승강장 북쪽', 'B2',
    500, 150, 250, 317,
    FALSE, FALSE, TRUE,
    'boarding',
    'https://id-nav.databuilder.co.kr/scan/B2-A01', 'placeholder'
),
-- B2-A02: 신림선 승강장 남쪽
(
    'B2-A02', '신림선 승강장 남쪽', 'B2',
    500, 650, 250, 360,
    FALSE, FALSE, TRUE,
    'boarding',
    'https://id-nav.databuilder.co.kr/scan/B2-A02', 'placeholder'
),
-- B2-A03: B2 엘리베이터
(
    'B2-A03', 'B2 엘리베이터', 'B2',
    500, 250, 290, 318,
    FALSE, TRUE, FALSE,
    NULL,
    'https://id-nav.databuilder.co.kr/scan/B2-A03', 'placeholder'
),
-- B2-A04: B2 개찰구
(
    'B2-A04', 'B2 개찰구', 'B2',
    500, 400, 375, 332,
    FALSE, FALSE, FALSE,
    NULL,
    'https://id-nav.databuilder.co.kr/scan/B2-A04', 'placeholder'
);

-- =============================================================================
-- 3. nav_graph_edges — 샛강역 연결 구조 (양방향)
--    anchor_id 참조 순서: B1-A01~A08 → id 1~8, B2-A01~A04 → id 9~12
-- =============================================================================

-- anchor_code → id 매핑을 위한 헬퍼 함수 (seed 내부용)
-- WITH 절로 anchor_id를 동적으로 조회하여 INSERT

WITH a AS (
    SELECT anchor_code, id FROM anchors
)
INSERT INTO nav_graph_edges (from_anchor_id, to_anchor_id, distance_m, edge_type, is_accessible)
SELECT f.id, t.id, dist, etype, accessible
FROM (VALUES
    -- ── B1 내 walk 연결 (양방향) ──────────────────────────────────────────
    -- 승강장 동↔서
    ('B1-A01', 'B1-A02', 50.00, 'walk', TRUE),
    ('B1-A02', 'B1-A01', 50.00, 'walk', TRUE),
    -- 승강장 동↔개찰구
    ('B1-A01', 'B1-A03', 30.00, 'walk', TRUE),
    ('B1-A03', 'B1-A01', 30.00, 'walk', TRUE),
    -- 승강장 서↔개찰구
    ('B1-A02', 'B1-A03', 30.00, 'walk', TRUE),
    ('B1-A03', 'B1-A02', 30.00, 'walk', TRUE),
    -- 개찰구↔1번출구
    ('B1-A03', 'B1-A04', 20.00, 'walk', TRUE),
    ('B1-A04', 'B1-A03', 20.00, 'walk', TRUE),
    -- 개찰구↔2번출구
    ('B1-A03', 'B1-A05', 20.00, 'walk', TRUE),
    ('B1-A05', 'B1-A03', 20.00, 'walk', TRUE),
    -- 개찰구↔엘리베이터
    ('B1-A03', 'B1-A06', 15.00, 'walk', TRUE),
    ('B1-A06', 'B1-A03', 15.00, 'walk', TRUE),
    -- 개찰구↔편의점
    ('B1-A03', 'B1-A07', 10.00, 'walk', TRUE),
    ('B1-A07', 'B1-A03', 10.00, 'walk', TRUE),
    -- 개찰구↔환승통로
    ('B1-A03', 'B1-A08', 25.00, 'walk', TRUE),
    ('B1-A08', 'B1-A03', 25.00, 'walk', TRUE),
    -- 편의점↔환승통로
    ('B1-A07', 'B1-A08', 20.00, 'walk', TRUE),
    ('B1-A08', 'B1-A07', 20.00, 'walk', TRUE),
    -- 엘리베이터↔환승통로
    ('B1-A06', 'B1-A08', 20.00, 'walk', TRUE),
    ('B1-A08', 'B1-A06', 20.00, 'walk', TRUE),

    -- ── B1 엘리베이터 ↔ B2 엘리베이터 (층간 이동) ─────────────────────────
    ('B1-A06', 'B2-A03', 30.00, 'elevator', TRUE),
    ('B2-A03', 'B1-A06', 30.00, 'elevator', TRUE),

    -- ── B1 환승통로 ↔ B2 개찰구 (계단, 교통약자 이용 불가) ─────────────────
    ('B1-A08', 'B2-A04', 15.00, 'stairs', FALSE),
    ('B2-A04', 'B1-A08', 15.00, 'stairs', FALSE),

    -- ── B2 내 walk 연결 (양방향) ──────────────────────────────────────────
    -- 개찰구↔엘리베이터
    ('B2-A04', 'B2-A03', 10.00, 'walk', TRUE),
    ('B2-A03', 'B2-A04', 10.00, 'walk', TRUE),
    -- 개찰구↔승강장 북쪽
    ('B2-A04', 'B2-A01', 25.00, 'walk', TRUE),
    ('B2-A01', 'B2-A04', 25.00, 'walk', TRUE),
    -- 개찰구↔승강장 남쪽
    ('B2-A04', 'B2-A02', 25.00, 'walk', TRUE),
    ('B2-A02', 'B2-A04', 25.00, 'walk', TRUE),
    -- 승강장 북↔남
    ('B2-A01', 'B2-A02', 40.00, 'walk', TRUE),
    ('B2-A02', 'B2-A01', 40.00, 'walk', TRUE),
    -- 엘리베이터↔승강장 북쪽
    ('B2-A03', 'B2-A01', 20.00, 'walk', TRUE),
    ('B2-A01', 'B2-A03', 20.00, 'walk', TRUE)

) AS edges(from_code, to_code, dist, etype, accessible)
JOIN a AS f ON f.anchor_code = edges.from_code
JOIN a AS t ON t.anchor_code = edges.to_code
ON CONFLICT (from_anchor_id, to_anchor_id) DO NOTHING;
