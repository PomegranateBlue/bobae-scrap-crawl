/**
 * 페이지 자동 스크롤 함수
 * 인스타그램의 lazy loading을 트리거하기 위해 페이지를 점진적으로 스크롤
 * @param {Page} page - Puppeteer 페이지 객체
 */
export async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0; // 현재까지 스크롤한 총 높이
      let distance = 300; // 한 번에 스크롤할 거리 (픽셀)
      let unchangedCount = 0; // 높이가 변하지 않은 횟수
      let previousHeight = document.body.scrollHeight; // 초기 페이지 높이

      const scrollInterval = setInterval(() => {
        const currentScrollHeight = document.body.scrollHeight; // 현재 페이지 전체 높이

        // 조금씩 스크롤 (한 번에 끝까지 가지 않고 점진적으로)
        window.scrollBy(0, distance);
        totalHeight += distance;

        // 페이지 높이가 변했는지 확인
        if (currentScrollHeight === previousHeight) {
          unchangedCount++;
          // 10번 연속 높이가 안 변하면 종료 (충분한 대기 시간 확보)
          if (unchangedCount >= 10) {
            clearInterval(scrollInterval);
            resolve();
          }
        } else {
          unchangedCount = 0; // 높이가 변하면 카운터 리셋
          previousHeight = currentScrollHeight;
        }
      }, 2000); // 2초마다 실행 (114개 컬렉션 로드를 위한 충분한 시간)
    });
  });
}
