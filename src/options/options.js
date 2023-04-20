import "chrome-extension-async";
import Alpine from "alpinejs";

import { ORBIT_API_ROOT_URL, ORBIT_HEADERS } from "../constants";

window.orbit = () => ({
  token: "",
  workspaces: [],
  repositories: [],
  selectedWorkspaceSlug: undefined,
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
    let selectedWorkspaceSlugFromStorage;
    let workspaces = [];
    let repositories = [];
    const items = await chrome.storage.sync.get({
      token: "",
      workspace: "",
    });
    tokenFromStorage = items.token;
    selectedWorkspaceSlugFromStorage = items.workspace;
    if (tokenFromStorage) {
      try {
        const response = await fetch(
          `${ORBIT_API_ROOT_URL}/workspaces?api_key=${tokenFromStorage}`,
          {
            headers: { ...ORBIT_HEADERS },
          }
        );
        const { data, included } = await response.json();
        workspaces = data;
        repositories = included.filter((item) => item.type === "repository");
      } catch (err) {
        console.error(err);
      }
    }
    this.tokenCheckStatus.success = true;
    this.token = tokenFromStorage;
    this.selectedWorkspaceSlug = selectedWorkspaceSlugFromStorage;
    this.workspaces = workspaces;
    this.repositories = repositories;
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
      const { data, included } = await response.json();
      this.workspaces = data;
      this.repositories = included.filter((item) => item.type === "repository");
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
  _findAllReposFullNameByWorkspaceSlug() {
    const currentWorkspace = this.workspaces.filter(
      (item) => item.attributes.slug === this.selectedWorkspaceSlug
    )[0];
    const allRepoIdsForCurrentWorkspace =
      currentWorkspace.relationships.repositories.data.reduce(
        (repoIdsAccumulator, repositoryData) =>
          (repoIdsAccumulator = repoIdsAccumulator.concat([repositoryData.id])),
        []
      );
    const result = allRepoIdsForCurrentWorkspace.map(
      (repositoryId) =>
        this.repositories.filter(
          (repository) => repository.id === repositoryId
        )[0].attributes.full_name
    );
    return result;
  },
  save() {
    let that = this;
    let repositoriesFullNameForWorkspace =
      this._findAllReposFullNameByWorkspaceSlug();
    chrome.storage.sync.set(
      {
        token: this.token,
        workspace: this.selectedWorkspaceSlug,
        repositories: repositoriesFullNameForWorkspace,
      },
      function () {
        that.saveStatus.success = true;
        that.saveStatus.message =
          "Saved successfully, you can close this page.";
      }
    );
  },
});

// Initialise Alpine
window.Alpine = Alpine;
Alpine.start();
