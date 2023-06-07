import LinkedinProfilePage from "./linkedinProfilePage";

describe("LinkedinProfilePage", () => {
  let page, originalLocation;

  beforeEach(() => {
    page = new LinkedinProfilePage();
    originalLocation = window.location;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  describe("#detect", () => {
    it("recognises profile pages", () => {
      delete window.location;
      window.location = {
        ...originalLocation,
        pathname: "/in/nicolas-goutay-4b984258",
      };

      expect(page.detect()).toBe(true);
    });

    it("does not recognise other pages", () => {
      delete window.location;
      window.location = {
        ...originalLocation,
        pathname: "/feed",
      };

      expect(page.detect()).toBe(false);
    });
  });

  describe("#findUsername", () => {
    it("extracts the username from the pathname", () => {
      delete window.location;
      window.location = {
        ...originalLocation,
        pathname: "/in/nicolas-goutay-4b984258",
      };

      expect(page.findUsername()).toBe("nicolas-goutay-4b984258");
    });
  });
});
