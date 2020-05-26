/**
 * The URL of the API root.
 * To be changed to `https://orbit.eu.ngrok.io` for local development.
 */
export const ORBIT_API_ROOT_URL = "https://orbit-nico.eu.ngrok.io";

/**
 * Headers common to all API calls.
 */
const ORBIT_HEADERS = {
  accept: "application/json",
};

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
    const response = await fetch(
      `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/members/${member}?api_key=${ORBIT_CREDENTIALS.API_TOKEN}`,
      {
        headers: {
          ...ORBIT_HEADERS,
        },
      }
    );
    const { data } = await response.json();
    if (!data) {
      return {
        is_a_member: false,
        contributions_collection: 0,
        contributions_total: 0,
      };
    }
    return {
      is_a_member: true,
      contributions_collection: data.attributes.contributions_collection,
      contributions_total: data.attributes.contributions_total,
    };
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
    const response = await fetch(
      `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/members/${member}/activities?api_key=${ORBIT_CREDENTIALS.API_TOKEN}`,
      {
        headers: {
          ...ORBIT_HEADERS,
        },
      }
    );
    const { data, included } = await response.json();
    if (!data) {
      return {
        contributions_on_this_repo_total: 0,
      };
    }
    const repositoryFullName = getRepositoryFullName();
    const filteredActivities = filterActivitiesByRepo(
      data,
      included,
      repositoryFullName
    );
    return {
      contributions_on_this_repo_total: filteredActivities.length,
    };
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
function filterActivitiesByRepo(activities, included, repositoryFullName) {
  /**
   * First, find out the internal repositoryId by filtering the `included`
   * data by type === repository and full_name === repositoryFullName
   */
  const filterIncludedByTypeRepository = (data) => data.type === "repository";
  const filterIncludedByRepositoryFullName = (data) =>
    data.attributes.full_name === repositoryFullName;
  const repositoryId = included
    .filter(filterIncludedByTypeRepository)
    .filter(filterIncludedByRepositoryFullName)[0].id;

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
function getRepositoryFullName() {
  return `${window.location.pathname.split("/")[1]}/${
    window.location.pathname.split("/")[2]
  }`;
}
