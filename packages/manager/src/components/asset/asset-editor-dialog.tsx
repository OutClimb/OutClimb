'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createAsset, updateAsset } from '@/api/asset'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '../ui/field'
import { Input } from '@/components/ui/input'
import { readFileToBase64 } from '@/lib/file'
import { UnauthorizedError } from '@/errors/unauthorized'
import useAssetStore from '@/stores/asset'
import { useCallback, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import useSelfStore from '@/stores/self'
import type { Asset } from '@/types/asset'

interface FormData {
  id: number
  fileName: string
  contentType: string
  data: string
}

const emptyFormData: FormData = {
  id: 0,
  fileName: '',
  contentType: '',
  data: '',
}

interface AssetEditorDialogProps {
  open: boolean
  onOpenChange: (isOpen: boolean) => void
  initialAsset?: Asset
}

export function AssetEditorDialog({ open, onOpenChange, initialAsset }: AssetEditorDialogProps) {
  const navigate = useNavigate()
  const { token } = useSelfStore()
  const { populateSingle } = useAssetStore()

  const isEditing = initialAsset !== undefined

  const fileInput = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formError, setFormError] = useState({ file: '', fileName: '' })
  const [formData, setFormData] = useState<FormData>(emptyFormData)

  if (!open && (formData.id !== 0 || formData.fileName !== '' || formData.contentType !== '' || formData.data !== '')) {
    setFormData(emptyFormData)
    setFormError({ file: '', fileName: '' })
  }

  if (open && formData.id === 0 && initialAsset != null) {
    setFormData({ id: initialAsset.id, fileName: initialAsset.fileName, contentType: '', data: '' })
  }

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    const data = await readFileToBase64(file)
    setFormData((prev) => ({
      ...prev,
      fileName: isEditing ? prev.fileName : file.name,
      contentType: file.type,
      data,
    }))
  }, [isEditing])

  const handleFileNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, fileName: e.target.value }))
  }, [])

  const handleClear = useCallback(() => {
    if (fileInput.current) fileInput.current.value = ''
    setFormData((prev) => ({ ...prev, contentType: '', data: '' }))
  }, [])

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const handleSubmit = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      let hasError = false
      const nextError = { file: '', fileName: '' }

      if (isEditing && !formData.fileName.trim()) {
        hasError = true
        nextError.fileName = 'Please fill in this field'
      }

      if (!isEditing && !formData.data) {
        hasError = true
        nextError.file = 'Please select a file to upload'
      } else if (formData.data.length > 10485480) {
        hasError = true
        nextError.file = 'File is too large. File must be under 10MB.'
      }

      setFormError(nextError)

      if (!hasError) {
        setIsLoading(true)
        try {
          const payload = {
            id: formData.id,
            fileName: formData.fileName.trim(),
            contentType: formData.contentType.trim(),
            data: formData.data.trim(),
          }
          const asset = isEditing
            ? await updateAsset(token || '', payload)
            : await createAsset(token || '', payload)
          populateSingle(asset)
          onOpenChange(false)
        } catch (error) {
          if (error instanceof UnauthorizedError) {
            navigate({ to: '/manage/login' })
          }
        }
        setIsLoading(false)
      }
    },
    [formData, isEditing, populateSingle, onOpenChange, token, navigate],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Update Asset' : 'Upload Asset'}</DialogTitle>
        </DialogHeader>

        <div className="no-scrollbar -mx-4 max-h-[75vh] overflow-y-auto px-4">
          <form onSubmit={() => false}>
            {isEditing && (
              <div className="mb-4">
                <Field>
                  <FieldLabel>File Name:</FieldLabel>
                  <Input
                    id="fileName"
                    name="fileName"
                    type="text"
                    value={formData.fileName}
                    onChange={handleFileNameChange}
                    disabled={isLoading}
                    required
                  />
                  <FieldError>{formError.fileName}</FieldError>
                </Field>
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="file">File:</FieldLabel>
              <Input
                id="file"
                name="file"
                type="file"
                onChange={handleFileChange}
                disabled={isLoading}
                ref={fileInput}
                required={!isEditing}
              />
              {formData.data && (
                <Button variant="secondary" type="button" onClick={handleClear}>
                  <X /> Clear file
                </Button>
              )}
              <FieldError>{formError.file}</FieldError>
            </Field>
          </form>
        </div>

        <DialogFooter>
          <Button disabled={isLoading} variant="secondary" type="button" onClick={handleCancel}>
            Cancel
          </Button>
          <Button disabled={isLoading} variant="default" type="button" onClick={handleSubmit}>
            {isEditing ? 'Save' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
