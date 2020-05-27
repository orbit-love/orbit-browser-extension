import testData from "./testData/activities.json";

import {
  _getRepositoryFullName,
  _filterActivitiesByRepo,
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
