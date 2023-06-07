import "chrome-extension-async";
import "@webcomponents/custom-elements";
import elementReady from "element-ready";

import WidgetOrchestrator from "./widgetOrchestrator";

import LinkedinProfilePage from "../pages/linkedinProfilePage";

const initializeWidget = () => {
  const pages = [new LinkedinProfilePage()];

  const orchestrator = new WidgetOrchestrator();

  const page = orchestrator.detectPage(pages);
  if (!page) return;

  orchestrator.addWidgetElements(page);
};

async function setupObserver() {
  const titleElement = await elementReady("head > title", {
    stopOnDomReady: false,
    timeout: 5000,
  });

  if (!titleElement) {
    return;
  }

  const observer = new MutationObserver((_mutationList, _observer) => {
    initializeWidget();
  });

  observer.observe(titleElement, {
    subtree: true,
    childList: true,
    characterData: true,
  });
}

setupObserver();
