import { Page } from "puppeteer";

export const LOGIN_URL = "https://www.instagram.com/accounts/login/";
export const ID_INPUT_SELECTOR = 'input[name="username"]';
export const PW_INPUT_SELECTOR = 'input[name="password"]';
export const LOGIN_BUTTON_SELECTOR = 'button[type="submit"]';

/**
 * 인스타그램 로그인 함수
 * @param page - Puppeteer 페이지 객체
 * @param username - 인스타그램 사용자명
 * @param password - 인스타그램 비밀번호
 */
export async function login(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  console.log("로그인 시도 중...");

  await page.goto(LOGIN_URL);
  await page.waitForSelector(ID_INPUT_SELECTOR);

  await page.type(ID_INPUT_SELECTOR, username, { delay: 50 });
  await page.type(PW_INPUT_SELECTOR, password, { delay: 50 });

  await page.click(LOGIN_BUTTON_SELECTOR);
  await page.waitForNavigation();

  console.log("로그인 성공!");
}
