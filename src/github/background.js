import "chrome-extension-async";
import gitHubInjection from "github-injection";

import { getOrbitCredentials, isRepoInOrbitWorkspace } from "./orbit-helpers";
import { createOrbitDetailsElement } from "./orbit-action";

document.addEventListener("DOMContentLoaded", async () => {
  /**
   * Retrieve the Orbit credentials and options from Chrome sync storage.
   * They are set by the user on the extension’s options page.
   *
   * TODO: Display a helpful message and fail gracefully if they have not
   * been set.
   */
  const ORBIT_CREDENTIALS = await getOrbitCredentials();

  const isRepoInWorkspace = await isRepoInOrbitWorkspace();

  /**
   * GitHub uses pjax (https://github.com/MoOx/pjax) to speed its
   * navigation, a bit like Turbolinks does.
   *
   * We use the github-injection library (https://github.com/OctoLinker/injection/)
   * to make the extension work even after a page navigation.
   */
  gitHubInjection(async () => {
    /**
     * Find all the “comment headers” on the page (this extension is only
     * active on /pull/* and /issues/* URLs).
     */
    const commentHeaders = window.document.getElementsByClassName(
      "timeline-comment-header"
    );
    /**
     * For each comment header, create and add the Orbit action to
     * the “comment action” section of the DOM.
     */
    for (const commentHeader of commentHeaders) {
      const commentActionsElement = commentHeader.querySelector(
        ".timeline-comment-actions"
      );
      const gitHubUsername = commentHeader.querySelector(".author").innerText;
      const orbitActionElement = await createOrbitDetailsElement(
        ORBIT_CREDENTIALS,
        gitHubUsername,
        isRepoInWorkspace
      );
      commentActionsElement.insertBefore(
        orbitActionElement,
        commentActionsElement.firstChild
      );
    }
  });
});
