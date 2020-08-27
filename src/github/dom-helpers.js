export const createDropdownItem = (text) => {
  const spanElement = window.document.createElement("span");
  spanElement.setAttribute("role", "menuitem");
  spanElement.classList.add("dropdown-item", "dropdown-item-orbit", "no-hover");
  spanElement.textContent = text;
  return spanElement;
};

export const createOrbitMetrics = (orbitLevel, reach, love) => {
  const detailsMenuOrbitMetrics = window.document.createElement("div");
  detailsMenuOrbitMetrics.setAttribute("role", "menuitem");
  detailsMenuOrbitMetrics.classList.add(
    "dropdown-item",
    "dropdown-item-orbit",
    "no-hover",
    "orbit-metrics-container",
    "d-flex"
  );

  const orbitLevelMetricContainer = createOrbitMetric(
    "Orbit",
    orbitLevel,
    "icons/icon-orbit-level.png"
  );
  detailsMenuOrbitMetrics.appendChild(orbitLevelMetricContainer);

  const reachMetricContainer = createOrbitMetric(
    "Reach",
    reach,
    "icons/icon-reach.png"
  );
  detailsMenuOrbitMetrics.appendChild(reachMetricContainer);

  const loveMetricContainer = createOrbitMetric(
    "Love",
    love.toFixed(1),
    "icons/icon-love.png"
  );
  detailsMenuOrbitMetrics.appendChild(loveMetricContainer);

  return detailsMenuOrbitMetrics;
};

const createOrbitMetric = (label, value, iconPath) => {
  const orbitMetricContainer = window.document.createElement("div");
  orbitMetricContainer.classList.add("orbit-metric-container");

  const orbitMetricIcon = window.document.createElement("img");
  orbitMetricIcon.setAttribute("src", chrome.runtime.getURL(iconPath));
  orbitMetricContainer.appendChild(orbitMetricIcon);

  const orbitMetricText = window.document.createElement("span");
  orbitMetricText.innerHTML = `${label} <strong>${value}</strong>`;
  orbitMetricContainer.appendChild(orbitMetricText);

  return orbitMetricContainer;
};
