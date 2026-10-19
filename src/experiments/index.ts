import { defineAsyncComponent } from 'vue'
import type { ExperimentDefinition } from './types'

export const experiments: readonly ExperimentDefinition[] = [
  {
    id: 'auxin-rooting',
    title: '探究生长素类调节剂促进插条生根的最适浓度',
    subject: '植物生命活动的调节',
    summary: '设置浓度梯度，观察月季插条生根，寻找适宜浓度。',
    available: true,
    runtime: defineAsyncComponent(() => import('./auxin/AuxinExperiment.vue')),
    principle: [
      '生长素类调节剂的生理作用与其浓度具有很大的关系。例如，适当浓度的2，4-二氯苯氧乙酸（简称2，4-D）可以促进插条生根，浓度过高时会抑制生根，高浓度的2，4-D甚至会杀死双子叶植物。',
      '在农业生产上应用植物生长调节剂时，寻找最佳的浓度范围有十分重要的意义。',
    ],
    purpose: ['探究所选定的生长素类调节剂促进某种植物插条生根的最适浓度是多少。'],
    materials: [
      { name: '月季枝条', asset: 'rose-cutting.png', kind: 'plant' },
      { name: 'α-萘乙酸溶液', asset: 'glass-beaker-filled.png', kind: 'beaker' },
      { name: '滤纸', asset: 'filter-paper.png', kind: 'paper' },
      { name: '清水', asset: 'glass-beaker-filled.png', kind: 'beaker' },
    ],
    discussions: [
      {
        question: '如果没有生根尝试分析原因？',
        answer: [
          '多种不同浓度的生长素类似物浸泡后扦插的枝条不能生根，主要有以下几种可能：',
          '（1）枝条所带的叶片较多、蒸腾作用过强。',
          '（2）枝条幼芽、幼叶保留较多，本身合成一定浓度的生长素，浸泡后形态学下端处于高浓度抑制状态。',
          '（3）配制的营养液缺乏营养元素或缺氧。',
          '（4）没有分清形态学的上端与下端。',
        ],
      },
      {
        question: '生长素类似物促进植物生根的最适浓度，会因为季节的变化和枝条的老幼而有差异吗？',
        answer: ['会。季节、枝条成熟程度等会影响生根反应，实际适宜浓度应在所选材料和培养条件下通过实验确定。'],
        supplement: true,
      },
    ],
  },
  {
    id: 'plasmolysis', title: '观察洋葱表皮细胞的质壁分离及质壁分离复原',
    subject: '细胞的物质输入和输出', summary: '制作装片、滴加蔗糖溶液与清水，通过显微镜观察细胞变化。',
    available: false, principle: [], purpose: [], materials: [], discussions: [],
  },
  {
    id: 'soil-starch', title: '探究土壤微生物对淀粉的分解作用',
    subject: '生态系统的物质循环', summary: '设置蒸馏水对照，培养后进行碘液与斐林试剂鉴定。',
    available: false, principle: [], purpose: [], materials: [], discussions: [],
  },
]
