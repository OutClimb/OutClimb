'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ChevronUp, ChevronDown, Pencil, Trash2, Plus } from 'lucide-react'
import type { FormField } from '@/types/form'

const FIELD_TYPES = [
  { value: 'given-name', label: 'First Name' },
  { value: 'family-name', label: 'Last Name' },
  { value: 'email', label: 'Email Address' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'text-input', label: 'Text Input' },
  { value: 'text-area', label: 'Text Area' },
  { value: 'checkboxes', label: 'Checkboxes' },
  { value: 'radios', label: 'Radio Buttons' },
  { value: 'select', label: 'Select' },
  { value: 'bool', label: 'Yes/No' },
  { value: 'newsletter', label: 'Newsletter' },
] as const

const TYPES_WITH_OPTIONS = new Set(['checkboxes', 'radios', 'select'])
const TYPES_WITH_PLACEHOLDER = new Set(['text-input', 'text-area', 'select'])
const NO_FIELD = '__none__'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function fieldTypeLabel(type: string): string {
  return FIELD_TYPES.find((t) => t.value === type)?.label ?? type
}

interface ParsedMetadata {
  options: string[]
  placeholder: string
  firstNameFieldSlug: string
  lastNameFieldSlug: string
  emailFieldSlug: string
}

const emptyMetadata: ParsedMetadata = {
  options: [],
  placeholder: '',
  firstNameFieldSlug: '',
  lastNameFieldSlug: '',
  emailFieldSlug: '',
}

function parseMetadata(metadata: string | null): ParsedMetadata {
  if (!metadata) return emptyMetadata
  try {
    const meta = JSON.parse(metadata)
    return {
      options: Array.isArray(meta?.options) ? (meta.options as string[]) : [],
      placeholder: typeof meta?.placeholder === 'string' ? meta.placeholder : '',
      firstNameFieldSlug: typeof meta?.firstNameFieldSlug === 'string' ? meta.firstNameFieldSlug : '',
      lastNameFieldSlug: typeof meta?.lastNameFieldSlug === 'string' ? meta.lastNameFieldSlug : '',
      emailFieldSlug: typeof meta?.emailFieldSlug === 'string' ? meta.emailFieldSlug : '',
    }
  } catch {
    return emptyMetadata
  }
}

function buildMetadata(dialog: DialogState): string | null {
  const { type, options, placeholder } = dialog
  const meta: {
    options?: string[]
    placeholder?: string
    firstNameFieldSlug?: string
    lastNameFieldSlug?: string
    emailFieldSlug?: string
  } = {}
  if (TYPES_WITH_OPTIONS.has(type)) {
    const optionList = options
      .split('\n')
      .map((o) => o.trim())
      .filter(Boolean)
    if (optionList.length) meta.options = optionList
  }
  if (TYPES_WITH_PLACEHOLDER.has(type) && placeholder.trim()) {
    meta.placeholder = placeholder.trim()
  }
  if (type === 'newsletter') {
    if (dialog.firstNameFieldSlug) meta.firstNameFieldSlug = dialog.firstNameFieldSlug
    if (dialog.lastNameFieldSlug) meta.lastNameFieldSlug = dialog.lastNameFieldSlug
    if (dialog.emailFieldSlug) meta.emailFieldSlug = dialog.emailFieldSlug
  }
  return Object.keys(meta).length ? JSON.stringify(meta) : null
}

interface DialogState {
  name: string
  slug: string
  slugManuallyEdited: boolean
  type: string
  required: boolean
  validation: string
  options: string
  placeholder: string
  firstNameFieldSlug: string
  lastNameFieldSlug: string
  emailFieldSlug: string
}

interface DialogErrors {
  name: string
  slug: string
  options: string
  emailFieldSlug: string
}

const emptyDialog: DialogState = {
  name: '',
  slug: '',
  slugManuallyEdited: false,
  type: 'text-input',
  required: false,
  validation: '',
  options: '',
  placeholder: '',
  firstNameFieldSlug: '',
  lastNameFieldSlug: '',
  emailFieldSlug: '',
}

const emptyErrors: DialogErrors = { name: '', slug: '', options: '', emailFieldSlug: '' }

export interface FormFieldBuilderProps {
  fields: Array<FormField>
  onChange: (fields: Array<FormField>) => void
}

export function FormFieldBuilder({ fields, onChange }: FormFieldBuilderProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [dialog, setDialog] = useState<DialogState>(emptyDialog)
  const [errors, setErrors] = useState<DialogErrors>(emptyErrors)

  const moveUp = useCallback(
    (index: number) => {
      if (index === 0) return
      const next = [...fields]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      onChange(next.map((f, i) => ({ ...f, order: i })))
    },
    [fields, onChange],
  )

  const moveDown = useCallback(
    (index: number) => {
      if (index === fields.length - 1) return
      const next = [...fields]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      onChange(next.map((f, i) => ({ ...f, order: i })))
    },
    [fields, onChange],
  )

  const deleteField = useCallback(
    (index: number) => {
      onChange(fields.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i })))
    },
    [fields, onChange],
  )

  const openAdd = useCallback(() => {
    setEditingIndex(null)
    setDialog(emptyDialog)
    setErrors(emptyErrors)
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback(
    (index: number) => {
      const f = fields[index]
      const meta = parseMetadata(f.metadata)
      setEditingIndex(index)
      setDialog({
        name: f.name,
        slug: f.slug,
        slugManuallyEdited: true,
        type: f.type,
        required: f.required,
        validation: f.validation ?? '',
        options: meta.options.join('\n'),
        placeholder: meta.placeholder,
        firstNameFieldSlug: meta.firstNameFieldSlug,
        lastNameFieldSlug: meta.lastNameFieldSlug,
        emailFieldSlug: meta.emailFieldSlug,
      })
      setErrors(emptyErrors)
      setDialogOpen(true)
    },
    [fields],
  )

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setDialog((prev) => ({
      ...prev,
      name,
      slug: prev.slugManuallyEdited ? prev.slug : slugify(name),
    }))
  }, [])

  const handleSlugChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value
    setDialog((prev) => ({ ...prev, slug, slugManuallyEdited: true }))
  }, [])

  const handleTypeChange = useCallback((value: string) => {
    setDialog((prev) => ({ ...prev, type: value }))
  }, [])

  const handleValidationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDialog((prev) => ({ ...prev, validation: e.target.value }))
  }, [])

  const handleOptionsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDialog((prev) => ({ ...prev, options: e.target.value }))
  }, [])

  const handlePlaceholderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDialog((prev) => ({ ...prev, placeholder: e.target.value }))
  }, [])

  const handleLinkedFieldChange = useCallback(
    (key: 'firstNameFieldSlug' | 'lastNameFieldSlug' | 'emailFieldSlug') => (value: string) => {
      setDialog((prev) => ({ ...prev, [key]: value === NO_FIELD ? '' : value }))
    },
    [],
  )

  const fieldsOfType = useCallback(
    (type: string) => fields.filter((f, i) => f.type === type && i !== editingIndex),
    [fields, editingIndex],
  )

  const handleSave = useCallback(() => {
    const errs: DialogErrors = { name: '', slug: '', options: '', emailFieldSlug: '' }
    let hasError = false

    if (!dialog.name.trim()) {
      errs.name = 'Please fill in this field'
      hasError = true
    }

    if (!dialog.slug.trim()) {
      errs.slug = 'Please fill in this field'
      hasError = true
    } else if (!/^[a-z0-9-]+$/.test(dialog.slug.trim())) {
      errs.slug = 'Slug may only contain lowercase letters, numbers, and hyphens'
      hasError = true
    } else if (fields.some((f, i) => f.slug === dialog.slug.trim() && i !== editingIndex)) {
      errs.slug = 'A field with this slug already exists'
      hasError = true
    }

    if (TYPES_WITH_OPTIONS.has(dialog.type)) {
      const optionList = dialog.options
        .split('\n')
        .map((o) => o.trim())
        .filter(Boolean)
      if (!optionList.length) {
        errs.options = 'Please add at least one option'
        hasError = true
      }
    }

    if (dialog.type === 'newsletter' && !dialog.emailFieldSlug) {
      errs.emailFieldSlug = 'Please select an email field'
      hasError = true
    }

    setErrors(errs)
    if (hasError) return

    const field: FormField = {
      id: editingIndex !== null ? fields[editingIndex].id : 0,
      name: dialog.name.trim(),
      slug: dialog.slug.trim(),
      type: dialog.type,
      required: dialog.required,
      validation: dialog.validation.trim() || null,
      metadata: buildMetadata(dialog),
      order: editingIndex !== null ? fields[editingIndex].order : fields.length,
    }

    const next = editingIndex !== null ? fields.map((f, i) => (i === editingIndex ? field : f)) : [...fields, field]

    onChange(next.map((f, i) => ({ ...f, order: i })))
    setDialogOpen(false)
  }, [dialog, fields, editingIndex, onChange])

  return (
    <div className="flex flex-col gap-4">
      {fields.length === 0 ? (
        <p className="text-muted-foreground text-sm">No fields yet. Add one below.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {fields.map((field, index) => (
            <div
              key={`${field.slug}-${index}`}
              className="border-border flex items-center gap-3 rounded-lg border px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  aria-label="Move up">
                  <ChevronUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === fields.length - 1}
                  aria-label="Move down">
                  <ChevronDown />
                </Button>
              </div>

              <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                <span className="text-sm font-medium">{field.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {fieldTypeLabel(field.type)} · {field.slug}
                  {field.required && ' · Required'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  type="button"
                  onClick={() => openEdit(index)}
                  aria-label="Edit field">
                  <Pencil />
                </Button>
                <Button
                  variant="destructive"
                  size="icon-sm"
                  type="button"
                  onClick={() => deleteField(index)}
                  aria-label="Delete field">
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button variant="secondary" size="default" type="button" onClick={openAdd}>
        <Plus />
        Add Field
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? 'Edit Field' : 'Add Field'}</DialogTitle>
          </DialogHeader>

          <div className="no-scrollbar -mx-4 max-h-[75vh] overflow-y-auto px-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="field-name">Name</FieldLabel>
                <Input
                  id="field-name"
                  value={dialog.name}
                  onChange={handleNameChange}
                  placeholder="Full Name"
                  aria-invalid={!!errors.name}
                />
                {errors.name && <FieldError>{errors.name}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="field-slug">Slug</FieldLabel>
                <FieldDescription>Unique identifier used in submissions</FieldDescription>
                <Input
                  id="field-slug"
                  value={dialog.slug}
                  onChange={handleSlugChange}
                  placeholder="full-name"
                  aria-invalid={!!errors.slug}
                />
                {errors.slug && <FieldError>{errors.slug}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="field-type">Type</FieldLabel>
                <Select value={dialog.type} onValueChange={handleTypeChange}>
                  <SelectTrigger id="field-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {TYPES_WITH_OPTIONS.has(dialog.type) && (
                <Field>
                  <FieldLabel htmlFor="field-options">Options</FieldLabel>
                  <FieldDescription>One option per line</FieldDescription>
                  <Textarea
                    id="field-options"
                    value={dialog.options}
                    onChange={handleOptionsChange}
                    placeholder={'Option A\nOption B\nOption C'}
                    rows={4}
                    aria-invalid={!!errors.options}
                  />
                  {errors.options && <FieldError>{errors.options}</FieldError>}
                </Field>
              )}

              {TYPES_WITH_PLACEHOLDER.has(dialog.type) && (
                <Field>
                  <FieldLabel htmlFor="field-placeholder">Placeholder</FieldLabel>
                  <FieldDescription>Leave blank for no placeholder</FieldDescription>
                  <Input
                    id="field-placeholder"
                    value={dialog.placeholder}
                    onChange={handlePlaceholderChange}
                    placeholder={dialog.type === 'select' ? 'Select an option' : 'e.g. Emily Oak'}
                  />
                </Field>
              )}

              {dialog.type === 'newsletter' && (
                <>
                  <Field>
                    <FieldLabel htmlFor="field-newsletter-first-name">First Name Field</FieldLabel>
                    <Select
                      value={dialog.firstNameFieldSlug || NO_FIELD}
                      onValueChange={handleLinkedFieldChange('firstNameFieldSlug')}>
                      <SelectTrigger id="field-newsletter-first-name" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_FIELD}>None</SelectItem>
                        {fieldsOfType('given-name').map((f) => (
                          <SelectItem key={f.slug} value={f.slug}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="field-newsletter-last-name">Last Name Field</FieldLabel>
                    <Select
                      value={dialog.lastNameFieldSlug || NO_FIELD}
                      onValueChange={handleLinkedFieldChange('lastNameFieldSlug')}>
                      <SelectTrigger id="field-newsletter-last-name" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_FIELD}>None</SelectItem>
                        {fieldsOfType('family-name').map((f) => (
                          <SelectItem key={f.slug} value={f.slug}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="field-newsletter-email">Email Field</FieldLabel>
                    <Select
                      value={dialog.emailFieldSlug || NO_FIELD}
                      onValueChange={handleLinkedFieldChange('emailFieldSlug')}>
                      <SelectTrigger
                        id="field-newsletter-email"
                        className="w-full"
                        aria-invalid={!!errors.emailFieldSlug}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_FIELD}>None</SelectItem>
                        {fieldsOfType('email').map((f) => (
                          <SelectItem key={f.slug} value={f.slug}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.emailFieldSlug && <FieldError>{errors.emailFieldSlug}</FieldError>}
                  </Field>
                </>
              )}

              <Field orientation="horizontal">
                <FieldLabel htmlFor="field-required">Required</FieldLabel>
                <Switch
                  id="field-required"
                  checked={dialog.required}
                  onCheckedChange={(checked) => setDialog((prev) => ({ ...prev, required: checked }))}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="field-validation">Validation (RegExp)</FieldLabel>
                <FieldDescription>Leave blank for no validation</FieldDescription>
                <Input
                  id="field-validation"
                  value={dialog.validation}
                  onChange={handleValidationChange}
                  placeholder="^[a-zA-Z ]+$"
                />
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter>
            <Button variant="secondary" type="button" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" type="button" onClick={handleSave}>
              {editingIndex !== null ? 'Save Changes' : 'Add Field'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
