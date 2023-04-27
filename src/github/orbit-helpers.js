import { ORBIT_API_ROOT_URL } from "../constants";
import { configureRequest } from "../oauth_helpers";
/**
 * Returns an object with values retrieved from Chrome sync storage.
 * Workspace is lowercased to match the API expectations.
 */
export async function getOrbitCredentials() {
  const items = await chrome.storage.sync.get({
    token: "",
    workspace: "",
    accessToken: "",
  });
  return {
    API_TOKEN: items.token,
    WORKSPACE: items.workspace.toLowerCase(),
    ACCESS_TOKEN: items.accessToken,
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
    const url = new URL(
      `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/members/find`
    );

    const { params, headers } = configureRequest(ORBIT_CREDENTIALS, {
      source: "github",
      username: username,
    });

    url.search = params.toString();

    try {
      const response = await fetch(url.toString(), {
        headers: headers,
      });
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
    const repositoryFullName = _getRepositoryFullName();
    const url = new URL(
      `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/activities`
    );

    const { params, headers } = configureRequest(ORBIT_CREDENTIALS, {
      member_id: member,
      properties: `github_repository:${repositoryFullName}`,
      items: 25,
    });

    url.search = params.toString();

    try {
      const response = await fetch(url.toString(), {
        headers: headers,
      });
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
        contributions_on_this_repo_total: data.length,
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
    const url = new URL(
      `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/identities/github/${username}`
    );

    const { params, headers } = configureRequest(ORBIT_CREDENTIALS);
    url.search = params.toString();

    try {
      const response = await fetch(url.toString(), {
        headers: headers,
      });

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
    const url = new URL(
      `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/members`
    );

    const { params, headers } = configureRequest(
      ORBIT_CREDENTIALS,
      {},
      { "Content-Type": "application/json" }
    );

    url.search = params.toString();

    try {
      const response = await fetch(url.toString(), {
        headers: headers,
        method: "POST",
        body: JSON.stringify({
          member: {
            github: username,
          },
        }),
      });

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
    const url = new URL(
      `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/members/${member}/activities`
    );

    const { params, headers } = configureRequest(
      ORBIT_CREDENTIALS,
      {},
      { "Content-Type": "application/json" }
    );

    url.search = params.toString();

    try {
      const response = await fetch(url.toString(), {
        headers: headers,
        method: "POST",
        body: JSON.stringify({
          activity_type: "content",
          url: commentUrl,
          occurred_at: commentPublishedAt,
        }),
      });
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
 * Verifies credentials contain the required keys to connect to Orbit
 *
 * @returns Boolean
 */
export function areCredentialsValid(ORBIT_CREDENTIALS) {
  // Workspace is required
  if (ORBIT_CREDENTIALS.WORKSPACE === "") {
    return false;
  }

  // Only one of the API token & the OAuth token is required for this to be "valid".
  return !!ORBIT_CREDENTIALS.ACCESS_TOKEN || !!ORBIT_CREDENTIALS.API_TOKEN;
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
