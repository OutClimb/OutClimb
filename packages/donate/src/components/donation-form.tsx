'use client'

import 'altcha'
import type {} from 'altcha/types/react'
import type { AltchaWidgetElement } from 'altcha/types/generic'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  calculateFeeCents,
  createDonationCheckout,
  dollarsToCents,
  formatCentsAsDollars,
  MAXIMUM_DONATION_CENTS,
  MINIMUM_DONATION_CENTS,
  STRIPE_FEE_PERCENT,
} from '@/api/donation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const PRESET_AMOUNTS_CENTS = [1000, 2000, 3000, 4000]
const AMOUNT_ERROR = `Please enter an amount between ${formatCentsAsDollars(MINIMUM_DONATION_CENTS)} and ${formatCentsAsDollars(MAXIMUM_DONATION_CENTS)}.`
const FEES_TOTAL_ERROR = `With fees included, the total can't be more than ${formatCentsAsDollars(MAXIMUM_DONATION_CENTS)}.`
const CAPTCHA_ERROR = "We couldn't verify that you're not a robot. Please try again."

function centsToDollarInput(cents: number): string {
  return String(cents / 100)
}

function validateAmount(dollars: string, coverFees: boolean): { cents: number } | { error: string } {
  const donationCents = dollarsToCents(dollars)
  if (donationCents === null || donationCents < MINIMUM_DONATION_CENTS || donationCents > MAXIMUM_DONATION_CENTS) {
    return { error: AMOUNT_ERROR }
  }

  const totalCents = coverFees ? donationCents + calculateFeeCents(donationCents) : donationCents
  if (totalCents > MAXIMUM_DONATION_CENTS) {
    return { error: FEES_TOTAL_ERROR }
  }
  return { cents: totalCents }
}

export function DonationForm() {
  const [amount, setAmount] = useState('')
  const [coverFees, setCoverFees] = useState(false)
  const [customSelected, setCustomSelected] = useState(false)
  const [amountError, setAmountError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const altchaRef = useRef<AltchaWidgetElement>(null)
  const altchaPayload = useRef<string | null>(null)
  const customAmountRef = useRef<HTMLInputElement>(null)
  const honeypotRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const widget = altchaRef.current
    if (!widget) return

    const handleStateChange = (e: Event) => {
      const { payload, state } = (e as CustomEvent<{ payload?: string; state: string }>).detail
      altchaPayload.current = state === 'verified' && payload ? payload : null
    }

    widget.addEventListener('statechange', handleStateChange)
    return () => widget.removeEventListener('statechange', handleStateChange)
  }, [])

  const changeAmount = (nextAmount: string) => {
    setAmount(nextAmount)
    setAmountError('')
  }

  const donationCents = dollarsToCents(amount)
  const feeCents = donationCents === null ? null : calculateFeeCents(donationCents)

  const selectPreset = (cents: number) => {
    setCustomSelected(false)
    changeAmount(centsToDollarInput(cents))
  }

  const selectCustom = () => {
    setCustomSelected(true)
    changeAmount('')
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError('')

    const validation = validateAmount(amount, coverFees)
    if ('error' in validation) {
      setAmountError(validation.error)
      if (customSelected) customAmountRef.current?.focus()
      return
    }

    setSubmitting(true)
    try {
      // The widget usually finishes in the background while the amount is chosen.
      const altcha = altchaPayload.current ?? (await altchaRef.current?.verify())?.payload
      if (!altcha) {
        throw new Error(CAPTCHA_ERROR)
      }

      const checkoutUrl = await createDonationCheckout({
        amountCents: validation.cents,
        altcha,
        honeypot: honeypotRef.current?.value ?? '',
      })
      window.location.assign(checkoutUrl)
    } catch (err) {
      // Each solution can only be used once, so start a fresh challenge for the retry.
      altchaPayload.current = null
      altchaRef.current?.reset()
      setSubmitError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <FieldGroup className="gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {PRESET_AMOUNTS_CENTS.map((cents) => (
            <Button
              key={cents}
              type="button"
              size="lg"
              variant={!customSelected && amount === centsToDollarInput(cents) ? 'default' : 'outline'}
              disabled={submitting}
              onClick={() => selectPreset(cents)}>
              {formatCentsAsDollars(cents)}
            </Button>
          ))}
          <Button
            type="button"
            size="lg"
            variant={customSelected ? 'default' : 'outline'}
            disabled={submitting}
            onClick={selectCustom}>
            Custom
          </Button>
        </div>

        {customSelected && (
          <Field data-invalid={Boolean(amountError)}>
            <FieldLabel htmlFor="donation-amount" className="text-base font-medium">
              Custom amount (USD)
            </FieldLabel>
            <Input
              ref={customAmountRef}
              id="donation-amount"
              inputMode="decimal"
              placeholder="25.00"
              autoComplete="off"
              autoFocus
              value={amount}
              disabled={submitting}
              aria-invalid={Boolean(amountError)}
              onChange={(e) => changeAmount(e.target.value)}
            />
          </Field>
        )}

        {amountError && <FieldError>{amountError}</FieldError>}

        <Field orientation="horizontal">
          <Checkbox
            id="cover-fees"
            checked={coverFees}
            onCheckedChange={(checked) => {
              setCoverFees(checked === true)
              setAmountError('')
            }}
            disabled={submitting}
            className="border-gray-400 bg-white"
          />
          <FieldContent>
            <FieldLabel htmlFor="cover-fees" className="text-base font-normal">
              {donationCents === null || feeCents === null
                ? `Cover the ${STRIPE_FEE_PERCENT}% processing fee so more of my gift goes to OutClimb`
                : `Cover the ${STRIPE_FEE_PERCENT}% processing fee (+${formatCentsAsDollars(feeCents)}, total ${formatCentsAsDollars(donationCents + feeCents)})`}
            </FieldLabel>
          </FieldContent>
        </Field>

        {/*
          Honeypot: hidden from people, but bots tend to fill in every field. The name avoids anything
          autofill recognizes, and the data attributes tell password managers to skip it.
        */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="oc-confirm">Leave this field empty</label>
          <input
            ref={honeypotRef}
            id="oc-confirm"
            name="oc-confirm"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-bwignore
            data-form-type="other"
          />
        </div>

        <altcha-widget
          ref={altchaRef}
          challenge="/api/v1/captcha"
          auto="onfocus"
          style={{
            '--altcha-max-width': '100%',
            '--altcha-color-base': 'var(--color-white)',
            '--altcha-border-radius': 'var(--radius-lg)',
            '--altcha-color-primary': 'var(--primary)',
          }}
        />

        {submitError && <FieldError className="text-center">{submitError}</FieldError>}

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Redirecting to Stripe…' : 'Donate'}
        </Button>
      </FieldGroup>
    </form>
  )
}
