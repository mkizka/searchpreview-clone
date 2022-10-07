const searchAnchors = [
  ...document.querySelectorAll<HTMLAnchorElement>("#search a"),
].filter(
  (n) =>
    // @ts-ignore
    n.checkVisibility() && n.classList.length == 0 && !!n.querySelector("h3")
);
console.log(searchAnchors);

for (const el of searchAnchors) {
  const img = document.createElement("img");
  img.src = `https://searchpreview-clone.mkizka.dev/preview.jpg?url=${el.href}`;
  img.loading = "lazy";
  img.width = 113;
  img.height = 90;
  img.style.marginRight = "15px";
  img.style.border = "1px solid rgba(0, 0, 0, 0.2)";
  const container =
    el.parentNode!.parentNode!.parentNode!.parentNode!.parentElement!;
  container.insertAdjacentElement("afterbegin", img);
  container.style.display = "flex";
}

export {};
