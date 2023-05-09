export interface Page {
  detect(): boolean;
  findWidgetZones(): HTMLCollectionOf<Element>
  validateWidgetZone(widgetZone: Element): boolean;
  applyCSSPatch(widgetZone: Element): void;
  findUsername(widgetZone: Element): string | undefined;
  findInsertionPoint(widgetZone: Element): Element | null;
}

export type Member = {
  name: string,
  slug: string,
  jobTitle: string,
  teammate: boolean,
  orbitLevel: 1 | 2 | 3 | 4 | null,
  organization: Organization,
  lastActivityOccurredAt: string,
  tags: Array<string>,
  identities: Array<Identity>
}

export type Organization = {
  name: string;
  website: string;
  logo_url: string;
  lifecycle_stage: string;
}

export type Identity = {
  source: string;
  source_host: string | null;
  email: string | null;
  username: string | null;
  uid: string | null;
  profile_url: string | null;
  url: string | null;
}

export type GithubAdditionalData = {
  contributionsTotal: Number;
  contributionsOnThisRepoTotal: Number;
}

export type AdditionalData = GithubAdditionalData