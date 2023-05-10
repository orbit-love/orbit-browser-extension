import { Page } from "../types";
import "../components/widget";
export default class WidgetOrchestrator {
  detectPage(pages: Page[]) {
    const page = pages.find((page) => page.detect());
    return page || null;
  }

  addWidgetElements(page: Page, platform: string) {
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

      const widgetElement = this.addWidgetElement(username, platform);
      this.addOrbitButton(widgetElement, platform);
      this.addAdditionalDataElements(widgetElement, platform);

      insertionPoint.insertBefore(widgetElement, insertionPoint.children[0]);
    }
  }

  addWidgetElement(username: string, platform: string) {
    const widgetElement =
      document.querySelector("obe-widget") ||
      window.document.createElement("obe-widget");
    widgetElement.setAttribute("username", username);
    widgetElement.setAttribute("platform", platform);
    return widgetElement;
  }

  addOrbitButton(widgetElement: Element, platform: string) {
    const buttonElement =
      document.querySelector(`obe-${platform}-button`) ||
      window.document.createElement(`obe-${platform}-button`);
    buttonElement.setAttribute("slot", "button");
    widgetElement.appendChild(buttonElement);
  }

  addAdditionalDataElements(widgetElement: Element, platform: string) {
    const additionalDataComponent = window.document.createElement(
      `obe-${platform}-additional-data`
    );
    additionalDataComponent.setAttribute("slot", "additional-data");
    widgetElement.appendChild(additionalDataComponent);
  }
}
