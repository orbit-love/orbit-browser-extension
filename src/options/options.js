import "chrome-extension-async";
import Alpine from "alpinejs";

import { ORBIT_API_ROOT_URL, OAUTH_CLIENT_ID } from "../constants";
import {
  configureRequest,
  generateCodeChallenge,
  generateCodeVerifier,
  parseQueryParams as parseQueryParams,
} from "../oauth-helpers";
import { getOrbitCredentials } from "../oauth-helpers";

document.addEventListener("alpine:init", () => {
  Alpine.data("orbit", () => ({
    token: "",
    accessToken: "",
    workspaces: [],
    repositories: [],
    selectedWorkspaceSlug: undefined,
    showLogin: true,
    authenticationCheckStatus: {
      status: undefined,
      message: "",
    },
    saveStatus: {
      success: undefined,
      message: "",
    },
    async init() {
      let apiKeyFromStorage,
        selectedWorkspaceSlugFromStorage,
        accessTokenFromStorage;
      let workspaces = [];
      let repositories = [];

      const ORBIT_CREDENTIALS = await getOrbitCredentials();

      apiKeyFromStorage = ORBIT_CREDENTIALS.API_TOKEN;
      selectedWorkspaceSlugFromStorage = ORBIT_CREDENTIALS.WORKSPACE;
      accessTokenFromStorage = ORBIT_CREDENTIALS.ACCESS_TOKEN;

      // If authentication is present, fetch workspaces on page load
      if (!!apiKeyFromStorage || !!accessTokenFromStorage) {
        const url = new URL(`${ORBIT_API_ROOT_URL}/workspaces`);

        const { params, headers } = configureRequest({
          ACCESS_TOKEN: accessTokenFromStorage,
          API_TOKEN: apiKeyFromStorage,
        });

        url.search = params.toString();

        try {
          const response = await fetch(url, {
            headers: headers,
          });
          const { data, included } = await response.json();

          // Give users with API token chance to switch to OAuth
          if (!!accessTokenFromStorage) this.showLogin = false;

          workspaces = data;
          repositories = included.filter((item) => item.type === "repository");
        } catch (err) {
          console.error(err);
        }
      }
      this.authenticationCheckStatus.status = "success";
      this.token = apiKeyFromStorage;
      this.accessToken = accessTokenFromStorage;
      this.selectedWorkspaceSlug = selectedWorkspaceSlugFromStorage;
      this.workspaces = workspaces;
      this.repositories = repositories;
    },
    async fetchWorkspaces() {
      const url = new URL(`${ORBIT_API_ROOT_URL}/workspaces`);

      const { params, headers } = configureRequest({
        ACCESS_TOKEN: this.accessToken,
        API_TOKEN: this.token,
      });

      url.search = params.toString();

      try {
        const response = await fetch(url, {
          headers: headers,
        });
        if (!response.ok) {
          this.showLogin = true;
          this.authenticationCheckStatus.status = "error";
          this.authenticationCheckStatus.message =
            "Failed to authenticate, please try again.";
          return;
        }
        const { data, included } = await response.json();
        this.workspaces = data;
        this.repositories = included.filter(
          (item) => item.type === "repository"
        );
        this.authenticationCheckStatus.status = "success";
        this.authenticationCheckStatus.message =
          "Signed in successfully. Please select a workspace.";

        if (!!this.accessToken) {
          this.showLogin = false;
        } else {
          this.authenticationCheckStatus.message =
            "WARNING: You are using an API token for authentication, which is deprecated. Use the button above to switch to the new sign in process.";
          this.authenticationCheckStatus.status = "warning";
        }
      } catch (err) {
        console.error(err);
        this.showLogin = true;
        this.authenticationCheckStatus.status = "error";
        this.authenticationCheckStatus.message =
          "There was an unexpected error while signing in.";
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
    _buildStorageObject(workspaceSlug, repositories) {
      const storageObject = {};
      const repository_keys = this._persistRepositories(
        workspaceSlug,
        repositories
      );

      // Set common variables
      storageObject["workspace"] = workspaceSlug;
      storageObject["repository_keys"] = repository_keys;

      return storageObject;
    },
    save() {
      let that = this;
      let repositoriesFullNameForWorkspace =
        this._findAllReposFullNameByWorkspaceSlug();

      let storageData = this._buildStorageObject(
        this.selectedWorkspaceSlug,
        repositoriesFullNameForWorkspace
      );

      chrome.storage.sync.set(storageData, function () {
        that.saveStatus.success = true;
        that.saveStatus.message =
          "Saved successfully, you can close this page.";
      });
    },
    async startOAuthFlow() {
      let codeVerifier = generateCodeVerifier();
      let codeChallenge = await generateCodeChallenge(codeVerifier);

      let authUrl = new URL(`${ORBIT_API_ROOT_URL}/oauth/authorize`);

      let params = new URLSearchParams({
        client_id: OAUTH_CLIENT_ID,
        response_type: "code",
        scopes: "read write",
        code_challenge_method: "S256",
        redirect_uri: chrome.identity.getRedirectURL("oauth2"),
        code_challenge: codeChallenge,
      });

      authUrl.search = params.toString();

      chrome.identity.launchWebAuthFlow(
        { url: authUrl.toString(), interactive: true },
        function (redirectUrl) {
          if (redirectUrl) {
            var parsed = parseQueryParams(redirectUrl);

            return this.getOAuthToken(parsed.code, codeVerifier);
          } else {
            // TODO: Verify failure routes from OAuth
            console.error(
              "launchWebAuthFlow login failed. Is your redirect URL (" +
                chrome.identity.getRedirectURL("oauth2") +
                ") configured with your OAuth2 provider?"
            );
            return null;
          }
        }.bind(this)
      );
    },
    async getOAuthToken(oAuthCode, codeVerifier) {
      let authUrl = new URL(`${ORBIT_API_ROOT_URL}/oauth/token`);

      let params = new URLSearchParams({
        client_id: OAUTH_CLIENT_ID,
        grant_type: "authorization_code",
        code: oAuthCode,
        code_verifier: codeVerifier,
        redirect_uri: chrome.identity.getRedirectURL("oauth2"),
      });

      authUrl.search = params.toString();

      try {
        const response = await fetch(authUrl.toString(), {
          method: "POST",
        });

        const { access_token, refresh_token, expires_in } =
          await response.json();

        // Calculate timestamp when OAuth token expires - current time + it's expires_in timestamp
        const expiresAt = Math.floor(Date.now() / 1000) + expires_in;

        chrome.storage.sync.set({
          authentication: {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: expiresAt,
          },
        });

        this.accessToken = access_token;
        this.refreshToken = refresh_token;
        this.expiresAt = expiresAt;

        await this.fetchWorkspaces();
      } catch (err) {
        console.error(err);
      }
    },
  }));
});

// Initialise Alpine
window.Alpine = Alpine;
Alpine.start();
