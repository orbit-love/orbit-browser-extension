import { _refreshAuthTokens, _isOAuthTokenExpired } from "../oauth-helpers";
import { mockChromeStorage } from "../test-helpers";
import {
  _getRepositoryFullName,
  _fetchRepositories,
  areCredentialsValid,
} from "./orbit-helpers";

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
