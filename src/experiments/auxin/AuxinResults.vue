<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import LabIcon from '../../components/LabIcon.vue'
import { averages, concentrationLabel, concentrationValue, concentrationUnit, type AuxinPhase } from './data'

const props = defineProps<{ phase: AuxinPhase; view: 'chart' | 'table' }>()
defineEmits<{ toggle: [] }>()
const hovered = shallowRef<number | null>(null)
const values = computed(() => averages(props.phase))
const points = computed(() => values.value.map((value, index) => ({ x: 120 + index * 145, y: 260 - value * 34, value })))
const line = computed(() => points.value.map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.y}`).join(' '))
const area = computed(() => `${line.value} L${points.value.at(-1)!.x} 260 L120 260Z`)
const chartLabel = computed(() => props.phase.concentrations.map((c, i) => `${concentrationLabel(c)}平均生根数${values.value[i]}`).join('，'))
</script>

<template>
  <section class="results" aria-label="实验结果">
    <svg v-if="view === 'chart'" class="chart" viewBox="0 0 1160 320" role="img" :aria-label="chartLabel" data-testid="root-chart">
      <defs><linearGradient id="root-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#73b198" stop-opacity=".8" /><stop offset="100%" stop-color="#73b198" stop-opacity=".04" /></linearGradient></defs>
      <g class="grid-lines"><line v-for="n in 6" :key="n" x1="120" :y1="260 - n * 34" x2="1045" :y2="260 - n * 34" /><text v-for="n in 6" :key="`label-${n}`" x="104" :y="268 - n * 34" text-anchor="end">{{ n }}</text></g>
      <path d="M120 18V260H1053M116 26l4-8 4 8M1046 256l8 4-8 4" class="axes" />
      <text x="110" y="25" text-anchor="end" class="axis-title">平均生根数</text>
      <path :d="area" fill="url(#root-fill)" /><path :d="line" class="data-line" />
      <g v-for="(point, index) in points" :key="phase.concentrations[index]" tabindex="0" @mouseenter="hovered = index" @mouseleave="hovered = null" @focus="hovered = index" @blur="hovered = null">
        <title>{{ concentrationLabel(phase.concentrations[index]) }}：{{ point.value }}</title>
        <circle :cx="point.x" :cy="point.y" r="14" fill="transparent" /><circle :cx="point.x" :cy="point.y" r="5.5" fill="#43cd8e" />
        <text :x="point.x" y="287" text-anchor="middle">{{ concentrationValue(phase.concentrations[index]) }}</text>
        <g v-if="hovered === index" class="tooltip"><rect :x="point.x - 35" :y="point.y - 40" width="70" height="28" rx="4" /><text :x="point.x" :y="point.y - 20" text-anchor="middle">{{ point.value }}</text></g>
      </g>
      <text x="1050" y="310" text-anchor="end" class="axis-title">α-萘乙酸浓度（{{ concentrationUnit }}）</text>
    </svg>
    <div v-else class="table-wrap" data-testid="root-table">
      <table><caption class="sr-only">{{ phase.name }}逐日生根数，浓度单位 {{ concentrationUnit }}</caption><thead><tr><th colspan="2">时间 / 生根数 / 浓度（{{ concentrationUnit }}）</th><th v-for="c in phase.concentrations" :key="c">{{ concentrationValue(c) }}</th></tr></thead>
        <tbody v-for="(day, dayIndex) in phase.days" :key="dayIndex" :class="{ alternate: dayIndex % 2 === 1 }"><tr v-for="(row, rowIndex) in day" :key="rowIndex"><th v-if="rowIndex === 0" rowspan="3" scope="rowgroup">第{{ ['一', '二', '三', '四'][dayIndex] }}天</th><th scope="row">{{ rowIndex + 1 }}</th><td v-for="(value, index) in row" :key="index">{{ value }}</td></tr></tbody>
        <tfoot><tr><th colspan="2">平均</th><td v-for="(value, index) in values" :key="index">{{ value }}</td></tr></tfoot>
      </table>
    </div>
    <button class="view-toggle" :aria-label="view === 'chart' ? '切换数据表' : '切换曲线图'" @click="$emit('toggle')"><LabIcon :name="view === 'chart' ? 'table' : 'chart'" :size="30" /></button>
  </section>
</template>

<style scoped>
.results { position: absolute; left: 355px; right: 180px; top: 90px; height: 300px; z-index: 4; }
.chart { width: 100%; height: 100%; overflow: visible; }
.chart text { font-size: 19px; fill: #eee; font-family: inherit; }
.chart .axis-title { font-size: 18px; }
.grid-lines line { stroke: #ffffff10; stroke-width: 1; }
.axes { stroke: #eee; fill: none; stroke-width: 1.4; }
.data-line { stroke: #b5cfc3; fill: none; stroke-width: 1.5; }
.view-toggle { position: absolute; right: -5px; top: 110px; width: 51px; height: 51px; border-radius: 50%; border: 3px solid #15221b; background: #237f5e; color: #e1f2e9; display: grid; place-items: center; box-shadow: 0 2px 5px #000a; }
.view-toggle:hover { background: #299d72; }
.table-wrap { display: flex; height: 100%; align-items: center; justify-content: center; }
table { border-collapse: collapse; background: #111514; outline: 12px solid #111514; font-size: 13px; text-align: center; min-width: 420px; }
th,td { border: 1px solid #414742; padding: 1px 9px; height: 17px; font-weight: 400; }
thead th { background: #464947; height: 38px; }
tbody.alternate { background: #2e3230; }
tfoot td { color: #68c5a1; font-weight: 600; }
.tooltip rect { fill: #111d17; stroke: #426b56; }
</style>
