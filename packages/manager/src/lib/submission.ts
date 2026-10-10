import type { FormField, Submission } from '@/types/form'

export function getSubmissionValue(submission: Submission, field: FormField): string {
  return submission.values.find((value) => value.formFieldId === field.id)?.value ?? ''
}
