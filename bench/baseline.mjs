import { Writable } from 'node:stream'

/** @param {unknown} x */
const identity = (x) => x

/**
 * Exact baseline: keeps every distinct value in a native `Set`. Used only to
 * measure the memory the CVM estimator saves, and to provide the ground-truth
 * F0 to compare the estimate against.
 */
export class ExactDistinctStream extends Writable {
  /** @param {{ keyFn?: (chunk: any) => unknown }} [options] */
  constructor (options = {}) {
    super({ objectMode: true })
    this._keyFn = options.keyFn ?? identity
    this._set = new Set()
  }

  /**
   * @param {any} chunk
   * @param {BufferEncoding} _encoding
   * @param {(error?: Error | null) => void} callback
   */
  _write (chunk, _encoding, callback) {
    this._set.add(this._keyFn(chunk))
    callback()
  }

  get distinct () {
    return this._set.size
  }
}
