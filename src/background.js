import "chrome-extension-async";
import { ORBIT_API_ROOT_URL, OAUTH_CLIENT_ID } from "./constants";
import { configureRequest } from "./oauth-helpers";

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
      loadWorkspaces(request).then(sendResponse);
      break;
    case "GET_OAUTH_TOKEN":
      getOAuthToken(request).then(sendResponse);
      break;
    case "REFRESH_OAUTH_TOKEN":
      refreshOAuthToken(request).then(sendResponse);
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
 * @param {String} accessToken
 * @param {String} apiKey
 *
 * @returns {success, response, ok}
 */
const loadWorkspaces = async ({ accessToken, apiKey }) => {
  try {
    const url = new URL(`${ORBIT_API_ROOT_URL}/workspaces`);

    const { params, headers } = configureRequest({
      ACCESS_TOKEN: accessToken,
      API_TOKEN: apiKey,
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

/**
 * Request the OAuth token. Called from options page when authenticating
 *
 * @param {String} oAuthCode
 * @param {String} codeVerifier
 *
 * @returns {success, response}
 */
const getOAuthToken = async ({ oAuthCode, codeVerifier }) => {
  try {
    let authUrl = new URL(`${ORBIT_API_ROOT_URL}/oauth/token`);

    let params = new URLSearchParams({
      client_id: OAUTH_CLIENT_ID,
      grant_type: "authorization_code",
      code: oAuthCode,
      code_verifier: codeVerifier,
      redirect_uri: chrome.identity.getRedirectURL("oauth2"),
    });

    authUrl.search = params.toString();

    const response = await fetch(authUrl, {
      method: "POST",
    });

    return { success: true, response: await response.json() };
  } catch (e) {
    return { success: false, response: e.message };
  }
};

/**
 * Fetch new OAuth credentials using the refresh token
 *
 * @param {String} refreshToken from storage
 *
 * @returns {success, response}
 */
const refreshOAuthToken = async ({ refreshToken }) => {
  try {
    const url = new URL(`${ORBIT_API_ROOT_URL}/oauth/token`);
    let params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: OAUTH_CLIENT_ID,
      refresh_token: refreshToken,
    });

    url.search = params.toString();

    const response = await fetch(url, {
      method: "POST",
    });

    return { success: true, response: await response.json() };
  } catch (e) {
    return { success: false, response: e.message };
  }
};
