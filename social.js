document.addEventListener("DOMContentLoaded", () => {
  const holder = document.querySelector("#scotlandnt-timeline");
  if (!holder) return;

  const fromCodes = (codes) => String.fromCharCode(...codes);

  holder.innerHTML = "";

  const timeline = document.createElement("a");
  timeline.className = "twitter-timeline";
  timeline.dataset.lang = "en";
  timeline.dataset.theme = "dark";
  timeline.dataset.height = "650";
  timeline.dataset.dnt = "true";
  timeline.href = fromCodes([104,116,116,112,115,58,47,47,120,46,99,111,109,47,83,99,111,116,108,97,110,100,78,84]);
  timeline.textContent = "Posts by ScotlandNT";
  holder.appendChild(timeline);

  const loadWidgets = () => {
    if (window.twttr && window.twttr.widgets && window.twttr.widgets.load) {
      window.twttr.widgets.load(holder);
    }
  };

  if (document.querySelector("script[data-x-widgets='true']")) {
    loadWidgets();
    return;
  }

  const widgetScript = document.createElement("script");
  widgetScript.async = true;
  widgetScript.charset = "utf-8";
  widgetScript.dataset.xWidgets = "true";
  widgetScript.src = fromCodes([104,116,116,112,115,58,47,47,112,108,97,116,102,111,114,109,46,120,46,99,111,109,47,119,105,100,103,101,116,115,46,106,115]);
  widgetScript.onload = loadWidgets;
  document.body.appendChild(widgetScript);
});
