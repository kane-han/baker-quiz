# Security Audit Notes

## 보안 감사 결과 (2026-03-17)

**감사자**: Security Sentry (자동화)
**대상**: baker-quiz (제빵/제과기능사 모의고사 웹앱)
**감사 범위**: 전체 git 히스토리, 소스코드, GitHub 저장소 설정
**트리거**: 저장소가 공개(public)에서 비공개(private)로 전환됨

---

### 배포 판정: WARNED (경고 - 조건부 허용)

CRITICAL 또는 HIGH 등급 취약점 없음. MEDIUM 2건 발견.

---

### 취약점 요약

| 등급 | 건수 | 항목 |
|------|------|------|
| CRITICAL | 0 | - |
| HIGH | 0 | - |
| MEDIUM | 2 | innerHTML XSS (간접), 보안 헤더 누락 |
| LOW | 2 | .gitignore 미흡, 커스텀 입력 유효성 |
| PASSED | 8 | 아래 항목 참조 |

---

### 발견 항목

#### MEDIUM: innerHTML 사용 (index.html:2822~3146)
- 10곳에서 app.innerHTML에 데이터 삽입
- 현재는 정적 문제 데이터만 삽입 → 직접적 XSS 위험 없음
- 단, 향후 서버 데이터 연동 시 XSS 위험 존재
- 권고: 점진적으로 createElement 방식으로 전환

#### MEDIUM: 보안 헤더 누락 (GitHub Pages 배포)
- CSP, X-Frame-Options, X-Content-Type-Options 헤더 없음
- GitHub Pages는 커스텀 헤더 지원 불가 (정적 호스팅 한계)
- 권고: Cloudflare 프록시 또는 Vercel 이전 시 헤더 추가

#### LOW: .gitignore에 .env 미명시 (`.gitignore`)
- 현재 .env 파일 없음, 커밋된 이력도 없음
- 예방 차원에서 `.env*` 패턴 추가 권고

#### LOW: 타이머 입력 서버측 검증 없음 (index.html:2931)
- `parseInt(el.value)` 후 범위 검증(1~180) 존재
- 순수 클라이언트 앱이므로 서버 사이드 위험 없음

---

### 통과 항목

- git 히스토리 전체에 하드코딩된 시크릿 없음 (AWS/GCP/Stripe/GitHub 토큰 등)
- .env 파일 커밋 이력 없음
- GitHub Actions ANTHROPIC_API_KEY는 Secrets로 안전하게 관리됨
- 배포 키(Deploy Keys) 없음
- 웹훅(Webhooks) 없음
- 외부 협업자 없음 (본인 계정 kane-han만 접근)
- SQL 인젝션 해당 없음 (순수 정적 앱, DB 없음)
- 커맨드 인젝션 없음
- eval() 사용 없음
- Private Key 노출 없음
- JWT 토큰 하드코딩 없음
- 외부 CDN/스크립트 로드 없음

---

### 조치 사항

**즉시 필요**: 없음

**권고 (향후)**:
1. .gitignore에 `.env*` 패턴 추가
2. 서버 연동 시 innerHTML을 createElement로 교체
3. 배포 플랫폼 변경 시 보안 헤더 설정

