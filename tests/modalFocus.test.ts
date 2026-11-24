import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref, nextTick } from 'vue'
import { useModalFocus } from '@/composables/useModalFocus'
it('locks scroll on open, closes on Escape and restores prior focus and styles', async () => {
  document.body.style.overflow = 'auto'
  const trigger = document.createElement('button')
  document.body.appendChild(trigger)
  trigger.focus()
  const Component = defineComponent({
    setup() {
      const open = ref(false),
        panel = ref<HTMLElement | null>(null)
      useModalFocus(open, panel)
      return { open, panel }
    },
    template:
      '<div><button @click="open=true">Open</button><aside v-if="open" ref="panel" tabindex="-1"><button>Inside</button></aside></div>',
  })
  const wrapper = mount(Component, { attachTo: document.body })
  await wrapper.find('button').trigger('click')
  await nextTick()
  expect(document.body.style.overflow).toBe('hidden')
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  await nextTick()
  expect(wrapper.find('aside').exists()).toBe(false)
  expect(document.body.style.overflow).toBe('auto')
  expect(document.activeElement).toBe(trigger)
  wrapper.unmount()
  trigger.remove()
})
