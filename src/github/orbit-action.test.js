import { fireEvent, getByRole, getByText, waitFor } from "@testing-library/dom";

import { createOrbitDetailsElement } from "./orbit-action";

let orbitDetailsElement;

beforeEach(async () => {
  orbitDetailsElement = await createOrbitDetailsElement(
    { API_TOKEN: "token", WORKSPACE: "workspace" },
    "phacks"
  );

  const mockJsonPromise = Promise.resolve({});
  const mockFetchPromise = Promise.resolve({
    json: () => mockJsonPromise,
  });
  global.fetch = jest.fn().mockImplementation(() => mockFetchPromise);
});

afterEach(() => {
  global.fetch.mockClear();
  delete global.fetch;
});

test("createOrbitDetailsElement should return a button and a menu", () => {
  expect(getByRole(orbitDetailsElement, "button"));
  expect(getByRole(orbitDetailsElement, "menu"));
});

test("createOrbitDetailsElement should trigger 2 fetch requests on mouseover, no fetch requests on repeat mouseover", () => {
  fireEvent(
    getByRole(orbitDetailsElement, "button"),
    new MouseEvent("mouseover", {
      bubbles: true,
      cancelable: true,
    })
  );
  expect(global.fetch).toHaveBeenCalledTimes(2);
  global.fetch.mockClear();
  fireEvent(
    getByRole(orbitDetailsElement, "button"),
    new MouseEvent("mouseover", {
      bubbles: true,
      cancelable: true,
    })
  );
  expect(global.fetch).toHaveBeenCalledTimes(0);
});

test("createOrbitDetailsElement should display a loading indicator", async () => {
  fireEvent(
    getByRole(orbitDetailsElement, "button"),
    new MouseEvent("mouseover", {
      bubbles: true,
      cancelable: true,
    })
  );
  await waitFor(
    () => {
      expect(getByText(orbitDetailsElement, "Loading Orbit data…"));
    },
    {
      container: orbitDetailsElement,
    }
  );
});

test("createOrbitDetailsElement should display when the user is not a member", async () => {
  fireEvent(
    getByRole(orbitDetailsElement, "button"),
    new MouseEvent("mouseover", {
      bubbles: true,
      cancelable: true,
    })
  );
  await waitFor(
    () => {
      expect(
        getByText(orbitDetailsElement, "phacks is not in your Orbit workspace")
      );
    },
    {
      container: orbitDetailsElement,
    }
  );
});

test("createOrbitDetailsElement should display Orbit info if the github user is a member", async () => {
  global.fetch.mockClear();
  global.fetch = jest
    .fn()
    .mockImplementationOnce(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            data: {
              attributes: {
                contributions_collection: {
                  total_repository_contributions: 10,
                },
                contributions_total: 50,
              },
            },
          }),
      })
    )
    .mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({}),
      })
    );
  fireEvent(
    getByRole(orbitDetailsElement, "button"),
    new MouseEvent("mouseover", {
      bubbles: true,
      cancelable: true,
    })
  );
  await waitFor(
    () => {
      expect(
        getByText(
          orbitDetailsElement,
          "Contributed 50 times to 10 repositories"
        )
      );
      expect(getByText(orbitDetailsElement, "See phacks’s profile on Orbit"));
    },
    {
      container: orbitDetailsElement,
    }
  );
});
