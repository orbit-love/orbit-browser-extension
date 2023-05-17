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

    it("does not recognises other pages", () => {
      delete window.location;
      window.location = {
        ...originalLocation,
        pathname: "/orbit-love/orbit-browser-extension/commits/main",
      };

      expect(page.detect()).toBe(false);
    });
  });

  it("#findWidgetZones fetches only .timeline-comment elements", () => {
    const widgetZone1 = document.createElement("div");
    widgetZone1.className = "timeline-comment";
    document.body.appendChild(widgetZone1);

    const widgetZone2 = document.createElement("div");
    widgetZone2.className = "timeline-comment";
    document.body.appendChild(widgetZone2);

    const fakeWidgetZone = document.createElement("div");
    fakeWidgetZone.className = "timeline-comment-wrong";
    document.body.appendChild(fakeWidgetZone);

    expect(page.findWidgetZones().length).toBe(2);
  });

  describe("#validateWidgetZone", () => {
    it("returns false if widget zone has no comments", () => {
      const widgetZone = document.createElement("div");
      widgetZone.className = "timeline-comment";
      document.body.appendChild(widgetZone);

      expect(page.validateWidgetZone(widgetZone)).toBe(false);
    });

    it("returns true if widget zone has comments", () => {
      const widgetZone = document.createElement("div");
      widgetZone.className = "timeline-comment";
      document.body.appendChild(widgetZone);

      const widgetZoneComment = document.createElement("div");
      widgetZoneComment.className = "timeline-comment-actions";
      widgetZone.appendChild(widgetZoneComment);

      expect(page.validateWidgetZone(widgetZone)).toBe(true);
    });
  });

  describe("#findUsername", () => {
    it("is nil safe if no username found", () => {
      const comment = document.createElement("div");
      comment.className = "timeline-comment-actions";
      document.body.appendChild(comment);

      expect(page.findUsername(comment)).toBe(undefined);
    });

    it("fetches username if found", () => {
      const comment = document.createElement("div");
      comment.className = "timeline-comment-actions";
      document.body.appendChild(comment);

      const author = document.createElement("div");
      author.className = "author";
      author.innerHTML = "delete-44";
      comment.appendChild(author);

      expect(page.findUsername(comment)).toEqual("delete-44");
    });
  });

  it("#findInsertionPoint fetches the comment actions box", () => {
    const comment = document.createElement("div");
    comment.className = "timeline-comment-actions";
    document.body.appendChild(comment);

    expect(page.findInsertionPoint(document.body)).toEqual(comment);
  });
});
