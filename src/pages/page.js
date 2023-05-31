export default class Page {
  /**
   * Check if we are currently on this type of page
   *
   * @returns {String}
   */
  getPlatform() {}

  /**
   * Check if we are currently on this type of page
   *
   * @returns {Boolean}
   */
  detect() {}

  /**
   * Fetch all spaces on the page where we need to inject the widget
   * ie, every github comment
   *
   * @returns {HTMLCollectionOf<Element>} the zones where we can add a widget
   */
  findWidgetZones() {}

  /**
   * Verify if we are able to add widget to given zone
   *
   * @param {Element} widgetZone the current zone
   *
   * @returns {Boolean}
   */
  validateWidgetZone(widgetZone) {}

  /**
   * Apply any extra CSS to zone
   *
   * @param {Element} widgetZone the current zone
   */
  applyCSSPatch(widgetZone) {}

  /**
   * Fetch username from current zone
   *
   * @param {Element} widgetZone the current zone
   *
   * @returns {String|undefined}
   */
  findUsername(widgetZone) {}

  /**
   * Find point to insert widget in current zone
   *
   * @param {Element} widgetZone the current zone
   *
   * @returns {Element|null}
   */
  findInsertionPoint(widgetZone) {}

  /**
   * Returns the name of the CustomElement of the widget button.
   * Returns `obe-{platform}-button` by default.
   *
   * @returns {String}
   */
  getButtonElementName() { return `obe-${this.getPlatform()}-button`; }
}
