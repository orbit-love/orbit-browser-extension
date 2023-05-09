import WidgetLoader from "./widgetLoader";
import "../components/twitterButton";
import { Page } from "../types";

class TwitterProfilePage implements Page {
  detect() {
    const profilePageRegex =
      /(https:\/\/twitter.com\/(?![a-zA-Z0-9_]+\/)([a-zA-Z0-9_]+))/;
    return profilePageRegex.test(window.location.href);
  }

  findWidgetZones() {
    return window.document.getElementsByTagName("main");
  }

  validateWidgetZone(widgetZone: Element) {
    return true;
  }

  applyCSSPatch(main: Element) {
    const primaryColumnElement = main.querySelector(
      "div[data-testid='primaryColumn']"
    );
    const headerElement =
      primaryColumnElement?.children[0]?.children[2]?.children[0]?.children[0]
        ?.children[0];

    if (headerElement) {
      headerElement.setAttribute("style", "z-index: 1;");
      const actionButtonsContainerElement =
        headerElement.children[1]?.children[0];

      if (actionButtonsContainerElement) {
        actionButtonsContainerElement.setAttribute("style", "z-index: 1;");
      }
    }
  }

  findUsername(main: Element) {
    return main
      .querySelector("div[data-testid='UserName']")
      ?.children[0]?.children[0]?.children[1]?.children[0]?.children[0]?.children[0]?.children[0]?.innerHTML?.slice(
        1
      );
  }

  findInsertionPoint(main: Element) {
    return (
      main.querySelector("div[data-testid='userActions']")?.parentElement ||
      null
    );
  }
}

export default class TwitterWidgetLoader extends WidgetLoader {
  readonly pages = [new TwitterProfilePage()];
  readonly platform = "twitter";
}
