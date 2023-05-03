import { ORBIT_HEADERS } from "./constants";
import {
  configureRequest,
  fetchQueryParams,
  isOAuthTokenExpired,
  refreshAuthTokens,
} from "./oauth_helpers";
import { mockChromeStorage, mockOrbitAPICall } from "./test-helpers";

test("configureRequest should use the OAuth token and not the API key if it is present", async () => {
  const ORBIT_CREDENTIALS = {
    ACCESS_TOKEN: "123",
  };

  const testParams = {
    additionalParam: "789",
  };

  const testHeaders = {
    additionalHeader: "456",
  };

  const { headers, params } = configureRequest(
    ORBIT_CREDENTIALS,
    testParams,
    testHeaders
  );

  expect(headers).toEqual({
    ...ORBIT_HEADERS,
    ...testHeaders,
    Authorization: "Bearer 123",
  });

  expect(params.toString()).toMatch("additionalParam=789");
});

test("configureRequest should use the API key if OAuth token is not present", async () => {
  const ORBIT_CREDENTIALS = {
    API_TOKEN: "123",
  };

  const testParams = {
    additionalParam: "789",
  };

  const testHeaders = {
    additionalHeader: "456",
  };

  const { headers, params } = configureRequest(
    ORBIT_CREDENTIALS,
    testParams,
    testHeaders
  );

  expect(headers).toEqual({
    ...ORBIT_HEADERS,
    ...testHeaders,
  });

  expect(params.toString()).toMatch("additionalParam=789");
  expect(params.toString()).toMatch("api_key=123");
});

test("isOAuthTokenExpired returns true if token expired before current time", () => {
  expect(isOAuthTokenExpired(1)).toEqual(true);
});

test("isOAuthTokenExpired returns false if token is still valid", () => {
  const theFuture = Math.floor(Date.now() / 1000) + 10000;
  expect(isOAuthTokenExpired(theFuture)).toEqual(false);
});

test("refreshAuthTokens requests refreshed tokens, sets them in storage, and returns them", async () => {
  const originalChrome = mockChromeStorage({
    workspace: "workspace",
    authentication: {
      accessToken: "expired_access_token",
      refreshToken: "valid_refresh_token",
      expiresAt: -1000,
    },
  });

  global.fetch = jest
    .fn()
    // mocks /oauth/token
    .mockImplementationOnce(
      mockOrbitAPICall({
        access_token: "refreshed_access_token",
        refresh_token: "refreshed_refresh_token",
        expires_in: 7200,
      })
    );

  expect(chrome.storage.sync.get()).toEqual({
    workspace: "workspace",
    authentication: {
      accessToken: "expired_access_token",
      refreshToken: "valid_refresh_token",
      expiresAt: -1000,
    },
  });

  const refreshed_tokens = await refreshAuthTokens("valid_refresh_token");

  expect(refreshed_tokens).toEqual({
    accessToken: "refreshed_access_token",
    refreshToken: "refreshed_refresh_token",
    expiresAt: expect.any(Number),
  });

  expect(chrome.storage.sync.get()).toEqual({
    workspace: "workspace",
    authentication: {
      accessToken: "refreshed_access_token",
      refreshToken: "refreshed_refresh_token",
      expiresAt: expect.any(Number),
    },
  });

  global.chrome = originalChrome;
});

test("refreshAuthTokens unsets tokens if the request fails, for example if the refresh token is expired", async () => {
  const originalChrome = mockChromeStorage({
    workspace: "workspace",
    authentication: {
      accessToken: "expired_access_token",
      refreshToken: "expired_refresh_token",
      expiresAt: 1,
    },
  });

  global.fetch = jest
    .fn()
    // mocks /oauth/token
    .mockRejectedValueOnce(
      "Test error - if you see this in the test runs it's okay :D"
    );

  expect(chrome.storage.sync.get()).toEqual({
    workspace: "workspace",
    authentication: {
      accessToken: "expired_access_token",
      refreshToken: "expired_refresh_token",
      expiresAt: 1,
    },
  });

  const refreshed_tokens = await refreshAuthTokens("expired_refresh_token");

  expect(refreshed_tokens).toEqual({
    accessToken: "",
    refreshToken: "",
    expiresAt: -1,
  });

  expect(chrome.storage.sync.get()).toEqual({
    workspace: "workspace",
    authentication: {
      accessToken: "",
      refreshToken: "",
      expiresAt: -1,
    },
  });

  global.chrome = originalChrome;
});

test("fetchQueryParams returns empty object if no params found", () => {
  const url = "https://www.example.com";

  expect(fetchQueryParams(url)).toEqual({});
});

test("fetchQueryParams returns object containing query params", () => {
  const url =
    "https://www.example.com?stringParam=123&arrayParam=1&arrayParam=2";

  expect(fetchQueryParams(url)).toEqual({
    stringParam: "123",
    arrayParam: ["1", "2"],
  });
});
