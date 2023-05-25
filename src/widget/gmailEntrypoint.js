import "chrome-extension-async";
import "@webcomponents/custom-elements";

import WidgetOrchestrator from "./widgetOrchestrator";

import GmailEmailThreadPage from "../pages/gmailEmailThreadPage";

const initializeWidget = () => {
  const pages = [ new GmailEmailThreadPage() ];

  const orchestrator = new WidgetOrchestrator();

  const page = orchestrator.detectPage(pages);
  if (!page) return;

  orchestrator.addWidgetElements(page, "gmail");
}

// I could not find any event fired after the page has finished loading.
// As a stopgap, we listen for DOMContentLoaded (fired when the loading screen appears)
// and wait 2s more to be safe.
document.addEventListener("DOMContentLoaded", () => setTimeout(initializeWidget, 2000));

// Navigating around GMail changes the hash
window.addEventListener('hashchange', initializeWidget);
