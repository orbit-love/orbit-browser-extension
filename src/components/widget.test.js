import "./widget";

describe("obe-widget", () => {
  let element;

  beforeEach(() => {
    element = document.createElement("obe-widget");
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it("has a default isOpen property set to false", () => {
    expect(element.isOpen).toBe(false);
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
});
