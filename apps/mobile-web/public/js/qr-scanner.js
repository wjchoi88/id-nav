'use strict';

let scannerActive = false;
let videoStream = null;

async function startQrScanner() {
  const video = document.getElementById('qr-video');
  const canvas = document.getElementById('qr-canvas');
  if (!video || !canvas) return;

  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    video.srcObject = videoStream;
    video.play();
    scannerActive = true;
    requestAnimationFrame(scanFrame);
  } catch (err) {
    console.error('카메라 접근 실패:', err);
    const errEl = document.getElementById('scanner-error');
    if (errEl) errEl.style.display = 'block';
  }
}

function stopQrScanner() {
  scannerActive = false;
  if (videoStream) {
    videoStream.getTracks().forEach(t => t.stop());
    videoStream = null;
  }
}

function scanFrame() {
  if (!scannerActive) return;

  const video = document.getElementById('qr-video');
  const canvas = document.getElementById('qr-canvas');
  if (!video || !canvas) return;

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = window.jsQR
      ? window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
      : null;

    if (code && code.data) {
      // QR 인식 성공
      stopQrScanner();
      const url = code.data;
      // id-nav 도메인 QR인지 확인 (/scan/ 경로 포함)
      if (url.includes('/scan/')) {
        location.href = url;
      } else {
        // 인식은 됐지만 id-nav QR이 아닌 경우: 계속 스캔 재시도
        scannerActive = true;
        if (videoStream) requestAnimationFrame(scanFrame);
        else startQrScanner();
      }
      return;
    }
  }

  requestAnimationFrame(scanFrame);
}

window.startQrScanner = startQrScanner;
window.stopQrScanner = stopQrScanner;
