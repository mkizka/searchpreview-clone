import fastify from "fastify";
import { launch, Page, Viewport } from "puppeteer";

let _page: Page | null;

async function getPage() {
  if (_page) {
    return _page;
  }
  const browser = await launch({
    args: ["--no-sandbox"],
    executablePath: "/usr/bin/google-chrome",
  });
  _page = await browser.newPage();
  return _page;
}

async function getScreenshot(url: string, viewport: Viewport) {
  const page = await getPage();
  await page.setViewport(viewport ?? { width: 19, height: 574 });
  await page.goto(url);
  return page.screenshot({ type: "png" });
}

async function getResizedImage(
  url: string,
  options: Viewport & { rate: number }
) {
  const file = await getScreenshot(url, options);
  const imageUrl = `data:image/png;base64,${Buffer.from(file).toString(
    "base64"
  )}`;
  return getScreenshot(imageUrl, {
    width: options.width * options.rate,
    height: options.height * options.rate,
  });
}

function getOrigin(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

const app = fastify({ logger: true });

app.get<{
  Querystring: { url: string };
}>("/preview", async (req, res) => {
  if (typeof req.query.url != "string") {
    return res.status(400).send();
  }
  const targetUrl = getOrigin(req.query.url);
  if (targetUrl == null) {
    return res.status(400).send();
  }
  if (req.query.url != targetUrl) {
    res.header("Location", `/api/preview?url=${targetUrl}`);
    return res.status(302).send();
  }
  const image = await getResizedImage(targetUrl, {
    width: 1000,
    height: 800,
    rate: 1 / 8,
  });
  res.header("Content-Type", `image/png`);
  return res.send(image);
});

app.listen({ host: "0.0.0.0", port: 3000 });
