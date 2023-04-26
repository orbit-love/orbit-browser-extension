/**
 * The URL of the API root.
 * To be changed to `https://orbit.eu.ngrok.io` for local development.
 */
export const ORBIT_API_ROOT_URL = "https://app.orbit.love";

/**
 * Client ID of the OAUTH application generated in Orbit app
 */
export const OAUTH_CLIENT_ID = "xxx";

/**
 * Headers common to all API calls.
 */
export const ORBIT_HEADERS = {
  accept: "application/json",
};

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
