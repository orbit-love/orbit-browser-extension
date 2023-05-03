import { _refreshAuthTokens, _isOAuthTokenExpired } from "../oauth_helpers";
import { mockChromeStorage } from "../test-helpers";
import {
  _getRepositoryFullName,
  _fetchRepositories,
  areCredentialsValid,
  getOrbitCredentials,
} from "./orbit-helpers";

jest.mock("../oauth_helpers");

test("getOrbitCredentials should correctly configure orbit credentials object", async () => {
  const originalChrome = mockChromeStorage({
    token: "123",
    workspace: "workspace",
  });

  const ORBIT_CREDENTIALS = await getOrbitCredentials();

  expect(ORBIT_CREDENTIALS).toEqual({
    API_TOKEN: "123",
    WORKSPACE: "workspace",
    ACCESS_TOKEN: "",
    REFRESH_TOKEN: "",
    EXPIRES_AT: 0,
  });

  global.chrome = originalChrome;
});

test("getOrbitCredentials should refresh auth token if it has expired", async () => {
  const originalChrome = mockChromeStorage({
    workspace: "workspace",
    accessToken: "expired_access_token",
    refreshToken: "valid_refresh_token",
    expiresAt: -1000,
  });

  _refreshAuthTokens.mockResolvedValue({
    accessToken: "refreshed_access_token",
    refreshToken: "refreshed_refresh_token",
    expiresAt: 1234,
  });

  _isOAuthTokenExpired.mockReturnValue(true);

  const ORBIT_CREDENTIALS = await getOrbitCredentials();

  expect(ORBIT_CREDENTIALS).toEqual({
    API_TOKEN: "",
    WORKSPACE: "workspace",
    ACCESS_TOKEN: "refreshed_access_token",
    REFRESH_TOKEN: "refreshed_refresh_token",
    EXPIRES_AT: 1234,
  });

  global.chrome = originalChrome;
});

test("_getRepositoryFullName should return the full name of the repository based on window.location.pathname", () => {
  global.window = Object.create(window);
  const pathname = "/hzoo/contributors-on-github/issues/34";
  Object.defineProperty(window, "location", {
    value: {
      pathname,
    },
  });
  expect(_getRepositoryFullName()).toBe("hzoo/contributors-on-github");
});

test("_fetchRepositories should collapse chunked repositories into a single array", async () => {
  const originalChrome = mockChromeStorage({
    repository_keys: ["test_key_1", "test_key_2"],
    test_key_1: ["repo-1", "repo-2"],
    test_key_2: ["repo-3", "repo-4"],
  });

  const repositories = await _fetchRepositories();

  expect(repositories.length).toBe(4);
  expect(repositories).toEqual(["repo-1", "repo-2", "repo-3", "repo-4"]);

  global.chrome = originalChrome;
});

test("_fetchRepositories should support a single array", async () => {
  const originalChrome = mockChromeStorage({
    repositories: ["repo-1", "repo-2", "repo-3", "repo-4"],
  });

  const repositories = await _fetchRepositories();

  expect(repositories.length).toBe(4);
  expect(repositories).toEqual(["repo-1", "repo-2", "repo-3", "repo-4"]);

  global.chrome = originalChrome;
});

test("areCredentialValid returns false if no workspace present", async () => {
  const ORBIT_CREDENTIALS = {
    WORKSPACE: "",
    API_TOKEN: "present",
    ACCESS_TOKEN: "present",
  };

  expect(areCredentialsValid(ORBIT_CREDENTIALS)).toBe(false);
});

test("areCredentialValid returns true if workspace & API token is present", async () => {
  const ORBIT_CREDENTIALS = {
    WORKSPACE: "present",
    API_TOKEN: "present",
    ACCESS_TOKEN: "",
  };

  expect(areCredentialsValid(ORBIT_CREDENTIALS)).toBe(true);
});

test("areCredentialValid returns true if workspace & OAuth token is present", async () => {
  const ORBIT_CREDENTIALS = {
    WORKSPACE: "present",
    API_TOKEN: "",
    ACCESS_TOKEN: "present",
  };

  expect(areCredentialsValid(ORBIT_CREDENTIALS)).toBe(true);
});
