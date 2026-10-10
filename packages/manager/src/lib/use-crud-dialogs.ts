import { useCallback, useState } from 'react'

export function useCrudDialogs() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false)
  const [isDuplicating, setIsDuplicating] = useState<boolean>(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)

  const handleCreate = useCallback(() => {
    setSelectedId(null)
    setIsDuplicating(false)
    setIsEditorOpen(true)
  }, [])

  const handleEdit = useCallback((id: number) => {
    setSelectedId(id)
    setIsDuplicating(false)
    setIsEditorOpen(true)
  }, [])

  const handleDuplicate = useCallback((id: number) => {
    setSelectedId(id)
    setIsDuplicating(true)
    setIsEditorOpen(true)
  }, [])

  const handleEditorOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setSelectedId(null)
      setIsDuplicating(false)
      setIsEditorOpen(false)
    }
  }, [])

  const handleDelete = useCallback((id: number) => {
    setSelectedId(id)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleDeleteDialogOpenChange = useCallback(() => {
    setSelectedId(null)
    setIsDeleteDialogOpen(false)
  }, [])

  return {
    selectedId,
    isEditorOpen,
    isDuplicating,
    handleEditorOpenChange,
    isDeleteDialogOpen,
    handleCreate,
    handleEdit,
    handleDuplicate,
    handleDelete,
    handleDeleteDialogOpenChange,
  }
}
