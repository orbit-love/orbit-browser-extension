import GitHubIssueOrPullRequestPage from "./githubIssueOrPullRequestPage";

describe("GithubIssueOrPullRequestPage", () => {
  let page, originalLocation;

  beforeEach(() => {
    page = new GitHubIssueOrPullRequestPage();
    originalLocation = window.location;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  describe("#detect", () => {
    it("recognises issue pages", () => {
      delete window.location;
      window.location = {
        ...originalLocation,
        pathname: "/orbit-love/orbit-browser-extension/issues/36",
      };

      expect(page.detect()).toBe(true);
    });

    it("recognises pull request pages", () => {
      delete window.location;
      window.location = {
        ...originalLocation,
        pathname: "/orbit-love/orbit-browser-extension/pull/40",
      };

      expect(page.detect()).toBe(true);
    });

    it("does not recognise other pages", () => {
      delete window.location;
      window.location = {
        ...originalLocation,
        pathname: "/orbit-love/orbit-browser-extension/commits/main",
      };

      expect(page.detect()).toBe(false);
    });
  });

  it("#findWidgetZones ignores other elements", () => {
    const fakeWidgetZone = document.createElement("div");
    fakeWidgetZone.className = "fake-comment-element";
    document.body.appendChild(fakeWidgetZone);

    expect(page.findWidgetZones().length).toBe(0);
  });
});
