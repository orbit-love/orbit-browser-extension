import "chrome-extension-async";
import elementReady from "element-ready";
import '@webcomponents/custom-elements'
import LinkedinWidgetLoader from "./linkedinWidgetLoader";

async function setupObserver() {
  const titleElement = await elementReady('head > title', { stopOnDomReady: false, timeout: 5000 });

  if (!titleElement) { return }

  const observer = new MutationObserver(() => {
    if (document.querySelector('obe-widget')) {
      return;
    }
    const linkedinWidgetLoader = new(LinkedinWidgetLoader)
    linkedinWidgetLoader.init();
  });

  observer.observe(titleElement, {
    subtree: true,
    childList: true,
    characterData: true
  });
}

setupObserver();
