// Benchmark scenarios for `npm run bench`. Each entry runs the exact Set
// baseline and the CVM estimator through the same pipeline, in its own
// isolated forked process. Add or edit entries here only.
export const scenarios = [
  // Scale series (epsilon fixed at 0.05): shows how the gap changes with cardinality.
  { name: 'small (2M / ~400K unique)', total: 2_000_000, unique: 400_000, epsilon: 0.05, delta: 0.01, seed: 42 },
  { name: 'medium (10M / ~2M unique)', total: 10_000_000, unique: 2_000_000, epsilon: 0.05, delta: 0.01, seed: 42 },
  { name: 'large (50M / ~10M unique)', total: 50_000_000, unique: 10_000_000, epsilon: 0.05, delta: 0.01, seed: 42 },
  // Epsilon series (scale fixed at medium): isolates the accuracy/memory trade-off.
  { name: 'medium, epsilon=0.10', total: 10_000_000, unique: 2_000_000, epsilon: 0.10, delta: 0.01, seed: 42 },
  { name: 'medium, epsilon=0.20', total: 10_000_000, unique: 2_000_000, epsilon: 0.20, delta: 0.01, seed: 42 }
]
