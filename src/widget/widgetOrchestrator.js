import { Page } from "../pages/page";
import "../components/widget";
import "../components/githubButton";
import "../components/twitterButton";
import "../components/linkedinButton";
import "../components/gmailButton";

export default class WidgetOrchestrator {
  /**
   * Finds the current page from the array of available pages
   *
   * @param {Array<Page>} pages Possible page types that this orchestrator can run on
   * @returns {(Page|null)} the current page
   */
  detectPage(pages) {
    const page = pages.find((page) => page.detect());
    return page || null;
  }

  /**
   * Inserts the widget for each of the zones on given page
   *
   * @param {Page} page the page to insert widget on
   * @param {string} platform the site we're on, used as a key for naming HTML elements
   */
  addWidgetElements(page, platform) {

    const widgetZones = page.findWidgetZones();

    for (const widgetZone of widgetZones) {
      // If a widget already exists for this widgetZone, remove it.
      // This fixes an issue with SPAs like LinkedIn, where the first widget
      // that was injected remained on other pages.
      const existingWidget = widgetZone.querySelector('obe-widget');
      if (existingWidget) {
        // TODO: there is an infinite loop happening with Gmail:
        // We’re triggering this method when any element is added to the page, but
        // we’re also adding an element with this method. Friday-evening-quick-workaround is
        // to opt-out of this behavior for now, so that it doesn’t block internal testing.
        if (platform === 'gmail') {
          continue;
        }
        existingWidget.remove();
      }

      if (!page.validateWidgetZone(widgetZone)) continue;

      page.applyCSSPatch(widgetZone);

      const username = page.findUsername(widgetZone);
      if (!username) continue;

      const insertionPoint = page.findInsertionPoint(widgetZone);
      if (!insertionPoint) continue;

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
  addWidgetElement(username, platform) {
    const widgetElement = window.document.createElement("obe-widget");

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
  addOrbitButton(widgetElement, platform) {
    if (!!widgetElement.querySelector(`obe-${platform}-button`)) return;

    const buttonElement = window.document.createElement(
      `obe-${platform}-button`
    );

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
  addAdditionalDataElements(widgetElement, platform) {
    if (!!widgetElement.querySelector(`obe-${platform}-additional-data`))
      return;

    const additionalDataComponent = window.document.createElement(
      `obe-${platform}-additional-data`
    );

    additionalDataComponent.setAttribute("slot", "additional-data");

    widgetElement.appendChild(additionalDataComponent);

    return additionalDataComponent;
  }
}
