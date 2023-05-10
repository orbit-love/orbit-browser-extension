import "chrome-extension-async";
import "@webcomponents/custom-elements";
import { GitHubIssueOrPullRequestPage } from "./pages/githubISsueOrPullRequestPage";
import WidgetOrchestrator from "./widgetOrchestrator";

const initializeWidget = () => {
  const pages = [new GitHubIssueOrPullRequestPage()];
  const orchestrator = new WidgetOrchestrator();

  const page = orchestrator.detectPage(pages);
  if (!page) return;

  orchestrator.addWidgetElements(page, "github");
};

document.addEventListener("DOMContentLoaded", initializeWidget);

document.addEventListener("turbo:render", initializeWidget);
