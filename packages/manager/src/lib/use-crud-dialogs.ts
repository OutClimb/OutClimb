import { useCallback, useState } from 'react'

export function useCrudDialogs() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)

  const handleCreate = useCallback(() => setIsCreateDialogOpen(true), [])

  const handleEdit = useCallback((id: number) => {
    setSelectedId(id)
    setIsEditDialogOpen(true)
  }, [])

  const handleEditDialogOpenChange = useCallback(() => {
    setSelectedId(null)
    setIsEditDialogOpen(false)
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
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    isDeleteDialogOpen,
    handleCreate,
    handleEdit,
    handleEditDialogOpenChange,
    handleDelete,
    handleDeleteDialogOpenChange,
  }
}
