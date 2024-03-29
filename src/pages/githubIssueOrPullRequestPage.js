import Page from "./page";

export default class GitHubIssueOrPullRequestPage extends Page {
  getPlatform() {
    return "github";
  }

  detect() {
    const issuePageRegex = /.*\/.*\/issues?\/.*/;
    const pullRequestPageRegex = /.*\/.*\/pulls?\/.*/;
    return (
      issuePageRegex.test(window.location.pathname) ||
      pullRequestPageRegex.test(window.location.pathname)
    );
  }

  findWidgetZones() {
    return window.document.getElementsByClassName("timeline-comment");
  }

  validateWidgetZone(widgetZone) {
    return widgetZone.querySelector(".timeline-comment-actions") !== null;
  }

  applyCSSPatch() {}

  findUsername(comment) {
    return comment.querySelector(".author")?.innerHTML;
  }

  findInsertionPoint(comment) {
    return comment.querySelector(".timeline-comment-actions");
  }

  getButtonElementName() {
    return "obe-github-issue-or-pull-request-button";
  }
}
