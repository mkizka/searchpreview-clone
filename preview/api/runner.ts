import { getPreviewImage } from "./screenshot";

type PreviewRequest =
  | {
      state: "success";
      updatedAt: Date;
      image: string | Buffer;
    }
  | {
      state: "failure";
      updatedAt: Date;
      err: Error;
    }
  | {
      state: "requested";
      updatedAt: Date;
    };

const storedRequests: { [url: string]: PreviewRequest } = {};

function logStoredRequsts() {
  const stats = Object.entries(storedRequests).reduce(
    (prev, [_, request]) => ({
      ...prev,
      [request.state]: (prev[request.state] ?? 0) + 1,
    }),
    {} as { [state in PreviewRequest["state"]]: number }
  );
  console.log(`[STATS]:`, stats);
}

async function updateRequest(url: string): Promise<PreviewRequest> {
  try {
    const image = await getPreviewImage(url, {
      width: 1000,
      height: 800,
      rate: 1 / 8,
    });
    return {
      state: "success",
      updatedAt: new Date(),
      image,
    };
  } catch (err) {
    return {
      state: "failure",
      updatedAt: new Date(),
      err: err as Error,
    };
  }
}

export async function background() {
  const urlsToRequest = Object.entries(storedRequests).find(
    ([_, request]) => request.state == "requested"
  );
  if (urlsToRequest) {
    const [url] = urlsToRequest;
    storedRequests[url] = await updateRequest(url);
    logStoredRequsts();
  }
  setTimeout(() => background(), 5000);
}

export function getPreviewRequest(url: string) {
  if (!(url in storedRequests)) {
    storedRequests[url] = {
      state: "requested",
      updatedAt: new Date(),
    };
    logStoredRequsts();
  }
  return storedRequests[url];
}
