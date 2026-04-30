export type CreateFormResponse = Form
export type GetFormsResponse = Array<Form>
export type UpdateFormResponse = Form

export interface FormField {
  id: number
  name: string
  slug: string
  type: string
  metadata: string | null
  validation: string | null
  required: boolean
  order: number
}

export interface Form {
  id: number
  name: string
  slug: string
  opensOn?: number | null
  closesOn?: number | null
  maxSubmissions?: number | null
  notOpenMessage?: string | null
  closedMessage?: string | null
  filledMessage?: string | null
  successMessage?: string | null
  viewableBy: Array<number>
  fields: Array<FormField>
}

export interface SubmissionValue {
  formFieldId: number
  fieldSlug: string
  value: string
}

export interface Submission {
  id: number
  submittedOn: number
  values: Array<SubmissionValue>
}

export type GetSubmissionsResponse = Array<Submission>

export interface FormState {
  data: Record<number, Form>
  isEmpty: () => boolean
  list: () => Array<Form>
  populate: (forms: Array<Form>) => void
  populateSingle: (form: Form) => void
  remove: (id: number) => void
}
