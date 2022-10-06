import { getPreviewImage } from "./screenshot";

const requestedUrls: { [url: string]: string | Buffer | null } = {};

export async function background() {
  const urlsToRequest = Object.entries(requestedUrls).filter(
    ([_, file]) => file == null
  );
  for (const [url] of urlsToRequest) {
    requestedUrls[url] = await getPreviewImage(url, {
      width: 1000,
      height: 800,
      rate: 1 / 8,
    });
  }
  setTimeout(() => background(), 100);
}

export function getPreviewImageOrRequest(url: string) {
  if (url in requestedUrls) {
    return requestedUrls[url];
  }
  requestedUrls[url] = null;
  return null;
}
