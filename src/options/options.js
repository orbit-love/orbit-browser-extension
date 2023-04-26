import "chrome-extension-async";
import Alpine from "alpinejs";

import { ORBIT_API_ROOT_URL, ORBIT_HEADERS } from "../constants";

document.addEventListener("alpine:init", () => {
  Alpine.data("orbit", () => ({
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
        this.repositories = included.filter(
          (item) => item.type === "repository"
        );
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
            (repoIdsAccumulator = repoIdsAccumulator.concat([
              repositoryData.id,
            ])),
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
    /**
     * Break array of repositories into chunks of 100, and
     * store them independently in Chrome storage
     *
     * @param {String} workspaceSlug the slug of the Orbit workspace, used to generate a key for the repositories
     * @param {Array<String>} repositories the un-chunked array of repository names
     *
     * @returns Array<String> the addresses of the chunked repositories
     */
    _persistRepositories(workspaceSlug, repositories) {
      // Addresses of the chunked repositories so we can retrieve them later
      let repository_keys = [];
      let counter = 1;

      // If there are 240 repositories for workspace "sally", they will be saved as:
      //
      // sally:repositories:1 // Repositories 0-100
      // sally:repositories:2 // Repositories 101-200
      // sally:repositories:3 // Repositories 201-240
      while (repositories.length > 0) {
        let key = `${workspaceSlug}:repositories:${counter}`;

        repository_keys.push(key);
        chrome.storage.sync.set({
          [key]: repositories.splice(0, 100),
        });
        counter++;
      }

      return repository_keys;
    },
    /**
     * Build the object of data to persist, including:
     * - token: the users API token
     * - workspace: slug of the selected workspace
     * - repository_keys: addresses of the chunked repositories
     *
     * @param {String} token the users API token
     * @param {String} workspaceSlug the slug of the Orbit workspace, used to generate a key for the repositories
     * @param {Array<String>} repositories the un-chunked array of repository names
     *
     * @returns {token, workspace, repository_keys}
     */
    _buildStorageObject(token, workspaceSlug, repositories) {
      const storageObject = {};
      const repository_keys = this._persistRepositories(
        workspaceSlug,
        repositories
      );

      // Set common variables
      storageObject["token"] = token;
      storageObject["workspace"] = workspaceSlug;
      storageObject["repository_keys"] = repository_keys;

      return storageObject;
    },
    save() {
      let that = this;
      let repositoriesFullNameForWorkspace =
        this._findAllReposFullNameByWorkspaceSlug();

      let storageData = this._buildStorageObject(
        this.token,
        this.selectedWorkspaceSlug,
        repositoriesFullNameForWorkspace
      );

      chrome.storage.sync.set(storageData, function () {
        that.saveStatus.success = true;
        that.saveStatus.message =
          "Saved successfully, you can close this page.";
      });
    },
  }));
});

// Initialise Alpine
window.Alpine = Alpine;
Alpine.start();
