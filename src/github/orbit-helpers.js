import { ORBIT_API_ROOT_URL, ORBIT_HEADERS } from "../constants";

/**
 * Returns an object with values retrieved from Chrome sync storage.
 * Workspace is lowercased to match the API expectations.
 */
export async function getOrbitCredentials() {
  const items = await chrome.storage.sync.get({
    token: "",
    workspace: "",
  });
  return {
    API_TOKEN: items.token,
    WORKSPACE: items.workspace.toLowerCase(),
  };
}

export async function isRepoInOrbitWorkspace() {
  const repositories = await _fetchRepositories();
  return repositories.includes(_getRepositoryFullName());
}

export function getThreshold(number) {
  switch (true) {
    case number <= 10:
      return number;
    case number <= 20:
      return "10+";
    case number <= 50:
      return "20+";
    case number <= 100:
      return "50+";
    case number <= 200:
      return "100+";
    case number <= 500:
      return "200+";
    case number <= 1000:
      return "5000+";
    case Number.isInteger(number):
      return "1000+";
    default:
      console.error(`[Orbit Browser Extension] ${number} is not a number`);
      return "NaN";
  }
}

/**
 * Helper object containing methods to call specific API endlove:
 * - `orbitAPI#getMemberContributions`
 * - `orbitAPI#getMemberActivitiesOnThisRepo`
 */
export const orbitAPI = {
  /**
   * Fetch all of a given member’s public contributions on GitHub,
   * independently of the repo and return relevant metrics
   *
   * @param {*} ORBIT_CREDENTIALS the Orbit credentials
   * @param {*} username the GitHub username
   *
   * @returns {is_a_member, contributions_collection, contributions_total}
   */
  async getMemberContributions(ORBIT_CREDENTIALS, username) {
    try {
      const response = await fetch(
        `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/members/find?source=github&username=${username}&api_key=${ORBIT_CREDENTIALS.API_TOKEN}`,
        {
          headers: {
            ...ORBIT_HEADERS,
          },
        }
      );
      if (!response.ok) {
        return {
          success: false,
          status: response.status,
        };
      }
      const { data } = await response.json();
      if (!data) {
        return {
          success: false,
          status: 404,
        };
      }
      const member = data;
      return {
        success: true,
        status: response.status,
        slug: member.attributes.slug,
        orbit_level: member.attributes.orbit_level,
        reach: member.attributes.reach,
        love: member.attributes.love,
        tag_list: member.attributes.tag_list,
        contributions_total: member.attributes.contributions_total,
      };
    } catch (err) {
      console.error(err);
      return {
        success: false,
      };
    }
  },

  /**
   * Fetch all of a given member’s contributions on GitHub on the current repo
   *
   * @param {*} ORBIT_CREDENTIALS the Orbit credentials
   * @param {*} member the member slug to use (the lowercased GitHub username)
   *
   * @returns {is_a_member, contributions_on_this_repo_total}
   */
  async getMemberActivitiesOnThisRepo(ORBIT_CREDENTIALS, member) {
    try {
      const response = await fetch(
        `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/members/${member}/activities?api_key=${ORBIT_CREDENTIALS.API_TOKEN}`,
        {
          headers: {
            ...ORBIT_HEADERS,
          },
        }
      );
      if (!response.ok) {
        return {
          success: false,
          status: response.status,
        };
      }
      const { data, included } = await response.json();
      const repositoryFullName = _getRepositoryFullName();
      const filteredActivities = _filterActivitiesByRepo(
        data,
        included,
        repositoryFullName
      );
      return {
        success: true,
        status: response.status,
        contributions_on_this_repo_total: filteredActivities.length,
      };
    } catch (err) {
      console.error(err);
      return {
        success: false,
      };
    }
  },
  /**
   * Fetch all of a given GitHub user public contributions on GitHub.
   *
   * @param {*} ORBIT_CREDENTIALS the Orbit credentials
   * @param {*} username the GitHub username
   *
   * @returns {total_issue_contributions, total_pull_request_contributions}
   */
  async getGitHubUserContributions(ORBIT_CREDENTIALS, username) {
    try {
      const response = await fetch(
        `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/identities/github/${username}?api_key=${ORBIT_CREDENTIALS.API_TOKEN}`,
        {
          headers: {
            ...ORBIT_HEADERS,
          },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
        };
      }
      const { data } = await response.json();
      return {
        success: true,
        status: response.status,
        contributions_total: data.attributes.g_contributions_total,
      };
    } catch (err) {
      console.error(err);
      return {
        success: false,
      };
    }
  },
  /**
   * Create a member for the given user in the current workspace
   *
   * @param {*} ORBIT_CREDENTIALS the Orbit credentials
   * @param {*} username the GitHub username
   *
   * @returns {success, status}
   */
  async addMemberToWorkspace(ORBIT_CREDENTIALS, username) {
    try {
      const response = await fetch(
        `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/members?api_key=${ORBIT_CREDENTIALS.API_TOKEN}`,
        {
          method: "POST",
          body: JSON.stringify({
            member: {
              github: username,
            },
          }),
          headers: {
            "Content-Type": "application/json",
            ...ORBIT_HEADERS,
          },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
        };
      }
      return {
        success: true,
        status: response.status,
      };
    } catch (err) {
      console.error(err);
      return {
        success: false,
      };
    }
  },
  /**
   * Adds the current comment as an Orbit content to the member
   *
   * @param {*} ORBIT_CREDENTIALS the Orbit credentials
   * @param {*} member the member slug to add the content to
   *
   * @returns {success, status}
   */
  async addCommentAsContentToMember(
    ORBIT_CREDENTIALS,
    member,
    commentUrl,
    commentPublishedAt
  ) {
    try {
      const response = await fetch(
        `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/members/${member}/activities?api_key=${ORBIT_CREDENTIALS.API_TOKEN}`,
        {
          method: "POST",
          body: JSON.stringify({
            activity_type: "content",
            url: commentUrl,
            occurred_at: commentPublishedAt,
          }),
          headers: {
            "Content-Type": "application/json",
            ...ORBIT_HEADERS,
          },
        }
      );
      if (!response.ok) {
        return {
          success: false,
          status: response.status,
        };
      }
      const { data } = await response.json();
      return {
        success: true,
        id: data.id,
        status: response.status,
      };
    } catch (err) {
      console.error(err);
      return {
        success: false,
      };
    }
  },
};

/**
 * Filters all activities from a member and returns only those
 * that are attached to the given repositoryFullName.
 *
 * @param {*} activities as returned by Orbit API
 * @param {*} included as returned by Orbit API
 * @param {*} repositoryFullName the full name of the current repository
 *
 * @returns a filtered list of activities.
 */
export function _filterActivitiesByRepo(
  activities,
  included,
  repositoryFullName
) {
  /**
   * First, find out the internal repositoryId by filtering the `included`
   * data by type === repository and full_name === repositoryFullName
   */
  const filterIncludedByTypeRepository = (data) => data.type === "repository";
  const filterIncludedByRepositoryFullName = (data) =>
    data.attributes.full_name === repositoryFullName;
  const repositoryId = included
    .filter(filterIncludedByTypeRepository)
    .filter(filterIncludedByRepositoryFullName)[0]?.id;

  /**
   * Then filter the activities by that repositoryId
   */
  return activities.filter(
    (data) => data.relationships.repository?.data?.id === repositoryId
  );
}

/**
 * Returns the current repository full name based on the current URL.
 *
 * window.location.pathname looks like “/orbit-love/orbit-model/pull/3”
 * This would return `orbit-love/orbit-model`
 */
export function _getRepositoryFullName() {
  return `${window.location.pathname.split("/")[1]}/${
    window.location.pathname.split("/")[2]
  }`;
}

/**
 * Fetches chunked repositories from chrome storage
 *
 * @returns Array<String> a 1d array of all repsoitory names, ie ["repo-1", "repo-2"]
 */
export async function _fetchRepositories() {
  const { repository_keys } = await chrome.storage.sync.get("repository_keys");

  // Backwards compatibility - if we do not have repository keys,
  //  default to how we used to store them
  if (repository_keys === undefined) {
    const { repositories } = await chrome.storage.sync.get("repositories");

    return repositories;
  }

  // Map the repositories to an array of "fetch from storage" promises
  const promises = repository_keys.map((key) => chrome.storage.sync.get(key));

  // Wait for all promises to resolve
  // This returns repositories in the following structure:
  // [
  //  { sally:repositories:1: ["repo-1", "repo-2", ...] },
  //  { sally:repositories:2: ["repo-101", "repo-102",...] },
  // ]
  const repositoryObjects = await Promise.all(promises);

  // Reduce repositories to 1d array, disregarding the keys
  return repositoryObjects
    .flatMap((repository_object) => Object.values(repository_object))
    .flat();
}
