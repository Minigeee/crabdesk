import { startCase } from 'lodash'

export function humanize(text: string): string {
  return startCase(text.replace(/[-_]/g, ' '))
} 