import { Browser, launch } from "puppeteer";

let _browser: Browser | null = null;

export async function getBrowser() {
  if (_browser == null) {
    _browser = await launch({
      headless: true,
      // https://github.com/puppeteer/puppeteer/issues/3120#issuecomment-415553869
      args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-first-run",
        "--no-sandbox",
        "--no-zygote",
        "--single-process",
      ],
    });
  }
  return _browser;
}
