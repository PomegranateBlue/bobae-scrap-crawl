// 컬렉션 관련 셀렉터
// '/saved/'가 포함된 링크만 선택 (컬렉션만 타겟팅)
export const COLLECTION_LINK_SELECTOR = 'a[href*="/saved/"][role="link"][tabindex="0"]';
export const COLLECTION_TITLE_SELECTOR = "h3 span";

/**
 * 페이지에서 컬렉션 데이터 추출
 * @param {Page} page - Puppeteer 페이지 객체
 * @returns {Promise<Array<{title: string, url: string}>>} 컬렉션 배열
 */
export async function scrapeCollections(page) {
  const collections = await page.evaluate(
    (linkSel, titleSel) => {
      const collectionLinks = document.querySelectorAll(linkSel);
      const collectionMap = new Map(); // URL을 키로 하여 중복 제거

      console.log(`[디버그] 전체 링크 수: ${collectionLinks.length}`);

      Array.from(collectionLinks).forEach((linkNode) => {
        const url = linkNode.href;
        const titleElement = linkNode.querySelector(titleSel);
        const title = titleElement ? titleElement.textContent.trim() : "";

        // 유효한 컬렉션 URL 패턴 필터링: /saved/ 이후에 추가 경로가 있는 경우
        const urlParts = url.split("/saved/");
        const isCollectionUrl =
          urlParts.length > 1 &&
          urlParts[1].length > 0 &&
          urlParts[1] !== "" &&
          !url.endsWith("/saved/"); // /saved/만 있는 경우 제외

        if (isCollectionUrl && !collectionMap.has(url)) {
          // Map을 사용하여 URL 중복 제거
          collectionMap.set(url, {
            title: title || "제목 없음 (유효한 컬렉션)",
            url: url,
          });
        }
      });

      console.log(`[디버그] 필터링 후 고유 컬렉션 수: ${collectionMap.size}`);

      // Map을 배열로 변환하여 반환
      return Array.from(collectionMap.values());
    },
    COLLECTION_LINK_SELECTOR,
    COLLECTION_TITLE_SELECTOR
  );

  return collections;
}
