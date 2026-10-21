export type PhaseId = 'preliminary' | 'formal'
export type StepId = 'prune' | 'soak' | 'dry' | 'culture'
export type TimedStepId = Exclude<StepId, 'prune'>
export type Triplicate = readonly [number, number, number]

export interface AuxinPhase {
  id: PhaseId
  name: string
  prefix: number
  firstBranch: number
  steps: readonly StepId[]
  concentrations: readonly number[]
  // 每天三行，每行对应所有浓度组；保留视频原始记录，平均值由其派生。
  days: readonly (readonly (readonly number[])[])[]
}

export const phases: readonly AuxinPhase[] = [
  {
    id: 'preliminary', name: '预实验', prefix: 1, firstBranch: 1,
    steps: ['prune', 'soak', 'dry', 'culture'],
    concentrations: [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2],
    days: [
      [[0, 0, 1, 0, 0, 0, 0], [0, 0, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]],
      [[1, 1, 1, 1, 1, 0, 0], [1, 1, 2, 2, 1, 0, 0], [1, 2, 1, 1, 1, 0, 0]],
      [[1, 2, 2, 2, 1, 0, 0], [2, 2, 4, 3, 2, 0, 0], [1, 3, 3, 3, 2, 1, 0]],
      [[2, 3, 4, 3, 2, 0, 0], [2, 3, 6, 5, 3, 1, 0], [2, 3, 5, 4, 2, 1, 0]],
    ],
  },
  {
    id: 'formal', name: '正式实验', prefix: 2, firstBranch: 8,
    steps: ['soak', 'dry', 'culture'],
    concentrations: [0.2, 0.3, 0.4, 0.5, 0.6],
    days: [
      [[0, 1, 1, 1, 0], [0, 0, 1, 1, 1], [0, 0, 0, 1, 0]],
      [[1, 1, 1, 2, 1], [1, 2, 2, 2, 2], [2, 1, 1, 2, 1]],
      [[2, 2, 2, 3, 1], [2, 2, 4, 4, 2], [3, 3, 3, 4, 3]],
      [[3, 3, 4, 5, 3], [3, 3, 6, 6, 5], [3, 4, 5, 6, 4]],
    ],
  },
]

export const durations: Readonly<Record<TimedStepId, number>> = { soak: 24, dry: 4, culture: 4 }
export const durationUnits: Readonly<Record<TimedStepId, string>> = { soak: '小时', dry: '小时', culture: '天' }

export const concentrationUnit = 'mg/mL'

export function concentrationValue(value: number): string {
  return value === 0 ? '0' : value.toFixed(1)
}

export function concentrationLabel(value: number): string {
  return `${concentrationValue(value)}${concentrationUnit}`
}

export function rootsAtDay(phase: AuxinPhase, group: number, day: number): Triplicate {
  if (day < 1) return [0, 0, 0]
  const rows = phase.days[Math.min(4, Math.floor(day)) - 1]
  return [rows[0][group], rows[1][group], rows[2][group]]
}

export function averages(phase: AuxinPhase): number[] {
  return phase.concentrations.map((_, index) => {
    const roots = rootsAtDay(phase, index, 4)
    return Math.round((roots[0] + roots[1] + roots[2]) / 3 * 10) / 10
  })
}

export function stepDescriptions(phase: AuxinPhase): string[] {
  const descriptions = [
    `将新剪下的植物枝条分成${phase.concentrations.length}组，插入到不同浓度的α-萘乙酸溶液中浸泡24小时。`,
    '将浸泡后的枝条取出置于滤纸上晾干4小时。',
    phase.id === 'preliminary'
      ? '将枝条分别插入清水中，在适宜的环境中培养，4天后，观察生根情况。'
      : '将枝条分别插入清水中，在适宜的环境中培养，4天后观察，找出α-萘乙酸促进生根的最适浓度。',
  ]
  return phase.id === 'preliminary'
    ? ['处理插条，剪去成熟的叶片，下端剪成斜面。', ...descriptions]
    : descriptions
}
