import "chrome-extension-async";

import { ORBIT_API_ROOT_URL, ORBIT_HEADERS } from "../constants";

window.orbit = () => ({
  token: "",
  workspaces: [],
  selectedWorkspace: undefined,
  tokenCheckStatus: {
    success: undefined,
    message: "",
  },
  saveStatus: {
    success: undefined,
    message: "",
  },
  async init() {
    let tokenFromStorage;
    let selectedWorkspaceFromStorage;
    let workspaces = [];
    const items = await chrome.storage.sync.get({
      token: "",
      workspace: "",
    });
    tokenFromStorage = items.token;
    selectedWorkspaceFromStorage = items.workspace;
    if (tokenFromStorage) {
      try {
        const response = await fetch(
          `${ORBIT_API_ROOT_URL}/workspaces?api_key=${tokenFromStorage}`,
          {
            headers: { ...ORBIT_HEADERS },
          }
        );
        const { data } = await response.json();
        workspaces = data;
      } catch (err) {
        console.error(err);
      }
    }
    this.tokenCheckStatus.success = true;
    this.token = tokenFromStorage;
    this.selectedWorkspace = selectedWorkspaceFromStorage;
    this.workspaces = workspaces;
  },
  async fetchWorkspaces() {
    try {
      const response = await fetch(
        `${ORBIT_API_ROOT_URL}/workspaces?api_key=${this.token}`,
        {
          headers: { ...ORBIT_HEADERS },
        }
      );
      if (!response.ok) {
        this.tokenCheckStatus.success = false;
        this.tokenCheckStatus.message = "The token is invalid.";
        return;
      }
      const { data } = await response.json();
      this.workspaces = data;
      this.tokenCheckStatus.success = true;
      this.tokenCheckStatus.message =
        "The token is valid, please select a workspace.";
    } catch (err) {
      console.error(err);
      this.tokenCheckStatus.success = false;
      this.tokenCheckStatus.message =
        "There was an unexpected error while validating the token.";
    }
  },
  save() {
    let that = this;
    chrome.storage.sync.set(
      {
        token: this.token,
        workspace: this.selectedWorkspace,
      },
      function () {
        that.saveStatus.success = true;
        that.saveStatus.message =
          "Saved successfully, you can close this page.";
      }
    );
  },
});
