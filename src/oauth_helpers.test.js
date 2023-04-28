import { ORBIT_HEADERS } from "./constants";
import { configureRequest } from "./oauth_helpers";

test("configureRequest should use the OAuth token and not the API key if it is present", async () => {
  const ORBIT_CREDENTIALS = {
    ACCESS_TOKEN: "123",
  };

  const testParams = {
    additionalParam: "789",
  };

  const testHeaders = {
    additionalHeader: "456",
  };

  const { headers, params } = configureRequest(
    ORBIT_CREDENTIALS,
    testParams,
    testHeaders
  );

  expect(headers).toEqual({
    ...ORBIT_HEADERS,
    ...testHeaders,
    Authorization: "Bearer 123",
  });

  expect(params.toString()).toMatch("additionalParam=789");
});

test("configureRequest should use the API key if OAuth token is not present", async () => {
  const ORBIT_CREDENTIALS = {
    API_TOKEN: "123",
  };

  const testParams = {
    additionalParam: "789",
  };

  const testHeaders = {
    additionalHeader: "456",
  };

  const { headers, params } = configureRequest(
    ORBIT_CREDENTIALS,
    testParams,
    testHeaders
  );

  expect(headers).toEqual({
    ...ORBIT_HEADERS,
    ...testHeaders,
  });

  expect(params.toString()).toMatch("additionalParam=789");
  expect(params.toString()).toMatch("api_key=123");
});
