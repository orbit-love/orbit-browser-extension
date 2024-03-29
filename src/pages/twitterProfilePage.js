import Page from "./page";

export default class TwitterProfilePage extends Page {
  getPlatform() {
    return "twitter";
  }

  detect() {
    /**
     * Since Twitter doesn't have a specific URL pattern for profile
     * pages, we look for a main profile picture instead. Conveniently, they always
     * seem to link to "/<username>/photo"
     */
    return !!document.querySelector('a[href$="/photo"]');
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
     * the bio and tweet timeline, we apply a z-index: 1 to three elements.
     */
    const primaryColumnElement = main.querySelector(
      "div[data-testid='primaryColumn']"
    );
    const headerAndSuggestionsElement =
      primaryColumnElement?.children[0]?.children[2]?.children[0]?.children[0]
        ?.children[0];

    if (headerAndSuggestionsElement) {
      headerAndSuggestionsElement.setAttribute("style", "z-index: 1;");

      const headerElement = headerAndSuggestionsElement.children[1];
      if (headerElement) {
        headerElement.setAttribute("style", "z-index: 1;");

        const actionButtonsContainerElement = headerElement.children[0];

        if (actionButtonsContainerElement) {
          actionButtonsContainerElement.setAttribute("style", "z-index: 1;");
        }
      }
    }
  }

  findUsername(main) {
    /**
     * The headerProfilePhoto element here is a link surrounding the, well, header profile photo,
     * which links to "/<username>/photo"
     */
    const headerProfilePhoto = main.querySelector('a[href$="/photo"]');

    if (!headerProfilePhoto) {
      return;
    }

    return headerProfilePhoto.getAttribute("href").split("/")[1];
  }

  findInsertionPoint(main) {
    return (
      main.querySelector("div[data-testid='UserName']")?.parentElement
        ?.children[0]?.children[1] || null
    );
  }
}
