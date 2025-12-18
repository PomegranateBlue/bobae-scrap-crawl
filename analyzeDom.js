/**
 * DOM 구조 분석 스크립트
 * 컬렉션 내부 페이지의 게시물/채널명 선택자를 파악하기 위한 도구
 */
import puppeteer from "puppeteer";
import dotenv from "dotenv";
import { login } from "./login.js";

dotenv.config();

const USERNAME = process.env.INSTA_ID;
const PASSWORD = process.env.INSTA_PW;
const TARGET_SAVED_URL = `https://www.instagram.com/bobaebike/saved/`;

async function analyzeDom() {
  if (!USERNAME || !PASSWORD) {
    console.error("오류: .env 파일에 INSTA_ID 또는 INSTA_PW를 설정해주세요.");
    return;
  }

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1920, height: 1080 });
    console.log("브라우저 실행 완료");

    // 1. 로그인
    await login(page, USERNAME, PASSWORD);
    console.log("로그인 완료");

    // 2. 저장됨 페이지로 이동
    console.log("저장됨 페이지로 이동 중...");
    await page.goto(TARGET_SAVED_URL);
    await page.waitForSelector('a[href*="/saved/"]', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 3000)); // 페이지 로딩 대기

    // 3. 첫 번째 컬렉션 URL 가져오기
    const firstCollectionUrl = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="/saved/"]');
      for (const link of links) {
        const href = link.href;
        const parts = href.split("/saved/");
        if (parts.length > 1 && parts[1].length > 0 && !href.endsWith("/saved/")) {
          return href;
        }
      }
      return null;
    });

    if (!firstCollectionUrl) {
      console.error("컬렉션을 찾을 수 없습니다.");
      return;
    }

    console.log(`\n첫 번째 컬렉션으로 이동: ${firstCollectionUrl}`);
    await page.goto(firstCollectionUrl);
    await new Promise((r) => setTimeout(r, 3000)); // 페이지 로딩 대기

    // 4. DOM 구조 분석
    console.log("\n" + "=".repeat(60));
    console.log("📊 DOM 구조 분석 시작");
    console.log("=".repeat(60));

    const domAnalysis = await page.evaluate(() => {
      const result = {
        // 게시물 링크 후보들
        postLinks: [],
        // a 태그 분석
        allLinks: [],
        // 이미지/비디오 컨테이너
        mediaContainers: [],
        // 잠재적 사용자명 요소
        usernameElements: [],
      };

      // 1. 모든 a 태그 분석 (게시물 링크 찾기)
      const allAnchors = document.querySelectorAll("a");
      allAnchors.forEach((a) => {
        const href = a.href;
        // /p/ (게시물) 또는 /reel/ (릴스) 링크 찾기
        if (href.includes("/p/") || href.includes("/reel/")) {
          result.postLinks.push({
            href: href,
            className: a.className,
            parentClassName: a.parentElement?.className || "",
            innerHTML: a.innerHTML.substring(0, 100),
          });
        }
      });

      // 2. 상위 20개 a 태그 샘플
      Array.from(allAnchors)
        .slice(0, 20)
        .forEach((a) => {
          result.allLinks.push({
            href: a.href,
            className: a.className,
            role: a.getAttribute("role"),
            tabindex: a.getAttribute("tabindex"),
          });
        });

      // 3. article 또는 div[role] 요소 분석
      const articles = document.querySelectorAll("article, div[role='button']");
      Array.from(articles)
        .slice(0, 10)
        .forEach((el) => {
          result.mediaContainers.push({
            tagName: el.tagName,
            className: el.className,
            role: el.getAttribute("role"),
            childCount: el.children.length,
          });
        });

      // 4. 사용자명 패턴 찾기 (@ 포함하거나 username 관련)
      const allElements = document.querySelectorAll("span, a, div");
      allElements.forEach((el) => {
        const text = el.textContent?.trim() || "";
        // @ 기호가 있거나 짧은 텍스트 (사용자명 가능성)
        if (
          text.startsWith("@") ||
          (text.length > 0 && text.length < 30 && !text.includes(" ") && el.tagName === "SPAN")
        ) {
          const parentHref = el.closest("a")?.href || "";
          if (parentHref.includes("/") && !parentHref.includes("/saved/")) {
            result.usernameElements.push({
              text: text,
              tagName: el.tagName,
              className: el.className,
              parentHref: parentHref,
            });
          }
        }
      });

      // 중복 제거
      result.usernameElements = result.usernameElements
        .filter(
          (v, i, a) => a.findIndex((t) => t.text === v.text && t.parentHref === v.parentHref) === i
        )
        .slice(0, 20);

      return result;
    });

    // 5. 결과 출력
    console.log("\n📌 1. 게시물 링크 (/p/, /reel/)");
    console.log("-".repeat(40));
    if (domAnalysis.postLinks.length > 0) {
      domAnalysis.postLinks.slice(0, 10).forEach((link, i) => {
        console.log(`[${i + 1}] ${link.href}`);
        console.log(`    class: ${link.className}`);
        console.log(`    parent class: ${link.parentClassName}`);
      });
      console.log(`\n총 ${domAnalysis.postLinks.length}개의 게시물 링크 발견`);
    } else {
      console.log("게시물 링크를 찾지 못했습니다.");
    }

    console.log("\n📌 2. 사용자명 후보");
    console.log("-".repeat(40));
    if (domAnalysis.usernameElements.length > 0) {
      domAnalysis.usernameElements.forEach((el, i) => {
        console.log(`[${i + 1}] "${el.text}"`);
        console.log(`    tag: ${el.tagName}, class: ${el.className}`);
        console.log(`    parent href: ${el.parentHref}`);
      });
    } else {
      console.log("사용자명 요소를 찾지 못했습니다.");
    }

    console.log("\n📌 3. 미디어 컨테이너");
    console.log("-".repeat(40));
    domAnalysis.mediaContainers.forEach((el, i) => {
      console.log(`[${i + 1}] <${el.tagName}> role="${el.role}" class="${el.className}"`);
    });

    // 6. 게시물 클릭 후 모달 분석 (첫 번째 게시물)
    if (domAnalysis.postLinks.length > 0) {
      console.log("\n" + "=".repeat(60));
      console.log("📊 게시물 클릭 후 모달 분석");
      console.log("=".repeat(60));

      // 첫 번째 게시물 링크 클릭
      const firstPostSelector = `a[href*="${domAnalysis.postLinks[0].href.split("instagram.com")[1]}"]`;
      console.log(`\n클릭할 선택자: ${firstPostSelector}`);

      try {
        await page.click(firstPostSelector);
        await new Promise((r) => setTimeout(r, 2000)); // 모달 로딩 대기

        // 모달 내부 분석
        const modalAnalysis = await page.evaluate(() => {
          const result = {
            // 작성자 정보
            authorInfo: [],
            // 헤더 영역
            headerElements: [],
          };

          // article 내부 또는 dialog 내부 탐색
          const modal = document.querySelector("div[role='dialog'], article");
          if (modal) {
            // 헤더 영역의 링크 (보통 작성자 프로필)
            const headerLinks = modal.querySelectorAll("header a, div a");
            headerLinks.forEach((a) => {
              const href = a.href;
              // 프로필 링크 패턴: /{username}/
              if (
                href.includes("instagram.com/") &&
                !href.includes("/p/") &&
                !href.includes("/reel/") &&
                !href.includes("/saved/")
              ) {
                const text = a.textContent?.trim() || "";
                if (text.length > 0 && text.length < 50) {
                  result.authorInfo.push({
                    text: text,
                    href: href,
                    className: a.className,
                  });
                }
              }
            });

            // header 태그 내용
            const header = modal.querySelector("header");
            if (header) {
              result.headerElements.push({
                innerHTML: header.innerHTML.substring(0, 500),
                textContent: header.textContent?.substring(0, 200),
              });
            }
          }

          // 중복 제거
          result.authorInfo = result.authorInfo.filter(
            (v, i, a) => a.findIndex((t) => t.href === v.href) === i
          );

          return result;
        });

        console.log("\n📌 모달 내 작성자 정보");
        console.log("-".repeat(40));
        if (modalAnalysis.authorInfo.length > 0) {
          modalAnalysis.authorInfo.forEach((info, i) => {
            console.log(`[${i + 1}] "${info.text}"`);
            console.log(`    href: ${info.href}`);
            console.log(`    class: ${info.className}`);
          });
        }

        // ESC로 모달 닫기
        await page.keyboard.press("Escape");
        await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        console.log("모달 분석 중 오류:", err.message);
      }
    }

    // 7. 최종 권장 선택자 출력
    console.log("\n" + "=".repeat(60));
    console.log("✅ 권장 선택자 (분석 결과 기반)");
    console.log("=".repeat(60));
    console.log(`
게시물 링크 선택자 후보:
  - 'a[href*="/p/"]'
  - 'a[href*="/reel/"]'

채널명 추출 방법:
  - 방법 1: 게시물 클릭 → 모달 header 내 a 태그 텍스트
  - 방법 2: 게시물 URL에서 추출 불가 (URL에 작성자 정보 없음)

💡 참고: 브라우저가 열려있습니다. 개발자 도구(F12)로 직접 확인해보세요.
   종료하려면 터미널에서 Ctrl+C를 누르세요.
`);

    // 브라우저를 열어둔 채로 대기 (수동 분석 가능)
    console.log("⏳ 수동 분석을 위해 브라우저를 열어둡니다. Ctrl+C로 종료하세요.");
    await new Promise((r) => setTimeout(r, 300000)); // 5분 대기
  } catch (error) {
    console.error("분석 중 오류 발생:", error);
  } finally {
    await browser.close();
    console.log("브라우저 종료.");
  }
}

analyzeDom();
