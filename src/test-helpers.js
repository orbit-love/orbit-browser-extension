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
