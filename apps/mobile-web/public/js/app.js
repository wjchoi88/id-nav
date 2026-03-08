'use strict';

const API = '';  // 동일 오리진

// ─────────────────────────────────────────────
// i18n 다국어 지원
// ─────────────────────────────────────────────

const I18N = {
  ko: {
    appTitle: '샛강역 내비게이션',
    qrHint: '입구 QR 코드를 카메라에 비춰 주세요',
    cameraError: '카메라 접근이 거부되었습니다.\n브라우저 설정에서 카메라 권한을 허용해 주세요.',
    accessibilityLabel: '교통약자',
    accessibilityAriaLabel: '교통약자 모드 (엘리베이터 우선)',
    floorB1: 'B1 평면도',
    floorB2: 'B2 평면도',
    destSelectBtn: '목적지 선택',
    qrScanBtn: 'QR 스캔',
    destPanelTitle: '목적지를 선택하세요',
    destPanelClose: '닫기',
    destLoading: '목적지 로드 중…',
    destError: '목적지 정보를 불러올 수 없습니다.',
    navDest: '목적지',
    navDist: '예상 거리',
    catBoarding: '승차위치',
    catFacility: '편의시설',
    catOther: '기타',
    sessionError: '목적지 설정 중 오류가 발생했습니다: ',
    langBtn: 'EN',
  },
  en: {
    appTitle: 'Saetgang Station Nav',
    qrHint: 'Point camera at the entrance QR code',
    cameraError: 'Camera access denied.\nPlease allow camera permission in browser settings.',
    accessibilityLabel: 'Accessibility',
    accessibilityAriaLabel: 'Accessibility mode (elevator priority)',
    floorB1: 'B1 Floor Plan',
    floorB2: 'B2 Floor Plan',
    destSelectBtn: 'Select Destination',
    qrScanBtn: 'QR Scan',
    destPanelTitle: 'Select a destination',
    destPanelClose: 'Close',
    destLoading: 'Loading destinations…',
    destError: 'Unable to load destinations.',
    navDest: 'Destination',
    navDist: 'Est. Distance',
    catBoarding: 'Boarding',
    catFacility: 'Facilities',
    catOther: 'Other',
    sessionError: 'Error setting destination: ',
    langBtn: '한',
  }
};

function detectLang() {
  const saved = localStorage.getItem('idnav_lang');
  if (saved && I18N[saved]) return saved;
  const nav = (navigator.language || 'ko').toLowerCase();
  return nav.startsWith('ko') ? 'ko' : 'en';
}

let currentLang = detectLang();

function t(key) {
  return (I18N[currentLang] || I18N.ko)[key] || key;
}

function applyI18n() {
  document.documentElement.lang = currentLang;
  document.title = t('appTitle');

  const title = document.querySelector('.app-title');
  if (title) title.textContent = t('appTitle');

  const qrHint = document.querySelector('.qr-hint-text');
  if (qrHint) qrHint.textContent = t('qrHint');

  const mobilityLabel = document.querySelector('.mobility-toggle-label');
  if (mobilityLabel) mobilityLabel.textContent = t('accessibilityLabel');

  const mobilityToggle = document.getElementById('mobility-toggle');
  if (mobilityToggle) mobilityToggle.setAttribute('aria-label', t('accessibilityAriaLabel'));

  const b1Tab = document.querySelector('.floor-tab-btn[data-tab="b1"]');
  if (b1Tab) b1Tab.textContent = t('floorB1');

  const b2Tab = document.querySelector('.floor-tab-btn[data-tab="b2"]');
  if (b2Tab) b2Tab.textContent = t('floorB2');

  const destBtn = document.getElementById('dest-select-btn');
  if (destBtn) destBtn.textContent = t('destSelectBtn');

  const qrBtn = document.getElementById('qr-scan-btn');
  if (qrBtn) qrBtn.innerHTML = `<span>&#9633;</span> ${t('qrScanBtn')}`;

  const panelTitle = document.getElementById('dest-panel-title');
  if (panelTitle) panelTitle.textContent = t('destPanelTitle');

  const closeBtn = document.getElementById('dest-panel-close');
  if (closeBtn) {
    closeBtn.setAttribute('aria-label', t('destPanelClose'));
  }

  const scannerError = document.getElementById('scanner-error');
  if (scannerError) scannerError.innerHTML = t('cameraError').replace('\n', '<br>');

  const langBtn = document.getElementById('lang-btn');
  if (langBtn) langBtn.textContent = t('langBtn');
}

function toggleLang() {
  currentLang = currentLang === 'ko' ? 'en' : 'ko';
  localStorage.setItem('idnav_lang', currentLang);
  applyI18n();
  updateNavInfo();
}

const state = {
  sessionId: null,
  anchorCode: null,
  anchor: null,
  isMobilityImpaired: false,
  destination: null,
  currentPath: [],    // 앞으로 갈 경로 [{id, anchor_code, label, floor, map_x, map_y, elev_x, elev_y, edge_type}]
  traveledPath: [],   // 지나온 경로 (anchor 목록)
  currentFloor: 'B1',
  totalDistanceM: 0,  // 경로 전체 거리 (m)
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
    alert(t('sessionError') + err.message);
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
    state.totalDistanceM = data.distanceM || 0;
    // 경로 시작 층으로 평면도 자동 전환
    if (state.currentPath.length > 0) {
      const startFloor = state.currentPath[0].floor;
      switchTab(startFloor === 'B2' ? 'b2' : 'b1');
    }
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

    const LABELS = { boarding: t('catBoarding'), facility: t('catFacility'), other: t('catOther') };
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
      panel.innerHTML = `<p style="padding:16px;color:#6c757d;font-size:13px;">${t('destError')}</p>`;
    }
  } catch (err) {
    console.error('loadDestinations 오류:', err);
    const panel = document.getElementById('destination-list');
    if (panel) panel.innerHTML = `<p style="padding:16px;color:#6c757d;font-size:13px;">${t('destError')}</p>`;
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

// 앵커 배열을 꺽은선(orthogonal) SVG points 문자열로 변환
// 두 점 사이: (x1,y1) → (x1, midY) → (x2, midY) → (x2, y2)
function toOrthoPts(anchors) {
  if (!anchors || anchors.length === 0) return '';
  const pts = [[anchors[0].map_x, anchors[0].map_y]];
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i], b = anchors[i + 1];
    const midY = Math.round((a.map_y + b.map_y) / 2);
    pts.push([a.map_x, midY]);
    pts.push([b.map_x, midY]);
    pts.push([b.map_x, b.map_y]);
  }
  return pts.map(([x, y]) => `${x},${y}`).join(' ');
}

function renderFloorMap(floor) {
  const svgId = floor === 'B1' ? 'overlay-b1' : 'overlay-b2';
  const svg = document.getElementById(svgId);
  if (!svg) return;
  svg.innerHTML = '';

  // 텍스트가 선 위에 보이도록 레이어 순서: 선 → 흰 테두리 → 마커
  let pathLayer = '';
  let markerLayer = '';

  // 지나온 경로 (파란 점선) — 흰 테두리 + 파란 선
  const traveled = state.traveledPath.filter(a => a.floor === floor);
  if (traveled.length > 1) {
    const pts = toOrthoPts(traveled);
    pathLayer += `<polyline points="${pts}" stroke="#fff" stroke-width="9" stroke-dasharray="8,5" fill="none" opacity="0.7"/>`;
    pathLayer += `<polyline points="${pts}" stroke="#4A90D9" stroke-width="5" stroke-dasharray="8,5" fill="none" opacity="0.95"/>`;
  }

  // 앞으로 갈 경로 (주황 실선 + 화살표) — 흰 테두리 + 주황 선
  const future = state.currentPath.filter(a => a.floor === floor);
  if (future.length > 1) {
    const pts = toOrthoPts(future);
    pathLayer += `
      <defs>
        <marker id="arrow-${floor}" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto">
          <path d="M0,0 L0,8 L10,4 z" fill="#FF6B35" stroke="#fff" stroke-width="1"/>
        </marker>
      </defs>
      <polyline points="${pts}" stroke="#fff" stroke-width="10" fill="none" opacity="0.6"/>
      <polyline points="${pts}" stroke="#FF6B35" stroke-width="6" fill="none"
        marker-end="url(#arrow-${floor})" opacity="1"/>`;
  }

  // 현재 위치 마커 (맥동 애니메이션)
  const currentAnchor = state.traveledPath.length > 0
    ? state.traveledPath[state.traveledPath.length - 1]
    : (state.currentPath.length > 0 ? state.currentPath[0] : null);

  if (currentAnchor && currentAnchor.floor === floor) {
    markerLayer += `
      <circle cx="${currentAnchor.map_x}" cy="${currentAnchor.map_y}" r="18"
        fill="#4A90D9" opacity="0.2">
        <animate attributeName="r" values="14;22;14" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${currentAnchor.map_x}" cy="${currentAnchor.map_y}" r="10" fill="#fff"/>
      <circle cx="${currentAnchor.map_x}" cy="${currentAnchor.map_y}" r="8" fill="#4A90D9"/>`;
  }

  // 목적지 마커
  const dest = state.destination;
  if (dest && dest.floor === floor) {
    markerLayer += `
      <circle cx="${dest.map_x}" cy="${dest.map_y}" r="14" fill="#fff" stroke="#FF6B35" stroke-width="3"/>
      <text x="${dest.map_x}" y="${dest.map_y + 6}" text-anchor="middle" font-size="16" aria-hidden="true">&#11088;</text>`;
  }

  svg.innerHTML = pathLayer + markerLayer;
}

function renderElevation() {
  const svg = document.getElementById('overlay-elev');
  if (!svg) return;
  svg.innerHTML = '';

  // 경로 전체 (지나온 경로 + 앞으로 갈 경로)
  const allPath = [...state.traveledPath, ...state.currentPath];

  // 층간 이동 구간 선 표시
  let prevAnchor = null;
  allPath.forEach((anchor) => {
    if (
      prevAnchor &&
      prevAnchor.floor !== anchor.floor &&
      prevAnchor.elev_x != null && prevAnchor.elev_y != null &&
      anchor.elev_x != null && anchor.elev_y != null
    ) {
      const midY = Math.round((prevAnchor.elev_y + anchor.elev_y) / 2);
      const elevPts = [
        `${prevAnchor.elev_x},${prevAnchor.elev_y}`,
        `${prevAnchor.elev_x},${midY}`,
        `${anchor.elev_x},${midY}`,
        `${anchor.elev_x},${anchor.elev_y}`
      ].join(' ');
      svg.innerHTML += `<polyline points="${elevPts}" stroke="#fff" stroke-width="8" stroke-dasharray="8,5" fill="none"/>
        <polyline points="${elevPts}" stroke="#FF6B35" stroke-width="5" stroke-dasharray="8,5" fill="none"/>`;
    }
    prevAnchor = anchor;
  });

  // 현재 위치 마커
  const currentAnchor = state.traveledPath.length > 0
    ? state.traveledPath[state.traveledPath.length - 1]
    : (state.currentPath.length > 0 ? state.currentPath[0] : null);

  if (currentAnchor && currentAnchor.elev_x != null && currentAnchor.elev_y != null) {
    svg.innerHTML += `
      <circle cx="${currentAnchor.elev_x}" cy="${currentAnchor.elev_y}" r="12"
        fill="#4A90D9" opacity="0.25">
        <animate attributeName="r" values="10;16;10" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${currentAnchor.elev_x}" cy="${currentAnchor.elev_y}" r="7" fill="#4A90D9" stroke="#fff" stroke-width="2"/>`;
  }

  // 목적지 마커
  const dest = state.destination;
  if (dest && dest.elev_x != null && dest.elev_y != null) {
    svg.innerHTML += `<text x="${dest.elev_x}" y="${dest.elev_y - 10}" text-anchor="middle" font-size="16" aria-hidden="true">&#11088;</text>`;
  }
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
  document.querySelectorAll('.floor-tab-btn').forEach(btn => {
    const active = btn.dataset.tab === tabId;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('.map-panel').forEach(el => {
    el.classList.toggle('active', el.id === `tab-${tabId}`);
  });
  state.currentFloor = tabId === 'b1' ? 'B1' : 'B2';
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
  const totalDist = state.totalDistanceM || 0;

  const el = document.getElementById('nav-info-bar');
  if (!el) return;

  el.classList.add('visible');
  el.innerHTML = `
    <div class="nav-info-item">
      <span class="nav-info-label">${t('navDest')}</span>
      <span class="nav-info-value">${state.destination ? state.destination.label : '-'}</span>
    </div>
    <div class="nav-info-item nav-distance">
      <span class="nav-info-label">${t('navDist')}</span>
      <span class="nav-info-value distance-value">${Math.round(totalDist)}<small class="distance-unit">m</small></span>
    </div>
  `;
}

// ─────────────────────────────────────────────
// 이벤트 바인딩 및 초기화
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  applyI18n();

  const toggle = document.getElementById('mobility-toggle');
  if (toggle) {
    toggle.addEventListener('change', e => toggleMobility(e.target.checked));
  }
  init();
});
