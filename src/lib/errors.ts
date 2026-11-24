import { isAxiosError, isCancel } from 'axios'
export function isCancelled(error: unknown): boolean {
  return isCancel(error) || (error instanceof DOMException && error.name === 'AbortError')
}
export function errorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')
      return 'Le délai de réponse est dépassé. Vérifiez le résultat avant de réessayer.'
    if (!error.response)
      return 'Connexion au serveur impossible. Vérifiez votre connexion puis réessayez.'
    const status = error.response.status
    if (status === 401) return 'Votre session a expiré. Reconnectez-vous.'
    if (status === 403) return 'Vous ne pouvez pas effectuer cette action.'
    if (status === 404) return 'Cet élément est introuvable ou a été supprimé.'
    if (status === 429) return 'Trop de demandes. Patientez avant de réessayer.'
    const data: unknown = error.response.data
    if (
      status < 500 &&
      data &&
      typeof data === 'object' &&
      'message' in data &&
      typeof data.message === 'string'
    )
      return data.message.slice(0, 500)
    return 'Le serveur ne peut pas répondre. Réessayez dans un instant.'
  }
  return error instanceof Error ? error.message : 'Une erreur est survenue. Réessayez.'
}
export function validationErrors(error: unknown): Record<string, string[]> {
  if (!isAxiosError(error) || error.response?.status !== 422) return {}
  const errors: unknown = error.response.data?.errors
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return {}
  return Object.fromEntries(
    Object.entries(errors).flatMap(([key, value]) =>
      Array.isArray(value) && value.every((v) => typeof v === 'string')
        ? [[key, value.map((v) => v.slice(0, 500))]]
        : [],
    ),
  )
}
