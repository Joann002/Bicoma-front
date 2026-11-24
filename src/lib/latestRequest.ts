/** Abort for efficiency and also invalidate, since adapters may finish after cancellation. */
export function latestRequest() {
  let revision = 0
  let controller: AbortController | undefined
  function cancel() {
    revision++
    controller?.abort()
    controller = undefined
  }
  function start() {
    cancel()
    const current = revision
    controller = new AbortController()
    return { signal: controller.signal, current: () => current === revision }
  }
  return { start, cancel }
}
