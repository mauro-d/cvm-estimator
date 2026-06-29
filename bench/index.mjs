import { fork } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))

/**
 * Run one engine in a forked process (with `--expose-gc`) so heap measurements
 * are clean and isolated from each other.
 *
 * @param {'cvm' | 'exact'} kind
 * @returns {Promise<{ name: string, estimate: string, ram: number, ms: number }>}
 */
function runIsolated (kind) {
  return new Promise((resolve, reject) => {
    const child = fork(join(here, 'worker.mjs'), [kind], {
      execArgv: ['--expose-gc'],
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    })

    let out = ''
    let err = ''
    child.stdout.on('data', (d) => { out += d })
    child.stderr.on('data', (d) => { err += d })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`worker '${kind}' exited with ${code}: ${err}`))
        return
      }
      const last = out.trim().split('\n').at(-1) ?? ''
      if (!last.startsWith('RESULT')) {
        reject(new Error(`unexpected worker output: ${out}`))
        return
      }
      const [, name, estimate, ram, ms] = last.split('|')
      resolve({ name, estimate, ram: parseFloat(ram), ms: parseInt(ms, 10) })
    })
  })
}

async function main () {
  console.log('=== CVM benchmark (isolated processes) ===')
  for (const kind of /** @type {const} */(['exact', 'cvm'])) {
    try {
      const r = await runIsolated(kind)
      const label = kind === 'exact' ? 'EXACT (Set) ' : 'CVM estimate'
      console.log(`[${label}] distinct: ${r.estimate} | RAM: ${r.ram} MB | time: ${r.ms} ms`)
    } catch (e) {
      console.error(`error running '${kind}':`, e instanceof Error ? e.message : e)
    }
  }
}

main()
