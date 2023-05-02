import "chrome-extension-async";
import Alpine from "alpinejs";

import { ORBIT_API_ROOT_URL, OAUTH_CLIENT_ID } from "../constants";
import { configureRequest, fetchQueryParams } from "../oauth_helpers";

document.addEventListener("alpine:init", () => {
  Alpine.data("orbit", () => ({
    token: "",
    accessToken: "",
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
      let apiKeyFromStorage,
        selectedWorkspaceSlugFromStorage,
        accessTokenFromStorage;
      let workspaces = [];
      let repositories = [];
      const items = await chrome.storage.sync.get({
        token: "",
        workspace: "",
        accessToken: "",
      });

      apiKeyFromStorage = items.token;
      selectedWorkspaceSlugFromStorage = items.workspace;
      accessTokenFromStorage = items.accessToken;

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
          workspaces = data;
          repositories = included.filter((item) => item.type === "repository");
        } catch (err) {
          console.error(err);
        }
      }
      this.tokenCheckStatus.success = true;
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
    async startOAuthFlow() {
      let config = {
        implicitGrantUrl: "http://localhost:3000/oauth/authorize",
        clientId: OAUTH_CLIENT_ID,
        responseType: "code",
        scopes: "read write",
        codeChallengeMethod: "S256",
      };

      console.log(chrome.identity.getRedirectURL("oauth2"));

      let codeVerifier = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

      async function digestMessage(message) {
        const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
        let base64String = encodeURI(
          btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
        );
        base64String = base64String.split("=")[0];
        base64String = base64String.replace("+", "-");
        base64String = base64String.replace("/", "_");

        return base64String;
      }

      let codeChallenge = await digestMessage(codeVerifier);
      console.log({ codeChallenge });

      let authUrl =
        config.implicitGrantUrl +
        "?response_type=" +
        config.responseType +
        "&client_id=" +
        config.clientId +
        "&scope=" +
        config.scopes +
        "&redirect_uri=" +
        chrome.identity.getRedirectURL("oauth2") +
        "&code_challenge=" +
        codeChallenge +
        "&code_challenge_method=" +
        config.codeChallengeMethod;

      console.debug("launchWebAuthFlow:", authUrl);

      chrome.identity.launchWebAuthFlow(
        { url: authUrl, interactive: true },
        function (redirectUrl) {
          if (redirectUrl) {
            console.debug("launchWebAuthFlow login successful: ", redirectUrl);
            var parsed = fetchQueryParams(redirectUrl);
            console.log("query params", parsed);

            console.debug("Background login complete");
            return this.getOAuthToken(parsed.code, codeVerifier); // call the original callback now that we've intercepted what we needed
          } else {
            console.debug(
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
      console.log("in getOAuthToken");
      console.log({ codeVerifier });
      console.log({ oAuthCode });

      let config = {
        implicitGrantUrl: "http://localhost:3000/oauth/token",
        clientId: OAUTH_CLIENT_ID,
        grantType: "authorization_code",
      };

      let authUrl =
        config.implicitGrantUrl +
        "?grant_type=" +
        config.grantType +
        "&client_id=" +
        config.clientId +
        "&code=" +
        oAuthCode +
        "&code_verifier=" +
        codeVerifier +
        "&redirect_uri=" +
        chrome.identity.getRedirectURL("oauth2");

      try {
        const response = await fetch(authUrl, {
          method: "POST",
        });

        const { access_token, refresh_token, expires_in } =
          await response.json();

        // Calculate timestamp when OAuth token expires - current time + it's expires_in timestamp
        const expiresAt = Math.floor(Date.now() / 1000) + expires_in;

        chrome.storage.sync.set({
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: expiresAt,
        });

        this.accessToken = access_token;
        this.refreshToken = refresh_token;
        this.expiresAt = expiresAt;

        const items = await chrome.storage.sync.get({
          accessToken: "",
          refreshToken: "",
          expiresAt: "",
        });
        console.log(items);

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
