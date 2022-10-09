import { FastifyBaseLogger } from "fastify";
import { getPreviewImage } from "./screenshot";

type PreviewRequest =
  | {
      state: "success";
      image: string | Buffer;
    }
  | {
      state: "requested" | "failure";
    };

const cache = new Map<string, PreviewRequest>();

export function getPreviewRequest(url: string, logger: FastifyBaseLogger) {
  if (!cache.has(url)) {
    cache.set(url, { state: "requested" });
  }
  const request = cache.get(url)!;
  if (request.state == "success") {
    // CDNにキャッシュされたことを信じて消す
    cache.delete(url);
    logger.info(`now stats is ${getStoreStats()}`);
  }
  return request;
}

async function updateRequest(
  url: string,
  logger: FastifyBaseLogger
): Promise<PreviewRequest> {
  const image = await getPreviewImage({
    url,
    viewport: { width: 1000, height: 800 },
    resizeRate: 1 / 10,
    logger,
  });
  return image == null
    ? {
        state: "failure",
      }
    : {
        state: "success",
        image,
      };
}

function getStoreStats() {
  const stats = [...cache].reduce(
    (prev, [_, request]) => ({
      ...prev,
      [request.state]: (prev[request.state] ?? 0) + 1,
    }),
    {} as { [state in PreviewRequest["state"]]: number }
  );
  return Object.entries(stats)
    .map(([state, count]) => `${state}: ${count}`)
    .join(", ");
}

export async function startBackground(logger: FastifyBaseLogger) {
  const requestedUrls = [...cache].find(
    ([_, request]) => request.state == "requested"
  );
  if (requestedUrls) {
    const url = requestedUrls[0];
    cache.set(url, await updateRequest(url, logger));
    logger.info(`now stats is ${getStoreStats()}`);
    // 生成した画像をCDNにキャッシュさせる
    await fetch(
      `https://searchpreview-clone.mkizka.dev/preview.jpg?url=${url}`
    );
  }
  setTimeout(() => startBackground(logger), 100);
}
