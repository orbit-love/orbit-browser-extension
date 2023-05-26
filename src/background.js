import "chrome-extension-async";
import { ORBIT_API_ROOT_URL, OAUTH_CLIENT_ID } from "./constants";
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
 *
 * @returns {success, response, ok}
 */
const loadMemberData = async ({ username, platform }) => {
  const ORBIT_CREDENTIALS = await getOrbitCredentials(
    (refreshCallback = refreshOAuthToken)
  );
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
      response: {
        workspace: ORBIT_CREDENTIALS.WORKSPACE,
        ...(await response.json()),
      },
      status: response.status,
    };
  } catch (e) {
    return { success: false, response: e.message, status: 500 };
  }
};

/**
 * Fetch "additionalData" from Orbit.
 * Currently, only supports GitHub so exit out for other platforms;
 * For GitHub, we need to make two requests:
 * 1. To fetch the users total number of contributions on GH
 * 2. If the current repo is in the user's workspace, fetch the number of contributions they've made for this repo
 *
 * @param {String} username from widget
 * @param {String} platform from widget
 * @param {String} repositoryFullName ie orbit-love/orbit-browser-extension
 * @param {String} member slug from API
 * @param {Boolean} isRepoInWorkspace from widget-helper#isWidgetInOrbitWorkspace
 *
 * @returns {success, response}
 */
const loadAdditionalData = async ({
  username,
  platform,
  repositoryFullName,
  member,
  isRepoInWorkspace,
}) => {
  if (platform !== "github") return;

  const ORBIT_CREDENTIALS = await getOrbitCredentials(
    (refreshCallback = refreshOAuthToken)
  );

  // For external repos, just send the one request
  if (!isRepoInWorkspace) {
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

      return {
        success: true,
        response: {
          contributions_total: data.attributes.g_contributions_total,
        },
      };
    } catch (err) {
      return {
        success: false,
        response: err.message,
      };
    }
  }

  // For workspaces we recognise, send additional request
  const allContributionsUrl = new URL(
    `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/identities/github/${username}`
  );

  const repoContributionsUrl = new URL(
    `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/activities`
  );

  // These params aren't needed for the first request, but don't do any harm being included.
  const { params, headers } = configureRequest(ORBIT_CREDENTIALS, {
    member_id: member,
    properties: `github_repository:${repositoryFullName}`,
    items: 25,
  });

  allContributionsUrl.search = params.toString();
  repoContributionsUrl.search = params.toString();

  try {
    // Fetch & read stream for both requests
    const responses = await Promise.all([
      fetch(allContributionsUrl, { headers: headers }).then((response) =>
        response.json()
      ),
      fetch(repoContributionsUrl, { headers: headers }).then((response) =>
        response.json()
      ),
    ]);

    const [allContributionsData, repoContributionsData] = responses;

    return {
      success: true,
      response: {
        contributions_total:
          allContributionsData.data.attributes.g_contributions_total,
        contributions_on_this_repo_total: repoContributionsData.data.length,
      },
    };
  } catch (err) {
    return {
      success: false,
      response: err.message,
    };
  }
};

/**
 * Add a member to Orbit
 *
 * @param {String} username from widget
 * @param {Object} ORBIT_CREDENTIALS fetched from storage
 *
 * @returns {success, response, ok}
 */
const addMemberToWorkspace = async ({ username }) => {
  const ORBIT_CREDENTIALS = await getOrbitCredentials(
    (refreshCallback = refreshOAuthToken)
  );
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
