"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FormBuilder } from "@/components/admin/form-builder"
import { useFormsStore } from "@/components/admin/use-forms-store"
import { FormDefinition } from "@/components/admin/types"
import { dbFormToComponentFormat } from "@/app/utils/form-utils"
import { useToast } from "@/hooks/use-toast"

export default function CreateFormPage() {
  
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const router = useRouter()
  const { toast } = useToast()
  const { createForm, updateForm, getForm } = useFormsStore()
  
  const [editingForm, setEditingForm] = useState<FormDefinition | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Try to get form from store first
  const storeForm = editId ? getForm(editId) : null

  useEffect(() => {
    if (editId) {
      if (storeForm) {
        // Form exists in store
        setEditingForm(storeForm)
      } else {
        // Fetch form from API
        fetchFormForEdit(editId)
      }
    } else {
      setEditingForm(null)
      setError(null)
    }
  }, [editId, storeForm])

  async function fetchFormForEdit(id: string) {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/forms/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Form not found')
        }
        throw new Error('Failed to fetch form data')
      }
      
      const dbForm = await response.json()
      const form = dbFormToComponentFormat(dbForm)
      setEditingForm(form)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast({
        description: errorMessage,
        variant: "destructive"
      })
      // Clear the edit parameter on error
      router.replace("/admin/forms")
    } finally {
      setIsLoading(false)
    }
  }

  function handleCreate(payload: Omit<FormDefinition, "id" | "created_at" | "submissions">) {
    createForm(payload)
    toast({ description: "Form created successfully!" })
  }

  function handleUpdate(id: string, updates: Partial<Omit<FormDefinition, "id" | "createdAt" | "submissions">>) {
    updateForm(id, updates)
    toast({ description: "Form updated successfully!" })
    router.replace("/admin/forms")
  }

  function handleFinishEdit() {
    router.replace("/admin/forms")
  }

  // Loading state
  if (editId && isLoading) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-balance mb-4">Loading Form...</h2>
        <div className="max-w-3xl">
          <div className="flex items-center justify-center min-h-[400px] border rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading form data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (editId && error && !isLoading) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-balance mb-4">Error</h2>
        <div className="max-w-3xl">
          <div className="flex items-center justify-center min-h-[400px] border rounded-lg">
            <div className="text-center">
              <div className="text-red-600 text-lg mb-4">Unable to Load Form</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={() => router.replace("/admin/create-form")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Back to Create Form
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* <h2 className="text-lg font-semibold text-balance mb-4">
        {editingForm ? "Edit Form" : "Create Form"}
      </h2> */}
      <FormBuilder
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        editingForm={editingForm}
        onFinishEdit={handleFinishEdit}
      />
    </>
  )
}