import { FastifyBaseLogger } from "fastify";
import got from "got";
import { Page, TimeoutError, Viewport } from "puppeteer";
import { getBrowser } from "./browser";

interface ScreenshotOptions {
  url: string;
  viewport: Viewport;
}

async function getScreenshot(page: Page, options: ScreenshotOptions) {
  await page.setViewport(options.viewport);
  try {
    await page.goto(options.url, { timeout: 10000 });
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
  return getScreenshot(page, {
    url: dataUrl(screenshot),
    viewport: {
      width: Math.ceil(options.viewport.width * options.resizeRate),
      height: Math.ceil(options.viewport.height * options.resizeRate),
    },
  });
}

interface PreviewImageOptions extends ScreenshotAndResizeOptions {
  logger: FastifyBaseLogger;
}

async function reportErrorToDiscord(err: unknown) {
  if (process.env.DISCORD_URL) {
    // @ts-ignore
    const content = `\`\`\`${err.stack}\`\`\``;
    await got.post(process.env.DISCORD_URL, { json: { content } });
  }
}

export async function getPreviewImage(options: PreviewImageOptions) {
  const startTime = new Date();
  options.logger.info(`generating preview image of ${options.url} ...`);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    const image = await getScreenshotAndResize(page, options);
    const time = (new Date().getTime() - startTime.getTime()) / 1000;
    options.logger.info(
      `generating preview image of ${options.url} ... done in ${time}s`
    );
    return image;
  } catch (err) {
    options.logger.error(err);
    await reportErrorToDiscord(err);
  } finally {
    await page.close();
  }
  return null;
}
