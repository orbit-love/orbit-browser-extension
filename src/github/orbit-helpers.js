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
    const repositoryFullName = _getRepositoryFullName();
    try {
      const response = await fetch(
        `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/activities?member_id=${member}&properties=github_repository:${repositoryFullName}&items=25&api_key=${ORBIT_CREDENTIALS.API_TOKEN}`,
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
