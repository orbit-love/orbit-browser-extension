import { _refreshAuthTokens, _isOAuthTokenExpired } from "../oauth-helpers";
import {
  getRepositoryFullName,
  fetchRepositories,
  areCredentialsValid,
} from "./orbit-helpers";

test("areCredentialValid returns false if no workspace present", async () => {
  const ORBIT_CREDENTIALS = {
    WORKSPACE: "",
    API_TOKEN: "present",
    ACCESS_TOKEN: "present",
  };

  expect(areCredentialsValid(ORBIT_CREDENTIALS)).toBe(false);
});

test("areCredentialValid returns true if workspace & API token is present", async () => {
  const ORBIT_CREDENTIALS = {
    WORKSPACE: "present",
    API_TOKEN: "present",
    ACCESS_TOKEN: "",
  };

  expect(areCredentialsValid(ORBIT_CREDENTIALS)).toBe(true);
});

test("areCredentialValid returns true if workspace & OAuth token is present", async () => {
  const ORBIT_CREDENTIALS = {
    WORKSPACE: "present",
    API_TOKEN: "",
    ACCESS_TOKEN: "present",
  };

  expect(areCredentialsValid(ORBIT_CREDENTIALS)).toBe(true);
});
