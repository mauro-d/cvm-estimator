import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { DistinctEstimateStream } from '../src/index.mjs'

test('counts distinct elements piped through it (exact for small input)', async () => {
  const values = ['a', 'b', 'a', 'c', 'b', 'a']
  const counter = new DistinctEstimateStream({ epsilon: 0.5, delta: 0.1, expectedSize: 100, seed: 1 })
  await pipeline(Readable.from(values), counter)
  assert.equal(counter.result().estimate, 3)
  assert.equal(counter.distinct, 3)
})

test('keyFn maps objects to their distinct key', async () => {
  const orders = [
    { user: 'u1' }, { user: 'u2' }, { user: 'u1' }, { user: 'u3' }
  ]
  const counter = new DistinctEstimateStream({
    epsilon: 0.5,
    delta: 0.1,
    expectedSize: 100,
    seed: 1,
    keyFn: (o) => o.user
  })
  await pipeline(Readable.from(orders), counter)
  assert.equal(counter.result().estimate, 3)
})

test('rejects keyFn that is not a function', () => {
  assert.throws(() => new DistinctEstimateStream({ keyFn: 5 }), TypeError)
})

test('propagates a source error through pipeline (single channel)', async () => {
  const boom = new Error('source boom')
  const source = new Readable({
    objectMode: true,
    read () { this.destroy(boom) }
  })
  const counter = new DistinctEstimateStream({ epsilon: 0.5, delta: 0.1, expectedSize: 100, seed: 1 })
  await assert.rejects(pipeline(source, counter), /source boom/)
})

test('propagates a keyFn error exactly once (no double reporting)', async () => {
  const counter = new DistinctEstimateStream({
    epsilon: 0.5,
    delta: 0.1,
    expectedSize: 100,
    keyFn: (x) => { if (x === 'bad') throw new Error('keyFn boom'); return x }
  })
  const errors = []
  counter.on('error', (e) => errors.push(e))

  await assert.rejects(pipeline(Readable.from(['a', 'bad', 'c']), counter), /keyFn boom/)
  assert.equal(errors.length, 1, 'error must be emitted exactly once')
  assert.equal(counter.destroyed, true)
})
