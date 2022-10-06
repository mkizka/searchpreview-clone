const searchAnchors = [
  ...document.querySelectorAll<HTMLAnchorElement>("#search a"),
].filter(
  (n) =>
    // @ts-ignore
    n.checkVisibility() && n.classList.length == 0 && !!n.querySelector("h3")
);

window.addEventListener("load", () => {
  for (const el of searchAnchors) {
    const img = document.createElement("img");
    img.src = `http://localhost:3000/api/preview?url=${el.href}`;
    el.parentNode!.insertBefore(img, el);
    console.log(img);
    break;
  }
});

export {};
