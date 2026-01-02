# Instagram Collection Scraper

인스타그램 저장된 컬렉션을 자동으로 수집하고 Excel 파일로 내보내는 TypeScript CLI 도구입니다.

## 주요 기능

- ✅ **전체 컬렉션 수집**: Virtual Scrolling 문제를 해결하여 모든 컬렉션 캡처
- ✅ **실시간 스크래핑**: 스크롤하면서 동시에 데이터 수집 (Map 기반 중복 제거)
- ✅ **Excel 내보내기**: 제목과 URL이 포함된 Excel 파일 자동 생성
- ✅ **타입 안정성**: TypeScript로 작성되어 타입 안전성 보장
- ✅ **타임스탬프 파일명**: 실행 시각이 포함된 파일명으로 자동 저장

## 프로젝트 구조

```
instagram-scrap/
├── index.ts                  # 메인 실행 파일
├── login.ts                  # 인스타그램 로그인 모듈
├── autoScrollAndScrape.ts    # 스크롤 + 스크래핑 통합 모듈
├── exportToExcel.ts          # Excel 내보내기 모듈
├── tsconfig.json             # TypeScript 설정
├── package.json              # 프로젝트 설정 및 의존성
├── .env                      # 환경변수 (사용자 인증 정보)
└── .gitignore                # Git 제외 파일 목록
```

## 기술 스택

- **언어**: TypeScript
- **런타임**: Node.js
- **브라우저 자동화**: Puppeteer
- **Excel 생성**: xlsx
- **환경변수 관리**: dotenv

## 설치 방법

### 1. 저장소 클론

```bash
git clone https://github.com/PomegranateBlue/bobae-scrap-crawl.git
cd instagram-scrap
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 인스타그램 계정 정보를 입력하세요:

```env
INSTA_ID=your_instagram_username
INSTA_PW=your_instagram_password
```

**⚠️ 주의**: `.env` 파일은 절대 Git에 커밋하지 마세요. (`.gitignore`에 이미 포함되어 있습니다)

## 사용 방법

### 스크래핑 실행

```bash
npm start
```

또는

```bash
npm run scrape
```

### 개발 모드 (자동 재실행)

코드 수정 시 자동으로 재실행됩니다:

```bash
npm run dev
```

## 실행 결과

스크립트 실행 후 다음과 같은 결과를 확인할 수 있습니다:

1. **콘솔 출력**: 수집된 컬렉션의 제목과 URL이 출력됩니다
2. **Excel 파일**: 프로젝트 루트에 `instagram_collections_YYYYMMDD_HHMMSS.xlsx` 형식으로 저장됩니다

### Excel 파일 구조

| 제목          | URL                           |
| ------------- | ----------------------------- |
| 컬렉션 제목 1 | https://www.instagram.com/... |
| 컬렉션 제목 2 | https://www.instagram.com/... |

## 핵심 알고리즘

### Virtual Scrolling 문제 해결

인스타그램은 Virtual Scrolling을 사용하여 DOM에서 보이지 않는 요소를 제거합니다. 이 문제를 해결하기 위해:

1. **스크롤 중 실시간 스크래핑**: 300px씩 스크롤할 때마다 현재 화면의 컬렉션을 수집
2. **Map 기반 중복 제거**: URL을 키로 사용하여 중복된 컬렉션 자동 필터링, 현재 중복 제거 후에도 실제
   데이터 수와 일치하지 않는 문제 발생
3. **종료 조건**: 페이지 높이가 10번 연속 변하지 않으면 스크래핑 완료

```typescript
// 핵심 로직 (autoScrollAndScrape.ts)
const scrollInterval = setInterval(() => {
  scrapeCurrentView();
  window.scrollBy(0, 300); // 300px 스크롤

  if (unchangedCount >= 10) {
    // 종료 조건
    resolve(Array.from(collectionMap.values()));
  }
}, 2000); // 2초 간격, 실제 데이터와 다를 경우 간격 조정할 것
```

## 타입 정의

### Collection 인터페이스

```typescript
export interface Collection {
  title: string; // 컬렉션 제목
  url: string; // 컬렉션 URL
}
```

## 문제 해결

### 컬렉션이 일부만 수집되는 경우

- **원인**: 인스타그램의 로딩 속도가 느린 경우
- **해결**: [autoScrollAndScrape.ts:96](autoScrollAndScrape.ts#L96)에서 `2000` (2초) 값을 `3000` (3초)으로 증가

### 로그인 실패

- `.env` 파일의 계정 정보가 정확한지 확인
- 2단계 인증이 활성화된 경우 비활성화 또는 앱 전용 비밀번호 사용

### Selector 오류

인스타그램 UI가 변경된 경우:

- [index.ts:14-15](index.ts#L14-L15)의 셀렉터 값을 업데이트해야 할 수 있습니다

## 라이선스

ISC

## 기여

이슈나 PR을 자유롭게 제출해주세요!

## 주의사항

- 이 도구는 개인적인 용도로만 사용하세요
- 인스타그램 서비스 약관을 준수하세요
- 과도한 스크래핑은 계정 제한을 초래할 수 있습니다

### 남은 과제

/saved 경로에 존재하는 개별 컬렉션으로 이동 후, 저장된 게시물 스크랩, URL 스크랩
