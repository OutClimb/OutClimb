import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { MAX_EVENT_LINK_LABEL_LENGTH, MAX_EVENT_LINK_URL_LENGTH, swapEventLinks } from '@/lib/event-link'
import type { EventLinkErrors } from '@/lib/event-link'
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, XIcon } from 'lucide-react'
import type { EventLink } from '@/types/event'

const EMPTY_LINK: EventLink = { label: '', url: '' }

interface LinkInputProps {
  id: string
  links: Array<EventLink>
  errors: Array<EventLinkErrors>
  onChange: (links: Array<EventLink>) => void
  disabled?: boolean
}

export function LinkInput({ id, links, errors, onChange, disabled }: LinkInputProps) {
  const updateLink = (index: number, changes: Partial<EventLink>) => {
    onChange(links.map((link, i) => (i === index ? { ...link, ...changes } : link)))
  }

  const removeLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-3">
      {links.map((link, index) => {
        const labelId = `${id}-${index}-label`
        const urlId = `${id}-${index}-url`
        return (
          <div key={index} className="flex items-start gap-2">
            <div className="flex">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Move link ${index + 1} up`}
                onClick={() => onChange(swapEventLinks(links, index, index - 1))}
                disabled={disabled || index === 0}>
                <ChevronUpIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Move link ${index + 1} down`}
                onClick={() => onChange(swapEventLinks(links, index, index + 1))}
                disabled={disabled || index === links.length - 1}>
                <ChevronDownIcon />
              </Button>
            </div>
            <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_2fr]">
              <Field>
                <FieldLabel htmlFor={labelId} className="sr-only">
                  Link {index + 1} label
                </FieldLabel>
                <Input
                  id={labelId}
                  type="text"
                  placeholder="Label, such as Register"
                  maxLength={MAX_EVENT_LINK_LABEL_LENGTH}
                  value={link.label}
                  onChange={(e) => updateLink(index, { label: e.target.value })}
                  disabled={disabled}
                />
                <FieldError>{errors[index]?.label}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor={urlId} className="sr-only">
                  Link {index + 1} URL
                </FieldLabel>
                <Input
                  id={urlId}
                  type="url"
                  placeholder="https://"
                  maxLength={MAX_EVENT_LINK_URL_LENGTH}
                  value={link.url}
                  onChange={(e) => updateLink(index, { url: e.target.value })}
                  disabled={disabled}
                />
                <FieldError>{errors[index]?.url}</FieldError>
              </Field>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove link ${index + 1}`}
              onClick={() => removeLink(index)}
              disabled={disabled}>
              <XIcon />
            </Button>
          </div>
        )
      })}
      <div>
        <Button
          id={id}
          type="button"
          variant="outline"
          onClick={() => onChange([...links, EMPTY_LINK])}
          disabled={disabled}>
          <PlusIcon /> Add link
        </Button>
      </div>
    </div>
  )
}
