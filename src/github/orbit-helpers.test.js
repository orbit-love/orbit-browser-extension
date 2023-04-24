import testData from "./testData/activities.json";

import {
  _getRepositoryFullName,
  _filterActivitiesByRepo,
  _fetchRepositories,
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

test("_filterActivitiesByRepo should filter activities by repository", () => {
  const activities = testData.data;
  const included = testData.included;
  const repositoryFullName = "theodo/falco";

  expect(activities.length).toBe(3);
  const filteredActivities = _filterActivitiesByRepo(
    activities,
    included,
    repositoryFullName
  );
  expect(filteredActivities.length).toBe(2);
  expect(
    filteredActivities.map(
      (activity) => activity.relationships.repository.data.id
    )
  ).toEqual(["210", "210"]);
});

test("_fetchRepositories should collapse chunked repositories into a single array", async () => {
  const mockChromeStorage = {
    storage: {
      repository_keys: ["test_key_1", "test_key_2"],
      test_key_1: ["repo-1", "repo-2"],
      test_key_2: ["repo-3", "repo-4"],
    },
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

  const repositories = await _fetchRepositories();

  expect(repositories.length).toBe(4);
  expect(repositories).toEqual(["repo-1", "repo-2", "repo-3", "repo-4"]);

  global.chrome = originalChrome;
});

test("_fetchRepositories should support a single array", async () => {
  const mockChromeStorage = {
    storage: {
      repositories: ["repo-1", "repo-2", "repo-3", "repo-4"],
    },
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

  const repositories = await _fetchRepositories();

  expect(repositories.length).toBe(4);
  expect(repositories).toEqual(["repo-1", "repo-2", "repo-3", "repo-4"]);

  global.chrome = originalChrome;
});
