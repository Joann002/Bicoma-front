import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import ItemDetailView from '@/views/ItemDetailView.vue'
import ItemFormView from '@/views/ItemFormView.vue'
import { api } from '@/lib/api'
import { item } from './fixtures'
import { useToast } from '@/composables/useToast'
vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
let wrapper: ReturnType<typeof mount> | undefined
beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(api.get).mockReset()
})
afterEach(() => {
  wrapper?.unmount()
  useToast().clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
it('reloads a detail when its ID changes without reusing the previous item', async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/items/:id', name: 'item-detail', component: ItemDetailView },
      { path: '/', name: 'shelf', component: { template: '<p>Shelf</p>' } },
      { path: '/items/:id/edit', name: 'item-edit', component: { template: '<p>Edit</p>' } },
    ],
  })
  vi.mocked(api.get)
    .mockResolvedValueOnce({ data: { data: item(1, 'First') } })
    .mockResolvedValueOnce({ data: { data: item(2, 'Second') } })
  await router.push('/items/1')
  wrapper = mount(RouterView, { global: { plugins: [router] } })
  await flushPromises()
  expect(wrapper.find('h1').text()).toBe('First')
  await router.push('/items/2')
  await flushPromises()
  expect(wrapper.find('h1').text()).toBe('Second')
  expect(wrapper.text()).not.toContain('First')
})
it('does not show an empty editor after a failed load and offers explicit retry', async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/items/:id/edit', name: 'item-edit', component: ItemFormView },
      { path: '/', name: 'shelf', component: { template: '<p>Shelf</p>' } },
    ],
  })
  vi.mocked(api.get)
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce({ data: { data: item(1, 'Recovered') } })
  await router.push('/items/1/edit')
  wrapper = mount(RouterView, { global: { plugins: [router] } })
  await flushPromises()
  expect(wrapper.find('form').exists()).toBe(false)
  expect(wrapper.find('[role="alert"]').text()).toContain('Offline')
  await wrapper.find('[role="alert"] button').trigger('click')
  await flushPromises()
  expect((wrapper.find('#title').element as HTMLInputElement).value).toBe('Recovered')
})
it('asks before a dirty editor changes IDs and keeps the draft when cancelled', async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/items/:id/edit', name: 'item-edit', component: ItemFormView },
      { path: '/', name: 'shelf', component: { template: '<p>Shelf</p>' } },
    ],
  })
  vi.mocked(api.get).mockResolvedValue({ data: { data: item(1, 'Original') } })
  await router.push('/items/1/edit')
  wrapper = mount(RouterView, { global: { plugins: [router] } })
  await flushPromises()
  await wrapper.find('#title').setValue('Unsaved')
  const confirm = vi.fn(() => false)
  vi.stubGlobal('confirm', confirm)
  await router.push('/items/2/edit')
  expect(router.currentRoute.value.params.id).toBe('1')
  expect((wrapper.find('#title').element as HTMLInputElement).value).toBe('Unsaved')
  expect(confirm).toHaveBeenCalledOnce()
})
