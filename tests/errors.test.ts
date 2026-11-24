import { expect, it } from 'vitest'
import { AxiosError } from 'axios'
import { errorMessage, validationErrors, isCancelled } from '@/lib/errors'
function error(status: number, data: unknown = {}) {
  return new AxiosError('error', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: {} as never,
    data,
  })
}
it('reports action-oriented HTTP and network failures without server stack traces', () => {
  expect(errorMessage(error(401))).toMatch(/session/)
  expect(errorMessage(error(429))).toMatch(/Patientez/)
  expect(errorMessage(error(500, { message: 'internal secret' }))).not.toContain('secret')
  expect(errorMessage(new AxiosError('offline', 'ERR_NETWORK'))).toMatch(/Connexion/)
  expect(errorMessage(new AxiosError('timeout', 'ECONNABORTED'))).toMatch(/délai/)
})
it('copies only valid Laravel validation arrays and recognizes cancellation', () => {
  expect(validationErrors(error(422, { errors: { title: ['required'], bad: 'text' } }))).toEqual({
    title: ['required'],
  })
  expect(validationErrors(error(500, { errors: { title: ['secret'] } }))).toEqual({})
  expect(isCancelled(new DOMException('aborted', 'AbortError'))).toBe(true)
})
