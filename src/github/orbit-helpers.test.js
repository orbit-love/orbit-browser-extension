import {
  _getRepositoryFullName,
  _fetchRepositories,
  areCredentialsValid,
} from "./orbit-helpers";

/**
 * Mocks the chrome storage object & getter
 * **Important**: At the end of your test, restore the original behaviour
 * by setting global.chrome to the object returned by this function.
 *
 * IE
 * const originalChrome = mockChromeStorage({ key: "123" })
 * ... Your tests
 * global.chrome = originalChrome
 *
 * @param {Object} objectToStore object to put in mock storage
 *
 * @returns {originalChrome} to restore behaviour to global.chrome
 */
const mockChromeStorage = (objectToStore) => {
  const mockChromeStorage = {
    storage: objectToStore,
    get: function (key) {
      const result = {};

      result[key] = this.storage[key];

      return result;
    },
  };

  let originalChrome = global.chrome;

  global.chrome = {
    storage: {
      sync: mockChromeStorage,
    },
  };

  return originalChrome;
};

test("getOrbitCredentials should correctly configure orbit credentials", () => {
  const originalChrome = mockChromeStorage({
    token: "123",
    workspace: "workspace",
  });

  global.chrome = originalChrome;
});

test("getOrbitCredentials should refresh auth token if it has expired", () => {});

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
