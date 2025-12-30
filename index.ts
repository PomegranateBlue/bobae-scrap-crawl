import puppeteer from "puppeteer";
import dotenv from "dotenv";
import { autoScrollAndScrape } from "./autoScrollAndScrape.js";
import { login } from "./login.js";
import { exportToExcel, generateTimestampFilename } from "./exportToExcel.js";

dotenv.config();

// 환경 변수
const USERNAME = process.env.INSTA_ID;
const PASSWORD = process.env.INSTA_PW;
const TARGET_SAVED_URL = `https://www.instagram.com/bobaebike/saved/`;

// 셀렉터 상수
const COLLECTION_LINK_SELECTOR = 'a[href*="/saved/"][role="link"][tabindex="0"]';
const COLLECTION_TITLE_SELECTOR = "h3 span";

/**
 * 메인 함수: 인스타그램 저장된 컬렉션 스크래핑
 */
async function scrapeSavedCollections(): Promise<void> {
  // 환경 변수 검증
  if (!USERNAME || !PASSWORD) {
    console.error("오류: .env 파일에 INSTA_ID 또는 INSTA_PW를 설정해주세요.");
    return;
  }

  // Puppeteer 브라우저 실행
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // 뷰포트 설정
    await page.setViewport({ width: 1920, height: 1080 });
    console.log("브라우저 뷰포트 설정 완료 (1920x1080).");

    // 1. 로그인
    await login(page, USERNAME, PASSWORD);

    // 2. 저장됨 페이지로 이동
    console.log("저장됨 페이지로 이동 중...");
    await page.goto(TARGET_SAVED_URL);
    await page.waitForSelector(COLLECTION_LINK_SELECTOR);

    // 3. 스크롤하면서 실시간 스크래핑
    const collections = await autoScrollAndScrape(
      page,
      COLLECTION_LINK_SELECTOR,
      COLLECTION_TITLE_SELECTOR
    );

    // 4. 결과 출력
    console.log("\n--- 추출된 컬렉션 목록 ---");
    collections.forEach((c) => console.log(`제목: ${c.title}, URL: ${c.url}`));
    console.log(`총 ${collections.length}개의 컬렉션이 추출되었습니다.`);

    // 5. Excel 파일로 내보내기
    const filename = generateTimestampFilename();
    exportToExcel(collections, filename);
  } catch (error) {
    console.error(
      "스크래핑 중 오류 발생. (Selector 오류 또는 로그인 실패 가능성):",
      error
    );
  } finally {
    await browser.close();
    console.log("\n브라우저 종료.");
  }
}

// 스크립트 실행
scrapeSavedCollections();
