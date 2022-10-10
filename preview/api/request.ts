import path from "path";
import fs from "fs/promises";
import { FastifyBaseLogger } from "fastify";
import { getPreviewImage } from "./screenshot";

type PreviewRequest =
  | {
      state: "requested" | "failure";
    }
  | {
      state: "success";
      image: Buffer;
    };

const requests = new Map<string, PreviewRequest>();

function logRequestStats(logger: FastifyBaseLogger) {
  const stats = [...requests].reduce(
    (prev, [_, request]) => ({
      ...prev,
      [request.state]: (prev[request.state] ?? 0) + 1,
    }),
    {} as { [state in PreviewRequest["state"]]: number }
  );
  const text = Object.entries(stats)
    .map(([state, count]) => `${state}: ${count}`)
    .join(", ");
  logger.info(`now stats is ${text || "empty"}`);
}

function imagePath(url: string) {
  const name = url.replace(/(:\/\/|\.)/g, "_");
  return path.resolve(__dirname, `../images/${name}.jpg`);
}

export async function getPreviewRequest(
  url: string,
  logger: FastifyBaseLogger
): Promise<PreviewRequest> {
  try {
    return {
      state: "success",
      image: await fs.readFile(imagePath(url)),
    };
  } catch {
    if (!requests.has(url)) {
      requests.set(url, { state: "requested" });
      logRequestStats(logger);
    }
    return requests.get(url)!;
  }
}

export async function startBackground(logger: FastifyBaseLogger) {
  const requestedUrls = [...requests].find(
    ([_, request]) => request.state == "requested"
  );
  if (requestedUrls) {
    const url = requestedUrls[0];
    const image = await getPreviewImage({
      url,
      viewport: { width: 1000, height: 800 },
      resizeRate: 1 / 10,
      logger,
    });
    if (image == null) {
      requests.set(url, { state: "failure" });
    } else {
      fs.writeFile(imagePath(url), image);
      requests.delete(url);
      logRequestStats(logger);
    }
  }
  setTimeout(() => startBackground(logger), 100);
}
