import { _refreshAuthTokens, _isOAuthTokenExpired } from "../oauth-helpers";
import { mockChrome } from "../test-helpers";
import { _getRepositoryFullName, _fetchRepositories } from "./widget-helper";

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
  const originalChrome = mockChrome({
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
  const originalChrome = mockChrome({
    repositories: ["repo-1", "repo-2", "repo-3", "repo-4"],
  });

  const repositories = await _fetchRepositories();

  expect(repositories.length).toBe(4);
  expect(repositories).toEqual(["repo-1", "repo-2", "repo-3", "repo-4"]);

  global.chrome = originalChrome;
});
