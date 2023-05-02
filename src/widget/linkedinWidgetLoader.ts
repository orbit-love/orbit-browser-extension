import WidgetLoader from "./widgetLoader";
import '../components/linkedinButton';
import Page from "./page";

class LinkedinProfilePage implements Page {
  detect() {
    const pathname = window.location.pathname;
    return pathname.startsWith("/in/");
  }

  findWidgetZones() {
    return window.document.getElementsByTagName("main");
  }

  validateWidgetZone(widgetZone: Element) {
    return true;
  }

  findUsername(main: Element) {
    const pathname = window.location.pathname;
    return pathname.match(/.*(\/in\/)([\w\d_-]*)\/?/)[2];
  }

  findInsertionPoint(main: Element) {
    return main.querySelector(".pv-top-card__badge-wrap") || null
  }
}

export default class LinkedinWidgetLoader extends WidgetLoader {
  readonly pages = [new(LinkedinProfilePage)]
  readonly platform = 'linkedin'
}
