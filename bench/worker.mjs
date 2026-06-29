import { pipeline } from 'node:stream/promises'
import { DistinctEstimateStream } from '../src/index.mjs'
import { createTokenStream } from './sources.mjs'
import { ExactDistinctStream } from './baseline.mjs'

const TOTAL = Number(process.env.BENCH_TOTAL ?? 50_000_000)
const UNIQUE = Number(process.env.BENCH_UNIQUE ?? 10_000_000)
const SEED = Number(process.env.BENCH_SEED ?? 42)

/**
 * Run a single engine in this (isolated) process and print one RESULT line:
 * `RESULT|<name>|<estimate>|<ramMB>|<ms>`.
 *
 * @param {'cvm' | 'exact'} kind
 */
async function run (kind) {
  // Both engines are driven through the same pipeline so transient allocation is
  // identical; the only difference measured is the *retained* set (sample set vs
  // the full distinct set). A GC right before measuring isolates retained memory.
  if (global.gc) global.gc()
  const source = createTokenStream(TOTAL, UNIQUE, SEED)
  // No fixed seed for the estimator: use the production default (Math.random) so
  // the benchmark shows an honest, freshly-drawn estimate each run rather than a
  // single repeated deterministic draw. SEED only fixes the synthetic workload.
  const sink = kind === 'cvm'
    ? new DistinctEstimateStream({ epsilon: 0.05, delta: 0.01, expectedSize: TOTAL })
    : new ExactDistinctStream()

  const memBefore = process.memoryUsage().heapUsed
  const start = performance.now()
  await pipeline(source, sink)
  const ms = performance.now() - start

  if (global.gc) global.gc()
  const ramMB = (process.memoryUsage().heapUsed - memBefore) / 1024 / 1024
  const estimate = sink.distinct
  console.log(`RESULT|${kind}|${estimate.toFixed(0)}|${ramMB.toFixed(2)}|${ms.toFixed(0)}`)
}

const kind = process.argv[2]
if (kind !== 'cvm' && kind !== 'exact') {
  console.error('usage: worker.mjs <cvm|exact>')
  process.exit(1)
}

run(kind).catch((err) => {
  console.error(err)
  process.exit(1)
})
