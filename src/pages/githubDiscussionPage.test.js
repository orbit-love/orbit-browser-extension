import GitHubDiscussionPage from "./githubDiscussionPage";

describe("GithubIssueOrPullRequestPage", () => {
  let page, originalLocation;

  beforeEach(() => {
    page = new GitHubDiscussionPage();
    originalLocation = window.location;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  describe("#detect", () => {
    it("recognises discussion pages", () => {
      delete window.location;
      window.location = {
        ...originalLocation,
        pathname: "/orbit-love/orbit-browser-extension/discussions/9",
      };

      expect(page.detect()).toBe(true);
    });

    it("does not recognise other pages", () => {
      delete window.location;
      window.location = {
        ...originalLocation,
        pathname: "/orbit-love/orbit-browser-extension/pull/40",
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
