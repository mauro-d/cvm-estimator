import { Writable } from 'node:stream'
import { CVM } from './cvm.mjs'

const identity = (x) => x

// Stream API: a Writable sink (object mode, one element per write) that estimates
// distinct elements as you pipe into it. Read result() once it has finished. A
// keyFn error surfaces once via the 'error' event, which also rejects pipeline()
// / finished().
export class DistinctEstimateStream extends Writable {
  constructor (options = {}) {
    const { keyFn = identity, objectMode = true, highWaterMark, ...cvmOptions } = options
    if (typeof keyFn !== 'function') throw new TypeError('keyFn must be a function')

    super({ objectMode, highWaterMark })
    this._cvm = new CVM(cvmOptions)
    this._keyFn = keyFn
  }

  _write (chunk, _encoding, callback) {
    try {
      this._cvm.add(this._keyFn(chunk))
    } catch (err) {
      callback(err)
      return
    }
    callback()
  }

  result () {
    return this._cvm.result()
  }

  get distinct () {
    return this._cvm.distinct
  }

  get threshold () {
    return this._cvm.threshold
  }
}
