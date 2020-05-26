/**
 * Creates the Orbit action button and popover menu for a given username.
 *
 * To match GitHub’s current DOM, the element looks like this:
 *
 *  <detils>
 *    <summary> <-- opens the popover menu on click
 *      <img /> <-- the orbit logo
 *    </summary>
 *    <details-menu> <-- custom webcomponent from GitHub (https://github.com/github/details-menu-element)
 *      ... <-- content of the popover menu
 *    </details-menu>
 *  </details>
 *
 * The CSS classes used are drawn from GitHub’s own CSS file to match
 * the look and feel of other comment actions, unless explicitely overriden
 * in `orbit-action.css`.
 *
 * @param {*} ORBIT_CREDENTIALS
 * @param {*} gitHubUsername
 */
async function createOrbitDetailsElement(ORBIT_CREDENTIALS, gitHubUsername) {
  /**
   * As a convention, $variables are “state variables” which can be updated in any
   * functions inside this very function. We used this to implement the “fetch on hover”
   * feature.
   */
  let $isLoading,
    $hasLoaded,
    $is_a_member,
    $contributions_collection,
    $contributions_total,
    $contributions_on_this_repo_total,
    $detailsMenuElement;

  const normalizedGitHubUsername = gitHubUsername.toLowerCase();
  const normalizedWorkspace = ORBIT_CREDENTIALS.WORKSPACE.toLowerCase();

  /**
   * Create the <details> element
   */
  const detailsElement = window.document.createElement("details");
  detailsElement.classList.add(
    "details-overlay",
    "details-reset",
    "position-relative",
    "d-inline-block"
  );

  /**
   * Create the <summary> element and add it to <details> children
   */
  const summaryElement = window.document.createElement("summary");
  summaryElement.classList.add(
    "btn-link",
    "link-gray",
    "timeline-comment-action"
  );
  summaryElement.setAttribute(
    "aria-label",
    "See Orbit details about this user"
  );
  summaryElement.setAttribute("aria-haspopup", "menu");
  summaryElement.setAttribute("role", "button");
  detailsElement.appendChild(summaryElement);

  /**
   * Create the <img> element and add it to <summary> children
   */
  const imageElement = window.document.createElement("img");
  imageElement.setAttribute("src", chrome.runtime.getURL("icons/icon32.png"));
  imageElement.classList.add("orbit-icon");
  summaryElement.appendChild(imageElement);

  /**
   * Create an empty <details-menu> element with a `mouseover` event listener
   * and add it to <details> children.
   *
   * The contents of this element will be populated by the event listener.
   */
  $detailsMenuElement = window.document.createElement("details-menu");
  $detailsMenuElement.classList.add(
    "anim-scale-in",
    "dropdown-menu",
    "dropdown-menu-sw",
    "mr-n1",
    "mt-n1"
  );
  $detailsMenuElement.setAttribute("aria-label", "See Orbit details");
  $detailsMenuElement.setAttribute("role", "menu");
  $detailsMenuElement.setAttribute("style", "width: 300px;");
  detailsElement.addEventListener("mouseover", mouseoverListener, true);
  detailsElement.appendChild($detailsMenuElement);

  return detailsElement;

  /**
   * This method is responsible for fetching data on mouseover.
   * The $isLoading and $hasLoaded “state variables” allow us to implement
   * a simple caching mechanism which only triggers a single request.
   * @param {*} event
   */
  async function mouseoverListener(event) {
    if (!$isLoading && !$hasLoaded) {
      /**
       * Display the loading indicator content inside the popover (the user
       * might have clicked before the request has finished).
       */
      $isLoading = true;
      insertContentWhenIsLoading();

      /**
       * `await Promise.all[]` allows us to trigger both request (member info +
       * member activities) at the same time, resulting in better performance.
       */
      const [
        { is_a_member, contributions_collection, contributions_total },
        { contributions_on_this_repo_total },
      ] = await Promise.all([
        orbitAPI.getMemberContributions(
          ORBIT_CREDENTIALS,
          normalizedGitHubUsername
        ),
        orbitAPI.getMemberActivitiesOnThisRepo(
          ORBIT_CREDENTIALS,
          normalizedGitHubUsername
        ),
      ]);

      $is_a_member = is_a_member;
      $contributions_collection = contributions_collection;
      $contributions_total = contributions_total;
      $contributions_on_this_repo_total = contributions_on_this_repo_total;
      $hasLoaded = true;

      /**
       * Clean up the event listener and display the actual content.
       */
      event.target.removeEventListener("mouseover", mouseoverListener, true);
      insertContentWhenHasLoaded();
    }
  }

  /**
   * Create a <span> element to indicate loading and add it to <details-menu> children
   */
  function insertContentWhenIsLoading() {
    const detailsMenuLoadingIndicator = window.document.createElement("span");
    detailsMenuLoadingIndicator.setAttribute("role", "menuitem");
    detailsMenuLoadingIndicator.classList.add("dropdown-item", "no-hover");
    detailsMenuLoadingIndicator.innerText = `Loading Orbit data…`;
    $detailsMenuElement.appendChild(detailsMenuLoadingIndicator);
  }

  /**
   * Clear <details-menu> children (to get rid of the loading indicator) and add
   * the relevant content depending on whether the GitHub user is an Orbit member.
   */
  function insertContentWhenHasLoaded() {
    $detailsMenuElement.innerHTML = "";
    if ($is_a_member) {
      insertContentForMember();
    } else {
      insertContentForNonMember();
    }
  }

  /**
   * Create several elements with Orbit data and add them to <details-menu> children
   */
  function insertContentForMember() {
    /**
     * <span>Contributed X times to this repository</span>
     */
    const detailsMenuRepositoryContributions = window.document.createElement(
      "span"
    );
    detailsMenuRepositoryContributions.setAttribute("role", "menuitem");
    detailsMenuRepositoryContributions.classList.add(
      "dropdown-item",
      "no-hover"
    );
    detailsMenuRepositoryContributions.innerText = `Contributed ${$contributions_on_this_repo_total} times to this repository`;
    $detailsMenuElement.appendChild(detailsMenuRepositoryContributions);

    /**
     * <span>Contributed Y times to Z repository</span>
     */
    const detailsMenuTotalContributions = window.document.createElement("span");
    detailsMenuTotalContributions.setAttribute("role", "menuitem");
    detailsMenuTotalContributions.classList.add("dropdown-item", "no-hover");
    detailsMenuTotalContributions.innerText = `Contributed ${$contributions_total} times to ${$contributions_collection.total_repository_contributions} repositories`;
    $detailsMenuElement.appendChild(detailsMenuTotalContributions);

    /**
     * <a href="…">See X’s profile on Orbit</a>
     */
    const detailsMenuLink = window.document.createElement("a");
    detailsMenuLink.setAttribute("aria-label", "See profile on Orbit");
    detailsMenuLink.setAttribute("role", "menuitem");
    detailsMenuLink.setAttribute(
      "href",
      `${ORBIT_API_ROOT_URL}/${normalizedWorkspace}/members/${normalizedGitHubUsername}`
    );
    detailsMenuLink.setAttribute("target", "_blank");
    detailsMenuLink.setAttribute("rel", "noopener");
    detailsMenuLink.classList.add("dropdown-item", "btn-link");
    detailsMenuLink.innerText = `See ${gitHubUsername}’s profile on Orbit`;
    $detailsMenuElement.appendChild(detailsMenuLink);
  }

  /**
   * Create a <span> indicating this GitHub user is not a member and add it
   * to <details-menu> children.
   */
  function insertContentForNonMember() {
    const detailsMenuRepositoryContributions = window.document.createElement(
      "span"
    );
    detailsMenuRepositoryContributions.setAttribute("role", "menuitem");
    detailsMenuRepositoryContributions.classList.add(
      "dropdown-item",
      "no-hover"
    );
    detailsMenuRepositoryContributions.innerText = `${gitHubUsername} is not in your Orbit workspace`;
    $detailsMenuElement.appendChild(detailsMenuRepositoryContributions);
  }
}
