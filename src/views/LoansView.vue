<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useLoansStore } from '@/stores/loans'
import { useToast } from '@/composables/useToast'
import BaseIcon from '@/components/BaseIcon.vue'

const store = useLoansStore()
const toast = useToast()
const showReturned = ref(false)

const visible = computed(() =>
  showReturned.value ? store.loans : store.loans.filter((l) => !l.returned),
)
const overdueCount = computed(() => store.loans.filter((l) => l.overdue).length)

onMounted(() => store.fetch())

async function markReturned(id: number) {
  await store.markReturned(id)
  toast.success('Retour enregistré')
}

async function remove(id: number) {
  if (!confirm('Supprimer ce prêt ?')) return
  await store.remove(id)
  toast.success('Prêt supprimé')
}
</script>

<template>
  <div class="loans">
    <header class="page-head">
      <div>
        <h1>Prêts</h1>
        <p class="muted">
          {{ store.loans.filter((l) => !l.returned).length }} en cours
          <span v-if="overdueCount" class="overdue-pill">{{ overdueCount }} en retard</span>
        </p>
      </div>
      <label class="toggle">
        <input v-model="showReturned" type="checkbox" />
        Afficher les retours
      </label>
    </header>

    <div v-if="store.loading" class="muted">Chargement…</div>

    <div v-else-if="!visible.length" class="empty card">
      <BaseIcon name="users" :size="40" />
      <p class="muted">Aucun prêt à afficher. Prêtez un élément depuis sa fiche.</p>
    </div>

    <ul v-else class="loan-list">
      <li v-for="loan in visible" :key="loan.id" class="loan card" :class="{ returned: loan.returned }">
        <RouterLink
          v-if="loan.item"
          :to="{ name: 'item-detail', params: { id: loan.item_id } }"
          class="loan__cover"
        >
          <img v-if="loan.item.cover_url" :src="loan.item.cover_url" :alt="loan.item.title" loading="lazy" />
          <div v-else class="loan__cover-ph"><BaseIcon name="book" :size="20" /></div>
        </RouterLink>
        <div class="loan__info">
          <strong>{{ loan.item?.title ?? 'Élément' }}</strong>
          <span class="muted">Emprunté par {{ loan.borrower_name }}</span>
          <span class="subtle">
            Prêté le {{ loan.loan_date }}
            <template v-if="loan.return_date"> · retour prévu {{ loan.return_date }}</template>
          </span>
        </div>
        <div class="loan__status">
          <span v-if="loan.returned" class="badge done"><BaseIcon name="check" :size="13" /> Rendu</span>
          <span v-else-if="loan.overdue" class="badge overdue"><BaseIcon name="clock" :size="13" /> En retard</span>
          <span v-else class="badge">En cours</span>
        </div>
        <div class="loan__actions">
          <button v-if="!loan.returned" class="btn btn--sm btn--primary" @click="markReturned(loan.id)">
            Rendu
          </button>
          <button class="btn btn--sm btn--danger" aria-label="Supprimer" @click="remove(loan.id)">
            <BaseIcon name="trash" :size="15" />
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.loans {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.page-head h1 {
  font-size: var(--text-3xl);
}
.overdue-pill {
  margin-left: var(--space-2);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  background: rgba(194, 84, 63, 0.18);
  color: var(--danger);
  font-size: var(--text-xs);
  font-weight: 600;
}
.toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-muted);
}
.loan-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.loan {
  display: grid;
  grid-template-columns: 48px 1fr auto auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
}
.loan.returned {
  opacity: 0.6;
}
.loan__cover {
  width: 48px;
  height: 64px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--surface-2);
}
.loan__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.loan__cover-ph {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--text-subtle);
}
.loan__info {
  display: flex;
  flex-direction: column;
  font-size: var(--text-sm);
  min-width: 0;
}
.loan__info .subtle {
  font-size: var(--text-xs);
}
.badge.done {
  color: var(--success);
}
.badge.overdue {
  background: rgba(194, 84, 63, 0.18);
  color: var(--danger);
}
.loan__actions {
  display: flex;
  gap: var(--space-2);
}
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-8);
  color: var(--text-subtle);
}
@media (max-width: 640px) {
  .loan {
    grid-template-columns: 48px 1fr;
    grid-template-areas:
      'cover info'
      'status actions';
  }
  .loan__cover {
    grid-area: cover;
  }
  .loan__info {
    grid-area: info;
  }
  .loan__status {
    grid-area: status;
  }
  .loan__actions {
    grid-area: actions;
    justify-content: flex-end;
  }
}
</style>
