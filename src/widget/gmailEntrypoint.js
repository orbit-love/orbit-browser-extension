import "chrome-extension-async";
import "@webcomponents/custom-elements";

import WidgetOrchestrator from "./widgetOrchestrator";

import GmailEmailThreadPage from "../pages/gmailEmailThreadPage";

/**
 * We keep track of the mutation observer so that we can disconnect it
 * when the user navigates away from an email thread page. This is to avoid
 * incurring an (admittedly small) performance penalty when browsing around GMail.
 */
let observer = new MutationObserver(() => {});

const initializeWidget = () => {
  // Start by disconnecting the observer
  if (observer) { observer.disconnect(); }

  const pages = [ new GmailEmailThreadPage() ];

  const orchestrator = new WidgetOrchestrator();

  const page = orchestrator.detectPage(pages);
  if (!page) return;

  orchestrator.addWidgetElements(page, "gmail");

  // Element id=:1 is the "thread view" on thread pages (and also the "inbox view" for inbox pages)
  const threadElement = document.querySelector('#\\:1');

  if (!threadElement) { return }

  // On changes to the "thread view", rerun the orchestrator again. This is so that we can
  // track when the user expands an email, and add the widget at that time.
  observer = new MutationObserver((_mutationList, _observer) => {
    orchestrator.addWidgetElements(page, "gmail");
  });

  observer.observe(threadElement, {
    subtree: true,
    childList: true
  });

  return observer;
}

// I could not find any event fired after the page has finished loading.
// As a stopgap, we listen for DOMContentLoaded (fired when the loading screen appears)
// and wait 2s more to be safe.
document.addEventListener("DOMContentLoaded", () => setTimeout(() => observer = initializeWidget(), 2000));

// Navigating around GMail changes the hash
window.addEventListener('hashchange', () => { observer = initializeWidget() });
