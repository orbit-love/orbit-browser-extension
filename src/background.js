import "chrome-extension-async";
import { ORBIT_API_ROOT_URL, ORBIT_HEADERS } from "./constants";
import { configureRequest, getOrbitCredentials } from "./oauth-helpers";

// When clicking on the Orbit extension button, open the options page
chrome.browserAction.onClicked.addListener(() =>
  chrome.runtime.openOptionsPage()
);

const isFirstInstall = async (suggestedReason) => suggestedReason === "install";

// When installing the Orbit extension, open the options page
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  // Only notify on install
  if (await isFirstInstall(reason)) {
    chrome.runtime.openOptionsPage();
  }
});

// When receiving the "showOptions" message, open the options page
chrome.runtime.onMessage.addListener((request) => {
  if (request === "showOptions") {
    chrome.runtime.openOptionsPage();
  }
});

// Message listener from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // do not attempt to parse the message if it is not coming from a content script
  if (!sender.tab) {
    return;
  }

  switch (request.operation) {
    case "LOAD_WORKSPACES":
      fetchWorkspaces(request).then(sendResponse);
      break;
    default:
      console.error(`Unknown operation: ${request.operation}`);
  }
  return true;
});

/**
 * Fetch workspaces from Orbit API
 * Credentials passed as arguments since this is called from options page
 *
 * @param {String} accessTokenFromStorage
 * @param {String} apiKeyFromStorage
 *
 * @returns {success, response, ok}
 */
const fetchWorkspaces = async ({
  accessTokenFromStorage,
  apiKeyFromStorage,
}) => {
  try {
    const url = new URL(`${ORBIT_API_ROOT_URL}/workspaces`);

    const { params, headers } = configureRequest({
      ACCESS_TOKEN: accessTokenFromStorage,
      API_TOKEN: apiKeyFromStorage,
    });

    url.search = params.toString();

    const response = await fetch(url, {
      headers: headers,
    });

    return { success: true, response: await response.json(), ok: response.ok };
  } catch (e) {
    return { success: false, response: e.message };
  }
};
