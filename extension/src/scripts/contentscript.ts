const searchAnchors = [
  ...document.querySelectorAll<HTMLAnchorElement>("#search a"),
].filter(
  (n) =>
    // @ts-ignore
    n.checkVisibility() && n.classList.length == 0 && !!n.querySelector("h3")
);

window.addEventListener("load", () => {
  for (const el of searchAnchors.slice(0, 2)) {
    const img = document.createElement("img");
    img.src = `https://searchpreview-clone.mkizka.dev/preview.png?url=${el.href}`;
    img.loading = "lazy";
    el.parentNode!.parentNode!.parentNode!.parentNode!.parentElement?.insertAdjacentElement(
      "afterbegin",
      img
    );
  }
});

export {};
