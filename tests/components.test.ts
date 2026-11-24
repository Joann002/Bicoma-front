import { afterEach, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RatingStars from '@/components/RatingStars.vue'
import PageControls from '@/components/PageControls.vue'
import ItemCard from '@/components/ItemCard.vue'
import ErrorNotice from '@/components/ErrorNotice.vue'
import { item } from './fixtures'
let wrapper: ReturnType<typeof mount> | undefined
afterEach(() => wrapper?.unmount())
it('read-only cards contain neither private links nor nested rating buttons', () => {
  wrapper = mount(ItemCard, { props: { item: { ...item(), rating: 4 }, readOnly: true } })
  expect(wrapper.find('a').exists()).toBe(false)
  expect(wrapper.find('button').exists()).toBe(false)
  expect(wrapper.find('[role="img"]').attributes('aria-label')).toBe('4 sur 5')
})
it('editable ratings expose radios and keyboard selection with clear action', async () => {
  wrapper = mount(RatingStars, { props: { modelValue: 2, editable: true } })
  expect(wrapper.find('[role="radiogroup"]').exists()).toBe(true)
  await wrapper.find('[data-star="2"]').trigger('keydown', { key: 'ArrowRight' })
  expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([3])
  await wrapper.find('.clear-rating').trigger('click')
  expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
})
it('pagination disables impossible or pending actions', async () => {
  wrapper = mount(PageControls, { props: { page: 1, lastPage: 3, loading: true } })
  expect(
    wrapper.findAll('button').every((button) => button.attributes('disabled') !== undefined),
  ).toBe(true)
  await wrapper.setProps({ loading: false })
  await wrapper.findAll('button')[1]!.trigger('click')
  expect(wrapper.emitted('change')).toEqual([[2]])
})
it('recovery notices expose an alert and one explicit retry action', async () => {
  wrapper = mount(ErrorNotice, { props: { message: 'Offline', retry: true } })
  expect(wrapper.attributes('role')).toBe('alert')
  await wrapper.find('button').trigger('click')
  expect(wrapper.emitted('retry')).toHaveLength(1)
})
