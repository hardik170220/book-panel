"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { FormDefinition } from "./types"

const STORAGE_KEY = "admin-ui-forms"

function genId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function nowISO() {
  return new Date().toISOString()
}

export function useFormsStore() {
  const [forms, setForms] = useState<FormDefinition[]>([])

  // load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as any[]
        const migrated = Array.isArray(parsed)
          ? parsed.map((f) => {
              const hasSingle = typeof f?.thumbnail === "string" && f.thumbnail.length > 0
              const hasArray = Array.isArray(f?.thumbnails)
              return {
                ...f,
                thumbnails: hasArray ? f.thumbnails : hasSingle ? [f.thumbnail] : [],
              }
            })
          : []
        setForms(migrated as FormDefinition[])
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  // persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(forms))
    } catch {
      // ignore storage errors
    }
  }, [forms])

  const createForm = useCallback((payload: Omit<FormDefinition, "id" | "created_at" | "submissions">) => {
    const newForm: FormDefinition = {
      ...payload,
      id: genId("form"),
      created_at: nowISO(),
      submissions: [],
    }
    setForms((prev) => [newForm, ...prev])
    return newForm.id
  }, [])

  const updateForm = useCallback(
    (id: string, updates: Partial<Omit<FormDefinition, "id" | "createdAt" | "submissions">>) => {
      setForms((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)))
    },
    [],
  )

  const deleteForm = useCallback((id: string) => {
    setForms((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const toggleActive = useCallback((id: string) => {
    setForms((prev) => prev.map((f) => (f.id === id ? { ...f, active: !f.active } : f)))
  }, [])

  // Demo: simulate a submission to increment count
  const simulateSubmission = useCallback((id: string) => {
    setForms((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              submissions: [{ id: genId("sub"), created_at: nowISO() }, ...f.submissions],
            }
          : f,
      ),
    )
  }, [])

  const getForm = useCallback((id?: string | null) => forms.find((f) => f.id === id), [forms])

  const totalForms = forms.length
  const activeForms = useMemo(() => forms.filter((f) => f.active).length, [forms])
  const totalSubmissions = useMemo(() => forms.reduce((sum, f) => sum + f.submissions.length, 0), [forms])

  return {
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
  }
}
