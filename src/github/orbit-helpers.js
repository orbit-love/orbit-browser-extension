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
  const { repositories } = await chrome.storage.sync.get({
    repositories: "",
  });
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
 * Helper object containing methods to call specific API endpoints:
 * - `orbitAPI#getMemberContributions`
 * - `orbitAPI#getMemberActivitiesOnThisRepo`
 */
export const orbitAPI = {
  /**
   * Fetch all of a given member’s public contributions on GitHub,
   * independently of the repo and return relevant metrics
   *
   * @param {*} ORBIT_CREDENTIALS the Orbit credentials
   * @param {*} member the member slug to use (the lowercased GitHub username)
   *
   * @returns {is_a_member, contributions_collection, contributions_total}
   */
  async getMemberContributions(ORBIT_CREDENTIALS, member) {
    try {
      const response = await fetch(
        `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/members/${member}?api_key=${ORBIT_CREDENTIALS.API_TOKEN}`,
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
        contributions_total: data.attributes.contributions_total,
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
        `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/github_user/${username}?api_key=${ORBIT_CREDENTIALS.API_TOKEN}`,
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
        contributions_total: data.attributes.contributions_total,
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
    (data) => data.relationships.repository.data?.id === repositoryId
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
