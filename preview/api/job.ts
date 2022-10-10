import path from "path";
import fs from "fs/promises";
import { FastifyBaseLogger } from "fastify";
import { getPreviewImage } from "./screenshot";

type TaskItem =
  | {
      state: "requested" | "failure";
    }
  | {
      state: "success";
      image: Buffer;
    };

const tasks = new Map<string, TaskItem>();

function logTaskStats(logger: FastifyBaseLogger) {
  const stats = [...tasks].reduce(
    (prev, [_, request]) => ({
      ...prev,
      [request.state]: (prev[request.state] ?? 0) + 1,
    }),
    {} as { [state in TaskItem["state"]]: number }
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

export async function getTaskItem(
  url: string,
  logger: FastifyBaseLogger
): Promise<TaskItem> {
  try {
    return {
      state: "success",
      image: await fs.readFile(imagePath(url)),
    };
  } catch {
    if (!tasks.has(url)) {
      tasks.set(url, { state: "requested" });
      logTaskStats(logger);
    }
    return tasks.get(url)!;
  }
}

export async function startBackground(logger: FastifyBaseLogger) {
  const requestedUrls = [...tasks].find(
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
      tasks.set(url, { state: "failure" });
    } else {
      fs.writeFile(imagePath(url), image);
      tasks.delete(url);
      logTaskStats(logger);
    }
  }
  setTimeout(() => startBackground(logger), 100);
}
