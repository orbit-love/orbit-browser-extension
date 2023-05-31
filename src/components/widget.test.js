import "./widget";
import { mockChrome } from "../test-helpers";

describe("obe-widget", () => {
  let element;

  beforeEach(() => {
    element = document.createElement("obe-widget");
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it("sets property default values", () => {
    expect(element.isOpen).toBe(false);
    expect(element.isLoading).toBe(false);
    expect(element.hasAuthError).toBe(false);
    expect(element.hasError).toBe(false);
    expect(element.hasAdditionalDataError).toBe(false);
    expect(element.hasActionsError).toBe(false);
    expect(element.showAllTags).toBe(false);
    expect(element.isAMember).toBe(false);
    expect(element.member).toEqual({});
    expect(element.workspace).toEqual("");
  });

  it("sets default state", () => {
    element.update();
    const dropdown = element.shadowRoot.querySelector(".obe-dropdown");
    expect(dropdown.innerHTML).not.toMatch("Loading Orbit data");
    expect(dropdown.innerHTML).not.toMatch("Authentication error");
    expect(dropdown.innerHTML).not.toMatch(
      "There was an error fetching Orbit data"
    );

    expect(dropdown.innerHTML).toMatch(/Add .* to .* on Orbit/);
  });

  it("responds to click event", () => {
    element.isOpen = true;
    document.dispatchEvent(new Event("click"));
    expect(element.isOpen).toBe(false);
  });

  it("toggles isOpen property when _toggle is called", () => {
    element._toggle();
    expect(element.isOpen).toBe(true);
    element._toggle();
    expect(element.isOpen).toBe(false);
  });

  it("renders dropdown when isOpen is true", () => {
    element.isOpen = true;
    element.update();
    const dropdown = element.shadowRoot.querySelector(".obe-dropdown");
    expect(dropdown.style.visibility).toBe("visible");
  });

  it("does not render dropdown when isOpen is false", () => {
    element.isOpen = false;
    element.update();
    const dropdown = element.shadowRoot.querySelector(".obe-dropdown");
    expect(dropdown.style.visibility).toBe("hidden");
  });

  it("renders loading state when isLoading is true", () => {
    element.isLoading = true;
    element.update();
    const dropdown = element.shadowRoot.querySelector(".obe-dropdown");
    expect(dropdown.innerHTML).toMatch("Loading Orbit data");
  });

  it("renders auth error state when hasAuthError is true", () => {
    element.hasAuthError = true;
    element.update();
    const dropdown = element.shadowRoot.querySelector(".obe-dropdown");
    expect(dropdown.innerHTML).toMatch("Authentication error");
  });

  it("renders generic error state when hasError is true", () => {
    element.hasError = true;
    element.update();
    const dropdown = element.shadowRoot.querySelector(".obe-dropdown");
    expect(dropdown.innerHTML).toMatch(
      "There was an error fetching Orbit data"
    );
  });

  it("renders additional data error state when hasAdditionalDataError is true", () => {
    element.hasAdditionalDataError = true;
    element.update();
    const dropdown = element.shadowRoot.querySelector(".obe-dropdown");
    expect(dropdown.innerHTML).toMatch("There was an error fetching data");
  });

  it("renders actions error state when hasActionsError is true", () => {
    element.hasActionsError = true;
    element.update();
    const dropdown = element.shadowRoot.querySelector(".obe-dropdown");
    expect(dropdown.innerHTML).toMatch(
      "There was an error performing this action"
    );
  });

  it("shows member information if present", async () => {
    const originalChrome = mockChrome(
      {},
      {
        success: true,
        status: 200,
        response: {
          data: {
            attributes: {
              name: "John Doe",
              title: "Software Engineer",
              slug: "john_doe",
              teammate: false,
              orbit_level: 100,
              last_activity_occurred_at: "01-01-1970",
              tags: ["123"],
            },
            relationships: {
              identities: { data: [] },
              organizations: { data: [] },
            },
          },
          included: [{ id: 123, type: "twitter_identity" }],
        },
      }
    );
    await element._loadOrbitData();
    await element.updateComplete;

    const dropdown = element.shadowRoot.querySelector(".obe-dropdown");

    expect(dropdown.innerHTML).toMatch("John Doe");
    expect(dropdown.innerHTML).toMatch("Software Engineer");
    expect(dropdown.innerHTML).toMatch("123");
    expect(dropdown.innerHTML).toMatch("Jan 1");
    expect(dropdown.innerHTML).toMatch(/Go to .* Orbit profile/);

    global.chrome = originalChrome;
  });

  describe("'_toggleTags", () => {
    it("sets showAllTags to true by default", () => {
      expect(element.showAllTags).toBe(false);
      element._toggleTags();
      expect(element.showAllTags).toBe(true);
    });

    it("sets showAllTags to false if specified", () => {
      element.showAllTags = true;
      expect(element.showAllTags).toBe(true);
      element._toggleTags(false);
      expect(element.showAllTags).toBe(false);
    });

    it("correctly responds to showAllTags", async () => {
      element.isAMember = true;
      element.member = {
        identities: [],
        jobTitle: "CEO",
        lastActivityOccurredAt: 1234,
        name: "Delete",
        orbitLevel: 100,
        organization: null,
        slug: "delete",
        tags: ["tag-1", "tag-2", "tag-3", "tag-4", "tag-5", "tag-6"],
        teammate: false,
      };

      element.update();

      const dropdown = element.shadowRoot.querySelector(".obe-dropdown");

      expect(dropdown.innerHTML).toMatch("tag-1");
      expect(dropdown.innerHTML).toMatch("tag-2");
      expect(dropdown.innerHTML).toMatch("tag-3");
      expect(dropdown.innerHTML).toMatch("tag-4");
      expect(dropdown.innerHTML).toMatch("tag-5");
      expect(dropdown.innerHTML).not.toMatch("tag-6");
      expect(dropdown.innerHTML).toMatch(/\+.*1 more/);
      expect(dropdown.innerHTML).not.toMatch("Show fewer");

      element._toggleTags();
      await element.updateComplete;

      expect(dropdown.innerHTML).toMatch("tag-1");
      expect(dropdown.innerHTML).toMatch("tag-2");
      expect(dropdown.innerHTML).toMatch("tag-3");
      expect(dropdown.innerHTML).toMatch("tag-4");
      expect(dropdown.innerHTML).toMatch("tag-5");
      expect(dropdown.innerHTML).toMatch("tag-6");
      expect(dropdown.innerHTML).not.toMatch(/\+.*1 more/);
      expect(dropdown.innerHTML).toMatch("Show fewer");
    });
  });

  describe("#_toggleIdentities", () => {
    it("sets showAllIdentities to true by default", () => {
      expect(element.showAllIdentities).toBe(false);
      element._toggleIdentities();
      expect(element.showAllIdentities).toBe(true);
    });

    it("sets showAllIdentities to false if specified", () => {
      element.showAllIdentities = true;
      expect(element.showAllIdentities).toBe(true);
      element._toggleIdentities(false);
      expect(element.showAllIdentities).toBe(false);
    });

    it("correctly responds to showAllIdentities", async () => {
      element.isAMember = true;
      element.member = {
        identities: [
          {
            source: "reddit",
            username: "identity-1",
            profile_url: "faker.com",
          },
          {
            source: "reddit",
            username: "identity-2",
            profile_url: "faker.com",
          },
          {
            source: "reddit",
            username: "identity-3",
            profile_url: "faker.com",
          },
          {
            source: "reddit",
            username: "identity-4",
            profile_url: "faker.com",
          },
          {
            source: "reddit",
            username: "identity-5",
            profile_url: "faker.com",
          },
          {
            source: "reddit",
            username: "identity-6",
            profile_url: "faker.com",
          },
        ],
        jobTitle: "CEO",
        lastActivityOccurredAt: 1234,
        name: "Delete",
        orbitLevel: 100,
        organization: null,
        slug: "delete",
        tags: [],
        teammate: false,
      };

      element.update();

      const dropdown = element.shadowRoot.querySelector(".obe-dropdown");

      expect(dropdown.querySelectorAll("obe-identity").length).toEqual(5);
      expect(dropdown.innerHTML).toMatch(/\+.*1 more/);
      expect(dropdown.innerHTML).not.toMatch("Show fewer");

      element._toggleIdentities();
      await element.updateComplete;

      expect(dropdown.querySelectorAll("obe-identity").length).toEqual(6);
      expect(dropdown.innerHTML).not.toMatch(/\+.*1 more/);
      expect(dropdown.innerHTML).toMatch("Show fewer");
    });
  });

  it("shows additionalData if present", () => {
    element.additionalData = ["Test Additional Data Section"];
    element.update();
    const dropdown = element.shadowRoot.querySelector(".obe-dropdown");
    expect(dropdown.innerHTML).toMatch("Test Additional Data Section");
  });

  describe("#_loadOrbitData", () => {
    it("exits the flow without updating if already loading", () => {
      element.isLoading = true;
      element.update();
      element._loadOrbitData();
      const dropdown = element.shadowRoot.querySelector(".obe-dropdown");
      expect(dropdown.innerHTML).toMatch("Loading Orbit data");
    });

    it("shows auth error if response is 401", async () => {
      const originalChrome = mockChrome(
        {},
        {
          success: true,
          status: 401,
        }
      );

      expect(element.hasAuthError).toBe(false);

      await element._loadOrbitData();
      await element.updateComplete;

      expect(element.hasAuthError).toBe(true);

      global.chrome = originalChrome;
    });

    it("shows not a member template if user is not found", async () => {
      element.isAMember = true;
      element.update();

      const originalChrome = mockChrome(
        {},
        {
          success: true,
          status: 404,
        }
      );

      expect(element.isAMember).toBe(true);

      await element._loadOrbitData();
      await element.updateComplete;

      expect(element.isAMember).toBe(false);

      global.chrome = originalChrome;
    });

    it("shows generic error if request fails", async () => {
      const originalChrome = mockChrome(
        {},
        {
          success: false,
          status: 500,
        }
      );

      expect(element.hasError).toBe(false);

      await element._loadOrbitData();
      await element.updateComplete;

      expect(element.hasError).toBe(true);

      global.chrome = originalChrome;
    });

    it("shows generic error if data is empty", async () => {
      element.isAMember = true;
      element.update();

      const originalChrome = mockChrome(
        {},
        {
          success: true,
          status: 200,
          response: {},
        }
      );

      expect(element.isAMember).toBe(true);
      expect(element.hasError).toBe(false);

      await element._loadOrbitData();
      await element.updateComplete;

      expect(element.isAMember).toBe(false);
      expect(element.hasError).toBe(true);
      expect(element.isLoading).toBe(false);

      global.chrome = originalChrome;
    });

    it("fetches & displays member if member is correctly retrieved", async () => {
      const originalChrome = mockChrome(
        {},
        {
          success: true,
          status: 200,
          response: {
            data: {
              attributes: {
                name: "Delete",
                title: "CEO",
                slug: "delete",
                teammate: false,
                orbit_level: 100,
                last_activity_occurred_at: 1234,
                tags: ["123"],
              },
              relationships: {
                identities: { data: [] },
                organizations: { data: [] },
              },
            },
            included: [{ id: 123, type: "twitter_identity" }],
          },
        }
      );

      expect(element.hasAuthError).toBe(false);
      expect(element.hasError).toBe(false);
      expect(element.isAMember).toBe(false);

      expect(element.member).toEqual({});

      await element._loadOrbitData();
      await element.updateComplete;

      expect(element.hasAuthError).toBe(false);
      expect(element.hasError).toBe(false);
      expect(element.isAMember).toBe(true);

      expect(element.member).toEqual({
        identities: [],
        jobTitle: "CEO",
        lastActivityOccurredAt: 1234,
        name: "Delete",
        orbitLevel: 100,
        organization: null,
        slug: "delete",
        tags: ["123"],
        teammate: false,
      });

      global.chrome = originalChrome;
    });

    describe("organisation", () => {
      it("makes link absolute if it is relative", () => {
        element.isAMember = true;
        element.member = {
          identities: [],
          jobTitle: "CEO",
          lastActivityOccurredAt: 1234,
          name: "Delete",
          orbitLevel: 100,
          organization: {
            website: "faker.com",
            name: "Test org",
          },
          slug: "delete",
          tags: ["tag-1", "tag-2", "tag-3", "tag-4", "tag-5", "tag-6"],
          teammate: false,
        };

        element.update();

        const dropdown = element.shadowRoot.querySelector(".obe-dropdown");

        expect(dropdown.querySelector("[href='https://faker.com']")).not.toBe(
          null
        );
        expect(dropdown.querySelector("[href='faker.com']")).toBe(null);
      });

      it("leaves absolute links untouched", () => {
        element.isAMember = true;
        element.member = {
          identities: [],
          jobTitle: "CEO",
          lastActivityOccurredAt: 1234,
          name: "Delete",
          orbitLevel: 100,
          organization: {
            website: "https://www.faker.com",
            name: "Test org",
          },
          slug: "delete",
          tags: ["tag-1", "tag-2", "tag-3", "tag-4", "tag-5", "tag-6"],
          teammate: false,
        };

        element.update();

        const dropdown = element.shadowRoot.querySelector(".obe-dropdown");

        expect(
          dropdown.querySelector("[href='https://www.faker.com']")
        ).not.toBe(null);
        expect(
          dropdown.querySelector("[href='https://https://www.faker.com']")
        ).toBe(null);
      });
    });
  });
});
