# 📌 프로젝트 세션 메모리 (Session Memory)

**최종 업데이트 일시**: 2026-09-02
**프로젝트 위치**: `/home/k/projects/housing`

---

## 1. 🌐 배포 및 계정 연동 정보
- **Vercel 라이브 URL**: [https://housing-bay.vercel.app](https://housing-bay.vercel.app)
- **Vercel 계정**: `qod0615-2108` (팀: `qod0615-2108's projects`)
- **GitHub 저장소**: [https://github.com/qod0615-cyber/housing](https://github.com/qod0615-cyber/housing)
- **GitHub 계정**: `qod0615-cyber`
- **클라우드 간이 저장소**: GitHub Gist (`e4cb2d5ecdb6fa0e42e92c7c774edd81`)

---

## 2. 📝 세션 진행 경과 및 주요 작업 내역

1. **Vercel CLI & GitHub CLI 인증 완료**
   - Vercel CLI 기기 코드 인증 (`TMZW-HDMC`)
   - GitHub CLI 기기 코드 인증 (`FD8C-A986`)

2. **클라우드 간이 저장소 구축**
   - 별도 DB/회원가입 없이 `https://housing-bay.vercel.app` 단일 대표 URL에서 **A PC에서 [저장] 누르면 어느 PC/모바일에서 접속하든 100% 최신 도면이 로딩**되는 REST API (`/api/blueprint`) 구현.

3. **UI/UX & 조작감 대대적 개편**
   - **마우스 커서 중심 휠 Zoom In/Out** (`onWheel`)
   - **Space + Drag / 마우스 휠 클릭 캔버스 이동** (Pan)
   - **온-스크린 퀵 액션바**: 가구 선택 시 `+45°`, `+90°`, `복제`, `색상`, `삭제` 팝업 표시
   - **하단 캔버스 플로팅 컨트롤바 & 단축키 가이드 모달 (`?`)**
   - **좌측 가구 라이브러리 검색창(Search Bar)** 추가

4. **벽면 자동 자석 흡착 (Wall Attachment Snap) 구현 완료**
   - 콘센트, 인터넷 LAN, TV 단자, 방문, 창문, 가구 드래그 시 가장 가까운 방 벽면(상/하/좌/우)에 25cm 이내 접근 시 자석 밀착(Snap)
   - 벽면 방향에 맞춘 회전 각도(0°, 90°, 180°, 270°) 자동 정렬
   - 캔버스에 `🧲 [방이름] [벽방향]` 자석 피드백 툴팁 및 바운딩 하이라이트 제공

5. **방 목록 UI 고도화 & 방별/벽별 개별 벽 두께 설정**
   - Sidebar '방/구조' 탭의 **방 목록 아코디언 카드 인라인 편집기** 구현: 방 이름, 가로/세로 폭(W/H), X/Y 위치, 방 삭제 즉시 조절 가능
   - **벽별 개별 벽 두께(Top, Right, Bottom, Left) 설정 기능**: `Room` 데이터 타입 및 SVG 렌더링 엔진 확장 (외벽/내벽 정밀 표현 가능)
   - PropertyInspector 및 Sidebar에 상/하/좌/우 개별 벽두께 입력 컨트롤 추가

6. **📱 모바일 전용 UX/UI 대대적 개편 완료 (Mobile First Responsive Layout)**
   - **모바일 캔버스 100% 풀스크린화**: 스마트폰/태블릿 환경에서 좌/우 패널을 숨기고 캔버스를 전체 화면으로 전환
   - **하단 모바일 네비게이션 탭바 배치**: `🛋️ 가구`, `📐 방/구조`, `🎨 속성`, `⚙️ 메뉴/저장` 고도화
   - **슬라이드업 바텀 시트 드로어 (Bottom Sheet Drawer)**: 탭 터치 시 하단에서 부드럽게 올라오는 조작 모달 적용
   - **모바일 2단계 터치 조작 방식 적용 (1회 터치 선택/포커싱 -> 2회 터치 이동)**: 실수로 가구가 움직이지 않도록 1st 터치 시 포커스/선택 툴바만 활성화하고, 2nd 터치 드래그 시 가구/방 이동 및 벽 자석 흡착 연동
   - **양손(2핑거) 제스처**: 두 손가락 핀치 투 줌(Zoom In/Out) 및 2핑거 캔버스 자유 이동(Pan) 연동 완료

7. **🎯 도면 캔버스 자석 물리기(Snap) 및 PC/모바일 조작감 대대적 정밀 개선 완료 (2026-09-03)**
   - **삼각함수 AABB 기반 내벽 전용 자석 물리기 재구현**: 가구가 90°/45° 등 어떤 각도로 회전되어 있든 실제 최외각 경계 꼭짓점이 방 내부 내벽에 0cm 오차로 밀착 스냅됨. (벽 뚫고 나감 및 허공 30cm 떠서 자석 잡히는 버그 완전 해결)
   - **위치 이동 스냅 & 회전 스냅 역할 완전 분리**: 이동 드래그 중 가구 회전 각도 100% 보존. 회전 핸들 조작 시에만 직각(0°, 90°, 180°, 270°) 회전 스냅 작동.
   - **PC 빈 캔버스 마우스 좌클릭 드래그 화면 이동(Pan) 및 선택 해제 지원**: 빈 캔버스(격자 배경 포함) 좌클릭 드래그 시 즉시 캔버스 이동 및 선택 포커스 클리어.
   - **방 개별 벽 두께 카운터 초기값 버그 수정**: `undefined` 시 실질 벽 두께 fallback 값 바인딩하여 `▲` 클릭 시 15cm -> 16cm로 정상 작동.
   - **마우스 호버 커서 정밀도 개선**: 평소 호버 시 기본 화살표 포인터 유지, 드래그 중일 때만 grabbing 커서 전환.

8. **📱 모바일 크롬 앱 다운로드 & PWA 설치 기능 구축 완료 (2026-09-09)**
   - **Web App Manifest (`/manifest.webmanifest`)**: Next.js App Router 동적 매니페스트 구축 (`display: "standalone"`, `theme_color: "#0f172a"`).
   - **PWA 전용 앱 아이콘 세트 생성**: Android (`192x192`, `512x512`), iOS Safari (`apple-touch-icon.png`).
   - **원클릭 모바일 앱 다운로드 설치 컴포넌트 (`PWAInstallPrompt.tsx`)**: 크롬 브라우저 접속 시 헤더 및 하단 바텀 시트에 `📲 앱 설치` 버튼 연동 ➔ 클릭 시 스마트폰 바탕화면에 즉시 앱 설치. iOS Safari 사용자 가이드 팝업 포함.
   - **Service Worker (`public/sw.js`)**: 로컬 오프라인 캐싱 및 고속 앱 실행 적용.
   - **Vercel 라이브 배포 완료**: [https://housing-bay.vercel.app](https://housing-bay.vercel.app)

---

## 3. ⚠️ 사용자 작업 지침 (Strict Workflow Directive)
- **선(先)작업 금지 원칙**: 작업 전 분석 및 제안 리포트를 먼저 제출할 것.
- **사용자가 승인한 항목에 대해서만 코드 수정 및 배포를 진행할 것.**


## 4. 📋 향후 이사 맞춤형 기능 업그레이드 아이디어
1. **새 집 도면 만들기 (New House Blueprint Creator)**: 빈 캔버스에서 시작하기 및 방 개별 추가/결합
2. **가구 간 충돌/간섭 자동 경고 (Furniture Collision Alert)**: 방문 열리는 동선이나 콘센트 가림 현상 자동 감지
