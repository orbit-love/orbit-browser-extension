import WidgetOrchestrator from "./widgetOrchestrator";

const orchestrator = new WidgetOrchestrator();

describe("addWidgetElement", () => {
  it("returns an Element object", () => {
    const result = orchestrator.addWidgetElement("john_doe", "twitter");
    expect(result instanceof Element).toBe(true);
  });

  it("sets the username attribute correctly", () => {
    const result = orchestrator.addWidgetElement("john_doe", "twitter");
    expect(result.getAttribute("username")).toBe("john_doe");
  });

  it("sets the platform attribute correctly", () => {
    const result = orchestrator.addWidgetElement("john_doe", "twitter");
    expect(result.getAttribute("platform")).toBe("twitter");
  });

  it("creates a new widget element if one does not exist", () => {
    const spy = jest.spyOn(window.document, "createElement");
    orchestrator.addWidgetElement("john_doe", "twitter");
    expect(spy).toHaveBeenCalledWith("obe-widget");
  });
});

describe("#addOrbitButton", () => {
  it("adds button element if none exist", () => {
    const widget = document.createElement("div");
    document.body.appendChild(widget);
    const button = orchestrator.addOrbitButton(widget, "test");

    expect(widget.children.item(0)).toEqual(button);
    expect(widget.children.length).toEqual(1);
    expect(button.getAttribute("slot")).toBe("button");
    expect(button.tagName).toEqual("OBE-TEST-BUTTON");
  });

  it("uses existing button element if one exists", () => {
    const widget = document.createElement("div");
    document.body.appendChild(widget);

    const button = document.createElement("obe-test-button");
    widget.appendChild(button);

    orchestrator.addOrbitButton(widget, "test");

    expect(widget.children.item(0)).toEqual(button);
    expect(widget.children.length).toEqual(1);
    expect(button.tagName).toEqual("OBE-TEST-BUTTON");
  });
});
