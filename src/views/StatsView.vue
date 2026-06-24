<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStatsStore } from '@/stores/stats'
import { useToast } from '@/composables/useToast'
import { TYPE_LABELS, STATUS_LABELS } from '@/lib/types'
import type { ItemType, ItemStatus } from '@/lib/types'
import BaseIcon from '@/components/BaseIcon.vue'

const store = useStatsStore()
const toast = useToast()

const editingTarget = ref(false)
const targetInput = ref(30)

const typeColors: Record<string, string> = {
  book: 'var(--type-book)',
  movie: 'var(--type-movie)',
  series: 'var(--type-series)',
  game: 'var(--type-game)',
}

const typeEntries = computed(() =>
  Object.entries(store.stats?.by_type ?? {}).map(([k, v]) => ({
    key: k,
    label: TYPE_LABELS[k as ItemType] ?? k,
    value: v,
    color: typeColors[k] ?? 'var(--accent)',
  })),
)
const typeTotal = computed(() => typeEntries.value.reduce((s, e) => s + e.value, 0) || 1)

const statusEntries = computed(() =>
  Object.entries(store.stats?.by_status ?? {}).map(([k, v]) => ({
    label: STATUS_LABELS[k as ItemStatus] ?? k,
    value: v,
  })),
)
const statusMax = computed(() => Math.max(1, ...statusEntries.value.map((e) => e.value)))

const genreEntries = computed(() => Object.entries(store.stats?.by_genre ?? {}))
const genreMax = computed(() => Math.max(1, ...genreEntries.value.map(([, v]) => v)))

// Donut conic-gradient pour la répartition par type.
const donut = computed(() => {
  let acc = 0
  const stops: string[] = []
  for (const e of typeEntries.value) {
    const start = (acc / typeTotal.value) * 100
    acc += e.value
    const end = (acc / typeTotal.value) * 100
    stops.push(`${e.color} ${start}% ${end}%`)
  }
  return stops.length ? `conic-gradient(${stops.join(', ')})` : 'var(--surface-3)'
})

const challenge = computed(() => store.stats?.challenge)

onMounted(() => store.fetch())

async function saveTarget() {
  await store.saveChallenge(challenge.value?.year ?? new Date().getFullYear(), targetInput.value)
  editingTarget.value = false
  toast.success('Objectif mis à jour')
}
</script>

<template>
  <div class="stats">
    <h1>Statistiques</h1>

    <div v-if="store.loading" class="muted">Chargement…</div>

    <template v-else-if="store.stats">
      <div class="kpis">
        <div class="kpi card">
          <span class="kpi__value">{{ store.stats.total }}</span>
          <span class="kpi__label muted">éléments au total</span>
        </div>
        <div class="kpi card">
          <span class="kpi__value">{{ store.stats.by_status.done ?? 0 }}</span>
          <span class="kpi__label muted">terminés</span>
        </div>
        <div class="kpi card">
          <span class="kpi__value">{{ store.stats.by_status.wishlist ?? 0 }}</span>
          <span class="kpi__label muted">à découvrir</span>
        </div>
      </div>

      <!-- Défi annuel -->
      <section class="card challenge">
        <div class="challenge__head">
          <h2>Défi {{ challenge?.year }}</h2>
          <button v-if="!editingTarget" class="btn btn--sm btn--ghost" @click="editingTarget = true">
            <BaseIcon name="edit" :size="14" /> Objectif
          </button>
        </div>
        <div v-if="editingTarget" class="challenge__edit">
          <input v-model.number="targetInput" type="number" min="1" class="input" />
          <button class="btn btn--sm btn--primary" @click="saveTarget">Enregistrer</button>
        </div>
        <template v-else-if="challenge?.target">
          <div class="progress">
            <div class="progress__bar" :style="{ width: `${challenge.percentage ?? 0}%` }"></div>
          </div>
          <p class="muted">
            {{ challenge.completed }} / {{ challenge.target }} terminés ({{ challenge.percentage }} %)
          </p>
        </template>
        <p v-else class="muted">
          Aucun objectif défini.
          <button class="link-btn" @click="editingTarget = true">En fixer un</button>
        </p>
      </section>

      <div class="charts">
        <!-- Donut répartition par type -->
        <section class="card chart">
          <h2>Par type</h2>
          <div class="donut-wrap">
            <div class="donut" :style="{ background: donut }">
              <div class="donut__hole">
                <strong>{{ store.stats.total }}</strong>
                <span class="subtle">titres</span>
              </div>
            </div>
            <ul class="legend">
              <li v-for="e in typeEntries" :key="e.key">
                <span class="legend__dot" :style="{ background: e.color }"></span>
                {{ e.label }} <span class="muted">· {{ e.value }}</span>
              </li>
            </ul>
          </div>
        </section>

        <!-- Barres par statut -->
        <section class="card chart">
          <h2>Par statut</h2>
          <ul class="bars">
            <li v-for="e in statusEntries" :key="e.label">
              <span class="bars__label">{{ e.label }}</span>
              <span class="bars__track">
                <span class="bars__fill" :style="{ width: `${(e.value / statusMax) * 100}%` }"></span>
              </span>
              <span class="bars__value">{{ e.value }}</span>
            </li>
          </ul>
        </section>
      </div>

      <!-- Genres -->
      <section v-if="genreEntries.length" class="card chart">
        <h2>Genres les plus présents</h2>
        <ul class="bars">
          <li v-for="[genre, value] in genreEntries" :key="genre">
            <span class="bars__label">{{ genre }}</span>
            <span class="bars__track">
              <span
                class="bars__fill bars__fill--alt"
                :style="{ width: `${(value / genreMax) * 100}%` }"
              ></span>
            </span>
            <span class="bars__value">{{ value }}</span>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.stats h1 {
  font-size: var(--text-3xl);
}
.kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}
.kpi {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4);
}
.kpi__value {
  font-family: var(--font-serif);
  font-size: var(--text-3xl);
  color: var(--accent);
}
.kpi__label {
  font-size: var(--text-sm);
}
.challenge {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.challenge__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.challenge__head h2 {
  font-size: var(--text-xl);
}
.challenge__edit {
  display: flex;
  gap: var(--space-2);
}
.challenge__edit .input {
  max-width: 120px;
}
.progress {
  height: 14px;
  border-radius: var(--radius-full);
  background: var(--surface-3);
  overflow: hidden;
}
.progress__bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--amber-300));
  border-radius: var(--radius-full);
  transition: width 600ms var(--ease-out);
}
.link-btn {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  padding: 0;
}
.charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}
.chart {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.chart h2 {
  font-size: var(--text-base);
  font-family: var(--font-sans);
  color: var(--text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.donut-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  flex-wrap: wrap;
}
.donut {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.donut__hole {
  width: 86px;
  height: 86px;
  border-radius: 50%;
  background: var(--surface);
  display: grid;
  place-items: center;
  text-align: center;
  line-height: 1.1;
}
.donut__hole strong {
  font-family: var(--font-serif);
  font-size: var(--text-xl);
}
.donut__hole span {
  font-size: var(--text-xs);
}
.legend {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--text-sm);
}
.legend li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.legend__dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}
.bars {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.bars li {
  display: grid;
  grid-template-columns: 110px 1fr 32px;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
}
.bars__track {
  height: 10px;
  background: var(--surface-3);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.bars__fill {
  display: block;
  height: 100%;
  background: var(--accent);
  border-radius: var(--radius-full);
  transition: width 500ms var(--ease-out);
}
.bars__fill--alt {
  background: var(--sage-500);
}
.bars__value {
  text-align: right;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
@media (max-width: 760px) {
  .kpis,
  .charts {
    grid-template-columns: 1fr;
  }
}
</style>
