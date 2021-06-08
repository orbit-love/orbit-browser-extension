import { fireEvent, getByRole, getByText, waitFor } from "@testing-library/dom";

import { createOrbitDetailsElement } from "./orbit-action";
import { mockOrbitAPICall } from "../test-helpers.js";

let orbitDetailsElement;

beforeEach(async () => {
  orbitDetailsElement = await createOrbitDetailsElement(
    { API_TOKEN: "token", WORKSPACE: "my-workspace" },
    "phacks",
    true,
    "https://github.com/orbit-love/orbit-model/issues/10#issuecomment-590037251",
    "2020-02-23T07:55:28Z"
  );

  global.fetch = jest
    .fn()
    // mocks /:workspace/members/:member
    .mockImplementationOnce(
      mockOrbitAPICall({
        data: {
          attributes: {
            orbit_level: 1,
            reach: 5,
            love: 9,
            tag_list: ["Speaker"],
          },
        },
      })
    )
    // mocks /:workspace/identities/github/:username
    .mockImplementationOnce(
      mockOrbitAPICall({ data: { attributes: { g_contributions_total: 12 } } })
    )
    // mocks /:workspace/members/:member/activities
    .mockImplementationOnce(
      mockOrbitAPICall({
        data: [],
        included: [],
      })
    );
});

afterEach(() => {
  global.fetch.mockClear();
  delete global.fetch;
});

test("createOrbitDetailsElement should return a button and a menu", () => {
  expect(getByRole(orbitDetailsElement, "button"));
  expect(getByRole(orbitDetailsElement, "menu"));
});

test("createOrbitDetailsElement should trigger 3 fetch requests on mouseover, no fetch requests on repeat mouseover", async () => {
  fireEvent(
    getByRole(orbitDetailsElement, "button"),
    new MouseEvent("mouseover")
  );
  await waitFor(() => {
    expect(getByText(orbitDetailsElement, "See phacks’s profile on Orbit"));
  });
  expect(global.fetch).toHaveBeenCalledTimes(3);
  global.fetch.mockClear();
  fireEvent(
    getByRole(orbitDetailsElement, "button"),
    new MouseEvent("mouseover")
  );
  await waitFor(() => {
    expect(getByText(orbitDetailsElement, "See phacks’s profile on Orbit"));
  });
  expect(global.fetch).toHaveBeenCalledTimes(0);
});

test("createOrbitDetailsElement should display an error message if there was an error fetching data", async () => {
  global.fetch.mockClear();
  // mocks /:workspace/members/:member
  global.fetch = jest.fn().mockImplementation(mockOrbitAPICall({}, false, 500));
  fireEvent(
    getByRole(orbitDetailsElement, "button"),
    new MouseEvent("mouseover")
  );
  await waitFor(() => {
    expect(
      getByText(orbitDetailsElement, "There was an error fetching Orbit data")
    );
  });
});

test("createOrbitDetailsElement should display an error message if credentials are missing", async () => {
  orbitDetailsElement = await createOrbitDetailsElement(
    { API_TOKEN: "", WORKSPACE: "workspace" },
    "phacks"
  );
  fireEvent(
    getByRole(orbitDetailsElement, "button"),
    new MouseEvent("mouseover")
  );
  await waitFor(() => {
    expect(getByText(orbitDetailsElement, "API token or workspace is missing"));
  });
});

test("createOrbitDetailsElement should display a loading indicator", async () => {
  fireEvent(
    getByRole(orbitDetailsElement, "button"),
    new MouseEvent("mouseover")
  );
  await waitFor(() => {
    expect(getByText(orbitDetailsElement, "Loading Orbit data…"));
  });
  await waitFor(() => {
    expect(getByText(orbitDetailsElement, "See phacks’s profile on Orbit"));
  });
});

test("createOrbitDetailsElement should trigger 2 requests when the user is not a member", async () => {
  global.fetch = jest
    .fn()
    // mocks /:workspace/members/:member
    .mockImplementationOnce(
      mockOrbitAPICall({ error: "not found" }, false, 404)
    )
    // mocks /:workspace/identities/github/:username
    .mockImplementationOnce(
      mockOrbitAPICall({ data: { attributes: { g_contributions_total: 12 } } })
    );
  fireEvent(
    getByRole(orbitDetailsElement, "button"),
    new MouseEvent("mouseover")
  );
  await waitFor(() => {
    expect(getByText(orbitDetailsElement, "Contributed 10+ times on GitHub"));
  });
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

test("createOrbitDetailsElement should display Orbit info if the github user is a member", async () => {
  fireEvent(
    getByRole(orbitDetailsElement, "button"),
    new MouseEvent("mouseover")
  );
  await waitFor(() => {
    expect(getByText(orbitDetailsElement, "Speaker"));
    expect(getByText(orbitDetailsElement, "Contributed 10+ times on GitHub"));
    expect(getByText(orbitDetailsElement, "See phacks’s profile on Orbit"));
  });
});

test("should create new members for non-members", async () => {
  global.fetch = jest
    .fn()
    // mocks /:workspace/members/:member
    .mockImplementationOnce(mockOrbitAPICall({}, false, 404))
    // mocks /:workspace/identities/github/:username
    .mockImplementationOnce(
      mockOrbitAPICall({ data: { attributes: { g_contributions_total: 12 } } })
    )
    // mocks POST /:workspace/members/
    .mockImplementationOnce(mockOrbitAPICall({ data: {} }, true, 201));
  fireEvent(
    getByRole(orbitDetailsElement, "button"),
    new MouseEvent("mouseover")
  );
  await waitFor(() => {
    expect(
      getByText(orbitDetailsElement, "Add phacks to my-workspace on Orbit")
    );
  });
  global.fetch.mockClear();
  fireEvent(
    getByText(orbitDetailsElement, "Add phacks to my-workspace on Orbit"),
    new MouseEvent("click")
  );
  await waitFor(() => {
    expect(getByText(orbitDetailsElement, "Creating the member…"));
  });
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining("/my-workspace/members"),
    expect.objectContaining({
      body: JSON.stringify({ member: { github: "phacks" } }),
    })
  );
  await waitFor(() => {
    expect(
      getByText(orbitDetailsElement, "Added! See phacks’s profile on Orbit")
    );
  });
});

test("should create content for existing members", async () => {
  global.fetch.mockImplementationOnce(
    mockOrbitAPICall({ data: { id: 12 } }, true, 201)
  );
  fireEvent(
    getByRole(orbitDetailsElement, "button"),
    new MouseEvent("mouseover")
  );
  await waitFor(() => {
    expect(getByText(orbitDetailsElement, "Add to phacks’s content"));
  });
  global.fetch.mockClear();
  fireEvent(
    getByText(orbitDetailsElement, "Add to phacks’s content"),
    new MouseEvent("click")
  );
  await waitFor(() => {
    expect(getByText(orbitDetailsElement, "Adding the content…"));
  });
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining("/my-workspace/members/phacks/activities"),
    expect.objectContaining({
      body: JSON.stringify({
        activity_type: "content",
        url: "https://github.com/orbit-love/orbit-model/issues/10#issuecomment-590037251",
        occurred_at: "2020-02-23T07:55:28Z"
      }),
    })
  );
  await waitFor(() => {
    expect(
      getByText(orbitDetailsElement, "Added! See phacks’s content on Orbit")
    );
  });
});
