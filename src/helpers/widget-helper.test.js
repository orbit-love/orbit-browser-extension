import { _refreshAuthTokens, _isOAuthTokenExpired } from "../oauth-helpers";
import { mockChrome } from "../test-helpers";
import {
  getRepositoryFullName,
  fetchRepositories,
  formatDate,
  getThreshold,
  isRepoInOrbitWorkspace,
  buildMemberData,
} from "./widget-helper";

describe("#buildMemberData", () => {
  const member = {
    attributes: {
      name: "John Doe",
      title: "Software Engineer",
      slug: "john_doe",
      teammate: false,
      orbit_level: 1,
      last_activity_occurred_at: "2023-06-15",
      tags: ["tag1", "tag2"],
    },
    relationships: {
      identities: {
        data: [
          { id: "1", type: "identity" },
          { id: "2", type: "identity" },
        ],
      },
      organizations: {
        data: [{ id: "1", type: "organization" }],
      },
    },
  };

  const included = [
    {
      id: "1",
      type: "identity",
      attributes: {
        source: "github",
        username: "johndoe",
        url: "https://github.com/johndoe",
      },
    },
    {
      id: "2",
      type: "identity",
      attributes: {
        source: "twitter",
        username: "johndoe",
        url: "https://twitter.com/johndoe",
      },
    },
    {
      id: "1",
      type: "organization",
      attributes: {
        name: "orbit",
        url: "https://orbit.love",
      },
    },
  ];

  it("correctly formats member object", () => {
    expect(buildMemberData(member, included)).toEqual({
      name: "John Doe",
      jobTitle: "Software Engineer",
      slug: "john_doe",
      teammate: false,
      orbitLevel: 1,
      organization: { name: "orbit", url: "https://orbit.love" },
      lastActivityOccurredAt: "2023-06-15",
      tags: ["tag1", "tag2"],
      identities: [
        {
          source: "github",
          username: "johndoe",
          url: "https://github.com/johndoe",
        },
        {
          source: "twitter",
          username: "johndoe",
          url: "https://twitter.com/johndoe",
        },
      ],
    });
  });
});

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

it("getRepositoryFullName should return the full name of the repository based on window.location.pathname", () => {
  global.window = Object.create(window);
  const pathname = "/hzoo/contributors-on-github/issues/34";
  Object.defineProperty(window, "location", {
    value: {
      pathname,
    },
  });
  expect(getRepositoryFullName()).toBe("hzoo/contributors-on-github");
});

describe("#fetchRepositories", () => {
  it("collapses chunked repositories into a single array", async () => {
    const originalChrome = mockChrome({
      repository_keys: ["test_key_1", "test_key_2"],
      test_key_1: ["repo-1", "repo-2"],
      test_key_2: ["repo-3", "repo-4"],
    });

    const repositories = await fetchRepositories();

    expect(repositories.length).toBe(4);
    expect(repositories).toEqual(["repo-1", "repo-2", "repo-3", "repo-4"]);

    global.chrome = originalChrome;
  });

  it("supports a single array", async () => {
    const originalChrome = mockChrome({
      repositories: ["repo-1", "repo-2", "repo-3", "repo-4"],
    });

    const repositories = await fetchRepositories();

    expect(repositories.length).toBe(4);
    expect(repositories).toEqual(["repo-1", "repo-2", "repo-3", "repo-4"]);

    global.chrome = originalChrome;
  });
});
