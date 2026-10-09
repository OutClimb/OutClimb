export type FormStatus = 'open' | 'notOpen' | 'closed' | 'filled'

export interface FormField {
  id: number
  name: string
  slug: string
  type: string
  metadata: string | null
  required: boolean
  order: number
}

export interface Form {
  id: number
  name: string
  slug: string
  status: FormStatus
  opensOn?: number | null
  closesOn?: number | null
  notOpenMessage?: string | null
  closedMessage?: string | null
  filledMessage?: string | null
  successMessage?: string | null
  fields: Array<FormField>
}

export type GetFormResponse = Form

export type CreateSubmissionRequest = Record<string, string>
