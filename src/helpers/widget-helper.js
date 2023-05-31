/**
 * Builds object of member data from the Orbit API response
 *
 * @param {Object} member from API
 * @param {Object} included from API
 *
 * @returns {Object} name, jobTitle, slug, teammate, orbitLevel, organization, lastActivityOccurredAt, tags, identities
 */
export function buildMemberData(member, included) {
  const identities = member.relationships.identities.data.map(
    ({ id, type }) =>
      included.find(
        ({ id: included_id, type: included_type }) =>
          id === included_id && type === included_type
      )?.attributes
  );

  const organizations = member.relationships.organizations.data.map(
    ({ id, type }) =>
      included.find(
        ({ id: included_id, type: included_type }) =>
          id === included_id && type === included_type
      )?.attributes
  );

  const organization = organizations[0] || null;

  return {
    avatarUrl: member.attributes.avatar_url,
    name: member.attributes.name,
    jobTitle: member.attributes.title,
    slug: member.attributes.slug,
    teammate: member.attributes.teammate,
    orbitLevel: member.attributes.orbit_level,
    organization: organization,
    lastActivityOccurredAt: member.attributes.last_activity_occurred_at,
    tags: member.attributes.tags,
    identities: identities,
  };
}

/**
 * Format a given date in the form:
 * May 24, 2023
 *
 * @param {String} date as a string
 * @returns {String}
 */
export function formatDate(date) {
  return new Date(Date.parse(date)).toLocaleDateString("en-EN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Pretty printing for large numbers
 *
 * @param {Integer} number
 * @returns {String} formatted string for the number
 */
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
    case number <= 1000:
      return "200+";
    case number <= 5000:
      return "1000+";
    case Number.isInteger(number):
      return "5000+";
    default:
      console.error(`[Orbit Browser Extension] ${number} is not a number`);
      return "NaN";
  }
}

/**
 * Checks if current repo (fetched from pathname) is in Orbit workspace
 *
 * @returns {Boolean}
 */
export async function isRepoInOrbitWorkspace() {
  const repositories = await fetchRepositories();
  return repositories.includes(getRepositoryFullName());
}

/**
 * Returns the current repository full name based on the current URL.
 *
 * window.location.pathname looks like “/orbit-love/orbit-model/pull/3”
 * This would return `orbit-love/orbit-model`
 */
export function getRepositoryFullName() {
  return `${window.location.pathname.split("/")[1]}/${
    window.location.pathname.split("/")[2]
  }`;
}

/**
 * Fetches chunked repositories from chrome storage
 *
 * @returns Array<String> a 1d array of all repsoitory names, ie ["repo-1", "repo-2"]
 */
export async function fetchRepositories() {
  const { repository_keys } = await chrome.storage.sync.get({
    repository_keys: [],
  });

  // Backwards compatibility - if we do not have repository keys,
  //  default to how we used to store them
  if (repository_keys.length === 0) {
    const { repositories } = await chrome.storage.sync.get({
      repositories: [],
    });

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
