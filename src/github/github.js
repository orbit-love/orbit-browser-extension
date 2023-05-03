import "chrome-extension-async";
import gitHubInjection from "github-injection";

import { getOrbitCredentials, isRepoInOrbitWorkspace } from "./orbit-helpers";
import { createOrbitDetailsElement } from "./orbit-action";
import { getPageType } from "./page-helpers";

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
    const pageType = getPageType();

    if (pageType === null) {
      return;
    }

    /**
     * Find all the “comment headers” on the page (this extension is only
     * active on /pull/* and /issues/* URLs).
     */
    const comments = window.document.getElementsByClassName("timeline-comment");
    /**
     * For each comment header, create and add the Orbit action to
     * the “comment action” section of the DOM.
     */
    for (const comment of comments) {
      if (!comment.querySelector(".timeline-comment-actions")) {
        break;
      }
      /**
       * GitHub pjax sometimes triggers the `githubInjection` multiple times on a single page,
       * which resulted in multiple Orbit icons being visible side by side. I was able to reproduce this
       * on a Pull Request, by switching back and forth from the Conversation to the Files Changes tabs.
       *
       * We thus check if Orbit is already instanciated; if that’s the case, we bail out.
       */
      let isOrbitActionElementAlreadyInstantiated = comment.querySelector(
        ".orbit-icon-container"
      );
      if (isOrbitActionElementAlreadyInstantiated) {
        break;
      }

      const commentActionsElement = comment.querySelector(
        ".timeline-comment-actions"
      );

      // For discussions, some messages do not have the .author class, so we target the span right close to the avatar img.
      // For issues + PRs (and some discussion messages), the author element has the .author classs.
      const authorElement =
        comment.querySelector('a > img[class~="avatar"] + div > span') ||
        comment.querySelector(".author");

      const gitHubUsername = authorElement.innerText;

      const orbitActionElement = await createOrbitDetailsElement(
        ORBIT_CREDENTIALS,
        gitHubUsername,
        isRepoInWorkspace
      );

      // The element must be inserted at different places if it's in a Discussions message
      if (pageType === "ISSUE" || pageType === "PULL_REQUEST") {
        commentActionsElement.insertBefore(
          orbitActionElement,
          commentActionsElement.children[0]
        );
      } else {
        commentActionsElement.children[0].insertBefore(
          orbitActionElement,
          commentActionsElement.children[0].children[0]
        );
      }
    }
  });
});
