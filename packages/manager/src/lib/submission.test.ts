import { describe, expect, it } from 'vitest'
import { getSubmissionValue } from '@/lib/submission'
import type { FormField, Submission } from '@/types/form'

const fieldWithId = (id: number) => ({ id }) as FormField
const submissionWithValues = (values: Array<{ formFieldId: number; value: string }>) => ({ values }) as Submission

describe('getSubmissionValue', () => {
  it('returns the value recorded for the field', () => {
    const submission = submissionWithValues([
      { formFieldId: 1, value: 'one' },
      { formFieldId: 2, value: 'two' },
    ])
    expect(getSubmissionValue(submission, fieldWithId(2))).toBe('two')
  })

  it('returns an empty string when the field was not answered', () => {
    expect(getSubmissionValue(submissionWithValues([]), fieldWithId(1))).toBe('')
  })
})
