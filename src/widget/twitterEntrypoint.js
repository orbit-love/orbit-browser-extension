import "chrome-extension-async";
import "@webcomponents/custom-elements";
import elementReady from "element-ready";

import WidgetOrchestrator from "./widgetOrchestrator";

import TwitterProfilePage from "../pages/twitterProfilePage";

const initializeWidget = () => {
  const pages = [ new TwitterProfilePage() ];

  const orchestrator = new WidgetOrchestrator();

  const page = orchestrator.detectPage(pages);
  if (!page) return;

  orchestrator.addWidgetElements(page, "twitter");
}

async function setupObserver() {
  const titleElement = await elementReady('head > title', { stopOnDomReady: false, timeout: 5000 });

  if (!titleElement) { return }

  const observer = new MutationObserver((mutationList, _observer) => {
    // We only want to initialize the widget once the page is fully loaded.
    // We can detect this using the <title> as it shows the username (@something) when the
    // page has loaded, but not before
    mutationList.forEach((mutation) => {
      if (!mutation.type === 'childList') { return }

      const newTitle = mutation.addedNodes[0]?.textContent

      if (newTitle === undefined || newTitle.indexOf('@') === -1) { return }

      // Adding a small timeout so that page transitions can complete (most of the time),
      // which helps with detecting profile pages.
      setTimeout(initializeWidget, 500);
    });
  });
  
  observer.observe(titleElement, {
    subtree: true,
    childList: true,
    characterData: true
  });
}

setupObserver();
