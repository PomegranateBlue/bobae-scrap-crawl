import { Page } from "puppeteer";
import { Collection } from "./exportToExcel.js";

/**
 * 스크롤하면서 컬렉션을 실시간으로 수집하는 함수
 * Virtual Scrolling 문제를 해결하여 모든 컬렉션을 캡처
 * @param page - Puppeteer 페이지 객체
 * @param linkSelector - 컬렉션 링크 셀렉터
 * @param titleSelector - 컬렉션 제목 셀렉터
 * @returns 수집된 컬렉션 배열
 */
export const autoScrollAndScrape = async (
  page: Page,
  linkSelector: string,
  titleSelector: string
): Promise<Collection[]> => {
  console.log("스크롤하면서 실시간으로 컬렉션을 수집합니다...");

  // Promise 없이 async/await만 사용!
  const collections = await page.evaluate(
    async (linkSel: string, titleSel: string): Promise<Collection[]> => {
      const collectionMap = new Map<string, Collection>(); // URL 기준 중복 제거
      let unchangedCount = 0;
      let previousHeight = document.body.scrollHeight;
      let scrapedCount = 0;

      // 현재 DOM에서 컬렉션 추출하는 함수 (화살표 함수로 변경)
      const scrapeCurrentView = () => {
        const collectionLinks = document.querySelectorAll(linkSel);

        Array.from(collectionLinks).forEach((linkNode) => {
          const url = (linkNode as HTMLAnchorElement).href;
          const titleElement = linkNode.querySelector(titleSel);
          const title = titleElement ? titleElement.textContent?.trim() : "";

          // 유효한 컬렉션 URL 필터링
          const urlParts = url.split("/saved/");
          const isCollectionUrl =
            urlParts.length > 1 &&
            urlParts[1].length > 0 &&
            !url.endsWith("/saved/");

          // 아직 추가되지 않은 컬렉션만 추가
          if (isCollectionUrl && !collectionMap.has(url)) {
            collectionMap.set(url, {
              title: title || "제목 없음",
              url: url,
            });
          }
        });

        // 새로 수집된 개수 확인
        const currentCount = collectionMap.size;
        if (currentCount > scrapedCount) {
          console.log(`[진행중] ${currentCount}개 컬렉션 수집됨`);
          scrapedCount = currentCount;
        }
      };

      // 2초 대기 헬퍼 함수 (화살표 함수로 변경)
      const wait = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      // while 루프로 스크롤 & 스크래핑 (Promise 대신!)
      while (unchangedCount < 10) {
        const currentScrollHeight = document.body.scrollHeight;

        // 현재 화면의 컬렉션 수집
        scrapeCurrentView();

        // 300px씩 스크롤
        window.scrollBy(0, 300);

        // 페이지 높이 변화 감지
        if (currentScrollHeight === previousHeight) {
          unchangedCount++;
        } else {
          unchangedCount = 0;
          previousHeight = currentScrollHeight;
        }

        // 2초 대기 (await 사용!)
        await wait(2000);
      }

      // 마지막으로 한 번 더 수집
      scrapeCurrentView();
      console.log(`[완료] 총 ${collectionMap.size}개 컬렉션 수집 완료`);

      return Array.from(collectionMap.values());
    },
    linkSelector,
    titleSelector
  );

  return collections;
};
