import fastify from "fastify";
import { getPreviewImageOrRequest, background } from "./runner";

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
}>("/preview.png", async (req, res) => {
  if (typeof req.query.url != "string") {
    return res.status(400).send();
  }
  const targetUrl = getOrigin(req.query.url);
  if (targetUrl == null) {
    return res.status(400).send();
  }
  if (req.query.url != targetUrl) {
    res.header("Location", `/preview.png?url=${targetUrl}`);
    return res.status(302).send();
  }
  const image = getPreviewImageOrRequest(targetUrl);
  if (image == null) {
    res.header("Location", `https://via.placeholder.com/125x100`);
    return res.status(302).send();
  }
  res.header("Content-Type", `image/png`);
  return res.send(image);
});

app.listen({ host: "0.0.0.0", port: 3000 });
background();
