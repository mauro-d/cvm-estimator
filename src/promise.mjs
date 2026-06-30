import { CVM } from './cvm.mjs'

const identity = (x) => x

// Promise API: estimate distinct values in any sync iterable, async iterable,
// or Readable. Async sources use `for await` (which also destroys a Readable on
// early exit); sync iterables avoid per-item await. The returned promise is the
// single error channel: it rejects on a source, keyFn, or algorithm error.
export async function estimateDistinct (source, options = {}) {
  const { keyFn = identity, ...cvmOptions } = options
  if (typeof keyFn !== 'function') throw new TypeError('keyFn must be a function')

  const cvm = new CVM(cvmOptions)

  if (source != null && typeof source[Symbol.asyncIterator] === 'function') {
    for await (const chunk of source) cvm.add(keyFn(chunk))
  } else if (source != null && typeof source[Symbol.iterator] === 'function') {
    for (const chunk of source) cvm.add(keyFn(chunk))
  } else {
    throw new TypeError('source must be iterable, async-iterable, or a Readable stream')
  }

  return cvm.result()
}
