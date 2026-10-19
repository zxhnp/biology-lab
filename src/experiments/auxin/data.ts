export type PhaseId = 'preliminary' | 'formal'
export type StepIndex = 0 | 1 | 2
export type Triplicate = readonly [number, number, number]

export interface AuxinPhase {
  id: PhaseId
  name: string
  prefix: number
  firstBranch: number
  concentrations: readonly number[]
  // 每天三行，每行对应所有浓度组；保留视频原始记录，平均值由其派生。
  days: readonly (readonly (readonly number[])[])[]
}

export const phases: readonly AuxinPhase[] = [
  {
    id: 'preliminary', name: '预实验', prefix: 1, firstBranch: 1,
    concentrations: [0, 2, 4, 6, 8, 10, 12],
    days: [
      [[0, 0, 1, 0, 0, 0, 0], [0, 0, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]],
      [[1, 1, 1, 1, 1, 0, 0], [1, 1, 2, 2, 1, 0, 0], [1, 2, 1, 1, 1, 0, 0]],
      [[1, 2, 2, 2, 1, 0, 0], [2, 2, 4, 3, 2, 0, 0], [1, 3, 3, 3, 2, 1, 0]],
      [[2, 3, 4, 3, 2, 0, 0], [2, 3, 6, 5, 3, 1, 0], [2, 3, 5, 4, 2, 1, 0]],
    ],
  },
  {
    id: 'formal', name: '正式实验', prefix: 2, firstBranch: 8,
    concentrations: [2, 3, 4, 5, 6],
    days: [
      [[0, 1, 1, 1, 0], [0, 0, 1, 1, 1], [0, 0, 0, 1, 0]],
      [[1, 1, 1, 2, 1], [1, 2, 2, 2, 2], [2, 1, 1, 2, 1]],
      [[2, 2, 2, 3, 1], [2, 2, 4, 4, 2], [3, 3, 3, 4, 3]],
      [[3, 3, 4, 5, 3], [3, 3, 6, 6, 5], [3, 4, 5, 6, 4]],
    ],
  },
]

export const durations = [24, 4, 4] as const
export const durationUnits = ['小时', '小时', '天'] as const

export function concentrationLabel(value: number): string {
  return value === 0 ? '清水' : `${value}ppm`
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
  return [
    `将新剪下的植物枝条分成${phase.concentrations.length}组，插入到不同浓度的α-萘乙酸溶液中浸泡24小时。`,
    '将浸泡后的枝条取出置于滤纸上晾干4小时。',
    phase.id === 'preliminary'
      ? '将枝条分别插入完全营养液中，在适宜的环境中培养，4天后，观察生根情况。'
      : '将枝条分别插入完全营养液中，在适宜的环境中培养，4天后观察，找出α-萘乙酸促进生根的最适浓度。',
  ]
}
