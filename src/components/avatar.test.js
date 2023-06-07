import "./avatar";

describe("obe-avatar", () => {
  let element;

  afterEach(() => {
    document.body.removeChild(element);
  });

  describe("avatarUrl is valid", () => {
    beforeEach(() => {
      global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

      element = document.createElement("obe-avatar");
      element.setAttribute("avatar-url", "https://example.com/avatar.jpg");
      element.setAttribute("fallback", "SR");
      document.body.appendChild(element);
    });

    it("displays an image", async () => {
      const image = element.shadowRoot.querySelector("img");
      const placeholder = element.shadowRoot.querySelector("div[role='img']");
      expect(placeholder).toBeNull();
      expect(image).toBeTruthy();
      expect(image.getAttribute("src")).toBe("https://example.com/avatar.jpg");
    });
  });

  describe("avatarUrl is invalid", () => {
    beforeEach(() => {
      global.fetch = jest.fn(() => Promise.resolve({ ok: false }));

      element = document.createElement("obe-avatar");
      element.setAttribute("avatar-url", "https://example.com/avatar.jpg");
      element.setAttribute("fallback", "SR");
      document.body.appendChild(element);
    });

    it("displays a fallback placeholder", async () => {
      const image = element.shadowRoot.querySelector("img");
      const placeholder = element.shadowRoot.querySelector(
        "div span[role='img']"
      );
      expect(image).toBeNull();
      expect(placeholder.innerHTML).toMatch("SR");
    });
  });
});
