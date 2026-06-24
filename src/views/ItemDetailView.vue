<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { api } from '@/lib/api'
import { useItemsStore } from '@/stores/items'
import { useLoansStore } from '@/stores/loans'
import { useToast } from '@/composables/useToast'
import { TYPE_LABELS, STATUS_LABELS } from '@/lib/types'
import type { Item } from '@/lib/types'
import BaseIcon from '@/components/BaseIcon.vue'
import RatingStars from '@/components/RatingStars.vue'

const route = useRoute()
const router = useRouter()
const store = useItemsStore()
const loans = useLoansStore()
const toast = useToast()

const item = ref<Item | null>(null)
const loading = ref(true)
const lendOpen = ref(false)
const borrower = ref('')
const returnDate = ref('')

const typeIcon = computed(
  () => ({ book: 'book', movie: 'film', series: 'tv', game: 'gamepad' })[item.value?.type ?? 'book'],
)

async function load() {
  loading.value = true
  try {
    item.value = await store.get(Number(route.params.id))
  } finally {
    loading.value = false
  }
}

async function remove() {
  if (!item.value) return
  if (!confirm(`Supprimer « ${item.value.title} » ? Cette action est irréversible.`)) return
  await store.remove(item.value.id)
  toast.success('Élément supprimé')
  router.push({ name: 'shelf' })
}

async function lend() {
  if (!item.value || !borrower.value.trim()) return
  await loans.create({
    item_id: item.value.id,
    borrower_name: borrower.value.trim(),
    return_date: returnDate.value || null,
  })
  lendOpen.value = false
  borrower.value = ''
  returnDate.value = ''
  toast.success('Prêt enregistré')
  load()
}

async function returnLoan() {
  if (!item.value?.active_loan) return
  await loans.markReturned(item.value.active_loan.id)
  toast.success('Retour enregistré')
  load()
}

async function enrich() {
  if (!item.value) return
  await api.post(`/items/${item.value.id}/enrich`)
  toast.info('Enrichissement lancé en arrière-plan. Actualisez dans un instant.')
}

onMounted(load)
</script>

<template>
  <div class="detail">
    <RouterLink :to="{ name: 'shelf' }" class="back">
      <BaseIcon name="back" :size="18" /> Étagère
    </RouterLink>

    <div v-if="loading" class="loading muted">Chargement…</div>

    <div v-else-if="item" class="detail__body">
      <div class="cover-col">
        <div class="cover">
          <img v-if="item.cover_url" :src="item.cover_url" :alt="`Couverture de ${item.title}`" />
          <div v-else class="cover__placeholder">
            <BaseIcon :name="typeIcon" :size="48" />
          </div>
        </div>
        <div class="cover-actions">
          <RouterLink :to="{ name: 'item-edit', params: { id: item.id } }" class="btn btn--ghost">
            <BaseIcon name="edit" :size="16" /> Modifier
          </RouterLink>
          <button class="btn btn--danger" @click="remove">
            <BaseIcon name="trash" :size="16" /> Supprimer
          </button>
        </div>
      </div>

      <div class="info">
        <div class="badges">
          <span class="badge"><BaseIcon :name="typeIcon" :size="14" /> {{ TYPE_LABELS[item.type] }}</span>
          <span class="badge">{{ STATUS_LABELS[item.status] }}</span>
          <span v-if="item.genre" class="badge">{{ item.genre }}</span>
        </div>

        <h1>{{ item.title }}</h1>
        <p v-if="item.creator" class="creator muted">{{ item.creator }}</p>

        <RatingStars v-if="item.rating" :model-value="item.rating" :size="22" />

        <div v-if="item.tags?.length" class="tags">
          <span v-for="t in item.tags" :key="t" class="tag-chip">{{ t }}</span>
        </div>

        <section v-if="item.synopsis">
          <h3>Synopsis</h3>
          <p>{{ item.synopsis }}</p>
        </section>

        <section v-if="item.notes">
          <h3>Mes notes</h3>
          <p class="notes">{{ item.notes }}</p>
        </section>

        <!-- Loan status -->
        <section class="loan-box card">
          <div v-if="item.active_loan" class="loan-active">
            <div>
              <strong>Prêté à {{ item.active_loan.borrower_name }}</strong>
              <p class="subtle">
                Depuis le {{ item.active_loan.loan_date }}
                <span v-if="item.active_loan.overdue" class="overdue"> · en retard</span>
              </p>
            </div>
            <button class="btn btn--sm btn--primary" @click="returnLoan">
              <BaseIcon name="check" :size="16" /> Marquer rendu
            </button>
          </div>
          <div v-else-if="lendOpen" class="lend-form">
            <div class="field">
              <label for="borrower">Prêter à</label>
              <input id="borrower" v-model="borrower" class="input" placeholder="Nom de l'emprunteur" />
            </div>
            <div class="field">
              <label for="return">Retour prévu</label>
              <input id="return" v-model="returnDate" class="input" type="date" />
            </div>
            <div class="lend-form__actions">
              <button class="btn btn--sm btn--ghost" @click="lendOpen = false">Annuler</button>
              <button class="btn btn--sm btn--primary" :disabled="!borrower.trim()" @click="lend">
                Enregistrer le prêt
              </button>
            </div>
          </div>
          <button v-else class="btn btn--ghost" @click="lendOpen = true">
            <BaseIcon name="users" :size="16" /> Prêter cet élément
          </button>
        </section>

        <button v-if="item.external_id" class="enrich-link" @click="enrich">
          <BaseIcon name="download" :size="14" /> Recharger les métadonnées ({{ item.external_source }})
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--text-muted);
  font-size: var(--text-sm);
}
.detail__body {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: var(--space-6);
  align-items: start;
}
.cover {
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--surface-2);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-2);
}
.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover__placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--accent);
  background: linear-gradient(160deg, var(--surface-3), var(--surface-2));
}
.cover-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-3);
}
.info {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.info h1 {
  font-size: var(--text-3xl);
}
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.creator {
  font-size: var(--text-lg);
  margin-top: calc(-1 * var(--space-2));
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
section h3 {
  font-size: var(--text-base);
  margin-bottom: var(--space-1);
  color: var(--text-muted);
}
.notes {
  white-space: pre-wrap;
}
.loan-box {
  padding: var(--space-4);
}
.loan-active {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.overdue {
  color: var(--danger);
  font-weight: 600;
}
.lend-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.lend-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
.enrich-link {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  background: none;
  border: none;
  color: var(--text-subtle);
  font-size: var(--text-xs);
  cursor: pointer;
}
.enrich-link:hover {
  color: var(--accent);
}
@media (max-width: 720px) {
  .detail__body {
    grid-template-columns: 1fr;
  }
  .cover {
    max-width: 220px;
  }
}
</style>
