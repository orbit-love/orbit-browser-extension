import Page from "./page";

export default class TwitterProfilePage extends Page {
  detect() {
    /**
     * Since Twitter doesn't have a specific URL pattern for profile
     * pages, we look for a header photo instead. Conveniently, they always
     * seem to link to "/<username>/header_photo"
     */
    return !!document.querySelector('a[href$="/header_photo"]');
  }

  findWidgetZones() {
    return window.document.getElementsByTagName("main");
  }

  validateWidgetZone(_widgetZone) {
    return true;
  }

  applyCSSPatch(main) {
    /**
     * Twitter's CSS is unwieldly, and elements seems to stack on top of
     * one another, covering the ones below. To avoid the widget to be covered by
     * the bio and tweet timeline, we apply a z-index: 1 to two elements.
     */
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

  findUsername(main) {
    return main
      .querySelector("div[data-testid='UserName']")
      ?.children[0]?.children[0]?.children[1]?.children[0]?.children[0]?.children[0]?.children[0]?.innerHTML?.slice(
        1
      );
  }

  findInsertionPoint(main) {
    return (
      main.querySelector("div[data-testid='UserName']")?.parentElement?.children[0]?.children[1] ||
      null
    );
  }
}
