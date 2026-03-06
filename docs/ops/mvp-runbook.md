# MVP Runbook

## 서비스 시작
- API 테스트: `npm --workspace @idnav/api test`
- 모바일 테스트: `npm --workspace @idnav/mobile-web test`
- 관리자 테스트: `npm --workspace @idnav/admin-web test`
- 전체 테스트: `npm test`

## 세션 종료 정책
- 50m 이탈 감지 + 30초 이상 지속 + GPS 정확도 필터
- 종료 임계: 60~70m, 재진입 임계: 40~50m

## 운영 KPI
- 도착 성공률
- 재탐색 빈도
- 세션 종료 정확도

## 배포
- `scripts/deploy_to_88.sh id-nav-chatbot`
