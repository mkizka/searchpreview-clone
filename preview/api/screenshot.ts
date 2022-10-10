import { FastifyBaseLogger } from "fastify";
import got from "got";
import { Page, TimeoutError, Viewport } from "puppeteer";
import { getBrowser } from "./browser";

interface ScreenshotOptions {
  url: string;
  viewport: Viewport;
  logger: FastifyBaseLogger;
}

async function getScreenshot(page: Page, options: ScreenshotOptions) {
  const startTime = new Date();
  await page.setViewport(options.viewport);
  try {
    await page.goto(options.url, { timeout: 10000 });
  } catch (err) {
    // タイムアウトしてもスクショは取るように
    if (!(err instanceof TimeoutError)) {
      throw err;
    }
  }
  const image = page.screenshot({ type: "jpeg" });
  const time = (new Date().getTime() - startTime.getTime()) / 1000;
  options.logger.info(`preview generated in ${time}s`);
  return image;
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
    logger: options.logger,
  });
}

interface PreviewImageOptions extends ScreenshotAndResizeOptions {}

async function reportErrorToDiscord(err: unknown) {
  if (process.env.DISCORD_URL) {
    // @ts-ignore
    const content = `\`\`\`${err.stack}\`\`\``;
    await got.post(process.env.DISCORD_URL, { json: { content } });
  }
}

export async function getPreviewImage(options: PreviewImageOptions) {
  options.logger.info(`generating preview image of ${options.url} ...`);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    const image = await getScreenshotAndResize(page, options);
    options.logger.info(`generating preview image of ${options.url} ... done.`);
    return image;
  } catch (err) {
    options.logger.error(err);
    await reportErrorToDiscord(err);
  } finally {
    await page.close();
  }
  return null;
}
