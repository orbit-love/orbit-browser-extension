import Page from "./page";

export default class GmailEmailThreadPage extends Page {
  getPlatform() {
    return "gmail";
  }

  detect() {
    const topLevelPageRegex =
      /(#inbox|#starred|#snoozed|#sent|#scheduled|#drafts|#imp|#all|#spam|#trash)\/\w+/;
    const secondLevelPageRegex =
      /(#category|#label|#search|#advanced-search)\/[^\/]+\/\w+/;

    return (
      topLevelPageRegex.test(window.location.hash) ||
      secondLevelPageRegex.test(window.location.hash)
    );
  }

  findWidgetZones() {
    return window.document.querySelectorAll(
      "[role='listitem'] [data-message-id]"
    );
  }

  validateWidgetZone(_expandedEmail) {
    return true;
  }

  applyCSSPatch(_expandedEmail) {}

  findUsername(expandedEmail) {
    return expandedEmail.querySelector("span[email]")?.getAttribute("email");
  }

  findInsertionPoint(expandedEmail) {
    return expandedEmail.querySelector('td [rowspan="2"]');
  }
}
