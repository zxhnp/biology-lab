import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import AuxinResults from './AuxinResults.vue'
import { concentrationLabel, concentrationValue, phases } from './data'

describe('两阶段统计图表的浓度显示', () => {
  for (const phase of phases) {
    it(`${phase.name}曲线使用新浓度、单位和对应的生根平均值`, async () => {
      const html = await renderToString(createSSRApp(AuxinResults, { phase, view: 'chart' }))
      expect(html).toContain('α-萘乙酸浓度（mg/mL）')
      for (const concentration of phase.concentrations) {
        expect(html).toContain(`${concentrationLabel(concentration)}平均生根数`)
        expect(html).toContain(`>${concentrationValue(concentration)}</text>`)
      }
      expect(html).not.toContain('ppm')
    })

    it(`${phase.name}数据表表头与曲线共用浓度，单位可见`, async () => {
      const html = await renderToString(createSSRApp(AuxinResults, { phase, view: 'table' }))
      expect(html).toContain('浓度（mg/mL）')
      const headers = Array.from(html.matchAll(/<th\b[^>]*>([^<]*)<\/th>/g), match => match[1])
      expect(headers.slice(1, 1 + phase.concentrations.length)).toEqual(phase.concentrations.map(concentrationValue))
      expect(html).not.toContain('ppm')
    })
  }
})
