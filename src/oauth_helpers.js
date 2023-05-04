import {
  ORBIT_HEADERS,
  OAUTH_CLIENT_ID,
  ORBIT_API_ROOT_URL,
} from "./constants";

/**
 * Returns an object with values retrieved from Chrome sync storage.
 * Workspace is lowercased to match the API expectations.
 * Will attempt to refresh auth token if it is expired
 *
 * @returns {Object} API_TOKEN WORKSPACE ACCESS_TOKEN REFRESH_TOKEN EXPIRES_AT
 */
export async function getOrbitCredentials() {
  const items = await chrome.storage.sync.get({
    token: "",
    workspace: "",
    authentication: {
      accessToken: "",
      refreshToken: "",
      expiresAt: 0,
    },
  });

  if (
    items.authentication.expiresAt != 0 &&
    _isOAuthTokenExpired(items.authentication.expiresAt)
  ) {
    const refreshedCredentials = await _refreshAuthTokens(
      items.authentication.refreshToken
    );
    return {
      API_TOKEN: items.token,
      WORKSPACE: items.workspace.toLowerCase(),
      ACCESS_TOKEN: refreshedCredentials.accessToken,
      REFRESH_TOKEN: refreshedCredentials.refreshToken,
      EXPIRES_AT: refreshedCredentials.expiresAt,
    };
  }

  return {
    API_TOKEN: items.token,
    WORKSPACE: items.workspace.toLowerCase(),
    ACCESS_TOKEN: items.authentication.accessToken,
    REFRESH_TOKEN: items.authentication.refreshToken,
    EXPIRES_AT: items.authentication.expiresAt,
  };
}

/**
 * Sets authentication for a request
 * If OAuth is present, prefers that
 *
 * @param {Object} ORBIT_CREDENTIALS the Orbit credentials
 * @param {Object} params any additional params to include in the request
 * @param {Object} headers any additional headers to include in the request
 *
 * @returns {Object}
 * @returns {URLSearchParams}
 */
export function configureRequest(ORBIT_CREDENTIALS, params, headers = {}) {
  // If the OAuth token is present, do not include the API key as a param
  if (!!ORBIT_CREDENTIALS.ACCESS_TOKEN) {
    return {
      headers: {
        ...headers,
        ...ORBIT_HEADERS,
        Authorization: `Bearer ${ORBIT_CREDENTIALS.ACCESS_TOKEN}`,
      },
      params: new URLSearchParams(params),
    };
  }

  // Otherwise, fall back to the API key
  return {
    headers: {
      ...headers,
      ...ORBIT_HEADERS,
    },
    params: new URLSearchParams({
      ...params,
      api_key: ORBIT_CREDENTIALS.API_TOKEN,
    }),
  };
}

/**
 * @param {Object} expirationTime from chrome storage
 *
 * @returns {Boolean} true if token expired before the current time
 */
export function _isOAuthTokenExpired(expirationTime) {
  // Get the current time in seconds
  const currentTime = Math.floor(Date.now() / 1000);

  // Check if the token has expired
  return currentTime > expirationTime;
}

/**
 * Sends a request to refresh authentication.
 * Updates accessToken, refreshToken, and expiresAt in chrome storage.
 *
 * @param {Object} refreshToken from chrome storage
 *
 * @returns {Object} refreshed tokens for accessToken, refreshToken, expiresAt
 */
export async function _refreshAuthTokens(refreshToken) {
  const url = new URL(`${ORBIT_API_ROOT_URL}/oauth/token`);
  let params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: OAUTH_CLIENT_ID,
    refresh_token: refreshToken,
  });

  url.search = params.toString();

  try {
    const response = await fetch(url, {
      method: "POST",
    });

    const { access_token, refresh_token, expires_in } = await response.json();

    // Calculate timestamp when OAuth token expires - current time + it's expires_in timestamp
    const expiresAt = Math.floor(Date.now() / 1000) + expires_in;

    const items = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: expiresAt,
    };

    chrome.storage.sync.set({ authentication: items });

    return items;
  } catch (err) {
    console.error(err);

    // If the request fails (for example if the refresh token has expired),
    // remove the OAuth credentials from storage. This will let the user
    // fall back on their API token if present, or ask them to reauthenticate.
    const items = {
      accessToken: "",
      refreshToken: "",
      expiresAt: -1,
    };

    chrome.storage.sync.set({ authentication: items });

    return items;
  }
}

/**
 * Parses the query parameters from the search portion of a URL and returns them as an object.
 * @param {URL} url - The URL to parse.
 * @returns {Object} An object containing the parsed query parameters.
 * The keys in the object are the parameter names, and the values are either strings or arrays of strings.
 * If a parameter appears multiple times, its values will be combined into an array.
 * If the URL has no search portion, an empty object is returned.
 */
export function fetchQueryParams(stringUrl) {
  try {
    const url = new URL(stringUrl);
    const searchParams = new URLSearchParams(url.search);
    const queryParams = {};

    for (const [key, value] of searchParams) {
      // If param is new, add it to the object to return
      if (!queryParams.hasOwnProperty(key)) {
        queryParams[key] = value;
        // If existing value is an array, append new value to it
      } else if (Array.isArray(queryParams[key])) {
        queryParams[key].push(value);
        // If existing value is not an array, ocnvert it to an array & add new value
      } else {
        queryParams[key] = [queryParams[key], value];
      }
    }

    return queryParams;
  } catch (err) {
    console.error(err);
    return {};
  }
}

/**
 * Generates a code_verifier
 * > a random string called code_verifier is generated using the characters: [A-Z], [a-z], [0-9], "-", ".",
 * > "_" and "~", with a minimum length of 43 characters and a maximum length of 128 characters
 * https://doorkeeper.gitbook.io/guides/ruby-on-rails/pkce-flow#how-can-pkce-prevent-this
 */
export function generateCodeVerifier() {
  // Initialise empty array of recommended length
  const codeVerifierLength = 43;
  const codeVerifier = new Uint8Array(codeVerifierLength);

  // Fill codeVerifier array with random values
  window.crypto.getRandomValues(codeVerifier);

  return _prepareArrayForEncoding(codeVerifier).replace(/=/g, "");
}

/** Generates a code challenge
 * > With code_challenge_method "S256" the code_challenge is the SHA256 Hash value of the code_verifier url safe base64 encoded (without trailing "=")
 * https://doorkeeper.gitbook.io/guides/ruby-on-rails/pkce-flow#how-can-pkce-prevent-this
 */
export async function generateCodeChallenge(codeVerifier) {
  const msgUint8 = new TextEncoder().encode(codeVerifier); // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
  return encodeURI(_prepareArrayForEncoding(hashBuffer).split("=")[0]);
}

// Removes illegal characters from PKCE verification strings
function _prepareArrayForEncoding(unsignedIntArray) {
  return window
    .btoa(String.fromCharCode(...new Uint8Array(unsignedIntArray)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}
