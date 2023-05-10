import { Page } from "../types";
import "../components/widget";

export default class WidgetOrchestrator {
  /**
   * Finds the current page from the array of available pages
   *
   * @param {Array<Page>} pages Possible page types that this orchestrator can run on
   * @returns {(Page|null)} the current page
   */
  detectPage(pages: Page[]): Page | null {
    const page = pages.find((page) => page.detect());
    return page || null;
  }

  /**
   * Inserts the widget for each of the zones on given page
   *
   * @param {Page} page the page to insert widget on
   * @param {string} platform the site we're on, used as a key for naming HTML elements
   */
  addWidgetElements(page: Page, platform: string) {
    const widgetZones = page.findWidgetZones();

    for (const widgetZone of widgetZones) {
      if (!page.validateWidgetZone(widgetZone)) break;

      page.applyCSSPatch(widgetZone);

      const username = page.findUsername(widgetZone);
      if (!username) return;

      const insertionPoint = page.findInsertionPoint(widgetZone);
      if (!insertionPoint) return;

      const widgetElement = this.addWidgetElement(username, platform);
      this.addOrbitButton(widgetElement, platform);
      this.addAdditionalDataElements(widgetElement, platform);

      insertionPoint.insertBefore(widgetElement, insertionPoint.children[0]);
    }
  }

  /**
   * Finds or creates a widget element in the DOM
   * Gives it required attributes
   *
   * @param {string} username (fetched from zone) to be set in widget
   * @param {string} platform the site we're on, used as a key for naming HTML elements
   *
   * @returns {Element} the created widget element
   */
  addWidgetElement(username: string, platform: string): Element {
    const widgetElement =
      document.querySelector("obe-widget") ||
      window.document.createElement("obe-widget");

    widgetElement.setAttribute("username", username);
    widgetElement.setAttribute("platform", platform);

    return widgetElement;
  }

  /**
   * Adds the orbit button to a given widget element
   *
   * @param {Element} widgetElement element to which we append the button
   * @param {string} platform the site we're on, used as a key for naming HTML elements
   *
   * @returns {Element} the created button
   */
  addOrbitButton(widgetElement: Element, platform: string): Element {
    const buttonElement =
      document.querySelector(`obe-${platform}-button`) ||
      window.document.createElement(`obe-${platform}-button`);

    buttonElement.setAttribute("slot", "button");

    widgetElement.appendChild(buttonElement);
    return buttonElement;
  }

  /**
   * Adds slots for additional data to the widget
   *
   * @param {Element} widgetElement element to which we append the button
   * @param {string} platform the site we're on, used as a key for naming HTML elements
   *
   * @returns {Element} the created element
   */
  addAdditionalDataElements(widgetElement: Element, platform: string): Element {
    const additionalDataComponent =
      document.querySelector(`obe-${platform}-additional-data`) ||
      window.document.createElement(`obe-${platform}-additional-data`);

    additionalDataComponent.setAttribute("slot", "additional-data");

    widgetElement.appendChild(additionalDataComponent);

    return additionalDataComponent;
  }
}
