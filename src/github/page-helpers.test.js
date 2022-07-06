import { getPageType } from "./page-helpers";

beforeEach(() => {
  global.window = Object.create(window);
});

afterEach(() => {
  global.window = null;
});

test("getPageType should return 'ISSUE' for issues pages", () => {
  const pathname = "/hzoo/contributors-on-github/issues/34";
  Object.defineProperty(window, "location", {
    value: {
      pathname,
    },
    writable: true,
  });

  expect(getPageType()).toBe("ISSUE");
});

test("getPageType should return 'PULL_REQUEST' for pull request pages", () => {
  const pathname = "/orbit-love/orbit-app/pull/2459";
  Object.defineProperty(window, "location", {
    value: {
      pathname,
    },
    writable: true,
  });

  expect(getPageType()).toBe("PULL_REQUEST");
});

test("getPageType should return 'DISCUSSIONS' for discussions pages", () => {
  const pathname = "/stimulusreflex/stimulus_reflex/discussions/497";
  Object.defineProperty(window, "location", {
    value: {
      pathname,
    },
    writable: true,
  });

  expect(getPageType()).toBe("DISCUSSION");
});
