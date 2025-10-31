"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { useFormsStore } from "./use-forms-store"
import { FormBuilder } from "./form-builder"
import { FormsList } from "./forms-list"
import { SubmissionsView } from "./submissions"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const { toast } = useToast()
  const {
    forms,
    createForm,
    updateForm,
    deleteForm,
    toggleActive,
    simulateSubmission,
    getForm,
    totalForms,
    activeForms,
    totalSubmissions,
  } = useFormsStore()

  const [active, setActive] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingForm = getForm(editingId)

  function goEdit(id: string) {
    setEditingId(id)
    setActive("create")
    toast({ description: "Editing form in the Create tab." })
  }

  function finishEdit() {
    setEditingId(null)
    setActive("forms")
  }

  function handleLogout() {
    toast({ description: "Logged out (UI only)." })
    setTimeout(() => {
      window.location.href = "/"
    }, 500)
  }

  return (
    <div className="min-h-[100dvh] grid md:grid-cols-[16rem_1fr]">
      <Sidebar  />

      <main className="p-4 md:p-6">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b -mx-4 md:-mx-6 px-4 md:px-6 py-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-pretty">
                {active === "create" ? (editingForm ? "Edit Form" : "Create Form") : null}
                {active === "forms" ? "Forms" : null}
                {active === "submissions" ? "Submissions" : null}
              </h1>
              <p className="text-sm text-muted-foreground">
                Total forms: {totalForms} • Active: {activeForms} • Submissions: {totalSubmissions}
              </p>
            </div>
            <div className="hidden md:block">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingId(null)
                  setActive("create")
                }}
              >
                New Form
              </Button>
            </div>
          </div>
        </header>

        <section className="grid">
          {active === "create" && (
            <FormBuilder
              onCreate={(payload) => {
                const id = createForm(payload)
                setActive("forms")
                return id
              }}
              onUpdate={updateForm}
              editingForm={editingForm}
              onFinishEdit={finishEdit}
            />
          )}

          {active === "forms" && (
            <FormsList  onEdit={goEdit} onDelete={deleteForm} onToggleActive={toggleActive} />
          )}

          {active === "submissions" && <SubmissionsView forms={forms} onSimulate={simulateSubmission} />}
        </section>
      </main>
    </div>
  )
}
