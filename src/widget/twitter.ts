import "chrome-extension-async";
import '@webcomponents/custom-elements'
import elementReady from "element-ready";
import TwitterWidgetLoader from "./twitterWidgetLoader";

async function setupObserver() {
  const titleElement = await elementReady('head > title', { stopOnDomReady: false, timeout: 5000 });

  if (!titleElement) { return }

  const observer = new MutationObserver(() => {
    if (document.querySelector('obe-widget')) {
      return;
    }
    const twitterWidgetLoader = new(TwitterWidgetLoader)
    twitterWidgetLoader.init();
  });

  observer.observe(titleElement, {
    subtree: true,
    childList: true,
    characterData: true
  });
}

setupObserver();
