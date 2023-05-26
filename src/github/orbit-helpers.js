import { ORBIT_API_ROOT_URL } from "../constants";
import { _getRepositoryFullName } from "../helpers/widget-helper";
import { configureRequest } from "../oauth-helpers";

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
      const response = await fetch(url, {
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
      const response = await fetch(url, {
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
      const response = await fetch(url, {
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
      const response = await fetch(url, {
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
};

/**
 * Verifies credentials contain the required keys to connect to Orbit
 *
 * @returns Boolean
 */
export function areCredentialsValid(ORBIT_CREDENTIALS) {
  // Workspace is required
  if (!ORBIT_CREDENTIALS.WORKSPACE) {
    return false;
  }

  // Only one of the API token & the OAuth token is required for this to be "valid".
  return !!ORBIT_CREDENTIALS.ACCESS_TOKEN || !!ORBIT_CREDENTIALS.API_TOKEN;
}
