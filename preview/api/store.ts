import { FastifyBaseLogger } from "fastify";
import { getPreviewImage } from "./screenshot";

type PreviewRequest =
  | {
      state: "success";
      updatedAt: Date;
      image: string | Buffer;
    }
  | {
      state: "requested" | "failure";
      updatedAt: Date;
    };

const storedRequests: { [url: string]: PreviewRequest } = {};

export function getPreviewRequest(url: string) {
  if (!(url in storedRequests)) {
    storedRequests[url] = {
      state: "requested",
      updatedAt: new Date(),
    };
  }
  return storedRequests[url];
}

async function updateRequest(
  url: string,
  logger: FastifyBaseLogger
): Promise<PreviewRequest> {
  const image = await getPreviewImage({
    url,
    viewport: { width: 1000, height: 800 },
    resizeRate: 1 / 8,
    logger,
  });
  return image == null
    ? {
        state: "failure",
        updatedAt: new Date(),
      }
    : {
        state: "success",
        updatedAt: new Date(),
        image,
      };
}

function getStoreStats() {
  const stats = Object.entries(storedRequests).reduce(
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
  const requestedUrls = Object.entries(storedRequests).find(
    ([_, request]) => request.state == "requested"
  );
  if (requestedUrls) {
    const url = requestedUrls[0];
    storedRequests[url] = await updateRequest(url, logger);
    logger.info(`now stats is ${getStoreStats()}`);
  }
  setTimeout(() => startBackground(logger), 5000);
}
