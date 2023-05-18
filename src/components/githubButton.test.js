import "./githubButton";

describe("obe-github-button", () => {
  let element;

  beforeEach(() => {
    element = document.createElement("obe-github-button");
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it("renders without errors", () => {
    expect(element.shadowRoot.innerHTML).toMatch("Github button");
    // TODO: Poplate this test more once full github button is added
  });
});
