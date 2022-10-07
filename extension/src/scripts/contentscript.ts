const searchAnchors = [
  ...document.querySelectorAll<HTMLAnchorElement>("#search a"),
].filter(
  (n) =>
    // @ts-ignore
    n.checkVisibility() && n.classList.length == 0 && !!n.querySelector("h3")
);
console.log(searchAnchors);
window.addEventListener("load", () => {
  console.log("fire");
  for (const el of searchAnchors.slice(0, 3)) {
    const img = document.createElement("img");
    img.src = `https://searchpreview-clone.mkizka.dev/preview.jpg?url=${el.href}`;
    img.loading = "lazy";
    // @ts-ignore
    img.style = "position: absolute; left: -150px;";
    el.parentNode!.parentNode!.parentNode!.parentNode!.parentElement?.insertAdjacentElement(
      "afterbegin",
      img
    );
  }
});

export {};
