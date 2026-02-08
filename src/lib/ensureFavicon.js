// Forces the favicon to a specific URL (helpful when other scripts overwrite it)
export function ensureFavicon(href, { attempts = 20, intervalMs = 250 } = {}) {
  if (typeof document === "undefined") return;

  const setOnce = () => {
    const upsert = (rel) => {
      let link = document.querySelector(`head link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", rel);
        link.setAttribute("type", "image/x-icon");
        document.head.appendChild(link);
      }
      link.setAttribute("href", href);
      link.setAttribute("data-app-favicon", "true");
    };

    upsert("icon");
    upsert("shortcut icon");
  };

  // Set immediately, then keep re-applying briefly to win races with other scripts.
  setOnce();

  let count = 0;
  const id = window.setInterval(() => {
    setOnce();
    count += 1;
    if (count >= attempts) window.clearInterval(id);
  }, intervalMs);
}
