import WidgetLoader from "./widgetLoader";
import '../components/twitterButton';
import Page from "./page";

class TwitterProfilePage implements Page {
  detect() {
    const profilePageRegex = /(https:\/\/twitter.com\/(?![a-zA-Z0-9_]+\/)([a-zA-Z0-9_]+))/;
    return profilePageRegex.test(window.location.href);
  }

  findWidgetZones() {
    return window.document.getElementsByTagName("main");
  }

  validateWidgetZone(widgetZone: Element) {
    return true;
  }

  findUsername(main: Element) {
    return main.querySelector("div[data-testid='UserName']")?.children[0]?.children[0]?.children[1]?.children[0]?.children[0]?.children[0]?.children[0]?.innerHTML?.slice(1)
  }

  findInsertionPoint(main: Element) {
    return main.querySelector("div[data-testid='userActions']")?.parentElement || null
  }
}

export default class TwitterWidgetLoader extends WidgetLoader {
  readonly pages = [new(TwitterProfilePage)]
  readonly platform = 'twitter';
}
