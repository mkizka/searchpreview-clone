import fastify from "fastify";
import { getJobItem, startBackground } from "./job";

function getOrigin(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

const app = fastify({ logger: true });

app.get("/", (_, reply) => {
  reply.type("text/html");
  return [
    "https://example.com",
    "https://mkizka.dev",
    "https://mkizka.dev/about",
    "https://ogp.mkizka.dev",
  ]
    .map((url) => `<p><img src="/preview.jpg?url=${url}" /></p>`)
    .join("");
});

app.get<{
  Querystring: { url: string };
}>("/preview.jpg", async (req, reply) => {
  if (typeof req.query.url != "string") {
    return reply.status(400).send();
  }
  const targetUrl = getOrigin(req.query.url);
  if (targetUrl == null) {
    return reply.status(400).send();
  }
  if (req.query.url != targetUrl) {
    reply.header("Location", `/preview.jpg?url=${targetUrl}`);
    return reply.status(302).send();
  }
  const job = await getJobItem(targetUrl, app.log);
  if (job.state == "requested") {
    reply.header(
      "Location",
      `https://via.placeholder.com/125x100.png?text=Capture+Requested`
    );
    return reply.status(302).send();
  }
  if (job.state == "failure") {
    reply.header(
      "Location",
      `https://via.placeholder.com/125x100.png?text=Request+Failed`
    );
    return reply.status(302).send();
  }
  if (job.state == "success") {
    reply.type(`image/jpeg`);
    reply.header(
      "Cache-Control",
      `public, max-age=31536000` // 1年
    );
    return reply.send(job.image);
  }
});

app
  .listen({ host: "0.0.0.0", port: 3000 })
  .then(() => startBackground(app.log))
  .catch(app.log.error);
