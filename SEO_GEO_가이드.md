# 진산회계법인 가업승계 랜딩페이지 — SEO/GEO 최적화 가이드

## Part 0: 도메인 등록 및 호스팅 가이드

### 1. 추천 도메인

| 도메인            | 장점                                   | 비용 (연간)   |
| ----------------- | -------------------------------------- | ------------- |
| `jinsancpa.co.kr` | 회계법인 공식 느낌, .co.kr 신뢰도 높음 | 약 2~3만 원   |
| `jinsancpa.kr`    | 짧고 깔끔                              | 약 2~3만 원   |
| `jinsan.tax`      | 세무 전문성 어필, 기억하기 쉬움        | 약 5~8만 원   |
| `jinsancpa.com`   | 글로벌 대응 가능                       | 약 1.5~2만 원 |

### 2. 도메인 등록 방법

1. **가비아** (gabia.com) — 국내 최대 도메인 등록업체
   - 회원가입 → 도메인 검색 → 결제 → DNS 설정
2. **호스팅KR** (hosting.kr) — 가격 경쟁력
3. **카페24** (cafe24.com) — 호스팅과 도메인 일괄 관리

### 3. 무료/저비용 호스팅 비교

| 서비스               | 비용            | 장점                            | 단점                    |
| -------------------- | --------------- | ------------------------------- | ----------------------- |
| **GitHub Pages**     | 무료            | 간편 배포, Git 연동             | 빌드 커스텀 제한        |
| **Cloudflare Pages** | 무료            | 글로벌 CDN, 빠른 속도, 무료 SSL | 서버사이드 처리 불가    |
| **Vercel**           | 무료 (취미용)   | 자동 배포, 프리뷰 URL           | 상업용은 유료 플랜 권장 |
| **Netlify**          | 무료 (100GB/월) | 폼 처리 기본 제공, 자동 배포    | 대역폭 제한             |

### 4. 배포 예시 (GitHub Pages)

```bash
# 1. GitHub 저장소 생성 후 코드 push
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/계정명/jinsancpa-homepage.git
git push -u origin main

# 2. GitHub → Settings → Pages → Source: main branch
# 3. Custom domain에 도메인 입력
# 4. 도메인 DNS에 CNAME 레코드 추가: www → 계정명.github.io
```

### 5. HTTPS(SSL) 설정

- **GitHub Pages**: Custom domain 설정 시 자동 SSL 제공 (Let's Encrypt)
- **Cloudflare Pages**: 자동 SSL 제공
- **직접 서버**: Let's Encrypt + Certbot으로 무료 SSL 인증서 발급

```bash
# Certbot 예시 (Ubuntu + Nginx)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d www.jinsancpa.co.kr
```

### 6. Google Apps Script → Google Sheets 연동

#### Step 1: Google Sheets 생성

1. Google Drive에서 새 스프레드시트 생성
2. 첫 번째 행에 헤더 입력: `timestamp | name | company | phone | email | revenue | message`

#### Step 2: Apps Script 코드 작성

1. 스프레드시트 메뉴 → 확장 프로그램 → Apps Script
2. 아래 코드 붙여넣기:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.name || "",
    data.company || "",
    data.phone || "",
    data.email || "",
    data.revenue || "",
    data.message || "",
  ]);

  return ContentService.createTextOutput(
    JSON.stringify({ result: "success" }),
  ).setMimeType(ContentService.MimeType.JSON);
}
```

#### Step 3: 웹앱으로 배포

1. 배포 → 새 배포 → 유형: 웹 앱
2. 실행 대상: **본인**
3. 액세스 권한: **모든 사용자**
4. 배포 → URL 복사

#### Step 4: 랜딩페이지에 URL 입력

`js/main.js` 파일의 `GOOGLE_SCRIPT_URL` 변수에 복사한 URL 붙여넣기:

```javascript
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/실제URL/exec";
```

---

## Part 0-B: Google Forms 연동 가이드

커스텀 폼 UI를 유지하면서 Google Forms의 `formResponse` 엔드포인트로 데이터를 전송하는 방식입니다.

### 1. Google Forms 생성

1. [Google Forms](https://docs.google.com/forms/) 접속 → **새 양식** 클릭
2. 아래 6개 질문을 순서대로 추가:

| 순서 | 질문 제목     | 질문 유형 |
| ---- | ------------- | --------- |
| 1    | 대표자명      | 단답형    |
| 2    | 회사명        | 단답형    |
| 3    | 연락처        | 단답형    |
| 4    | 이메일        | 단답형    |
| 5    | 연매출 규모   | 드롭다운  |
| 6    | 추가 문의사항 | 장문형    |

3. 연매출 규모 드롭다운 옵션: `50억 미만`, `50억~100억`, `100억~300억`, `300억~1000억`, `1000억 이상`

### 2. formResponse URL 찾기

1. Google Forms 편집 화면에서 **미리보기** (눈 모양 아이콘) 클릭
2. 브라우저 URL을 확인: `https://docs.google.com/forms/d/e/FORM_ID/viewform`
3. `viewform`을 `formResponse`로 변경:
   ```
   https://docs.google.com/forms/d/e/FORM_ID/formResponse
   ```
   이것이 `actionUrl` 값입니다.

### 3. Entry ID 찾기

1. Google Forms 미리보기 페이지에서 **마우스 우클릭 → 페이지 소스 보기**
2. `Ctrl+F`로 `entry.` 검색
3. 각 질문에 대응하는 `entry.XXXXXXXXX` 값을 찾습니다.
   - 보통 `FB_PUBLIC_LOAD_DATA` 안에 entry ID가 포함되어 있습니다.
   - 또는 각 input 태그의 `name` 속성에서 확인 가능

**대안 방법** (더 쉬움):

1. 미리보기 페이지에서 Chrome 개발자 도구 (F12) → Network 탭 열기
2. 폼을 채우고 제출
3. Network 탭에서 `formResponse` 요청을 찾아 Form Data에서 entry ID 확인

### 4. main.js 설정값 교체

`js/main.js` 파일 상단의 `GOOGLE_FORM_CONFIG` 객체를 실제 값으로 교체:

```javascript
const GOOGLE_FORM_CONFIG = {
  actionUrl: "https://docs.google.com/forms/d/e/실제_FORM_ID/formResponse",
  fields: {
    name: "entry.실제_ID_1",
    company: "entry.실제_ID_2",
    phone: "entry.실제_ID_3",
    email: "entry.실제_ID_4",
    revenue: "entry.실제_ID_5",
    message: "entry.실제_ID_6",
  },
};
```

### 5. 연동 테스트

1. 로컬에서 `npm run dev`로 사이트 실행
2. 폼을 작성하고 제출
3. Google Forms의 **응답** 탭에서 데이터 수신 확인
4. Google Forms 응답 → **Google Sheets에서 보기**로 스프레드시트 연동 가능

### 주의사항

- Google Forms는 `no-cors` 모드로 전송하므로, 응답 코드를 직접 확인할 수 없습니다. 전송 후 자동으로 "성공" 메시지를 표시합니다.
- 기존 Google Apps Script 방식도 계속 사용 가능합니다 (별도 설정 필요).
- Google Forms에서 **이메일 알림**을 설정하면 새 응답 시 즉시 알림을 받을 수 있습니다: 응답 탭 → ⋮ → "새 응답에 대한 이메일 알림 받기"

---

## Part A: SEO/GEO 최적화 To-Do 리스트

### 필수 (우선순위 높음)

- [ ] **도메인 구매 및 연결**: `jinsancpa.co.kr` 또는 원하는 도메인 등록
- [ ] **HTTPS 설정**: SSL 인증서 적용 (호스팅 서비스에 따라 자동 적용)
- [ ] **Google Search Console 등록**: 사이트 소유권 확인 + sitemap.xml 제출
- [ ] **Google Business Profile 등록**: '회계법인' 카테고리로 비즈니스 프로필 생성
- [ ] **네이버 서치어드바이저 등록**: https://searchadvisor.naver.com 에서 사이트 등록
- [ ] **네이버 플레이스 등록**: 진산회계법인 정보 등록 (주소, 전화, 영업시간)
- [ ] **Google Apps Script 배포**: 폼 데이터 → Google Sheets 연동 완료
- [ ] **OG 이미지 제작**: 1200×630 소셜 공유 이미지 (브랜드 로고 + 핵심 카피)
- [ ] **전화번호·주소 실제 정보 입력**: index.html, footer, Schema.org에 실제 연락처 반영

### 권장 (2~4주 내)

- [ ] **GA4 설치**: Google Analytics 4 추적 코드 삽입
- [ ] **GTM 설치**: Google Tag Manager로 이벤트 추적 (폼 제출, CTA 클릭)
- [ ] **Core Web Vitals 측정**: PageSpeed Insights에서 성능 점수 확인 (목표: 90+)
- [ ] **콘텐츠 마케팅 시작**: 가업승계 관련 블로그 글 첫 5편 작성
- [ ] **백링크 확보**: 대한상공회의소, 중소기업중앙회 등 권위 사이트 링크 요청
- [ ] **네이버 블로그 개설**: 가업승계 키워드 타겟 콘텐츠 발행
- [ ] **구조화 데이터 검증**: https://validator.schema.org/ 에서 JSON-LD 오류 확인

### GEO 전용 (AI 검색 최적화)

- [ ] **FAQ 확장**: 4개 → 20~30개로 확대 (아래 Part B 참고)
- [ ] **구조화 데이터 추가**: HowTo 스키마 (프로세스 섹션), Review 스키마 (후기)
- [ ] **자연어 콘텐츠 작성**: AI가 답변 소스로 사용할 수 있는 명확한 설명문
- [ ] **정기 콘텐츠 업데이트**: 세법 개정 반영, 최신 사례 추가 (AI는 최신 데이터 선호)

---

## Part B: Claude와 함께하는 마케팅·세일즈 전략

### 1. 블로그 콘텐츠 시리즈 (SEO 키워드 타겟)

아래 주제로 Claude에게 "2000자 내외, SEO 최적화된 블로그 글 작성" 요청:

| #   | 제목 (키워드)                                   | 타겟 키워드               |
| --- | ----------------------------------------------- | ------------------------- |
| 1   | 가업승계란? 중소기업 대표가 알아야 할 모든 것   | 가업승계, 가업승계란      |
| 2   | 가업승계 과세특례 완벽 가이드 (2025년 기준)     | 가업승계 과세특례, 요건   |
| 3   | 가업승계 증여세 절세 전략 5가지                 | 가업승계 증여세, 절세     |
| 4   | 가업승계 상속세 계산법과 절세 방법              | 가업승계 상속세, 계산     |
| 5   | 가업승계 사후관리 7년 — 실패하지 않는 법        | 가업승계 사후관리         |
| 6   | 비상장주식 평가 방법과 가업승계 활용법          | 비상장주식 평가, 가업승계 |
| 7   | 경영권 승계 시 법적 리스크와 대비 전략          | 경영권 승계, 법적 리스크  |
| 8   | 가업승계 vs 기업 매각(M&A) — 무엇이 유리할까?   | 가업승계 vs 매각          |
| 9   | 가업승계 성공 사례로 보는 절세 전략             | 가업승계 성공 사례        |
| 10  | 가업승계 준비 체크리스트 — 대표님을 위한 10단계 | 가업승계 체크리스트       |

### 2. FAQ 콘텐츠 확장 (GEO 최적화)

Claude에게 아래 프롬프트로 추가 FAQ 생성 요청:

> "가업승계 컨설팅 관련 자주 묻는 질문 20개를 생성해줘. 각 질문에 대해 200자 내외로 전문적이면서도 이해하기 쉬운 답변을 작성해줘. Schema.org FAQPage 형태로 활용할 거야."

추가 FAQ 예시:

- 가업승계 과세특례 공제 한도는 얼마인가요?
- 가업승계 시 형제자매 간 분쟁을 예방하는 방법은?
- 가업승계 과세특례와 가업상속공제의 차이는?
- 비상장주식 가치를 낮추는 합법적인 방법은?
- 가업승계 후 업종 변경이 가능한가요?

### 3. 이메일 마케팅 시퀀스 (리드 너처링)

폼 신청 후 자동 발송할 이메일 시리즈:

| 시점    | 제목                                     | 내용                  |
| ------- | ---------------------------------------- | --------------------- |
| 즉시    | 가업승계 무료 진단 신청이 완료되었습니다 | 감사 인사 + 진행 안내 |
| 3일 후  | 가업승계, 왜 지금 시작해야 할까요?       | 교육 콘텐츠 + 사례    |
| 7일 후  | 대표님 기업에 맞는 절세 전략이 있습니다  | 맞춤 인사이트         |
| 14일 후 | 가업승계 성공 사례 — 27억 절세 비결      | 사례 상세 + CTA       |

### 4. 네이버 블로그/포스트 전략

네이버 SEO에 최적화된 콘텐츠 작성 가이드:

- **제목**: 키워드를 앞에 배치 (예: "가업승계 과세특례 | 2025년 완벽 가이드")
- **본문**: 2000~3000자, 소제목(H2/H3) 활용
- **이미지**: 인포그래픽 2~3장 포함 (Canva 등 활용)
- **태그**: 관련 키워드 10개 이상
- **발행 주기**: 주 2~3회

### 5. 소셜 미디어 콘텐츠

#### LinkedIn (B2B 의사결정자 타겟)

- 가업승계 인사이트 포스트 (주 1~2회)
- 대표이사 인터뷰 / 전문가 칼럼 형태
- 해시태그: #가업승계 #경영권승계 #절세전략 #중소기업 #진산회계법인

#### 페이스북 광고 카피 예시

> "30년 키운 기업, 세금 폭탄 없이 물려줄 수 있습니다.
> 변호사·세무사·회계사·감평사·변리사 5인이 한 팀으로 설계하는 가업승계 로드맵.
> 지금 무료 진단 신청하세요. → [링크]"

### 6. 세미나/웨비나 기획

- **제목**: "2025 가업승계 절세 전략 세미나 — 대표님이 알아야 할 핵심 포인트"
- **대상**: 연매출 50억 이상 중소·중견기업 대표
- **내용**: 과세특례 요건, 절세 사례, Q&A
- **형식**: 오프라인 (서울) + 온라인 동시 개최
- **후속**: 참석자 대상 무료 진단 안내

### 7. 리마케팅 전략

- **Google Ads 리마케팅**: 랜딩페이지 방문자 대상 디스플레이 광고
- **Facebook 리마케팅 픽셀**: 방문자 대상 맞춤 광고
- **광고 카피**: "지난번 가업승계 상담, 아직 고민 중이신가요? 무료 진단으로 시작하세요."

### 8. 경쟁사 분석

Claude에게 아래 프롬프트로 분석 요청:

> "가업승계 컨설팅' 키워드로 검색했을 때 상위에 나오는 경쟁사 5곳의 랜딩페이지를 분석해줘.
> 각 경쟁사의 강점, 약점, 그리고 진산회계법인이 차별화할 수 있는 포인트를 알려줘."

핵심 차별화 포인트:

- **5개 분야 원스톱**: 대부분 경쟁사는 세무 위주 → 진산은 법률·평가·지재권까지
- **사후관리 7년 보장**: 일회성 컨설팅이 아닌 장기 파트너십
- **투명한 비용 구조**: 초기 진단 무료 + 맞춤 견적

---

## 부록: 기술 체크리스트

### 현재 적용 완료된 항목

- [x] 시맨틱 HTML5 구조 (`header`, `main`, `section`, `article`, `footer`)
- [x] Schema.org JSON-LD (AccountingService, FAQPage, Service)
- [x] Open Graph + Twitter Card 메타 태그
- [x] 모바일 반응형 디자인
- [x] 접근성 (aria-label, role, skip navigation)
- [x] CSS/JS 외부 파일 분리
- [x] 폰트 preconnect + display=swap
- [x] IntersectionObserver 기반 lazy animation
- [x] robots.txt + sitemap.xml
- [x] 인쇄 미디어 쿼리
- [x] Google Sheets 폼 연동 (데모 모드)

### 도메인 연결 후 변경할 항목

- [ ] `<link rel="canonical">` URL 변경
- [ ] Open Graph URL 변경
- [ ] Schema.org `url` 필드 변경
- [ ] sitemap.xml `<loc>` URL 변경
- [ ] robots.txt Sitemap URL 변경
- [ ] 실제 전화번호·주소 입력
