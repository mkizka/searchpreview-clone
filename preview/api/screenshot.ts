import { setTimeout as sleep } from "timers/promises";
import { Browser, launch, Viewport } from "puppeteer";

let _browser: Browser | null;

async function getBrowser() {
  if (_browser == null) {
    _browser = await launch({
      headless: true,
      args: ["--no-sandbox"],
    });
  }
  return _browser;
}

async function getScreenshot(url: string, viewport: Viewport) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(url);
  await sleep(2000);
  return page.screenshot({ type: "png" });
}

export async function getPreviewImage(
  url: string,
  options: Viewport & { rate: number }
) {
  console.log("getScreenshot: ", url);
  const image = await getScreenshot(url, options);
  const imageUrl = `data:image/png;base64,${Buffer.from(image).toString(
    "base64"
  )}`;
  const previewImage = await getScreenshot(imageUrl, {
    width: options.width * options.rate,
    height: options.height * options.rate,
  });
  await _browser?.close();
  _browser = null;
  return previewImage;
}
