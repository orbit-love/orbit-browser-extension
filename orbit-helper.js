const ORBIT_API_ROOT_URL = "https://orbit.eu.ngrok.io";

async function getOrbitCredentials(credentialsHolder) {
  const items = await chrome.storage.sync.get({
    token: "",
    workspace: "",
  });
  return {
    API_TOKEN: items.token,
    WORKSPACE: items.workspace,
  };
}

const orbitAPI = {
  async getMemberContributions(ORBIT_CREDENTIALS, member) {
    const normalizedMember = member.toLowerCase();
    const normalizedWorkspace = ORBIT_CREDENTIALS.WORKSPACE.toLowerCase();
    const response = await fetch(
      `${ORBIT_API_ROOT_URL}/${normalizedWorkspace}/members/${normalizedMember}?api_key=${ORBIT_CREDENTIALS.API_TOKEN}`,
      {
        headers: {
          accept: "application/json",
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

  async getMemberActivitiesOnThisRepo(ORBIT_CREDENTIALS, member) {
    const normalizedMember = member.toLowerCase();
    const normalizedWorkspace = ORBIT_CREDENTIALS.WORKSPACE.toLowerCase();
    const response = await fetch(
      `${ORBIT_API_ROOT_URL}/${normalizedWorkspace}/members/${normalizedMember}/activities?api_key=${ORBIT_CREDENTIALS.API_TOKEN}`,
      {
        headers: {
          accept: "application/json",
        },
      }
    );
    const { data, included } = await response.json();
    if (!data) {
      return {
        contributions_on_this_repo_total: 0,
      };
    }
    const repositoryFullName = `${window.location.pathname.split("/")[1]}/${
      window.location.pathname.split("/")[2]
    }`;
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

function filterActivitiesByRepo(activities, included, repositoryFullName) {
  const filterIncludedByTypeRepository = (data) => data.type === "repository";
  const filterIncludedByRepositoryFullName = (data) =>
    data.attributes.full_name === repositoryFullName;
  const repositoryId = included
    .filter(filterIncludedByTypeRepository)
    .filter(filterIncludedByRepositoryFullName)[0].id;

  return activities.filter(
    (data) => data.relationships.repository.data?.id === repositoryId
  );
}
