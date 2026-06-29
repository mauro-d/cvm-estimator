// ⚠ Used ONLY by the original algorithm (src/cvm-original.mjs). The new variant is
// total and never throws this. Delete this file together with the original (see
// the deletion checklist in CLAUDE.md).
//
// The ⊥ outcome of Algorithm 1: after sub-sampling, the sample set is still full.
// Provably rare (probability ≤ δ/8); usually means expectedSize was set too low.
export class CVMFailureError extends Error {
  constructor (threshold) {
    super(
      `CVM failed (⊥): the sample set stayed full (|X| = ${threshold}) after ` +
      'sub-sampling (probability ≤ δ/8). Retry with a different seed, a larger ' +
      'epsilon, or a more accurate expectedSize.'
    )
    this.name = 'CVMFailureError'
    this.code = 'CVM_FAILURE'
    this.threshold = threshold
  }
}
