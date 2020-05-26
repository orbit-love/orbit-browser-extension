function createOrbitDetailsElement(gitHubUsername) {
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

  const detailsMenuLink = window.document.createElement("a");
  detailsMenuLink.setAttribute("aria-label", "See profile on Orbit");
  detailsMenuLink.setAttribute("role", "menuitem");
  detailsMenuLink.classList.add("dropdown-item", "btn-link");
  detailsMenuLink.innerText = `See ${gitHubUsername}’s profile on Orbit`;
  detailsMenuElement.appendChild(detailsMenuLink);

  return detailsElement;
}
