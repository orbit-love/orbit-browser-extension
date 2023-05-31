import Page from "./page";

export default class GitHubDiscussionPage extends Page {
  getPlatform() { return 'github' }

  detect() {
    const pageRegex = /.*\/.*\/discussions?\/.*/;
    return pageRegex.test(window.location.pathname);
  }

  findWidgetZones() {
    return window.document.getElementsByClassName("timeline-comment");
  }

  validateWidgetZone(widgetZone) {
    return widgetZone.querySelector(".timeline-comment-actions") !== null;
  }

  applyCSSPatch() {}

  findUsername(comment) {
    const authorElement =
      comment.querySelector('a > img[class~="avatar"] + div > span') ||
      comment.querySelector(".author");

    return authorElement.innerText;
  }

  findInsertionPoint(comment) {
    return comment.querySelector(".timeline-comment-actions").children[0];
  }

  getButtonElementName() { return 'obe-github-discussion-button' }
}
