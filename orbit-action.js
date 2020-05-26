async function createOrbitDetailsElement(ORBIT_CREDENTIALS, gitHubUsername) {
  const {
    contributions_collection,
    contributions_total,
  } = await orbitAPI.getMemberContributions(ORBIT_CREDENTIALS, gitHubUsername);
  const {
    contributions_on_this_repo_total,
  } = await orbitAPI.getMemberActivitiesOnThisRepo(
    ORBIT_CREDENTIALS,
    gitHubUsername
  );

  const detailsElement = window.document.createElement("details");
  detailsElement.classList.add(
    "details-overlay",
    "details-reset",
    "position-relative",
    "d-inline-block"
  );

  const summaryElement = window.document.createElement("summary");
  detailsElement.appendChild(summaryElement);
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

  const imageElement = window.document.createElement("img");
  imageElement.setAttribute("src", chrome.runtime.getURL("icons/icon32.png"));
  imageElement.classList.add("orbit-icon");
  summaryElement.appendChild(imageElement);

  const detailsMenuElement = window.document.createElement("details-menu");
  detailsMenuElement.classList.add(
    "anim-scale-in",
    "dropdown-menu",
    "dropdown-menu-sw",
    "mr-n1",
    "mt-n1"
  );
  detailsMenuElement.setAttribute("aria-label", "See Orbit details");
  detailsMenuElement.setAttribute("role", "menu");
  detailsMenuElement.setAttribute("style", "width: 300px;");
  detailsElement.appendChild(detailsMenuElement);

  const detailsMenuRepositoryContributions = window.document.createElement(
    "span"
  );
  detailsMenuRepositoryContributions.setAttribute("role", "menuitem");
  detailsMenuRepositoryContributions.classList.add("dropdown-item", "no-hover");
  detailsMenuRepositoryContributions.innerText = `Contributed ${contributions_on_this_repo_total} times to this repository`;
  detailsMenuElement.appendChild(detailsMenuRepositoryContributions);

  const detailsMenuTotalContributions = window.document.createElement("span");
  detailsMenuTotalContributions.setAttribute("role", "menuitem");
  detailsMenuTotalContributions.classList.add("dropdown-item", "no-hover");
  detailsMenuTotalContributions.innerText = `Contributed ${contributions_total} times to ${contributions_collection.total_repository_contributions} repositories`;
  detailsMenuElement.appendChild(detailsMenuTotalContributions);

  const detailsMenuLink = window.document.createElement("a");
  detailsMenuLink.setAttribute("aria-label", "See profile on Orbit");
  detailsMenuLink.setAttribute("role", "menuitem");
  const normalizedGitHubUsername = gitHubUsername.toLowerCase();
  const normalizedWorkspace = ORBIT_CREDENTIALS.WORKSPACE.toLowerCase();
  detailsMenuLink.setAttribute(
    "href",
    `${ORBIT_API_ROOT_URL}/${normalizedWorkspace}/members/${normalizedGitHubUsername}`
  );
  detailsMenuLink.setAttribute("target", "_blank");
  detailsMenuLink.setAttribute("rel", "noopener");
  detailsMenuLink.classList.add("dropdown-item", "btn-link");
  detailsMenuLink.innerText = `See ${gitHubUsername}’s profile on Orbit`;
  detailsMenuElement.appendChild(detailsMenuLink);

  return detailsElement;
}
