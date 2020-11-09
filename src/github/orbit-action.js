import { getThreshold, orbitAPI } from "./orbit-helpers";
import { createDropdownItem, createOrbitMetrics } from "./dom-helpers";
import { ORBIT_API_ROOT_URL } from "../constants";

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
export async function createOrbitDetailsElement(
  ORBIT_CREDENTIALS,
  gitHubUsername,
  isRepoInWorkspace,
  commentUrl,
  commentPublishedAt
) {
  /**
   * As a convention, $variables are “state variables” which can be updated in any
   * functions inside this very function. We used this to implement the “fetch on hover”
   * feature.
   */
  let $isLoading,
    $hasLoaded,
    $contributions_total,
    $contributions_on_this_repo_total,
    $orbit_level,
    $reach,
    $love,
    $success,
    $slug,
    $detailsMenuElement,
    $is_a_member;

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
    "timeline-comment-action",
    "orbit-icon-container"
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
  const svgElement = window.document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );
  svgElement.innerHTML = `
    <path d="M18.6750222,6.95079111 C18.5032889,5.65240889 18.0152889,4.41603556 17.2540444,3.35025778 C16.4929778,2.28449778 15.4817778,1.42190222 14.3092444,0.838257778 C13.1368,0.254613333 11.8389867,-0.0322435556 10.52976,0.00288 C9.22053333,0.0379911111 7.93996444,0.394026667 6.80048,1.03968 C5.66101333,1.68535111 4.69747556,2.60090667 3.99452444,3.70595556 C3.29155556,4.81100444 2.87064889,6.07175111 2.76878222,7.37747556 C2.66689778,8.6832 2.88716444,9.99395556 3.41022222,11.1946667 C3.93329778,12.3953778 4.74314667,13.4492978 5.76869333,14.2638756 C6.55386667,13.9142578 7.41235556,13.5061156 8.32417778,13.0483556 C7.40192,12.6065067 6.61829333,11.9204978 6.05834667,11.0648 C5.49838222,10.2091022 5.18346667,9.21637333 5.14776889,8.19436444 C5.11207111,7.17235556 5.35694222,6.16008889 5.85584,5.26739556 C6.35473778,4.37472 7.08858667,3.63571556 7.97776,3.13057778 C8.86691556,2.62545778 9.87745778,2.37349333 10.8996978,2.40202667 C11.92192,2.43056 12.9168178,2.73852444 13.7764267,3.29248 C14.6360178,3.84643556 15.3274667,4.62524444 15.7758222,5.54437333 C16.2241778,6.46350222 16.4120889,7.48785778 16.3194667,8.50629333 C17.1639111,7.97075556 17.9534222,7.44928 18.6750222,6.95079111 Z M18.7424,7.85742222 C17.9342222,8.45518222 17.0387556,9.07441778 16.0757333,9.69884444 C15.6456889,11.0478578 14.7204444,12.1838222 13.4864,12.8780089 C12.2523378,13.5722133 10.8011022,13.7730844 9.42487111,13.4401956 C8.36935111,13.9475911 7.36791111,14.3868267 6.45089778,14.7505244 C7.67057778,15.5262044 9.07763556,15.9569422 10.5225244,15.9969422 C11.9674133,16.0369778 13.3961422,15.6847111 14.6568533,14.9776889 C15.9175111,14.2706667 16.9632,13.2352711 17.6824889,11.9815467 C18.4019556,10.72784 18.7681778,9.30263111 18.7424,7.85742222 Z"></path>
    <path d="M19.1482667,1.35096949 C19.2565333,1.35096949 19.3623111,1.31886222 19.4524444,1.25872 C19.5424,1.19857778 19.6126222,1.11308444 19.6540444,1.01304889 C19.6954667,0.913031111 19.7063111,0.802968889 19.6851556,0.696782222 C19.664,0.590613333 19.6119111,0.493066667 19.5352889,0.416515556 C19.4588444,0.339964444 19.3612444,0.287822222 19.2551111,0.266702222 C19.1488,0.245582222 19.0387556,0.256426667 18.9388444,0.297866667 C18.8387556,0.339288889 18.7532444,0.409457778 18.6931556,0.499466667 C18.6328889,0.589475556 18.6008872,0.695324444 18.6008872,0.803573333 C18.6007111,0.875484444 18.6149333,0.94672 18.6423111,1.01317333 C18.6698667,1.07962667 18.7100444,1.14001778 18.7610667,1.19086222 C18.8119111,1.24170667 18.8721778,1.28202667 18.9386667,1.30949333 C19.0051556,1.33697778 19.0762667,1.35107556 19.1482667,1.35096949 Z"></path>
    <path d="M0.729617778,10.6514133 C0.874008889,10.6514133 1.01514667,10.6085511 1.13518222,10.5282844 C1.25521778,10.4480178 1.34872889,10.3339378 1.40389333,10.2004978 C1.45904,10.06704 1.47336889,9.92023111 1.44503111,9.77864889 C1.41669333,9.63704889 1.34698667,9.50705778 1.24472889,9.40510222 C1.14247111,9.30316444 1.01224889,9.23384889 0.870577778,9.20593778 C0.728906667,9.17804444 0.582133333,9.1928 0.448853333,9.24837333 C0.315573333,9.30392889 0.201777778,9.39779556 0.121884444,9.51806222 C0.0419733333,9.63834667 -0.000444444444,9.77962667 -3.45712905e-06,9.92401778 C0.000586666667,10.1171378 0.0777244444,10.3021511 0.214488889,10.4384889 C0.351253333,10.5748444 0.536497778,10.6514133 0.729617778,10.6514133 Z"></path>
    <path d="M13.0514311,6.35376 C13.8395556,5.91822222 14.6069333,5.50490667 15.3475556,5.12343111 C15.3751111,5.16787556 15.4046222,5.22046222 15.4357333,5.27973333 C14.7017422,5.66341333 13.9343644,6.07822222 13.14624,6.51450667 L13.0514311,6.35376 Z M23.2881778,2.46723556 C22.9363556,1.85761778 20.8030222,2.50499556 17.7838222,3.91607111 C17.8120889,3.96273778 17.8401778,4.01088 17.8668444,4.05976889 C20.7592889,2.68277333 22.7777778,2.01984 23.0341333,2.55315556 C23.4369778,3.25089778 18.8119111,6.67448889 12.70848,10.1995556 C6.60497778,13.72464 1.32663111,16.0163556 0.92368,15.3186489 C0.694062222,14.9038578 1.82956444,13.7735289 2.84954667,12.8742933 C1.38069333,14.0594311 0.610346667,14.9727467 0.86368,15.4112356 C1.43847111,16.4074667 7.00199111,14.44832 13.1951289,10.8750933 C19.3882667,7.30188444 23.8659556,3.46348444 23.2881778,2.46723556 Z"></path>
    <path d="M12.3262756,6.93301333 C12.1957689,6.70904889 12.1469689,6.44675556 12.1882311,6.19086222 C12.2294933,5.93496889 12.35824,5.70129778 12.5525156,5.52970667 C12.7467911,5.35811556 12.99456,5.25921778 13.2536,5.24988444 C13.51264,5.24055111 13.7668978,5.32136889 13.9730133,5.47854222 C14.1791289,5.63569778 14.3243556,5.85950222 14.3839111,6.11176889 C14.4434667,6.36405333 14.4136889,6.62917333 14.2996267,6.86192 C14.1855822,7.09468444 13.9943111,7.28069333 13.7584533,7.38819556 C13.5225956,7.49571556 13.2567467,7.51808 13.00624,7.45150222 C12.8635911,7.41589333 12.7297067,7.35152 12.6128,7.26236444 C12.4958756,7.17322667 12.3983822,7.06113778 12.3262756,6.93301333 Z" id="Path" fill-rule="nonzero"></path>
  `;
  svgElement.classList.add("orbit-icon");
  svgElement.setAttribute("viewBox", "0 0 24 16");
  svgElement.setAttribute("version", "1.1");
  svgElement.setAttribute("width", "24");
  svgElement.setAttribute("height", "16");
  svgElement.setAttribute("aria-hidden", "true");
  summaryElement.appendChild(svgElement);

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
    "dropdown-menu-orbit",
    "mr-n1",
    "mt-n1"
  );
  $detailsMenuElement.setAttribute("aria-label", "See Orbit details");
  $detailsMenuElement.setAttribute("role", "menu");
  detailsElement.addEventListener("mouseover", mouseoverListener, true);
  detailsElement.appendChild($detailsMenuElement);

  return detailsElement;

  /**
   * This method is responsible for fetching data on mouseover.
   * The $isLoading and $hasLoaded “state variables” allow us to implement
   * a simple caching mechanism which only triggers a single request.
   */
  async function mouseoverListener() {
    if (Object.values(ORBIT_CREDENTIALS).some((value) => value === "")) {
      detailsElement.removeEventListener("mouseover", mouseoverListener, true);
      insertContentWhenNoCredentials();
    } else if (!$isLoading && !$hasLoaded) {
      /**
       * Display the loading indicator content inside the popover (the user
       * might have clicked before the request has finished).
       */
      $isLoading = true;
      insertContentWhenIsLoading();

      let success, status, slug, contributions_total, orbit_level, reach, love;

      /**
       * `await Promise.all[]` allows us to trigger both request (member info +
       * member activities) at the same time, resulting in better performance.
       */
      ({
        success,
        status,
        slug,
        contributions_total,
        orbit_level,
        reach,
        love,
      } = await orbitAPI.getMemberContributions(
        ORBIT_CREDENTIALS,
        gitHubUsername
      ));
      $is_a_member = true;
      $slug = slug;

      ({
        contributions_total,
        success,
      } = await orbitAPI.getGitHubUserContributions(
        ORBIT_CREDENTIALS,
        gitHubUsername
      ));

      /**
       * TODO: clean that up once comment-only users on that issue/repo
       * will have been integrated as full workspace members.
       *
       * In the meantime, we fallback (not very gracefully) to the same
       * behavior as when the repository is not in the workspace.
       */
      if (status === 404) {
        isRepoInWorkspace = false;
        $is_a_member = false;
      } else {
        $orbit_level = orbit_level;
        $reach = reach;
        $love = love;
      }
      $success = success;
      $contributions_total = contributions_total;
      if (isRepoInWorkspace) {
        const {
          success,
          contributions_on_this_repo_total,
        } = await orbitAPI.getMemberActivitiesOnThisRepo(
          ORBIT_CREDENTIALS,
          $slug
        );

        $contributions_on_this_repo_total = contributions_on_this_repo_total;
        $success = success;
      }
      $hasLoaded = true;

      /**
       * Clean up the event listener and display the actual content.
       */
      detailsElement.removeEventListener("mouseover", mouseoverListener, true);
      insertContentWhenHasLoaded();
    }
  }

  function insertContentWhenNoCredentials() {
    const missingCredentialsInfo1 = createDropdownItem(
      "API token or workspace is missing"
    );
    $detailsMenuElement.appendChild(missingCredentialsInfo1);

    const missingCredentialsInfo2 = createDropdownItem(
      "Right click the extension icon to access Options"
    );
    $detailsMenuElement.appendChild(missingCredentialsInfo2);
  }

  /**
   * Create a <span> element to indicate loading and add it to <details-menu> children
   */
  function insertContentWhenIsLoading() {
    const detailsMenuLoadingIndicator = createDropdownItem(
      "Loading Orbit data…"
    );
    $detailsMenuElement.appendChild(detailsMenuLoadingIndicator);
  }

  /**
   * Clear <details-menu> children (to get rid of the loading indicator) and add
   * the relevant content depending on whether the GitHub user is an Orbit member.
   */
  function insertContentWhenHasLoaded() {
    $detailsMenuElement.innerHTML = "";
    if (!$success) {
      insertContentForError();
    } else if ($is_a_member) {
      insertContentForMember();
    } else {
      insertContentForNonMember();
    }
  }

  /**
   * Create a <span> indicating there was an error fetching Orbit data.
   */
  function insertContentForError() {
    const detailsMenuRepositoryContributions = createDropdownItem(
      "There was an error fetching Orbit data"
    );
    $detailsMenuElement.appendChild(detailsMenuRepositoryContributions);
  }

  /**
   * Create several elements with Orbit data and add them to <details-menu> children
   */
  function insertContentForMember() {
    /**
     * <div>Orbit Metrics (orbit level, reach, love)</div>
     */
    const detailsMenuOrbitMetrics = createOrbitMetrics(
      $orbit_level,
      $reach,
      $love
    );

    $detailsMenuElement.appendChild(detailsMenuOrbitMetrics);

    /**
     * <span class="dropdown-divider"></span>
     */
    const dropdownDivider1 = window.document.createElement("span");
    dropdownDivider1.setAttribute("role", "none");
    dropdownDivider1.classList.add("dropdown-divider");
    $detailsMenuElement.appendChild(dropdownDivider1);

    /**
     * <span>Contributed X times to this repository</span>
     */
    if (isRepoInWorkspace) {
      const detailsMenuRepositoryContributions = createDropdownItem(
        $contributions_on_this_repo_total === 1
          ? "First contribution to this repository"
          : `Contributed ${getThreshold(
              $contributions_on_this_repo_total
            )} times to this repository`
      );
      $detailsMenuElement.appendChild(detailsMenuRepositoryContributions);
    }

    /**
     * <span>Contributed Y times to Z repository</span>
     */
    const detailsMenuTotalContributions = createDropdownItem(
      `Contributed ${getThreshold($contributions_total)} times on GitHub`
    );
    $detailsMenuElement.appendChild(detailsMenuTotalContributions);

    /**
     * <span class="dropdown-divider"></span>
     */
    const dropdownDivider2 = window.document.createElement("span");
    dropdownDivider2.setAttribute("role", "none");
    dropdownDivider2.classList.add("dropdown-divider");
    $detailsMenuElement.appendChild(dropdownDivider2);

    /**
     * <a href="…">Add to to X’s content</a>
     */
    const detailsMenuLinkContent = window.document.createElement("a");
    detailsMenuLinkContent.setAttribute("aria-label", "See profile on Orbit");
    detailsMenuLinkContent.setAttribute("role", "menuitem");
    detailsMenuLinkContent.classList.add(
      "dropdown-item",
      "dropdown-item-orbit",
      "btn-link"
    );
    detailsMenuLinkContent.textContent = `Add to ${gitHubUsername}’s content`;
    detailsMenuLinkContent.addEventListener("click", handleAddCommentToMember);
    $detailsMenuElement.appendChild(detailsMenuLinkContent);

    /**
     * <a href="…">See X’s profile on Orbit</a>
     */
    const detailsMenuLinkProfile = window.document.createElement("a");
    detailsMenuLinkProfile.setAttribute("aria-label", "See profile on Orbit");
    detailsMenuLinkProfile.setAttribute("role", "menuitem");
    detailsMenuLinkProfile.setAttribute(
      "href",
      `${ORBIT_API_ROOT_URL}/${normalizedWorkspace}/members/${gitHubUsername}`
    );
    detailsMenuLinkProfile.setAttribute("target", "_blank");
    detailsMenuLinkProfile.setAttribute("rel", "noopener");
    detailsMenuLinkProfile.classList.add(
      "dropdown-item",
      "dropdown-item-orbit",
      "btn-link"
    );
    detailsMenuLinkProfile.textContent = `See ${gitHubUsername}’s profile on Orbit`;
    $detailsMenuElement.appendChild(detailsMenuLinkProfile);
  }

  async function handleAddCommentToMember(event) {
    event.target.removeEventListener("click", handleAddCommentToMember);
    event.preventDefault();
    event.stopPropagation();
    event.target.textContent = "Adding the content…";

    const { success, id } = await orbitAPI.addCommentAsContentToMember(
      ORBIT_CREDENTIALS,
      gitHubUsername,
      commentUrl,
      commentPublishedAt
    );
    if (success) {
      event.target.setAttribute(
        "href",
        `${ORBIT_API_ROOT_URL}/${normalizedWorkspace}/members/${gitHubUsername}/posts/${id}`
      );
      event.target.setAttribute("target", "_blank");
      event.target.setAttribute("rel", "noopener");
      event.target.textContent = `Added! See ${gitHubUsername}’s content on Orbit`;
    } else {
      event.target.textContent = `There was a problem with the request.`;
    }
  }

  /**
   * Create a <span> displaying general GitHub data and a link to add the member
   * to the current Orbit workspace.
   */
  function insertContentForNonMember() {
    const detailsMenuRepositoryContributions = createDropdownItem(
      `Contributed ${getThreshold($contributions_total)} times on GitHub`
    );
    $detailsMenuElement.appendChild(detailsMenuRepositoryContributions);

    /**
     * <span class="dropdown-divider"></span>
     */
    const dropdownDivider = window.document.createElement("span");
    dropdownDivider.setAttribute("role", "none");
    dropdownDivider.classList.add("dropdown-divider");
    $detailsMenuElement.appendChild(dropdownDivider);

    /**
     * <a href="…">Add X to workspace Y</a>
     */
    const detailsMenuLink = window.document.createElement("a");
    detailsMenuLink.setAttribute(
      "aria-label",
      `Add ${gitHubUsername} to ${ORBIT_CREDENTIALS.WORKSPACE} on Orbit`
    );
    detailsMenuLink.setAttribute("role", "menuitem");
    detailsMenuLink.classList.add(
      "dropdown-item",
      "dropdown-item-orbit",
      "btn-link"
    );
    detailsMenuLink.textContent = `Add ${gitHubUsername} to ${ORBIT_CREDENTIALS.WORKSPACE} on Orbit`;
    detailsMenuLink.addEventListener("click", handleMemberCreation);
    $detailsMenuElement.appendChild(detailsMenuLink);
  }

  async function handleMemberCreation(event) {
    event.target.removeEventListener("click", handleMemberCreation);
    event.preventDefault();
    event.stopPropagation();
    event.target.textContent = "Creating the member…";

    const { success } = await orbitAPI.addMemberToWorkspace(
      ORBIT_CREDENTIALS,
      gitHubUsername
    );
    if (success) {
      event.target.setAttribute(
        "href",
        `${ORBIT_API_ROOT_URL}/${normalizedWorkspace}/members/${gitHubUsername}`
      );
      event.target.setAttribute("target", "_blank");
      event.target.setAttribute("rel", "noopener");
      event.target.textContent = `Added! See ${gitHubUsername}’s profile on Orbit`;
    } else {
      event.target.textContent = `There was a problem with the request.`;
    }
  }
}
