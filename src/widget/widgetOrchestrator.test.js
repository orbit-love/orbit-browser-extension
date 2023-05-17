import WidgetOrchestrator from "./widgetOrchestrator";
import Page from "../pages/page";

const orchestrator = new WidgetOrchestrator();

afterEach(() => {
  // Reset DOM between tests
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
});

describe("#addWidgetElements", () => {
  let page, widgetZone1, widgetZone2, insertionPoint;

  beforeEach(() => {
    page = new Page();

    widgetZone1 = document.createElement("div");
    widgetZone1.className = "widget-zone";
    document.body.appendChild(widgetZone1);

    widgetZone2 = document.createElement("div");
    widgetZone2.className = "widget-zone";
    document.body.appendChild(widgetZone2);

    insertionPoint = document.createElement("div");
    insertionPoint.className = "insertion-point";
    document.body.appendChild(insertionPoint);

    jest.spyOn(page, "detect").mockReturnValue(true);
    jest
      .spyOn(page, "findWidgetZones")
      .mockReturnValue([widgetZone1, widgetZone2]);
    jest.spyOn(page, "validateWidgetZone").mockReturnValue(true);
    jest.spyOn(page, "applyCSSPatch");
    jest.spyOn(page, "findUsername").mockReturnValue("username");
    jest.spyOn(page, "findInsertionPoint").mockReturnValue(insertionPoint);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("doesn't add widget if zone is invalid", () => {
    // Only validate the first widget zone
    jest
      .spyOn(page, "validateWidgetZone")
      .mockImplementation((zone) => zone == widgetZone1);

    expect(document.querySelectorAll("obe-widget").length).toEqual(0);

    orchestrator.addWidgetElements(page, "test");

    expect(document.querySelectorAll("obe-widget").length).toEqual(1);
    expect(document.querySelectorAll("obe-widget")[0].tagName).toEqual(
      "OBE-WIDGET"
    );
  });

  it("doesn't add widget if username isn't found", () => {
    // Only return username for first widget zone
    jest
      .spyOn(page, "findUsername")
      .mockImplementation((zone) =>
        zone == widgetZone1 ? "username" : undefined
      );

    expect(document.querySelectorAll("obe-widget").length).toEqual(0);

    orchestrator.addWidgetElements(page, "test");

    expect(document.querySelectorAll("obe-widget").length).toEqual(1);
    expect(document.querySelectorAll("obe-widget")[0].tagName).toEqual(
      "OBE-WIDGET"
    );
  });

  it("doesn't add widget if insertion point isn't found", () => {
    // Only return username for first widget zone
    jest
      .spyOn(page, "findInsertionPoint")
      .mockImplementation((zone) =>
        zone == widgetZone1 ? insertionPoint : undefined
      );

    expect(document.querySelectorAll("obe-widget").length).toEqual(0);

    orchestrator.addWidgetElements(page, "test");

    expect(document.querySelectorAll("obe-widget").length).toEqual(1);
    expect(document.querySelectorAll("obe-widget")[0].tagName).toEqual(
      "OBE-WIDGET"
    );
  });

  it("adds a widget element, which includes a button & additional data elements, for each valid widget zone", () => {
    orchestrator.addWidgetElements(page, "test");

    expect(page.findWidgetZones).toHaveBeenCalledTimes(1);

    expect(page.validateWidgetZone).toHaveBeenCalledWith(widgetZone1);
    expect(page.applyCSSPatch).toHaveBeenCalledWith(widgetZone1);
    expect(page.findUsername).toHaveBeenCalledWith(widgetZone1);
    expect(page.findInsertionPoint).toHaveBeenCalledWith(widgetZone1);

    expect(page.validateWidgetZone).toHaveBeenCalledWith(widgetZone2);
    expect(page.applyCSSPatch).toHaveBeenCalledWith(widgetZone2);
    expect(page.findUsername).toHaveBeenCalledWith(widgetZone2);
    expect(page.findInsertionPoint).toHaveBeenCalledWith(widgetZone2);

    expect(document.querySelectorAll("obe-widget").length).toEqual(2);
  });
});

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

describe("#addAdditionalDataElements", () => {
  it("adds additional data element if none exist", () => {
    const widget = document.createElement("div");
    document.body.appendChild(widget);
    const additionalDataElement = orchestrator.addAdditionalDataElements(
      widget,
      "test"
    );

    expect(widget.children.item(0)).toEqual(additionalDataElement);
    expect(widget.children.length).toEqual(1);
    expect(additionalDataElement.getAttribute("slot")).toBe("additional-data");
    expect(additionalDataElement.tagName).toEqual("OBE-TEST-ADDITIONAL-DATA");
  });

  it("uses existing element if one exists", () => {
    const widget = document.createElement("div");
    document.body.appendChild(widget);

    const additionalDataElement = document.createElement(
      "obe-test-additional-data"
    );
    widget.appendChild(additionalDataElement);

    orchestrator.addAdditionalDataElements(widget, "test");

    expect(widget.children.item(0)).toEqual(additionalDataElement);
    expect(widget.children.length).toEqual(1);
    expect(additionalDataElement.tagName).toEqual("OBE-TEST-ADDITIONAL-DATA");
  });
});
