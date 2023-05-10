import "chrome-extension-async";
import "@webcomponents/custom-elements";
import GitHubIssueOrPullRequestPage from "../pages/githubIssueOrPullRequestPage";
import WidgetOrchestrator from "./widgetOrchestrator";

/**
 * Defines the list of pages supported on Github
 * Uses the widget orchestrator to insert Orbit widget where needed
 */
const initializeWidget = () => {
  const pages = [new GitHubIssueOrPullRequestPage()];
  const orchestrator = new WidgetOrchestrator();

  const page = orchestrator.detectPage(pages);
  if (!page) return;

  orchestrator.addWidgetElements(page, "github");
};

document.addEventListener("DOMContentLoaded", initializeWidget);

document.addEventListener("turbo:render", initializeWidget);
