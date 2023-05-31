import TwitterProfilePage from "./twitterProfilePage";

describe("TwitterProfilePage", () => {
  let page;

  beforeEach(() => {
    page = new TwitterProfilePage();
  });

  describe("#detect", () => {
    it("detects header profile photos", () => {
      const headerPhoto = document.createElement("a");
      headerPhoto.setAttribute('href', '/OrbitModel/photo');
      document.body.appendChild(headerPhoto);
      expect(page.detect()).toBe(true);
      document.body.removeChild(headerPhoto);
    });

    it("does not recognise other pages", () => {
      expect(page.detect()).toBe(false);
    });
  });
});
