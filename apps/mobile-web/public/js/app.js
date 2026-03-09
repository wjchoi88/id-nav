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
    floorB1: 'B1',
    floorB2: 'B2',
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
    langBtn: '한국어',
    dirRight: '오른쪽으로',
    dirLeft: '왼쪽으로',
    dirUp: '앞으로',
    dirDown: '반대방향',
  },
  en: {
    appTitle: 'Saetgang Station Nav',
    qrHint: 'Point camera at the entrance QR code',
    cameraError: 'Camera access denied.\nPlease allow camera permission in browser settings.',
    accessibilityLabel: 'Accessibility',
    accessibilityAriaLabel: 'Accessibility mode (elevator priority)',
    floorB1: 'B1',
    floorB2: 'B2',
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
    langBtn: 'English',
    dirRight: 'Turn Right',
    dirLeft: 'Turn Left',
    dirUp: 'Go Straight',
    dirDown: 'Turn Around',
  },
  ja: {
    appTitle: 'セッカン駅ナビ',
    qrHint: '入口のQRコードにカメラを向けてください',
    cameraError: 'カメラへのアクセスが拒否されました。\nブラウザの設定でカメラを許可してください。',
    accessibilityLabel: 'バリアフリー',
    accessibilityAriaLabel: 'バリアフリーモード（エレベーター優先）',
    floorB1: 'B1',
    floorB2: 'B2',
    destSelectBtn: '目的地を選択',
    qrScanBtn: 'QRスキャン',
    destPanelTitle: '目的地を選択してください',
    destPanelClose: '閉じる',
    destLoading: '読み込み中…',
    destError: '目的地情報を読み込めませんでした。',
    navDest: '目的地',
    navDist: '予想距離',
    catBoarding: '乗車位置',
    catFacility: '施設',
    catOther: 'その他',
    sessionError: '目的地設定中にエラーが発生しました: ',
    langBtn: '日本語',
    dirRight: '右へ',
    dirLeft: '左へ',
    dirUp: '直進',
    dirDown: '反対方向',
  },
  zh: {
    appTitle: '塞江站导航',
    qrHint: '请将摄像头对准入口二维码',
    cameraError: '摄像头访问被拒绝。\n请在浏览器设置中允许摄像头权限。',
    accessibilityLabel: '无障碍',
    accessibilityAriaLabel: '无障碍模式（电梯优先）',
    floorB1: 'B1',
    floorB2: 'B2',
    destSelectBtn: '选择目的地',
    qrScanBtn: '扫描二维码',
    destPanelTitle: '请选择目的地',
    destPanelClose: '关闭',
    destLoading: '加载中…',
    destError: '无法加载目的地信息。',
    navDest: '目的地',
    navDist: '预计距离',
    catBoarding: '乘车位置',
    catFacility: '设施',
    catOther: '其他',
    sessionError: '设置目的地时出错: ',
    langBtn: '中文',
    dirRight: '向右转',
    dirLeft: '向左转',
    dirUp: '直行',
    dirDown: '掉头',
  },
  'zh-Hant': { appTitle: '塞江站導航', qrHint: '請將相機對準入口二維碼', cameraError: '相機存取被拒絕。\n請在瀏覽器設定中允許相機權限。', accessibilityLabel: '無障礙', accessibilityAriaLabel: '無障礙模式（電梯優先）', floorB1: 'B1', floorB2: 'B2', floorB3: 'B3', floorB4: 'B4', destSelectBtn: '選擇目的地', qrScanBtn: '掃描二維碼', destPanelTitle: '請選擇目的地', destPanelClose: '關閉', destLoading: '載入中…', destError: '無法載入目的地資訊。', navDest: '目的地', navDist: '預計距離', catBoarding: '乘車位置', catFacility: '設施', catOther: '其他', sessionError: '設定目的地時發生錯誤: ', langBtn: '中文(繁體)', dirRight: '向右轉', dirLeft: '向左轉', dirUp: '直行', dirDown: '掉頭' },
  es: { appTitle: 'Navegación Est. Saetgang', qrHint: 'Apunte la cámara al código QR de la entrada', cameraError: 'Acceso a la cámara denegado.\nPermita el acceso en la configuración.', accessibilityLabel: 'Accesibilidad', accessibilityAriaLabel: 'Modo accesibilidad (ascensor preferido)', floorB1: 'B1', floorB2: 'B2', floorB3: 'B3', floorB4: 'B4', destSelectBtn: 'Seleccionar destino', qrScanBtn: 'Escanear QR', destPanelTitle: 'Seleccione un destino', destPanelClose: 'Cerrar', destLoading: 'Cargando…', destError: 'No se pudo cargar la información.', navDest: 'Destino', navDist: 'Distancia', catBoarding: 'Andén', catFacility: 'Instalaciones', catOther: 'Otros', sessionError: 'Error: ', langBtn: 'Español', dirRight: 'Girar derecha', dirLeft: 'Girar izquierda', dirUp: 'Recto', dirDown: 'Media vuelta' },
  fr: { appTitle: 'Nav. Gare Saetgang', qrHint: 'Pointez la caméra sur le QR code', cameraError: 'Accès caméra refusé.\nAutorisez dans les paramètres.', accessibilityLabel: 'Accessibilité', accessibilityAriaLabel: 'Mode accessibilité (ascenseur prioritaire)', floorB1: 'B1', floorB2: 'B2', floorB3: 'B3', floorB4: 'B4', destSelectBtn: 'Choisir destination', qrScanBtn: 'Scanner QR', destPanelTitle: 'Choisissez une destination', destPanelClose: 'Fermer', destLoading: 'Chargement…', destError: 'Impossible de charger.', navDest: 'Destination', navDist: 'Distance', catBoarding: 'Quai', catFacility: 'Équipements', catOther: 'Autres', sessionError: 'Erreur: ', langBtn: 'Français', dirRight: 'Tourner à droite', dirLeft: 'Tourner à gauche', dirUp: 'Tout droit', dirDown: 'Demi-tour' },
  de: { appTitle: 'Navigation Bhf. Saetgang', qrHint: 'Kamera auf den Eingangs-QR-Code richten', cameraError: 'Kamerazugriff verweigert.\nBitte in den Einstellungen erlauben.', accessibilityLabel: 'Barrierefreiheit', accessibilityAriaLabel: 'Barrierefreier Modus (Aufzug bevorzugt)', floorB1: 'B1', floorB2: 'B2', floorB3: 'B3', floorB4: 'B4', destSelectBtn: 'Ziel auswählen', qrScanBtn: 'QR scannen', destPanelTitle: 'Ziel auswählen', destPanelClose: 'Schließen', destLoading: 'Laden…', destError: 'Informationen konnten nicht geladen werden.', navDest: 'Ziel', navDist: 'Entfernung', catBoarding: 'Bahnsteig', catFacility: 'Einrichtungen', catOther: 'Sonstiges', sessionError: 'Fehler: ', langBtn: 'Deutsch', dirRight: 'Rechts abbiegen', dirLeft: 'Links abbiegen', dirUp: 'Geradeaus', dirDown: 'Umkehren' },
  pt: { appTitle: 'Navegação Est. Saetgang', qrHint: 'Aponte a câmera para o QR code', cameraError: 'Acesso à câmera negado.\nPermita nas configurações.', accessibilityLabel: 'Acessibilidade', accessibilityAriaLabel: 'Modo acessibilidade (elevador preferido)', floorB1: 'B1', floorB2: 'B2', floorB3: 'B3', floorB4: 'B4', destSelectBtn: 'Selecionar destino', qrScanBtn: 'Escanear QR', destPanelTitle: 'Selecione um destino', destPanelClose: 'Fechar', destLoading: 'Carregando…', destError: 'Não foi possível carregar.', navDest: 'Destino', navDist: 'Distância', catBoarding: 'Plataforma', catFacility: 'Instalações', catOther: 'Outros', sessionError: 'Erro: ', langBtn: 'Português', dirRight: 'Virar à direita', dirLeft: 'Virar à esquerda', dirUp: 'Em frente', dirDown: 'Meia volta' },
  ru: { appTitle: 'Навигация ст. Сэтган', qrHint: 'Наведите камеру на QR-код входа', cameraError: 'Доступ к камере запрещён.\nРазрешите в настройках браузера.', accessibilityLabel: 'Доступность', accessibilityAriaLabel: 'Режим доступности (лифт приоритетен)', floorB1: 'B1', floorB2: 'B2', floorB3: 'B3', floorB4: 'B4', destSelectBtn: 'Выбрать назначение', qrScanBtn: 'Сканировать QR', destPanelTitle: 'Выберите назначение', destPanelClose: 'Закрыть', destLoading: 'Загрузка…', destError: 'Не удалось загрузить.', navDest: 'Назначение', navDist: 'Расстояние', catBoarding: 'Посадка', catFacility: 'Удобства', catOther: 'Прочее', sessionError: 'Ошибка: ', langBtn: 'Русский', dirRight: 'Направо', dirLeft: 'Налево', dirUp: 'Прямо', dirDown: 'Кругом' },
  it: { appTitle: 'Navigazione Staz. Saetgang', qrHint: 'Punta la fotocamera sul QR code', cameraError: 'Accesso fotocamera negato.\nConsenti nelle impostazioni.', accessibilityLabel: 'Accessibilità', accessibilityAriaLabel: 'Modalità accessibilità (ascensore preferito)', floorB1: 'B1', floorB2: 'B2', floorB3: 'B3', floorB4: 'B4', destSelectBtn: 'Scegli destinazione', qrScanBtn: 'Scansiona QR', destPanelTitle: 'Scegli una destinazione', destPanelClose: 'Chiudi', destLoading: 'Caricamento…', destError: 'Impossibile caricare.', navDest: 'Destinazione', navDist: 'Distanza', catBoarding: 'Binario', catFacility: 'Servizi', catOther: 'Altro', sessionError: 'Errore: ', langBtn: 'Italiano', dirRight: 'Girare a destra', dirLeft: 'Girare a sinistra', dirUp: 'Dritto', dirDown: 'Inversione' },
  th: { langBtn: 'ภาษาไทย' },
  vi: { langBtn: 'Tiếng Việt' },
  id: { langBtn: 'Indonesia' },
  ms: { langBtn: 'Melayu' },
  tl: { langBtn: 'Filipino' },
  hi: { langBtn: 'हिन्दी' },
  bn: { langBtn: 'বাংলা' },
  ta: { langBtn: 'தமிழ்' },
  te: { langBtn: 'తెలుగు' },
  ur: { langBtn: 'اردو' },
  mn: { langBtn: 'Монгол' },
  ne: { langBtn: 'नेपाली' },
  si: { langBtn: 'සිංහල' },
  nl: { langBtn: 'Nederlands' },
  sv: { langBtn: 'Svenska' },
  no: { langBtn: 'Norsk' },
  da: { langBtn: 'Dansk' },
  fi: { langBtn: 'Suomi' },
  pl: { langBtn: 'Polski' },
  cs: { langBtn: 'Čeština' },
  sk: { langBtn: 'Slovenčina' },
  hu: { langBtn: 'Magyar' },
  ro: { langBtn: 'Română' },
  bg: { langBtn: 'Български' },
  el: { langBtn: 'Ελληνικά' },
  uk: { langBtn: 'Українська' },
  sr: { langBtn: 'Српски' },
  hr: { langBtn: 'Hrvatski' },
  sl: { langBtn: 'Slovenščina' },
  ar: { langBtn: 'العربية' },
  he: { langBtn: 'עברית' },
  fa: { langBtn: 'فارسی' },
  tr: { langBtn: 'Türkçe' },
};

function detectLang() {
  const saved = localStorage.getItem('idnav_lang');
  if (saved && I18N[saved]) return saved;
  const nav = (navigator.language || 'ko').toLowerCase().replace('_', '-');
  // 정확한 매치 먼저
  if (I18N[nav]) return nav;
  // zh-hans / zh-hant 처리
  if (nav.startsWith('zh')) return nav.includes('tw') || nav.includes('hant') ? 'zh-Hant' : 'zh';
  // 앞 2글자 매치
  const prefix = nav.split('-')[0];
  if (I18N[prefix]) return prefix;
  return 'en';
}

let currentLang = detectLang();

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key])
    || (I18N.en && I18N.en[key])
    || (I18N.ko && I18N.ko[key])
    || key;
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

function setLangAndClose(lang) {
  currentLang = lang;
  localStorage.setItem('idnav_lang', lang);
  applyI18n();
  updateNavInfo();
  // 드롭다운 닫기
  const menu = document.getElementById('lang-menu');
  if (menu) menu.classList.remove('open');
}

function toggleLangMenu() {
  const menu = document.getElementById('lang-menu');
  if (menu) menu.classList.toggle('open');
}

// 드롭다운 외부 클릭 시 닫기 (DOMContentLoaded에서 바인딩)
function closeLangMenuOnOutsideClick(e) {
  const wrap = document.getElementById('lang-wrap');
  if (wrap && !wrap.contains(e.target)) {
    const menu = document.getElementById('lang-menu');
    if (menu) menu.classList.remove('open');
  }
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
    // anchor 없이 접속 시 → 지도 메인 화면 표시 (QR 버튼으로 수동 스캔 가능)
    showMapView();
    await loadDestinations();
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
  // 지도 화면을 먼저 표시하고 목적지 목록을 로드
  showMapView();
  await loadDestinations();

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
    } else {
      // 목적지 미설정 시 선택 패널 표시
      showDestinationPanel();
    }
  } catch (err) {
    console.error('continueSession 오류:', err);
    // 오류 발생 시에도 지도는 유지
    showMapView();
  }
}

async function selectDestination(anchor) {
  state.destination = anchor;
  hideDestinationPanel();

  // 출발지 없이 접속 시(QR 미스캔) → 1번 출구를 기본 출발지로 사용
  const startAnchorCode = state.anchorCode || 'B1-A04';
  if (!state.anchorCode) state.anchorCode = 'B1-A04';

  try {
    // 세션 시작
    const res = await fetch(`${API}/api/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anchorCode: startAnchorCode, isMobilityImpaired: state.isMobilityImpaired })
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
      const floorTabMap = { B1: 'b1', B2: 'b2', B3: 'b3', B4: 'b4' };
      switchTab(floorTabMap[startFloor] || 'b1');
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
  renderFloorMap('B3');
  renderFloorMap('B4');
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

function getStrokeWidth() {
  const w = window.innerWidth;
  if (w >= 1024) return 10;
  if (w >= 768) return 8;
  return 6;
}

function renderFloorMap(floor) {
  const svgIdMap = { B1: 'overlay-b1', B2: 'overlay-b2', B3: 'overlay-b3', B4: 'overlay-b4' };
  const svgId = svgIdMap[floor];
  const svg = document.getElementById(svgId);
  if (!svg) return;
  svg.innerHTML = '';

  const sw = getStrokeWidth();
  let defs = `
    <defs>
      <filter id="glow-${floor}" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <marker id="arrow-${floor}" markerWidth="12" markerHeight="12" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse">
        <path d="M0,0 L0,10 L12,5 z" fill="#FFD400" stroke="rgba(0,0,0,0.4)" stroke-width="0.8"/>
      </marker>
    </defs>`;

  let pathLayer = '';
  let markerLayer = '';

  // 지나온 경로 (회색 점선)
  const traveled = state.traveledPath.filter(a => a.floor === floor);
  if (traveled.length > 1) {
    const pts = toOrthoPts(traveled);
    pathLayer += `<polyline points="${pts}" stroke="#fff" stroke-width="${sw + 3}" stroke-dasharray="10,6" fill="none" opacity="0.4"/>`;
    pathLayer += `<polyline points="${pts}" stroke="#8E8E93" stroke-width="${sw}" stroke-dasharray="10,6" fill="none" opacity="0.75"/>`;
  }

  // 앞으로 갈 경로 — 노랑 Glow + 점멸
  const future = state.currentPath.filter(a => a.floor === floor);
  if (future.length > 1) {
    const pts = toOrthoPts(future);
    const arrowSize = sw * 2.5;
    pathLayer += `
      <polyline points="${pts}" stroke="#fff" stroke-width="${sw + 5}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.55"/>
      <polyline points="${pts}" stroke="#FFD400" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" fill="none"
        filter="url(#glow-${floor})" marker-end="url(#arrow-${floor})">
        <animate attributeName="opacity" values="1;0.45;1" dur="1.8s" repeatCount="indefinite"/>
      </polyline>`;

    // 각 세그먼트 중간에 방향 화살표 삼각형 추가
    for (let i = 0; i < future.length - 1; i++) {
      const a = future[i], b = future[i + 1];
      // Manhattan 경로의 중간점 (toOrthoPts와 동일 방식)
      const midY = Math.round((a.map_y + b.map_y) / 2);
      // 수평 세그먼트 중간: (a.map_x + b.map_x)/2, midY
      // 수직 세그먼트 중간: a.map_x, (a.map_y + midY)/2
      const segments = [
        { x1: a.map_x, y1: a.map_y, x2: a.map_x, y2: midY },
        { x1: a.map_x, y1: midY,   x2: b.map_x, y2: midY },
        { x1: b.map_x, y1: midY,   x2: b.map_x, y2: b.map_y }
      ];
      segments.forEach(seg => {
        const dx = seg.x2 - seg.x1, dy = seg.y2 - seg.y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 20) return; // 너무 짧은 세그먼트는 스킵
        const mx = (seg.x1 + seg.x2) / 2, my = (seg.y1 + seg.y2) / 2;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const as = sw * 1.6; // 화살표 크기
        pathLayer += `<polygon points="${-as},${-as*0.55} ${as*0.7},0 ${-as},${as*0.55}"
          fill="#FFD400" stroke="rgba(0,0,0,0.3)" stroke-width="0.8"
          transform="translate(${mx},${my}) rotate(${angle})" opacity="0.9"/>`;
      });
    }
  }

  // 현재 위치 마커 — #007AFF 펄스
  const currentAnchor = state.traveledPath.length > 0
    ? state.traveledPath[state.traveledPath.length - 1]
    : (state.currentPath.length > 0 ? state.currentPath[0] : null);

  if (currentAnchor && currentAnchor.floor === floor) {
    markerLayer += `
      <circle cx="${currentAnchor.map_x}" cy="${currentAnchor.map_y}" r="20"
        fill="#007AFF" opacity="0.18">
        <animate attributeName="r" values="14;26;14" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.25;0;0.25" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${currentAnchor.map_x}" cy="${currentAnchor.map_y}" r="11" fill="#fff"/>
      <circle cx="${currentAnchor.map_x}" cy="${currentAnchor.map_y}" r="9" fill="#007AFF"/>`;
  }

  // 목적지 마커 — #34C759 초록 체크
  const dest = state.destination;
  if (dest && dest.floor === floor) {
    markerLayer += `
      <circle cx="${dest.map_x}" cy="${dest.map_y}" r="16" fill="#34C759" stroke="#fff" stroke-width="3"/>
      <text x="${dest.map_x}" y="${dest.map_y + 6}" text-anchor="middle" font-size="15" fill="#fff" font-weight="bold" aria-hidden="true">✓</text>`;
  }

  svg.innerHTML = defs + pathLayer + markerLayer;
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
        <polyline points="${elevPts}" stroke="#FFD400" stroke-width="5" stroke-dasharray="8,5" fill="none"/>`;
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
        fill="#007AFF" opacity="0.25">
        <animate attributeName="r" values="10;16;10" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${currentAnchor.elev_x}" cy="${currentAnchor.elev_y}" r="7" fill="#007AFF" stroke="#fff" stroke-width="2"/>`;
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
  const floorMap = { b1: 'B1', b2: 'B2', b3: 'B3', b4: 'B4' };
  state.currentFloor = floorMap[tabId] || 'B1';
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

function getDirectionText(path) {
  if (!path || path.length < 2) return '';
  const a = path[0], b = path[1];
  const dx = b.map_x - a.map_x;
  const dy = b.map_y - a.map_y;
  const adx = Math.abs(dx), ady = Math.abs(dy);
  // 이동 방향 판단
  if (adx > ady) {
    return dx > 0 ? t('dirRight') : t('dirLeft');
  } else {
    return dy > 0 ? t('dirDown') : t('dirUp');
  }
}

function updateNavInfo() {
  const totalDist = state.totalDistanceM || 0;
  const el = document.getElementById('nav-info-bar');
  if (!el) return;
  el.classList.add('visible');

  const dirText = getDirectionText(state.currentPath);
  const nextAnchor = state.currentPath && state.currentPath.length > 1 ? state.currentPath[1] : null;
  const nextDist = nextAnchor
    ? Math.round(Math.sqrt(
        Math.pow((nextAnchor.map_x - (state.currentPath[0]?.map_x||0)), 2) +
        Math.pow((nextAnchor.map_y - (state.currentPath[0]?.map_y||0)), 2)
      ) * 0.1)  // SVG 단위 → 미터 환산 (임시 스케일)
    : 0;

  el.innerHTML = `
    <div class="nav-info-item nav-dest-item">
      <span class="nav-info-label">${t('navDest')}</span>
      <span class="nav-info-value">${state.destination ? state.destination.label : '-'}</span>
    </div>
    ${dirText ? `<div class="nav-info-item nav-dir-item">
      <span class="nav-dir-arrow">${getDirArrow(state.currentPath)}</span>
      <span class="nav-dir-text">${dirText}</span>
    </div>` : ''}
    <div class="nav-info-item nav-distance">
      <span class="nav-info-label">${t('navDist')}</span>
      <span class="nav-info-value distance-value">${Math.round(totalDist)}<small class="distance-unit">m</small></span>
    </div>
  `;
}

function getDirArrow(path) {
  if (!path || path.length < 2) return '→';
  const a = path[0], b = path[1];
  const dx = b.map_x - a.map_x;
  const dy = b.map_y - a.map_y;
  const adx = Math.abs(dx), ady = Math.abs(dy);
  if (adx > ady) return dx > 0 ? '→' : '←';
  return dy > 0 ? '↓' : '↑';
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
  document.addEventListener('click', closeLangMenuOnOutsideClick);
  init();
});
