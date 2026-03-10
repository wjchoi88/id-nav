'use strict';

// =============================================================================
// admin.js — id-nav-chatbot Admin UI 공통 모듈
// =============================================================================

// -----------------------------------------------------------------------------
// apiFetch — fetch wrapper (에러 처리 포함)
// -----------------------------------------------------------------------------
async function apiFetch(url, options = {}) {
  const defaults = {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  // FormData 전송 시 Content-Type 제거 (브라우저가 자동 설정)
  if (options.body instanceof FormData) {
    delete defaults.headers['Content-Type'];
  }

  const res = await fetch(url, { ...defaults, ...options, headers: defaults.headers });

  if (res.status === 401) {
    window.location.href = '/admin/login.html';
    throw new Error('Unauthorized');
  }

  return res;
}

// -----------------------------------------------------------------------------
// checkAuth — 페이지 로드 시 인증 확인
// -----------------------------------------------------------------------------
async function checkAuth() {
  try {
    const res = await fetch('/api/admin/anchors', { credentials: 'same-origin' });
    if (res.status === 401) {
      window.location.href = '/admin/login.html';
    }
  } catch (e) {
    window.location.href = '/admin/login.html';
  }
}

// -----------------------------------------------------------------------------
// logout — GET /api/admin/logout → login.html 이동
// -----------------------------------------------------------------------------
async function logout() {
  try {
    await apiFetch('/api/admin/logout');
  } catch (e) {
    // 401 처리 시 이미 리다이렉트됨
  }
  window.location.href = '/admin/login.html';
}

// -----------------------------------------------------------------------------
// loadStats — GET /api/admin/sessions/stats → KPI 카드 업데이트
// -----------------------------------------------------------------------------
async function loadStats() {
  const res = await apiFetch('/api/admin/sessions/stats');
  if (!res.ok) throw new Error('통계 조회 실패');
  const data = await res.json();

  const totalEl        = document.getElementById('kpi-total');
  const arrivedEl      = document.getElementById('kpi-arrived');
  const successRateEl  = document.getElementById('kpi-success-rate');
  const avgDurationEl  = document.getElementById('kpi-avg-duration');

  if (totalEl)       totalEl.textContent       = (data.totalSessions ?? '–').toLocaleString();
  if (arrivedEl)     arrivedEl.textContent      = (data.arrivedSessions ?? '–').toLocaleString();
  if (successRateEl) successRateEl.textContent  = data.arrivalSuccessRate != null
    ? data.arrivalSuccessRate.toFixed(1) + '%'
    : '–';
  if (avgDurationEl) avgDurationEl.textContent  = data.avgDurationSeconds != null
    ? formatDuration(data.avgDurationSeconds)
    : '–';

  return data;
}

// -----------------------------------------------------------------------------
// formatDuration — 초 → "X분 Y초" 형식
// -----------------------------------------------------------------------------
function formatDuration(seconds) {
  if (seconds == null || isNaN(seconds)) return '–';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}초`;
  return `${m}분 ${s}초`;
}

// -----------------------------------------------------------------------------
// loadAnchors — GET /api/admin/anchors → 테이블 렌더링
// -----------------------------------------------------------------------------
async function loadAnchors() {
  const tbody = document.getElementById('anchor-tbody');
  const summary = document.getElementById('anchor-count-info');

  if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="loading">불러오는 중...</td></tr>';

  const res = await apiFetch('/api/admin/anchors');
  if (!res.ok) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="empty-state">앵커 목록을 불러올 수 없습니다.</td></tr>';
    return [];
  }

  const anchors = await res.json();
  renderAnchorTable(anchors);
  renderAnchorSummary(anchors);
  return anchors;
}

function renderAnchorTable(anchors) {
  const tbody = document.getElementById('anchor-tbody');
  if (!tbody) return;

  if (!anchors || anchors.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">등록된 앵커가 없습니다.</td></tr>';
    return;
  }

  const catLabel = { boarding: '승차위치', facility: '편의시설', other: '기타' };

  tbody.innerHTML = anchors.slice(0, 50).map(a => `
    <tr>
      <td><code>${escHtml(a.anchor_code)}</code></td>
      <td>${escHtml(a.label)}</td>
      <td><span class="badge badge-floor-${a.floor.toLowerCase()}">${escHtml(a.floor)}</span></td>
      <td><span class="badge ${a.is_exit ? 'badge-yes' : 'badge-no'}">${a.is_exit ? '예' : '–'}</span></td>
      <td><span class="badge ${a.is_elevator ? 'badge-yes' : 'badge-no'}">${a.is_elevator ? '예' : '–'}</span></td>
      <td><span class="badge ${a.is_destination ? 'badge-yes' : 'badge-no'}">${a.is_destination ? '예' : '–'}</span></td>
      <td>${a.destination_category ? `<span class="badge badge-cat">${catLabel[a.destination_category] || escHtml(a.destination_category)}</span>` : '–'}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-secondary btn-sm" onclick="downloadQR(${a.id}, '${escHtml(a.anchor_code)}')">QR 다운로드</button>
          <button class="btn btn-danger btn-sm" onclick="deleteAnchor(${a.id}, '${escHtml(a.anchor_code)}')">삭제</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderAnchorSummary(anchors) {
  const totalEl    = document.getElementById('summary-total');
  const b1El       = document.getElementById('summary-b1');
  const b2El       = document.getElementById('summary-b2');
  const elevEl     = document.getElementById('summary-elevator');

  if (!anchors) return;
  const total    = anchors.length;
  const b1       = anchors.filter(a => a.floor === 'B1').length;
  const b2       = anchors.filter(a => a.floor === 'B2').length;
  const elevator = anchors.filter(a => a.is_elevator).length;

  if (totalEl) totalEl.textContent = total;
  if (b1El)    b1El.textContent    = b1;
  if (b2El)    b2El.textContent    = b2;
  if (elevEl)  elevEl.textContent  = elevator;
}

// -----------------------------------------------------------------------------
// registerAnchor — POST /api/admin/anchors → QR SVG 표시
// -----------------------------------------------------------------------------
async function registerAnchor(formData) {
  const res = await apiFetch('/api/admin/anchors', {
    method: 'POST',
    body: JSON.stringify(formData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '등록 실패' }));
    throw new Error(err.error || '앵커 등록에 실패했습니다.');
  }

  return res.json();
}

// -----------------------------------------------------------------------------
// deleteAnchor — DELETE /api/admin/anchors/:id → confirm 후 실행
// -----------------------------------------------------------------------------
async function deleteAnchor(id, code) {
  const ok = confirm(`앵커 "${code}" 을(를) 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`);
  if (!ok) return;

  const res = await apiFetch(`/api/admin/anchors/${id}`, { method: 'DELETE' });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '삭제 실패' }));
    alert(`삭제 실패: ${err.error || '알 수 없는 오류'}`);
    return;
  }

  alert(`앵커 "${code}" 을(를) 삭제했습니다.`);
  loadAnchors();
}

// -----------------------------------------------------------------------------
// downloadQR — GET /api/admin/anchors/:id/qr → SVG 파일 다운로드
// -----------------------------------------------------------------------------
async function downloadQR(id, code) {
  const res = await apiFetch(`/api/admin/anchors/${id}/qr`);

  if (!res.ok) {
    alert('QR 코드를 불러올 수 없습니다.');
    return;
  }

  const svgText = await res.text();
  const blob = new Blob([svgText], { type: 'image/svg+xml' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `qr-${code}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -----------------------------------------------------------------------------
// showQrPreview — QR SVG를 페이지 내 미리보기로 표시
// -----------------------------------------------------------------------------
function showQrPreview(svgText, anchorCode) {
  const previewEl   = document.getElementById('qr-preview');
  const containerEl = document.getElementById('qr-svg-container');
  const downloadEl  = document.getElementById('qr-download-btn');

  if (!previewEl || !containerEl) return;

  containerEl.innerHTML = svgText;
  previewEl.classList.add('show');

  if (downloadEl) {
    const blob = new Blob([svgText], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    downloadEl.href     = url;
    downloadEl.download = `qr-${anchorCode}.svg`;
  }
}

// -----------------------------------------------------------------------------
// loadSessions — 세션 목록 로드 및 테이블 렌더링
// -----------------------------------------------------------------------------
async function loadSessions(params = {}) {
  const tbody = document.getElementById('session-tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="loading">불러오는 중...</td></tr>';

  const qs = new URLSearchParams(params).toString();
  const url = `/api/admin/sessions${qs ? '?' + qs : ''}`;
  const res = await apiFetch(url);

  if (!res.ok) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="empty-state">세션 목록을 불러올 수 없습니다.</td></tr>';
    return;
  }

  const sessions = await res.json();
  renderSessionTable(Array.isArray(sessions) ? sessions : (sessions.sessions || []));
}

function renderSessionTable(sessions) {
  const tbody = document.getElementById('session-tbody');
  if (!tbody) return;

  if (!sessions || sessions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">표시할 세션이 없습니다.</td></tr>';
    return;
  }

  tbody.innerHTML = sessions.slice(0, 50).map(s => {
    const sessionShort = String(s.id || '').substring(0, 8);
    const startAnchor  = s.start_anchor_label || s.start_anchor_id || '–';
    const destAnchor   = s.destination_anchor_label || s.destination_anchor_id || '–';
    const impaired     = s.is_mobility_impaired ? '<span class="badge badge-yes">예</span>' : '–';
    const startedAt    = s.created_at  ? formatDatetime(s.created_at)  : '–';
    const arrivedAt    = s.arrived_at  ? formatDatetime(s.arrived_at)  : '–';
    const duration     = s.arrived_at && s.created_at
      ? formatDuration((new Date(s.arrived_at) - new Date(s.created_at)) / 1000)
      : '–';

    return `
      <tr>
        <td><code title="${escHtml(String(s.id || ''))}">${escHtml(sessionShort)}…</code></td>
        <td>${escHtml(String(startAnchor))}</td>
        <td>${escHtml(String(destAnchor))}</td>
        <td>${impaired}</td>
        <td>${startedAt}</td>
        <td>${arrivedAt}</td>
        <td>${duration}</td>
      </tr>
    `;
  }).join('');
}

// -----------------------------------------------------------------------------
// formatDatetime — ISO 문자열 → "MM/DD HH:mm" 형식
// -----------------------------------------------------------------------------
function formatDatetime(isoStr) {
  if (!isoStr) return '–';
  const d = new Date(isoStr);
  if (isNaN(d)) return isoStr;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${min}`;
}

// -----------------------------------------------------------------------------
// escHtml — XSS 방어용 HTML 이스케이프
// -----------------------------------------------------------------------------
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// -----------------------------------------------------------------------------
// setActiveNav — 현재 페이지 네비게이션 링크 활성화
// -----------------------------------------------------------------------------
function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (path.endsWith(href) || (href !== '/' && path.includes(href.replace('.html', '')))) {
      a.classList.add('active');
    }
  });
}

// -----------------------------------------------------------------------------
// triggerFireAlert — POST /api/admin/alert/fire → 화재 알림 발령
// -----------------------------------------------------------------------------
async function triggerFireAlert() {
  const ok = confirm('화재 알림을 발령하시겠습니까?\n모든 모바일 사용자에게 대피 안내가 표시됩니다.');
  if (!ok) return;

  try {
    const res = await apiFetch('/api/admin/alert/fire', { method: 'POST' });
    if (!res.ok) throw new Error('발령 실패');
    updateFireAlertUI(true);
    alert('화재 알림이 발령되었습니다.');
  } catch (e) {
    alert('화재 알림 발령 실패: ' + e.message);
  }
}

// -----------------------------------------------------------------------------
// clearFireAlert — DELETE /api/admin/alert/fire → 화재 알림 해제
// -----------------------------------------------------------------------------
async function clearFireAlert() {
  const ok = confirm('화재 알림을 해제하시겠습니까?');
  if (!ok) return;

  try {
    const res = await apiFetch('/api/admin/alert/fire', { method: 'DELETE' });
    if (!res.ok) throw new Error('해제 실패');
    updateFireAlertUI(false);
    alert('화재 알림이 해제되었습니다.');
  } catch (e) {
    alert('화재 알림 해제 실패: ' + e.message);
  }
}

// -----------------------------------------------------------------------------
// loadFireAlertStatus — 현재 화재 알림 상태 조회 및 UI 업데이트
// -----------------------------------------------------------------------------
async function loadFireAlertStatus() {
  try {
    const res = await fetch('/api/alert/status');
    if (!res.ok) return;
    const data = await res.json();
    updateFireAlertUI(data.fireAlert, data.fireAlertAt);
  } catch (_) {}
}

function updateFireAlertUI(active, alertAt) {
  const statusEl = document.getElementById('fire-alert-status');
  const triggerBtn = document.getElementById('fire-trigger-btn');
  const clearBtn   = document.getElementById('fire-clear-btn');

  if (statusEl) {
    statusEl.textContent = active
      ? (alertAt ? `발령 중 (${formatDatetime(alertAt)})` : '발령 중')
      : '정상';
    statusEl.className = 'fire-alert-status ' + (active ? 'fire-alert-active' : 'fire-alert-normal');
  }
  if (triggerBtn) triggerBtn.disabled = active;
  if (clearBtn)   clearBtn.disabled   = !active;
}

// 전역 노출
window.checkAuth       = checkAuth;
window.logout          = logout;
window.loadStats       = loadStats;
window.loadAnchors     = loadAnchors;
window.registerAnchor  = registerAnchor;
window.deleteAnchor    = deleteAnchor;
window.downloadQR      = downloadQR;
window.showQrPreview   = showQrPreview;
window.loadSessions    = loadSessions;
window.renderAnchorSummary = renderAnchorSummary;
window.apiFetch        = apiFetch;
window.formatDuration  = formatDuration;
window.formatDatetime  = formatDatetime;
window.escHtml         = escHtml;
window.triggerFireAlert    = triggerFireAlert;
window.clearFireAlert      = clearFireAlert;
window.loadFireAlertStatus = loadFireAlertStatus;
window.setActiveNav    = setActiveNav;
