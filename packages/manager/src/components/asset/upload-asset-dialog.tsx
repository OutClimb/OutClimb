'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createAsset } from '@/api/asset'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel } from '../ui/field'
import { Input } from '@/components/ui/input'
import { readFileToBase64 } from '@/lib/file'
import { UnauthorizedError } from '@/errors/unauthorized'
import useAssetStore from '@/stores/asset'
import { useCallback, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import useSelfStore from '@/stores/self'

interface FormData {
  fileName: string
  contentType: string
  data: string
}

interface UploadAssetDialogProps {
  open: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function UploadAssetDialog({ open, onOpenChange }: UploadAssetDialogProps) {
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { populateSingle } = useAssetStore()

  const fileInput = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formError, setFormError] = useState({
    file: '',
  })
  const [formData, setFormData] = useState<FormData>({
    fileName: '',
    contentType: '',
    data: '',
  })

  if (!open && (formData.fileName !== '' || formData.contentType !== '' || formData.data !== '')) {
    setFormData({
      fileName: '',
      contentType: '',
      data: '',
    })
    setFormError({
      file: '',
    })
  }

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) {
        return
      }
      const file = e.target.files[0]

      setFormData({
        fileName: file.name,
        contentType: file.type,
        data: await readFileToBase64(file),
      })
    },
    [setFormData],
  )

  const handleClear = useCallback(() => {
    if (fileInput.current) {
      fileInput.current.value = ''
    }

    setFormData({
      fileName: '',
      contentType: '',
      data: '',
    })
  }, [fileInput, setFormData])

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      let hasError = false
      setFormError({
        file: '',
      })

      if (!formData.data.trim()) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          file: 'Please select a file to upload',
        }))
      } else if (formData.data.length > 10485480) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          file: 'File is too large. File must be under 10MB.',
        }))
      }

      if (!hasError) {
        setIsLoading(true)
        try {
          const asset = await createAsset(token || '', {
            id: 0,
            fileName: formData.fileName.trim(),
            contentType: formData.contentType.trim(),
            data: formData.data.trim(),
          })
          populateSingle(asset)
          onOpenChange(false)
        } catch (error) {
          if (error instanceof UnauthorizedError) {
            navigate({
              to: '/manage/login',
            })
          } else {
            // Handle error
          }
        }
        setIsLoading(false)
      }
    },
    [setFormError, formData, setIsLoading, populateSingle, onOpenChange, token, navigate],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Asset</DialogTitle>
        </DialogHeader>

        <div className="no-scrollbar -mx-4 max-h-[75vh] overflow-y-auto px-4">
          <form onSubmit={() => false}>
            <Field>
              <FieldLabel htmlFor="fromPath">File:</FieldLabel>
              <Input
                id="file"
                name="file"
                type="file"
                onChange={handleFileChange}
                disabled={isLoading}
                ref={fileInput}
                required
              />
              {formData.data && (
                <Button variant="secondary" type="button" onClick={handleClear}>
                  <X /> Clear file
                </Button>
              )}
              {formError.file && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError.file}</AlertDescription>
                </Alert>
              )}
            </Field>
          </form>
        </div>

        <DialogFooter>
          <Button disabled={isLoading} variant="secondary" type="button" onClick={handleCancel}>
            Cancel
          </Button>
          <Button disabled={isLoading} variant="default" type="button" onClick={handleSubmit}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
