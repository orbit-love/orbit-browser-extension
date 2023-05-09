import "chrome-extension-async";
import "@webcomponents/custom-elements";
import GitHubWidgetLoader from "./githubWidgetLoader";

const initializeWidget = () => {
  const githubWidgetLoader = new GitHubWidgetLoader();
  githubWidgetLoader.init();
};

document.addEventListener("DOMContentLoaded", initializeWidget);

document.addEventListener("turbo:render", initializeWidget);
