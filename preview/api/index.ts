import fastify from "fastify";
import { getPreviewRequest, background } from "./runner";

function getOrigin(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

const app = fastify();

app.get("/", (req, reply) => {
  reply.type("text/html");
  return '<img src="/preview.png?url=https://mkizka.dev" />';
});

app.get<{
  Querystring: { url: string };
}>("/preview.png", async (req, reply) => {
  if (typeof req.query.url != "string") {
    return reply.status(400).send();
  }
  const targetUrl = getOrigin(req.query.url);
  if (targetUrl == null) {
    return reply.status(400).send();
  }
  if (req.query.url != targetUrl) {
    reply.header("Location", `/preview.png?url=${targetUrl}`);
    return reply.status(302).send();
  }
  const request = getPreviewRequest(targetUrl);
  if (request.state == "requested") {
    reply.header(
      "Location",
      `https://via.placeholder.com/125x100.png?text=Capture+Requested`
    );
    return reply.status(302).send();
  }
  if (request.state == "failure") {
    reply.header(
      "Location",
      `https://via.placeholder.com/125x100.png?text=Request+Failed`
    );
    return reply.status(302).send();
  }
  if (request.state == "success") {
    reply.type(`image/png`);
    return reply.send(request.image);
  }
});

app.listen({ host: "0.0.0.0", port: 3000 }, () => background());
