import GmailEmailThreadPage from "./gmailEmailThreadPage";

describe("GmailEmailThreadPage", () => {
  let page, originalLocation;

  beforeEach(() => {
    page = new GmailEmailThreadPage();
    originalLocation = window.location;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  describe("#detect", () => {
    it("detects top-level threads pages in various contexts", () => {
      // Using sample URLs from my GMail:
      const topLevelEmailThreadPages = [
        "#inbox/FMfcgzGsmhgmSZBrHhpDwjWgCPRGcxWQ",
        "#starred/FMfcgzGrcXrRJHsSStwqswkmmMVbmhhN",
        "#snoozed/FMfcgzGsmhgmSZBrHhpDwjWgCPRGcxWQ",
        "#sent/FMfcgzGsmWxxqCZMmqCzQclwWvMNZcJK",
        "#scheduled/KtbxLthNQSSmlnDGTthLnsPgNRzbgtrCcL",
        "#drafts/FMfcgzGsmhgmKJKRHNfmCwbmVbxdpdGf",
        "#imp/FMfcgzGsmhSGtwvkdfbbCsqbMCtpcPFB",
        "#all/KtbxLthNQSSmlnDGTthLnsPgNRzbgtrCcL",
        "#spam/FMfcgzGsmhgmSZBPWfBnMjhjBPZgQbSF",
        "#trash/FMfcgzGsmhgmSZBPWfBnMjhjBPZgQbSF",
      ];

      for (const topLevelEmailThreadPage of topLevelEmailThreadPages) {
        delete window.location;
        window.location = {
          ...originalLocation,
          hash: topLevelEmailThreadPage,
        };
        expect(page.detect()).toBe(true);
      }
    });

    it("detects second-level thread pages in various contexts", () => {
      // Using sample URLs from my GMail:
      const secondLevelEmailThreadPages = [
        "#category/social/FMfcgzGsmhfdkkmpWmCJXwHNbfblxRpm",
        "#category/updates/FMfcgzGsmhgmKJKRHNfmCwbmVbxdpdGf",
        "#category/forums/FMfcgzGsmXDbXxbtJNJNFGQRZgMrCjnH",
        "#category/promotions/FMfcgzGsmhcLDSfWfLpqHrmhvJWjnplW",
        "#label/My+Label/FMfcgxwLsSWMtGrdNwQgnSqZZLhGFbrT",
        "#search/my+search/FMfcgzGsmWtVBtqcfngzFbZVmWlgnVSG",
        "#advanced-search/subset=all&has=my+search&within=1d&sizeoperator=s_sl&sizeunit=s_smb&query=my+search/FMfcgzGsmWtVBtqcfngzFbZVmWlgnVSG"
      ];

      for (const secondLevelEmailThreadPage of secondLevelEmailThreadPages) {
        delete window.location;
        window.location = {
          ...originalLocation,
          hash: secondLevelEmailThreadPage,
        };
        expect(page.detect()).toBe(true);
      }
    });

    it('does not detect "inbox" pages', () => {
      const inboxPages = [
        "#inbox",
        "#starred",
        "#snoozed",
        "#sent",
        "#scheduled",
        "#drafts",
        "#imp",
        "#all",
        "#spam",
        "#trash",
        "#category/social",
        "#category/updates",
        "#category/forums",
        "#category/promotions",
        "#label/My+Label",
        "#search/my+search",
        "#advanced-search/subset=all&has=my+search&within=1d&sizeoperator=s_sl&sizeunit=s_smb&query=my+search"
      ];

      for (const inboxPage of inboxPages) {
        delete window.location;
        window.location = {
          ...originalLocation,
          hash: inboxPage,
        };
        expect(page.detect()).toBe(false);
      }
    });
  });
});
