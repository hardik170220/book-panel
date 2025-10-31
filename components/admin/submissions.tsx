"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { FormDefinition } from "./types"
import { AVAILABLE_FIELDS } from "./types"

export function SubmissionsView({
  forms,
  onSimulate,
}: {
  forms: FormDefinition[]
  onSimulate: (id: string) => void
}) {
  const [selectedId, setSelectedId] = useState<string | undefined>(forms[0]?.id)
  const selected = useMemo(() => forms.find((f) => f.id === selectedId), [forms, selectedId])
  const labelMap = useMemo(() => {
    const map = new Map(AVAILABLE_FIELDS.map((f) => [f.key, f.label]))
    return map
  }, [])

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-pretty">Submissions Overview</CardTitle>
          <CardDescription>Select a form to view details and recent submissions.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="min-w-60">
              <Select value={selectedId} onValueChange={(v) => setSelectedId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select form" />
                </SelectTrigger>
                <SelectContent>
                  {forms.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selected && (
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Status</CardTitle>
                  </CardHeader>
                  <CardContent className="py-3">
                    {selected.active ? (
                      <Badge className="bg-green-600 hover:bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Total Submissions</CardTitle>
                  </CardHeader>
                  <CardContent className="py-3 text-2xl font-semibold">{selected.submissions.length}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Fields</CardTitle>
                  </CardHeader>
                  <CardContent className="py-3 text-2xl font-semibold">{selected.fields.length}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Created</CardTitle>
                  </CardHeader>
                  <CardContent className="py-3">
                    <div className="text-sm text-muted-foreground">{new Date(selected.created_at).toLocaleString()}</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {selected && (
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Button onClick={() => onSimulate(selected.id)}>Simulate submission</Button>
                  <span className="text-sm text-muted-foreground">
                    UI-only demo to increase counts without a backend.
                  </span>
                </div>
              </div>
              <div className="md:w-1/2">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Fields Included</CardTitle>
                    <CardDescription>Fields configured for this form.</CardDescription>
                  </CardHeader>
                  <CardContent className="py-3">
                    <div className="flex flex-wrap gap-2">
                      {selected.fields.length > 0 ? (
                        selected.fields.map((k) => (
                          <Badge key={k} variant="secondary">
                            {labelMap.get(k) ?? k}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No fields selected.</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent submissions table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-pretty">Recent Submissions</CardTitle>
          <CardDescription>Latest entries for the selected form.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submission ID</TableHead>
                  <TableHead>Submitted At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selected && selected.submissions.length > 0 ? (
                  selected.submissions.slice(0, 20).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.id}</TableCell>
                      <TableCell className="text-sm">{new Date(s.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      {forms.length === 0 ? "No forms created yet." : "No submissions yet."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
