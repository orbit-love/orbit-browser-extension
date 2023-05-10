export interface Page {
  detect(): boolean;
  findWidgetZones(): HTMLCollectionOf<Element>;
  validateWidgetZone(widgetZone: Element): boolean;
  applyCSSPatch(widgetZone: Element): void;
  findUsername(widgetZone: Element): string | undefined;
  findInsertionPoint(widgetZone: Element): Element | null;
}
