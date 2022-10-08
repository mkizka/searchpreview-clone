import { FastifyBaseLogger } from "fastify";
import { launch, Page, TimeoutError, Viewport } from "puppeteer";

interface ScreenshotOptions {
  url: string;
  viewport: Viewport;
}

async function getScreenshot(page: Page, options: ScreenshotOptions) {
  page.setDefaultTimeout(10000);
  await page.setViewport(options.viewport);
  try {
    await page.goto(options.url);
  } catch (err) {
    // タイムアウトしてもスクショは取るように
    if (!(err instanceof TimeoutError)) {
      throw err;
    }
  }
  return page.screenshot({ type: "jpeg" });
}

interface ScreenshotAndResizeOptions extends ScreenshotOptions {
  resizeRate: number;
}

function dataUrl(file: string | Buffer) {
  return `data:image/jpeg;base64,${Buffer.from(file).toString("base64")}`;
}

async function getScreenshotAndResize(
  page: Page,
  options: ScreenshotAndResizeOptions
) {
  const screenshot = await getScreenshot(page, options);
  const resizedScreenshot = await getScreenshot(page, {
    url: dataUrl(screenshot),
    viewport: {
      width: options.viewport.width * options.resizeRate,
      height: options.viewport.height * options.resizeRate,
    },
  });
  return resizedScreenshot;
}

interface PreviewImageOptions extends ScreenshotAndResizeOptions {
  logger: FastifyBaseLogger;
}

export async function getPreviewImage(options: PreviewImageOptions) {
  options.logger.info(`generating preview image of ${options.url} ...`);
  const browser = await launch({
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
  const page = await browser.newPage();
  try {
    const image = await getScreenshotAndResize(page, options);
    options.logger.info(`generating preview image of ${options.url} is done.`);
    return image;
  } catch (err) {
    options.logger.error(err);
  } finally {
    await browser.close();
  }
  return null;
}
