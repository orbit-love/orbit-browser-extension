const ORBIT_API_ROOT_URL = "https://app.orbit.love";

function getOrbitCredentials() {
  return {
    API_TOKEN: "<PERSONAL TOKEN>",
    WORKSPACE: "<WORKSPACE NAME>",
  };
}

const orbitAPI = {
  async getMemberContributions(member) {
    const normalizedMember = member.toLowerCase();
    const normalizedWorkspace = getOrbitCredentials().WORKSPACE.toLowerCase();
    const response = await fetch(
      `${ORBIT_API_ROOT_URL}/${normalizedWorkspace}/members/${normalizedMember}?api_key=${
        getOrbitCredentials().API_TOKEN
      }`,
      {
        headers: {
          accept: "application/json",
        },
      }
    );
    const { data } = await response.json();
    return {
      contributions_collection: data.attributes.contributions_collection,
      contributions_total: data.attributes.contributions_total,
    };
  },

  async getMemberActivitiesOnThisRepo(member) {
    const normalizedMember = member.toLowerCase();
    const normalizedWorkspace = getOrbitCredentials().WORKSPACE.toLowerCase();
    const response = await fetch(
      `${ORBIT_API_ROOT_URL}/${normalizedWorkspace}/members/${normalizedMember}/activities?api_key=${
        getOrbitCredentials().API_TOKEN
      }`,
      {
        headers: {
          accept: "application/json",
        },
      }
    );
    const { data, included } = await response.json();
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
