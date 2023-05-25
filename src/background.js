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
    case "LOAD_MEMBER_DATA":
      loadMemberData(request).then(sendResponse);
      break;
    case "ADD_MEMBER_TO_WORKSPACE":
      addMemberToWorkspace(request).then(sendResponse);
      break;
    case "LOAD_ADDITIONAL_DATA":
      loadAdditionalData(request).then(sendResponse);
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

/**
 * Fetch member from Orbit
 *
 * @param {String} username from widget
 * @param {String} platform from widget
 * @param {Object} ORBIT_CREDENTIALS fetched from storage
 *
 * @returns {success, response, ok}
 */
const loadMemberData = async ({ username, platform, ORBIT_CREDENTIALS }) => {
  const url = new URL(
    `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/members/find`
  );

  const { params, headers } = configureRequest(ORBIT_CREDENTIALS, {
    source: platform,
    username: username,
  });

  url.search = params.toString();

  try {
    const response = await fetch(url, {
      headers,
    });

    return {
      success: true,
      response: await response.json(),
      status: response.status,
    };
  } catch (e) {
    return { success: false, response: e.message, status: 500 };
  }
};

const loadAdditionalData = async ({
  username,
  platform,
  repositoryFullName,
  member,
  ORBIT_CREDENTIALS,
}) => {
  if (platform !== "github") return;

  let additionalData = {};

  const url = new URL(
    `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/identities/github/${username}`
  );

  const { params, headers } = configureRequest(ORBIT_CREDENTIALS);
  url.search = params.toString();

  try {
    const response = await fetch(url, {
      headers: headers,
    });

    const { data } = await response.json();

    additionalData = {
      success: true,
      response: { contributions_total: data.attributes.g_contributions_total },
      status: response.status,
      ok: response.ok,
    };
  } catch (err) {
    return {
      success: false,
      response: err.message,
    };
  }

  // IE, if repository exists in this workspace
  // FIXME: 404 set as output of fetchOrbitData :|
  if (additionalData.status !== 404) {
    const url = new URL(
      `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/activities`
    );

    const { params, headers } = configureRequest(ORBIT_CREDENTIALS, {
      member_id: member,
      properties: `github_repository:${repositoryFullName}`,
      items: 25,
    });

    url.search = params.toString();

    try {
      const response = await fetch(url, {
        headers: headers,
      });

      const { data } = await response.json();
      additionalData.response.contributions_on_this_repo_total = data.length;
    } catch (err) {
      return {
        success: false,
        response: err.message,
      };
    }
  }

  return additionalData;
};

/**
 * Add a member to Orbit
 *
 * @param {String} username from widget
 * @param {Object} ORBIT_CREDENTIALS fetched from storage
 *
 * @returns {success, response, ok}
 */
const addMemberToWorkspace = async ({ username, ORBIT_CREDENTIALS }) => {
  const url = new URL(
    `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/members`
  );

  const { params, headers } = configureRequest(
    ORBIT_CREDENTIALS,
    {},
    { "Content-Type": "application/json" }
  );

  url.search = params.toString();

  try {
    const response = await fetch(url, {
      headers: headers,
      method: "POST",
      body: JSON.stringify({
        member: {
          github: username,
        },
      }),
    });

    return { success: true, response: await response.json(), ok: response.ok };
  } catch (e) {
    return { success: false, response: e.message };
  }
};
