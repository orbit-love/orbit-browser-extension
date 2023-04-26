import "chrome-extension-async";
import Alpine from "alpinejs";

import {
  ORBIT_API_ROOT_URL,
  OAUTH_CLIENT_ID,
  configureRequest,
} from "../constants";

async function fetchWorkspaces(alpineContext) {
  const url = new URL(`${ORBIT_API_ROOT_URL}/workspaces`);

  console.log(
    "#fetchWorkspaces",
    alpineContext.accessToken,
    alpineContext.token
  );

  const { params, headers } = configureRequest({
    ACCESS_TOKEN: alpineContext.accessToken,
    API_TOKEN: alpineContext.token,
  });

  url.search = params.toString();
  try {
    const response = await fetch(url, {
      headers: headers,
    });
    if (!response.ok) {
      alpineContext.tokenCheckStatus.success = false;
      alpineContext.tokenCheckStatus.message = "The token is invalid.";
      return;
    }
    const { data, included } = await response.json();
    alpineContext.workspaces = data;
    alpineContext.repositories = included.filter(
      (item) => item.type === "repository"
    );
    alpineContext.tokenCheckStatus.success = true;
    alpineContext.tokenCheckStatus.message =
      "The token is valid, please select a workspace.";
  } catch (err) {
    console.error(err);
    alpineContext.tokenCheckStatus.success = false;
    alpineContext.tokenCheckStatus.message =
      "There was an unexpected error while validating the token.";
  }
}

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
      await fetchWorkspaces(this);
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
    async startOAuthFlow(callback) {
      function parse(str) {
        if (typeof str !== "string") {
          return {};
        }
        str = str.trim().replace(/^(\?|#|&)/, "");
        if (!str) {
          return {};
        }
        return str.split("&").reduce(function (ret, param) {
          var parts = param.replace(/\+/g, " ").split("=");
          // Firefox (pre 40) decodes `%3D` to `=`
          // https://github.com/sindresorhus/query-string/pull/37
          var key = parts.shift();
          var val = parts.length > 0 ? parts.join("=") : undefined;
          key = decodeURIComponent(key);
          // missing `=` should be `null`:
          // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
          val = val === undefined ? null : decodeURIComponent(val);
          if (!ret.hasOwnProperty(key)) {
            ret[key] = val;
          } else if (Array.isArray(ret[key])) {
            ret[key].push(val);
          } else {
            ret[key] = [ret[key], val];
          }
          return ret;
        }, {});
      }

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

      const alpineContext = this;

      chrome.identity.launchWebAuthFlow(
        { url: authUrl, interactive: true },
        function (redirectUrl) {
          if (redirectUrl) {
            console.debug("launchWebAuthFlow login successful: ", redirectUrl);
            var parsed = parse(
              redirectUrl.substr(
                chrome.identity.getRedirectURL("oauth2").length + 1
              )
            );
            console.debug(parsed);

            console.debug("Background login complete");
            return callback(parsed.code, codeVerifier, alpineContext); // call the original callback now that we've intercepted what we needed
          } else {
            console.debug(
              "launchWebAuthFlow login failed. Is your redirect URL (" +
                chrome.identity.getRedirectURL("oauth2") +
                ") configured with your OAuth2 provider?"
            );
            return null;
          }
        }.bind(alpineContext)
      );
    },
    async getOAuthToken(oAuthCode, codeVerifier, alpineContext) {
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
        const { access_token, refresh_token } = await response.json();
        chrome.storage.sync.set({
          accessToken: access_token,
          refreshToken: refresh_token,
        });
        const items = await chrome.storage.sync.get({
          accessToken: "",
          refreshToken: "",
        });
        console.log(items);

        await fetchWorkspaces(alpineContext);
      } catch (err) {
        console.error(err);
      }
    },
  }));
});

// Initialise Alpine
window.Alpine = Alpine;
Alpine.start();
