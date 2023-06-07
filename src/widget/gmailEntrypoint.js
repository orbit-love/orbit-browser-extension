import "chrome-extension-async";
import "@webcomponents/custom-elements";

import WidgetOrchestrator from "./widgetOrchestrator";

import GmailEmailThreadPage from "../pages/gmailEmailThreadPage";

const initializeWidget = () => {
  const pages = [new GmailEmailThreadPage()];

  const orchestrator = new WidgetOrchestrator();

  const page = orchestrator.detectPage(pages);
  if (!page) return;

  orchestrator.addWidgetElements(page);

  // Element id=:1 is the "thread view" on thread pages (and also the "inbox view" for inbox pages)
  const threadElement = document.querySelector("#\\:1");

  if (!threadElement) {
    return;
  }

  /**
   * GMail threads have two kinds of emails: "collapsed" and "expanded". We only want to show the widget on
   * expanded emails. Clicking on a collapsed email expands it, but critically it does so by creating a new DOM node;
   * meaning we can’t preemptively attach widgets to all expanded emails in one go -- only those which are expanded
   * when the page first loads.
   * To work around this, we listen to the click event on all collapsed emails: on click, we simply rerun the
   * widget orchestrator, which will create (or replace) all the widgets -- most importantly, it will create the widget
   * on the email that the user clicked on.
   */
  const addEventListenersToCollapsedEmailElements = () => {
    const collapsedEmailElements = threadElement.querySelectorAll(
      "[role='listitem']:not([aria-expanded='true'])"
    );

    for (const collapsedEmailElement of collapsedEmailElements) {
      collapsedEmailElement.addEventListener(
        "click",
        function handleClickOnCollapsedEmail() {
          this.removeEventListener("click", handleClickOnCollapsedEmail);
          orchestrator.addWidgetElements(page);
        }
      );
    }
  };

  addEventListenersToCollapsedEmailElements();

  /**
   * For long thread, GMail "hides" long groups of email behind a button (indicating how many emails are hidden).
   * When clicking on the button, new collapsed emails are created in the DOM, and we can run the method described
   * above again.
   */
  const expandThreadButtonElement = threadElement.querySelector(
    "span[role='button'][aria-expanded='false']"
  );

  if (!expandThreadButtonElement) {
    return;
  }
  expandThreadButtonElement.addEventListener(
    "click",
    function handleClickOnExpandThread() {
      // Note: we need a short timeout here so that the collapsed emails are created in the DOM
      setTimeout(addEventListenersToCollapsedEmailElements, 100);
    }
  );
};

// I could not find any event fired after the page has finished loading.
// As a stopgap, we listen for DOMContentLoaded (fired when the loading screen appears)
// and wait 2s more to be safe.
document.addEventListener("DOMContentLoaded", () =>
  setTimeout(initializeWidget, 2000)
);

// Navigating around GMail changes the hash
window.addEventListener("hashchange", initializeWidget);
