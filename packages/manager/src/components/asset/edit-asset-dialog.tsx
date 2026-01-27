'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel } from '../ui/field'
import { Input } from '@/components/ui/input'
import { readFileToBase64 } from '@/lib/file'
import { UnauthorizedError } from '@/errors/unauthorized'
import { updateAsset } from '@/api/asset'
import useAssetStore from '@/stores/asset'
import { useCallback, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import useUserStore from '@/stores/user'

interface FormData {
  id: number
  fileName: string
  contentType: string
  data: string
}

interface EditAssetDialogProps {
  id: number | null
  open: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function EditAssetDialog({ id, open, onOpenChange }: EditAssetDialogProps) {
  const navigate = useNavigate()
  const { token } = useUserStore()
  const { data, populateSingle } = useAssetStore()

  const fileInput = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formError, setFormError] = useState({
    file: '',
    fileName: '',
  })
  const [formData, setFormData] = useState<FormData>({
    id: 0,
    fileName: '',
    contentType: '',
    data: '',
  })

  if (!open && (formData.fileName !== '' || formData.contentType !== '' || formData.data !== '')) {
    setFormData({
      id: 0,
      fileName: '',
      contentType: '',
      data: '',
    })
    setFormError({
      file: '',
      fileName: '',
    })
  }

  if (open && formData.id === 0 && id != null) {
    const currentAsset = data[id]
    setFormData({
      id: currentAsset.id,
      fileName: currentAsset.fileName,
      contentType: '',
      data: '',
    })
  }

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    },
    [setFormData],
  )

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) {
        return
      }
      const file = e.target.files[0]
      const newData = await readFileToBase64(file)

      setFormData((prev) => ({
        ...prev,
        contentType: file.type,
        data: newData,
      }))
    },
    [setFormData],
  )

  const handleClear = useCallback(() => {
    if (fileInput.current) {
      fileInput.current.value = ''
    }

    setFormData((prev) => ({
      ...prev,
      contentType: '',
      data: '',
    }))
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
        fileName: '',
      })

      if (!formData.fileName) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          fileName: 'Please fill in this field',
        }))
      }

      if (formData.data.length > 10485480) {
        hasError = true
        setFormError((prev) => ({
          ...prev,
          file: 'File is too large. File must be under 10MB.',
        }))
      }

      if (!hasError) {
        setIsLoading(true)
        try {
          const asset = await updateAsset(token || '', {
            id: formData.id,
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
          <DialogTitle>Update Asset</DialogTitle>
        </DialogHeader>

        <div className="no-scrollbar -mx-4 max-h-[75vh] overflow-y-auto px-4">
          <form onSubmit={() => false}>
            <div className="mb-4">
              <Field>
                <FieldLabel>File Name:</FieldLabel>
                <Input
                  id="fileName"
                  name="fileName"
                  type="text"
                  value={formData.fileName}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </Field>
              {formError.fileName && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError.fileName}</AlertDescription>
                </Alert>
              )}
            </div>

            <Field>
              <FieldLabel htmlFor="fromPath">File:</FieldLabel>
              <Input
                id="file"
                name="file"
                type="file"
                onChange={handleFileChange}
                disabled={isLoading}
                ref={fileInput}
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
