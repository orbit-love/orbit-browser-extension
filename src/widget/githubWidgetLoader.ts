import WidgetLoader from "./widgetLoader";
import '../components/githubButton';
import '../components/pillComponent';
import '../components/githubAdditionalDataComponent';
import { Page } from "../types";

class GitHubIssueOrPullRequestPage implements Page {
  detect() {
    const issuePageRegex = /.*\/.*\/issues?\/.*/;
    const pullRequestPageRegex = /.*\/.*\/pulls?\/.*/;
    return issuePageRegex.test(window.location.pathname) || pullRequestPageRegex.test(window.location.pathname);
  }

  findWidgetZones() {
    return window.document.getElementsByClassName("timeline-comment");
  }

  validateWidgetZone(widgetZone: Element) {
    return widgetZone.querySelector(".timeline-comment-actions") !== null;
  }

  applyCSSPatch() {}
  
  findUsername(comment: Element) {
    return comment.querySelector(".author")?.innerHTML;
  }
  
  findInsertionPoint(comment: Element) {
    return comment.querySelector(
      ".timeline-comment-actions"
    );
  }
}

export default class GitHubWidgetLoader extends WidgetLoader {
  readonly pages = [new(GitHubIssueOrPullRequestPage)]
  readonly platform = 'github';
}
