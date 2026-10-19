import type { Component } from 'vue'

export interface Discussion {
  question: string
  answer: string[]
  supplement?: boolean
}

export interface Material {
  name: string
  asset: string
  kind?: 'plant' | 'beaker' | 'paper'
}

export interface ExperimentDefinition {
  id: string
  title: string
  subject: string
  summary: string
  available: boolean
  principle: string[]
  purpose: string[]
  materials: Material[]
  discussions: Discussion[]
  runtime?: Component
}
