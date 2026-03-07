'use strict';

const API = '';  // 동일 오리진

const state = {
  sessionId: null,
  anchorCode: null,
  anchor: null,
  isMobilityImpaired: false,
  destination: null,
  currentPath: [],    // 앞으로 갈 경로 [{id, anchor_code, label, floor, map_x, map_y, elev_x, elev_y, edge_type, distance_from_prev}]
  traveledPath: [],   // 지나온 경로 (anchor 목록)
  currentFloor: 'B1',
};

// ─────────────────────────────────────────────
// 초기화
// ─────────────────────────────────────────────

async function init() {
  // 1. URL 파싱
  const params = new URLSearchParams(location.search);
  state.anchorCode = params.get('anchor');
  const sessionParam = params.get('session');

  // 2. localStorage에서 세션 복원
  state.sessionId = sessionParam || localStorage.getItem('idnav_session');
  state.isMobilityImpaired = localStorage.getItem('idnav_mobility') === 'true';

  // 토글 UI 초기화
  const toggle = document.getElementById('mobility-toggle');
  if (toggle) toggle.checked = state.isMobilityImpaired;

  if (!state.anchorCode) {
    // QR 스캔 화면 표시
    showQrScanner();
    return;
  }

  if (state.sessionId) {
    // 기존 세션: 스캔 이벤트 기록
    await continueSession();
  } else {
    // 새 세션: 도착지 선택 화면
    await loadDestinations();
    showDestinationPanel();
  }
}

// ─────────────────────────────────────────────
// 세션 처리
// ─────────────────────────────────────────────

async function continueSession() {
  try {
    const res = await fetch(`${API}/api/session/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: state.sessionId, anchorCode: state.anchorCode })
    });

    if (!res.ok) {
      // 세션 만료 등 → 새 세션 시작
      localStorage.removeItem('idnav_session');
      state.sessionId = null;
      await loadDestinations();
      showDestinationPanel();
      return;
    }

    const data = await res.json();
    state.traveledPath = data.scannedPath || [];

    // 기존 세션에서 목적지 정보 로드
    const sessRes = await fetch(`${API}/api/session/${state.sessionId}`);
    if (sessRes.ok) {
      const sess = await sessRes.json();
      state.destination = sess.destination || null;
      if (sess.is_mobility_impaired !== undefined) {
        state.isMobilityImpaired = Boolean(sess.is_mobility_impaired);
        const toggle = document.getElementById('mobility-toggle');
        if (toggle) toggle.checked = state.isMobilityImpaired;
      }
    }

    if (state.destination) {
      await calculatePath();
    }
  } catch (err) {
    console.error('continueSession 오류:', err);
  }
}

async function selectDestination(anchor) {
  state.destination = anchor;
  hideDestinationPanel();

  try {
    // 세션 시작
    const res = await fetch(`${API}/api/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anchorCode: state.anchorCode, isMobilityImpaired: state.isMobilityImpaired })
    });
    if (!res.ok) throw new Error('세션 시작 실패');
    const data = await res.json();
    state.sessionId = data.sessionId;
    localStorage.setItem('idnav_session', state.sessionId);

    // 목적지 설정 (엔드포인트가 없으면 무시하고 path 계산으로 진행)
    try {
      await fetch(`${API}/api/session/destination`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: state.sessionId, destinationAnchorId: anchor.id })
      });
    } catch (_) {
      // /api/session/destination 엔드포인트가 없어도 계속 진행
    }

    await calculatePath();
  } catch (err) {
    console.error('selectDestination 오류:', err);
    alert('목적지 설정 중 오류가 발생했습니다: ' + err.message);
  }
}

// ─────────────────────────────────────────────
// 경로 계산
// ─────────────────────────────────────────────

async function calculatePath() {
  if (!state.sessionId || !state.destination) return;
  try {
    const res = await fetch(`${API}/api/navigation/path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: state.sessionId,
        destinationAnchorId: state.destination.id,
        isMobilityImpaired: state.isMobilityImpaired
      })
    });
    if (!res.ok) return;
    const data = await res.json();
    state.currentPath = data.path || [];
    renderAllMaps();
  } catch (err) {
    console.error('calculatePath 오류:', err);
  }
}

// ─────────────────────────────────────────────
// 도착지 목록 로드
// ─────────────────────────────────────────────

async function loadDestinations() {
  try {
    const res = await fetch(`${API}/api/navigation/destinations`);
    const groups = await res.json();  // { boarding: [...], facility: [...], other: [...] }

    const LABELS = { boarding: '승차위치', facility: '편의시설', other: '기타' };
    const panel = document.getElementById('destination-list');
    panel.innerHTML = '';

    let hasAny = false;
    for (const [key, items] of Object.entries(groups)) {
      if (!items || !items.length) continue;
      hasAny = true;
      const section = document.createElement('div');
      section.className = 'dest-section';
      section.innerHTML = `<div class="dest-section-header"><span class="section-title">${LABELS[key] || key}</span></div>`;
      const itemsWrap = document.createElement('div');
      itemsWrap.className = 'dest-section-items';
      items.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'dest-item';
        btn.setAttribute('aria-label', `${item.label} (${item.floor})`);
        btn.innerHTML = `<span class="dest-info"><span class="dest-name">${item.label}</span><span class="dest-floor">${item.floor}</span></span><span class="dest-arrow">&#8250;</span>`;
        btn.onclick = () => selectDestination(item);
        itemsWrap.appendChild(btn);
      });
      section.appendChild(itemsWrap);
      panel.appendChild(section);
    }

    if (!hasAny) {
      panel.innerHTML = '<p style="padding:16px;color:#6c757d;font-size:13px;">목적지 정보를 불러올 수 없습니다.</p>';
    }
  } catch (err) {
    console.error('loadDestinations 오류:', err);
    const panel = document.getElementById('destination-list');
    if (panel) panel.innerHTML = '<p style="padding:16px;color:#6c757d;font-size:13px;">목적지 정보를 불러올 수 없습니다.</p>';
  }
}

// ─────────────────────────────────────────────
// 지도 렌더링
// ─────────────────────────────────────────────

function renderAllMaps() {
  renderElevation();
  renderFloorMap('B1');
  renderFloorMap('B2');
  updateNavInfo();
}

function renderFloorMap(floor) {
  const svgId = floor === 'B1' ? 'overlay-b1' : 'overlay-b2';
  const svg = document.getElementById(svgId);
  if (!svg) return;
  svg.innerHTML = '';

  // 지나온 경로 (파란 점선)
  const traveled = state.traveledPath.filter(a => a.floor === floor);
  if (traveled.length > 1) {
    const points = traveled.map(a => `${a.map_x},${a.map_y}`).join(' ');
    svg.innerHTML += `<polyline points="${points}" stroke="#4A90D9" stroke-width="3" stroke-dasharray="6,4" fill="none" opacity="0.8"/>`;
  }

  // 앞으로 갈 경로 (주황 실선 + 화살표)
  const future = state.currentPath.filter(a => a.floor === floor);
  if (future.length > 1) {
    const points = future.map(a => `${a.map_x},${a.map_y}`).join(' ');
    svg.innerHTML += `
      <defs>
        <marker id="arrow-${floor}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#FF6B35"/>
        </marker>
      </defs>
      <polyline points="${points}" stroke="#FF6B35" stroke-width="4" fill="none"
        marker-end="url(#arrow-${floor})" opacity="0.9"/>`;
  }

  // 현재 위치 마커 (맥동 애니메이션)
  const currentAnchor = state.traveledPath.length > 0
    ? state.traveledPath[state.traveledPath.length - 1]
    : (state.currentPath.length > 0 ? state.currentPath[0] : null);

  if (currentAnchor && currentAnchor.floor === floor) {
    svg.innerHTML += `
      <circle cx="${currentAnchor.map_x}" cy="${currentAnchor.map_y}" r="10"
        fill="#4A90D9" opacity="0.3">
        <animate attributeName="r" values="8;14;8" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${currentAnchor.map_x}" cy="${currentAnchor.map_y}" r="6" fill="#4A90D9"/>`;
  }

  // 목적지 마커
  const dest = state.destination;
  if (dest && dest.floor === floor) {
    svg.innerHTML += `
      <text x="${dest.map_x}" y="${dest.map_y - 12}" text-anchor="middle" font-size="18" aria-hidden="true">&#11088;</text>`;
  }
}

function renderElevation() {
  const svg = document.getElementById('overlay-elev');
  if (!svg) return;
  svg.innerHTML = '';

  // 층간 이동이 있는 경우 입면도에 경로 표시
  const allPath = [...state.traveledPath, ...state.currentPath];
  let prevAnchor = null;
  allPath.forEach((anchor) => {
    if (
      prevAnchor &&
      prevAnchor.floor !== anchor.floor &&
      prevAnchor.elev_x != null && prevAnchor.elev_y != null &&
      anchor.elev_x != null && anchor.elev_y != null
    ) {
      svg.innerHTML += `<line x1="${prevAnchor.elev_x}" y1="${prevAnchor.elev_y}"
        x2="${anchor.elev_x}" y2="${anchor.elev_y}"
        stroke="#FF6B35" stroke-width="3" stroke-dasharray="4,3"/>`;
    }
    prevAnchor = anchor;
  });
}

// ─────────────────────────────────────────────
// 교통약자 토글
// ─────────────────────────────────────────────

function toggleMobility(checked) {
  state.isMobilityImpaired = checked;
  localStorage.setItem('idnav_mobility', String(checked));
  if (state.sessionId && state.destination) {
    calculatePath();
  }
}

// ─────────────────────────────────────────────
// 탭 전환
// ─────────────────────────────────────────────

function switchTab(tabId) {
  document.querySelectorAll('.map-tab-btn').forEach(btn => {
    const active = btn.dataset.tab === tabId;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('.map-panel').forEach(el => {
    el.classList.toggle('active', el.id === `tab-${tabId}`);
  });
  state.currentFloor = tabId === 'b1' ? 'B1' : tabId === 'b2' ? 'B2' : tabId;
}

// ─────────────────────────────────────────────
// UI 헬퍼
// ─────────────────────────────────────────────

function showQrScanner() {
  const qrSec = document.getElementById('qr-section');
  if (qrSec) qrSec.classList.add('active');
  if (typeof startQrScanner === 'function') startQrScanner();
}

function showMapView() {
  const qrSec = document.getElementById('qr-section');
  if (qrSec) qrSec.classList.remove('active');
  if (typeof stopQrScanner === 'function') stopQrScanner();
}

function showDestinationPanel() {
  const panel = document.getElementById('dest-panel');
  const scrim = document.getElementById('scrim');
  if (panel) {
    panel.style.display = 'flex';
    // 다음 프레임에 클래스 추가해야 CSS transition이 동작
    requestAnimationFrame(() => panel.classList.add('open'));
  }
  if (scrim) scrim.classList.add('visible');
}

function hideDestinationPanel() {
  const panel = document.getElementById('dest-panel');
  const scrim = document.getElementById('scrim');
  if (panel) {
    panel.classList.remove('open');
    panel.addEventListener('transitionend', function handler() {
      panel.style.display = 'none';
      panel.removeEventListener('transitionend', handler);
    });
  }
  if (scrim) scrim.classList.remove('visible');
}

function onDestSelectBtnClick() {
  loadDestinations().then(() => showDestinationPanel());
}

function updateNavInfo() {
  const totalDist = state.currentPath.reduce((sum, a, i) => {
    if (i === 0) return sum;
    return sum + (a.distance_from_prev || 0);
  }, 0);

  const el = document.getElementById('nav-info-bar');
  if (!el) return;

  el.classList.add('visible');
  el.innerHTML = `
    <div class="nav-info-item">
      <span class="nav-info-label">목적지</span>
      <span class="nav-info-value">${state.destination ? state.destination.label : '-'}</span>
    </div>
    <div class="nav-info-item nav-distance">
      <span class="nav-info-label">예상 거리</span>
      <span class="nav-info-value distance-value">${Math.round(totalDist)}<small class="distance-unit">m</small></span>
    </div>
  `;
}

// ─────────────────────────────────────────────
// 이벤트 바인딩 및 초기화
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('mobility-toggle');
  if (toggle) {
    toggle.addEventListener('change', e => toggleMobility(e.target.checked));
  }
  init();
});
