import { ORBIT_HEADERS, OAUTH_CLIENT_ID } from "./constants";

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
export function isOAuthTokenExpired(expirationTime) {
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
export async function refreshAuthTokens(refreshToken) {
  const url = new URL("http://localhost:3000/oauth/token");
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

    chrome.storage.sync.set(items);

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

    chrome.storage.sync.set(items);

    return items;
  }
}
