# Baker Quiz - 제빵/제과기능사 모의고사 웹앱

## 프로젝트 개요
- **앱 이름**: Baker Quiz (제빵/제과기능사 모의고사)
- **한줄 설명**: 제빵기능사·제과기능사 모의고사를 모바일에서 풀고 채점할 수 있는 웹앱
- **타겟 유저**: 제빵/제과기능사 자격증 준비생
- **플랫폼**: 모바일 웹 (반응형, PWA 미적용)
- **배포**: GitHub Pages (https://kane-han.github.io/baker-quiz/)

## 기술 스택
- **프레임워크**: 없음 (Vanilla HTML/CSS/JS)
- **배포**: GitHub Pages (정적 호스팅)
- **빌드**: 없음 (단일 HTML 파일)

## 현재 기능
- 제빵기능사 모의고사 21개 시험 (원본 1회 + 2007~2011년 20회차, 각 60문제)
- 제과기능사 모의고사 21개 시험 (원본 1회 + 2007~2011년 20회차, 각 60문제)
- 총 2,520문제 (42개 시험 × 60문제), 전체 해설 포함
- 정답/해설 4회 검증 완료 (~632건 수정, 원본 이미지 + PDF 교사용 38개 대조)
- 카테고리(제빵/제과) → 회차 선택 → 시험 UI 흐름
- **챕터별 학습**: 5개 과목별 랜덤 20문제 출제
  - 재료과학(925), 제조이론(857), 식품위생학(361), 영양학(332), 경영관리(45)
- **학습 분석**: 챕터별 정답률 막대그래프 + 자주 틀리는 문제 TOP 10
- **취약 복습**: 가중치 기반 자동 출제 (weight = 틀린횟수 - 맞힌횟수 × 0.5)
- **시험 타이머**: 프리셋(30/45/60분) + 커스텀 시간 입력, 5분 이하 경고, 시간초과 자동 채점
- 1문제씩 보기 / 전체 보기 전환
- 자동 채점 (60점 합격 기준)
- 오답 노트 (오답만 필터, 전체 보기)
- 모바일 최적화 UI

## 파일 구조
```
baker-quiz/
├── index.html          # 메인 앱 (HTML/CSS/JS 통합, 945KB, 2520문제+해설)
├── data/               # 기출문제 원본 JSON (빌드용, 배포 불필요)
├── originals/          # 원본 시험 문제 이미지 (20장)
├── build-*.js          # 데이터 빌드 스크립트 (개발용)
├── CLAUDE.md           # 이 파일
├── .gitignore
└── README.md
```

## 데이터 구조
- 문제 데이터는 index.html 내 JavaScript 객체로 관리
- 각 문제: `{q: 문제텍스트, o: [보기4개], a: 정답인덱스(0-3), e: 해설, c: 챕터}`
- 챕터(c): ingredients, manufacturing, nutrition, hygiene, management
- EXAMS 구조: `{bread: [{title, desc, questions}], cake: [{title, desc, questions}]}`
- 시험 종류: `bread` (제빵기능사), `cake` (제과기능사)
- 기출문제 출처: gunsys.com (2007~2011년)

## LocalStorage 키
- `baker-quiz-history`: 시험 단위 결과 기록 [{cat, idx, title, date, score, ...}]
- `baker-quiz-log`: 문제 단위 풀이 기록 [{id, c, picked, correct, date}]

## 향후 계획
- 다크모드
- PWA 오프라인 지원
- 랜덤 출제 모드
- 점수 추이 그래프
- 추가 회차 모의고사 등록

## 원본 자료
- `originals/` 폴더에 EDUWAY 제빵/제과기능사 모의고사 1회 카페용 이미지 20장
- `originals/pdf/` 폴더에 교사용 PDF 38개 (제빵 19 + 제과 19, 2007~2011년)
- 제빵기능사 27~43번 해설은 원본 이미지 누락으로 전문 지식 기반 작성
- `data/pdf-answers.json`: PDF에서 추출한 정답 (PyMuPDF 텍스트 추출)
- `data/pdf-mapping.json`: PDF 날짜 → index.html 시험 인덱스 매핑

## 배포 방법
```bash
# GitHub Pages로 배포 (main 브랜치에서 배포)
git add . && git commit -m "update" && git push origin main
# 1~2분 후 https://kane-han.github.io/baker-quiz/ 에 반영
```
