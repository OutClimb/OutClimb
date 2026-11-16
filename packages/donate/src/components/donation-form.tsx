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
  STRIPE_FEE_PERCENT,
  validateAmount,
} from '@/api/donation'
import { HandHeart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from 'cn'

const PRESET_AMOUNTS_CENTS = [1000, 2000, 3000, 4000]
const DEFAULT_AMOUNT_CENTS = 2000
const SECTION_LABEL_CLASS = 'text-sm font-medium'
const CAPTCHA_ERROR = "We couldn't verify that you're not a robot. Please try again."

function centsToDollarInput(cents: number): string {
  return String(cents / 100)
}

export function DonationForm() {
  const [amount, setAmount] = useState(centsToDollarInput(DEFAULT_AMOUNT_CENTS))
  const [coverFees, setCoverFees] = useState(false)
  const [showAmountError, setShowAmountError] = useState(false)
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
    setShowAmountError(true)
  }

  const validation = validateAmount(amount, coverFees)
  const hasAmountError = 'error' in validation
  const amountError = showAmountError && 'error' in validation ? validation.error : ''
  const donationCents = dollarsToCents(amount)
  const feeCents = donationCents === null ? null : calculateFeeCents(donationCents)

  const selectPreset = (cents: number) => {
    changeAmount(centsToDollarInput(cents))
  }

  const totalCents = 'cents' in validation ? validation.cents : null
  const donateLabel = totalCents === null ? 'Donate' : `Donate ${formatCentsAsDollars(totalCents)}`

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError('')

    if ('error' in validation) {
      setShowAmountError(true)
      customAmountRef.current?.focus()
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
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-2xl bg-white p-5 shadow-sm md:gap-7 md:p-8">
      <div className="flex flex-col gap-3">
        <div className={SECTION_LABEL_CLASS}>Amount</div>
        <div className="grid grid-cols-4 gap-2.5">
          {PRESET_AMOUNTS_CENTS.map((cents) => {
            const selected = amount === centsToDollarInput(cents)
            return (
              <button
                key={cents}
                type="button"
                disabled={submitting}
                aria-pressed={selected}
                onClick={() => selectPreset(cents)}
                className={cn(
                  'h-[52px] rounded-[10px] border text-lg font-semibold transition-colors disabled:opacity-50',
                  selected ? 'border-brand bg-brand text-white' : 'border-[#e2e1ee] bg-white hover:bg-surface',
                )}>
                {formatCentsAsDollars(cents)}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="donation-amount" className="text-sm text-ink-muted">
            Or enter a custom amount
          </label>
          <div className="relative">
            <span aria-hidden="true" className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ink-muted">
              $
            </span>
            <Input
              ref={customAmountRef}
              id="donation-amount"
              inputMode="decimal"
              placeholder="0.00"
              autoComplete="off"
              value={amount}
              disabled={submitting}
              aria-invalid={Boolean(amountError)}
              onChange={(e) => changeAmount(e.target.value)}
              className="h-11 rounded-[10px] border-[#e2e1ee] bg-white pl-8 shadow-xs"
            />
          </div>
        </div>
        {amountError && <FieldError>{amountError}</FieldError>}
      </div>

      <div className="flex gap-3 rounded-xl bg-surface p-4">
        <Checkbox
          id="cover-fees"
          checked={coverFees}
          onCheckedChange={(checked) => {
            setCoverFees(checked === true)
            setShowAmountError(true)
          }}
          disabled={submitting}
          className="mt-0.5 size-[18px] border-[#c9c8e0] bg-white"
        />
        <label htmlFor="cover-fees" className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Cover the {STRIPE_FEE_PERCENT}% processing fee</span>
          <span className="text-[13px] text-ink-muted">
            {feeCents === null
              ? 'So 100% of your gift reaches OutClimb.'
              : `So 100% of your gift reaches OutClimb (+${formatCentsAsDollars(feeCents)}).`}
          </span>
        </label>
      </div>

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

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between text-sm text-ink-muted">
          <span>Your donation</span>
          <strong className="text-lg font-semibold text-ink">
            {totalCents === null ? '—' : formatCentsAsDollars(totalCents)}
          </strong>
        </div>

        {submitError && <FieldError className="text-center">{submitError}</FieldError>}

        <Button
          type="submit"
          className="h-[52px] w-full rounded-[10px] text-base shadow-xs"
          disabled={submitting || hasAmountError}>
          <HandHeart aria-hidden="true" className="size-[18px]" />
          {submitting ? 'Redirecting to Stripe…' : donateLabel}
        </Button>

        <p className="text-[13px] leading-normal text-ink-muted">
          OutClimb is a 501(c)(3) nonprofit organization. All donations are tax deductible.
        </p>
      </div>
    </form>
  )
}
