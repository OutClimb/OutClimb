import { useCallback, useState } from 'react'

export function useCrudDialogs() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)

  const handleCreate = useCallback(() => {
    setSelectedId(null)
    setIsEditorOpen(true)
  }, [])

  const handleEdit = useCallback((id: number) => {
    setSelectedId(id)
    setIsEditorOpen(true)
  }, [])

  const handleEditorOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setSelectedId(null)
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
    handleEditorOpenChange,
    isDeleteDialogOpen,
    handleCreate,
    handleEdit,
    handleDelete,
    handleDeleteDialogOpenChange,
  }
}
