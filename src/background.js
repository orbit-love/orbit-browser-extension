import "chrome-extension-async";
import { ORBIT_API_ROOT_URL, ORBIT_HEADERS } from "./constants";
import { configureRequest, getOrbitCredentials } from "./oauth-helpers";

// When clicking on the Orbit extension button, open the options page
chrome.browserAction.onClicked.addListener(() =>
  chrome.runtime.openOptionsPage()
);

const isFirstInstall = async (suggestedReason) => suggestedReason === "install";

// When installing the Orbit extension, open the options page
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  // Only notify on install
  if (await isFirstInstall(reason)) {
    chrome.runtime.openOptionsPage();
  }
});

// When receiving the "showOptions" message, open the options page
chrome.runtime.onMessage.addListener((request) => {
  if (request === "showOptions") {
    chrome.runtime.openOptionsPage();
  }
});

// Message listener from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // do not attempt to parse the message if it is not coming from a content script
  if (!sender.tab) {
    return;
  }

  switch (request.operation) {
    case "LOAD_MEMBER_DATA":
      loadMemberData(request).then(sendResponse);
      break;
    default:
      console.error(`Unknown operation: ${request.operation}`);
  }
  return true;
});

const loadMemberData = async ({ username, platform }) => {
  const ORBIT_CREDENTIALS = await getOrbitCredentials();

  const url = new URL(
    `${ORBIT_API_ROOT_URL}/${ORBIT_CREDENTIALS.WORKSPACE}/members/find`
  );
  const { params, headers } = configureRequest(ORBIT_CREDENTIALS, {
    source: platform,
    username: username,
  });

  url.search = params.toString();

  try {
    const response = await fetch(
      url,
      {
        headers
      }
    );
    const { data, included } = await response.json();
    if (!data) {
      return {
        success: false,
        status: 404,
        workspace: ORBIT_CREDENTIALS.WORKSPACE
      };
    }
    const member = data;
    const identities = data.relationships.identities.data.map(
      ({ id, type }) =>
        included.find(
          ({ id: included_id, type: included_type }) =>
            id === included_id && type === included_type
        )?.attributes
    );
    const organizations = data.relationships.organizations.data.map(
      ({ id, type }) =>
        included.find(
          ({ id: included_id, type: included_type }) =>
            id === included_id && type === included_type
        )?.attributes
    );
    const organization = organizations[0] || null

    return {
      success: true,
      status: response.status,
      workspace: ORBIT_CREDENTIALS.WORKSPACE,
      member: {
        name: member.attributes.name,
        jobTitle: member.attributes.title,
        slug: member.attributes.slug,
        teammate: member.attributes.teammate,
        orbitLevel: member.attributes.orbit_level,
        organization: organization,
        lastActivityOccurredAt: member.attributes.last_activity_occurred_at,
        tags: member.attributes.tags,
        identities: identities
      },
      additionalData: {
        contributionsTotal: 12
      }
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
    };
  }
};
