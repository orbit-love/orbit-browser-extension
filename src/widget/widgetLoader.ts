import { Page } from "../types";
import "../components/widget";

// Do not use state in classes
// pass in `page` at every page, à la orchestrator
// helps with tests

export default class WidgetLoader {
  readonly pages: Array<Page>;
  readonly platform: string;

  detectPage() {
    const page = this.pages.find((page) => page.detect());
    return page || null;
  }
  async init() {
    const page = this.detectPage();

    if (page === null) {
      return;
    }

    const widgetZones = page.findWidgetZones();

    for (const widgetZone of widgetZones) {
      if (!page.validateWidgetZone(widgetZone)) {
        break;
      }

      page.applyCSSPatch(widgetZone);

      const username = page.findUsername(widgetZone);
      if (username == null) {
        return;
      }

      const insertionPoint = page.findInsertionPoint(widgetZone);
      if (insertionPoint == null) {
        return;
      }

      const widgetElement =
        document.querySelector("obe-widget") ||
        window.document.createElement("obe-widget");
      const buttonElement =
        document.querySelector(`obe-${this.platform}-button`) ||
        window.document.createElement(`obe-${this.platform}-button`);
      widgetElement.setAttribute("username", username);
      widgetElement.setAttribute("platform", this.platform);
      buttonElement.setAttribute("slot", "button");
      widgetElement.appendChild(buttonElement);

      const additionalDataComponent = window.document.createElement(
        `obe-${this.platform}-additional-data`
      );
      additionalDataComponent.setAttribute("slot", "additional-data");
      widgetElement.appendChild(additionalDataComponent);

      // const orbitActionElement = await createOrbitDetailsElement(
      //   ORBIT_CREDENTIALS,
      //   username,
      //   isRepoInWorkspace,
      //   'test',
      //   'test'
      // );

      insertionPoint.insertBefore(widgetElement, insertionPoint.children[0]);
      // insertionPoint.insertBefore(
      //   orbitActionElement,
      //   insertionPoint.children[0]
      // );
    }
  }
}
