import { setTimeout as sleep } from "timers/promises";
import { Browser, launch, TimeoutError, Viewport } from "puppeteer";

let _browser: Browser | null;

async function getBrowser() {
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

async function getScreenshot(url: string, viewport: Viewport) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  await page.setViewport(viewport);
  try {
    await page.goto(url);
  } catch (err) {
    // タイムアウトしてもスクショは取るように
    if (err instanceof TimeoutError) {
      console.log(err);
    } else {
      throw err;
    }
  }
  await sleep(2000);
  return page.screenshot({ type: "jpeg" });
}

export async function getPreviewImage(
  url: string,
  options: Viewport & { rate: number }
) {
  console.log("getScreenshot: ", url);
  const image = await getScreenshot(url, options);
  const imageUrl = `data:image/jpeg;base64,${Buffer.from(image).toString(
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
