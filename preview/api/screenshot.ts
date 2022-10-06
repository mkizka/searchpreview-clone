import { setTimeout as sleep } from "timers/promises";
import { launch, Page, Viewport } from "puppeteer";

let _page: Page | null;

async function getPage() {
  if (_page) {
    return _page;
  }
  const browser = await launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  _page = await browser.newPage();
  return _page;
}

async function getScreenshot(url: string, viewport: Viewport) {
  const page = await getPage();
  await page.setViewport(viewport ?? { width: 19, height: 574 });
  await page.goto(url);
  await sleep(2000);
  return page.screenshot({ type: "png" });
}

export async function getPreviewImage(
  url: string,
  options: Viewport & { rate: number }
) {
  console.log(`getScreenshot: ${url}`);
  const file = await getScreenshot(url, options);
  const imageUrl = `data:image/png;base64,${Buffer.from(file).toString(
    "base64"
  )}`;
  return getScreenshot(imageUrl, {
    width: options.width * options.rate,
    height: options.height * options.rate,
  });
}
