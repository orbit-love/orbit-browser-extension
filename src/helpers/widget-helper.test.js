import { _refreshAuthTokens, _isOAuthTokenExpired } from "../oauth-helpers";
import { mockChrome } from "../test-helpers";
import {
  _getRepositoryFullName,
  _fetchRepositories,
  formatDate,
  getThreshold,
  isRepoInOrbitWorkspace,
} from "./widget-helper";

it("formatDate formats date correctly", () => {
  const stringDate = "2023-05-19T21:37:51.000Z";
  expect(formatDate(stringDate)).toEqual("May 19, 2023");
});

describe("#getThreshold", () => {
  expect(getThreshold(9)).toEqual(9);
  expect(getThreshold(19)).toEqual("10+");
  expect(getThreshold(49)).toEqual("20+");
  expect(getThreshold(99)).toEqual("50+");
  expect(getThreshold(199)).toEqual("100+");
  expect(getThreshold(999)).toEqual("200+");
  expect(getThreshold(4999)).toEqual("1000+");
  expect(getThreshold(5001)).toEqual("5000+");
  expect(getThreshold("Test error")).toEqual("NaN");
});

describe("#isRepoInOrbitWorkspace", () => {
  // Set current repo
  global.window = Object.create(window);
  const pathname = "/hzoo/contributors-on-github/issues/34";
  Object.defineProperty(window, "location", {
    value: {
      pathname,
    },
  });

  it("returns true if repo exists in chrome storage", async () => {
    // Add that repo to storage
    const originalChrome = mockChrome({
      repository_keys: ["test_key_1"],
      test_key_1: ["hzoo/contributors-on-github", "repo-2"],
    });

    const isRepoInWorkspace = await isRepoInOrbitWorkspace();

    expect(isRepoInWorkspace).toBe(true);

    global.chrome = originalChrome;
  });

  it("returns false if repo does not exist in chrome storage", async () => {
    // Add that repo tp storage
    const originalChrome = mockChrome({
      repository_keys: ["test_key_1"],
      test_key_1: ["repo-1", "repo-2"],
    });

    const isRepoInWorkspace = await isRepoInOrbitWorkspace();

    expect(isRepoInWorkspace).toBe(false);

    global.chrome = originalChrome;
  });
});

it("_getRepositoryFullName should return the full name of the repository based on window.location.pathname", () => {
  global.window = Object.create(window);
  const pathname = "/hzoo/contributors-on-github/issues/34";
  Object.defineProperty(window, "location", {
    value: {
      pathname,
    },
  });
  expect(_getRepositoryFullName()).toBe("hzoo/contributors-on-github");
});

describe("#_fetchRepositories", () => {
  it("collapses chunked repositories into a single array", async () => {
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

  it("supports a single array", async () => {
    const originalChrome = mockChrome({
      repositories: ["repo-1", "repo-2", "repo-3", "repo-4"],
    });

    const repositories = await _fetchRepositories();

    expect(repositories.length).toBe(4);
    expect(repositories).toEqual(["repo-1", "repo-2", "repo-3", "repo-4"]);

    global.chrome = originalChrome;
  });
});
