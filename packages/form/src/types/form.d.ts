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
  status: string
  opensOn?: number | null
  closesOn?: number | null
  notOpenMessage?: string | null
  closedMessage?: string | null
  filledMessage?: string | null
  successMessage?: string | null
  fields?: Array<FormField> | []
}
