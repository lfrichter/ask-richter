export class SanityTimeoutError extends Error {
  constructor(message = 'Sanity request timed out after 2500ms') {
    super(message)
    this.name = 'SanityTimeoutError'
  }
}

export class SanityRequestError extends Error {
  public statusCode?: number
  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'SanityRequestError'
    this.statusCode = statusCode
  }
}

export interface SanityClientConfig {
  projectId?: string
  dataset?: string
  apiVersion?: string
  timeoutMs?: number
  fetchFn?: typeof fetch
}

export class SanityServerClient {
  private readonly projectId: string
  private readonly dataset: string
  private readonly apiVersion: string
  private readonly timeoutMs: number
  private readonly fetchFn: typeof fetch

  constructor(config: SanityClientConfig = {}) {
    this.projectId = config.projectId || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'q19ey6yx'
    this.dataset = config.dataset || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
    this.apiVersion = config.apiVersion || '2024-01-01'
    this.timeoutMs = config.timeoutMs || 2500
    this.fetchFn = config.fetchFn || fetch
  }

  public getEndpoint(): string {
    return `https://${this.projectId}.api.sanity.io/v${this.apiVersion}/data/query/${this.dataset}`
  }

  public async fetch<T = any>(
    query: string,
    params: Record<string, any> = {},
    optionsOrTimeout?: number | { signal?: AbortSignal; timeoutMs?: number }
  ): Promise<T> {
    const timeout = typeof optionsOrTimeout === 'number'
      ? optionsOrTimeout
      : optionsOrTimeout?.timeoutMs || this.timeoutMs
    const externalSignal = typeof optionsOrTimeout === 'object' ? optionsOrTimeout?.signal : undefined

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort()
      } else {
        externalSignal.addEventListener('abort', () => controller.abort())
      }
    }

    try {
      const response = await this.fetchFn(this.getEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, params }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new SanityRequestError(
          `Sanity API error (${response.status}): ${errorText}`,
          response.status
        )
      }

      const json = await response.json()
      return json.result as T
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        throw new SanityTimeoutError(`Sanity query timed out after ${timeout}ms`)
      }
      if (err instanceof SanityRequestError || err instanceof SanityTimeoutError) {
        throw err
      }
      throw new SanityRequestError(`Sanity transport error: ${err.message || String(err)}`)
    } finally {
      clearTimeout(timer)
    }
  }
}
