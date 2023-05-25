import Page from "./page";

export default class LinkedinProfilePage extends Page {
  detect() {
    const pathname = window.location.pathname;
    return pathname.startsWith("/in/");
  }

  findWidgetZones() {
    return window.document.getElementsByTagName("main");
  }

  validateWidgetZone(_widgetZone) {
    return true;
  }

  applyCSSPatch() {}

  findUsername(_main) {
    const pathname = window.location.pathname;
    return pathname.match(/.*(\/in\/)([\w\d_-]*)\/?/)[2];
  }

  findInsertionPoint(main) {
    return main.querySelector(".pv-top-card__badge-wrap") || null
  }
}
