import { describe, it, expect } from 'vitest'
import { pathToFileURL } from 'node:url'
import * as fs from 'node:fs'
import * as path from 'node:path'

describe('vite6-minimal post-build', () => {
  it('build outputs index.html', () => {
    expect(fs.existsSync(path.resolve('dist', 'index.html'))).toBe(true)
  })

  it('api bundle can be imported', async () => {
    const apiBundle = path.resolve('dist', 'vitek-api.mjs')
    expect(fs.existsSync(apiBundle)).toBe(true)
    const mod = await import(pathToFileURL(apiBundle).href)
    expect(Array.isArray(mod.routes)).toBe(true)
  })

  it('resolves vitek-plugin subpath exports', async () => {
    const response = await import('vitek-plugin/response')
    expect(typeof response.ok).toBe('function')
    const plugin = await import('vitek-plugin/plugin')
    expect(typeof plugin.vitek).toBe('function')
  })
})

