export type CreateEmailResponse = Email
export type GetEmailsResponse = Array<Email>
export type UpdateEmailResponse = Email

export interface Email {
  id: number
  name: string
  slug: string
  subject: string
  htmlBody: string
  textBody: string
}
