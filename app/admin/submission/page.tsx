"use client"

import { SubmissionsView } from "@/components/admin/submissions"
import { useFormsStore } from "@/components/admin/use-forms-store"

export default function SubmissionPage() {
  const { forms, simulateSubmission } = useFormsStore()

  return (
    <>
      <h2 className="text-lg font-semibold text-balance mb-4">Submissions</h2>
      <SubmissionsView forms={forms} onSimulate={simulateSubmission} />
    </>
  )
}

// import React from 'react'

// const page = () => {
//   return (
//     <div>page</div>
//   )
// }

// export default page