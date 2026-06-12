document.addEventListener("DOMContentLoaded", () => {
  const holder = document.querySelector("#scotlandnt-timeline");
  if (!holder) return;

  const fromCodes = (codes) => String.fromCharCode(...codes);
  const profileUrl = fromCodes([104,116,116,112,115,58,47,47,120,46,99,111,109,47,83,99,111,116,108,97,110,100,78,84]);
  const widgetSrc = fromCodes([104,116,116,112,115,58,47,47,112,108,97,116,102,111,114,109,46,116,119,105,116,116,101,114,46,99,111,109,47,119,105,100,103,101,116,115,46,106,115]);

  holder.innerHTML = `
    <div class="timeline-loading">
      <strong>Loading ScotlandNT posts…</strong>
      <span>This may take a moment depending on X embed availability.</span>
    </div>
  `;

  const showFallback = () => {
    if (holder.querySelector("iframe")) return;

    holder.innerHTML = `
      <div class="timeline-fallback">
        <strong>Posts by ScotlandNT</strong>
        <p>The embedded X timeline could not be loaded in this browser.</p>
        <a href="${profileUrl}" rel="noopener noreferrer" target="_blank">Open ScotlandNT on X</a>
      </div>
    `;
  };

  const createTimeline = () => {
    if (!window.twttr || !window.twttr.widgets || !window.twttr.widgets.createTimeline) {
      window.setTimeout(showFallback, 3500);
      return;
    }

    holder.innerHTML = "";

    window.twttr.widgets.createTimeline(
      {
        sourceType: "profile",
        screenName: "ScotlandNT"
      },
      holder,
      {
        lang: "en",
        theme: "dark",
        dnt: true,
        height: 650,
        chrome: "nofooter transparent"
      }
    ).then((element) => {
      if (!element) showFallback();
    }).catch(showFallback);

    window.setTimeout(showFallback, 7000);
  };

  if (window.twttr && window.twttr.widgets) {
    createTimeline();
    return;
  }

  const existing = document.querySelector("script[data-x-widgets='true']");
  if (existing) {
    existing.addEventListener("load", createTimeline, { once: true });
    window.setTimeout(showFallback, 7000);
    return;
  }

  const widgetScript = document.createElement("script");
  widgetScript.async = true;
  widgetScript.charset = "utf-8";
  widgetScript.dataset.xWidgets = "true";
  widgetScript.src = widgetSrc;
  widgetScript.onload = createTimeline;
  widgetScript.onerror = showFallback;
  document.body.appendChild(widgetScript);
});
