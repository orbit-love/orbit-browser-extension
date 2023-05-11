import WidgetOrchestrator from "./widgetOrchestrator";

const orchestrator = new WidgetOrchestrator();

describe("addWidgetElement", () => {
  test("returns an Element object", () => {
    const result = orchestrator.addWidgetElement("john_doe", "twitter");
    expect(result instanceof Element).toBe(true);
  });

  test("sets the username attribute correctly", () => {
    const result = orchestrator.addWidgetElement("john_doe", "twitter");
    expect(result.getAttribute("username")).toBe("john_doe");
  });

  test("sets the platform attribute correctly", () => {
    const result = orchestrator.addWidgetElement("john_doe", "twitter");
    expect(result.getAttribute("platform")).toBe("twitter");
  });

  test("creates a new widget element if one does not exist", () => {
    const spy = jest.spyOn(window.document, "createElement");
    orchestrator.addWidgetElement("john_doe", "twitter");
    expect(spy).toHaveBeenCalledWith("obe-widget");
  });
});
