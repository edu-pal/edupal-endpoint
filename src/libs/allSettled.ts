/**
 * Polyfill for Promise.allSettled which only supports Node 12.9+
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
 */
const allSettled = (promises: Promise<unknown>[]): Promise<unknown> =>
  Promise.all(
    promises.map((p) =>
      p
        .then((value) => ({
          status: 'fulfilled',
          value,
        }))
        .catch((error) => ({
          status: 'rejected',
          reason: error,
        }))
    )
  );

export default allSettled;
