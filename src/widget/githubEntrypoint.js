import "chrome-extension-async";
import "@webcomponents/custom-elements";

import WidgetOrchestrator from "./widgetOrchestrator";

import GitHubIssueOrPullRequestPage from "../pages/githubIssueOrPullRequestPage";
import GitHubDiscussionPage from "../pages/githubDiscussionPage";

/**
 * Defines the list of pages supported on Github
 * Uses the widget orchestrator to insert Orbit widget where needed
 */
const initializeWidget = () => {
  const pages = [
    new GitHubIssueOrPullRequestPage(),
    new GitHubDiscussionPage(),
  ];
  const orchestrator = new WidgetOrchestrator();

  const page = orchestrator.detectPage(pages);
  if (!page) return;

  orchestrator.addWidgetElements(page);
};

document.addEventListener("DOMContentLoaded", initializeWidget);

document.addEventListener("turbo:render", initializeWidget);
