/**
 * Mock the response of an Orbit API call
 *
 * Sample usage:
 *
 *   global.fetch = jest
 *    .fn()
 *    .mockImplementationOnce(mockOrbitAPICall({data: "some data"}, true, 200))
 *
 * @param {*} data the mocked response data
 * @param boolean whether the response was successful (2XX) or not
 * @param int status the status code
 */
export const mockOrbitAPICall = (data = {}, ok = true, status = 200) => {
  return () =>
    Promise.resolve({
      json: () => Promise.resolve(data),
      ok,
      status,
    });
};

/**
 * Mocks the chrome storage object & getter
 * **Important**: At the end of your test, restore the original behaviour
 * by setting global.chrome to the object returned by this function.
 *
 * IE
 * const originalChrome = mockChrome({ key: "123" })
 * ... Your tests
 * global.chrome = originalChrome
 *
 * @param {Object} objectToStore object to put in mock storage
 * @param {Object} runtimeResponse object to return from sendMessage requests
 *
 * @returns {originalChrome} to restore behaviour to global.chrome
 */
export const mockChrome = (objectToStore = {}, runtimeResponse = {}) => {
  const mockChromeStorage = {
    storage: objectToStore,
    get: function (keys) {
      // .get() should return all stored data
      if (!keys) {
        return this.storage;
      }

      const result = {};

      // .get("repository_keys") should just return the stored data for "repository_keys"
      if (typeof keys === "string") {
        result[keys] = this.storage[keys];
        return result;
      }

      // .get({ repository_keys: 123, repositories: 456) should fetch the data for repository_keys
      // & repositories, and, if either is not found, return the default value given in the argument
      Object.keys(keys).forEach((key) => {
        result[key] = this.storage[key] || keys[key];
      });

      return result;
    },
    set: function (items) {
      Object.keys(items).forEach((key) => {
        this.storage[key] = items[key];
      });
    },
  };

  const mockRuntime = {
    sendMessage: jest.fn(() => {
      return new Promise((resolve) => {
        resolve(runtimeResponse);
      });
    }),
  };

  let originalChrome = global.chrome;

  global.chrome = {
    storage: {
      sync: mockChromeStorage,
    },
    runtime: mockRuntime,
  };

  return originalChrome;
};
