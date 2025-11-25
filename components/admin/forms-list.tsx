// "use client"

// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import type { FormDefinition } from "./types"
// import { Trash2, Pencil, Eye, Power, Trash } from "lucide-react"
// import { useToast } from "@/hooks/use-toast"
// import { useEffect, useState } from "react"

// export function FormsList({
//   onEdit,
//   onDelete,
//   onToggleActive,
// }: {
//   onEdit: (id: string) => void
//   onDelete: (id: string) => void
//   onToggleActive: (id: string) => void
// }) {
//   const { toast } = useToast()
//   const [forms, setForms] = useState<FormDefinition[]>([])
//   const [loading, setLoading] = useState(false)
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
//   const [formToDelete, setFormToDelete] = useState<string | null>(null)
//   const [deletingForm, setDeletingForm] = useState(false)

//   const API_URL = "/api/forms"

//   useEffect(() => {
//     async function fetchForms() {
//       setLoading(true)
//       try {
//         const res = await fetch(API_URL, { cache: "no-store" })
//         if (!res.ok) throw new Error(`Failed to fetch forms: ${res.statusText}`)
//         const data: FormDefinition[] = await res.json()
//         setForms(data)
//       } catch (err: any) {
//         console.error("Error fetching forms:", err)
//         toast({
//           description: "Failed to fetch forms",
//           variant: "destructive"
//         })
//       } finally {
//         setLoading(false)
//       }
//     }
//     fetchForms()
//   }, [toast])

//   const handleDeleteClick = (id: string) => {
//     setFormToDelete(id)
//     setDeleteDialogOpen(true)
//   }

//   const handleDeleteConfirm = async () => {
//     if (!formToDelete) return

//     setDeletingForm(true)
//     try {
//       // Call the API to delete the form
//       const res = await fetch(`${API_URL}/${formToDelete}`, {
//         method: 'DELETE',
//       })

//       if (!res.ok) {
//         throw new Error(`Failed to delete form: ${res.statusText}`)
//       }

//       // Remove from local state
//       setForms(forms.filter(form => form.id !== formToDelete))

//       // Call parent's onDelete callback
//       onDelete(formToDelete)

//       toast({
//         description: "Form deleted successfully."
//       })
//     } catch (err: any) {
//       console.error("Error deleting form:", err)
//       toast({
//         description: "Failed to delete form",
//         variant: "destructive"
//       })
//     } finally {
//       setDeletingForm(false)
//       setDeleteDialogOpen(false)
//       setFormToDelete(null)
//     }
//   }

//   const handleEditClick = (id: string) => {
//     onEdit(id)
//   }

//   const handleToggleActive = async (id: string) => {
//     try {
//       const form = forms.find(f => f.id === id)
//       if (!form) return

//       const res = await fetch(`${API_URL}/${id}`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ active: !form.active }),
//       })

//       if (!res.ok) {
//         throw new Error(`Failed to update form: ${res.statusText}`)
//       }

//       // Update local state
//       setForms(forms.map(f =>
//         f.id === id ? { ...f, active: !f.active } : f
//       ))

//       onToggleActive(id)

//       toast({
//         description: `Form ${form.active ? 'deactivated' : 'activated'} successfully.`
//       })
//     } catch (err: any) {
//       console.error("Error toggling form status:", err)
//       toast({
//         description: "Failed to update form status",
//         variant: "destructive"
//       })
//     }
//   }

//   const formToDeleteDetails = forms.find(f => f.id === formToDelete)

//   return (
//     <>
//       <Card>
//         {/* <CardHeader>
//           <CardTitle className="text-pretty">All Forms</CardTitle>
//         </CardHeader> */}
//         <CardContent>
//           <div className="overflow-x-auto font-anek">
//             <Table>
//               <TableCaption>Manage your generated forms.</TableCaption>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Form</TableHead>
//                   <TableHead>Status</TableHead>
//                   <TableHead>Created</TableHead>
//                   <TableHead className="text-right">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {loading ? (
//                   <TableRow>
//                     <TableCell colSpan={4} className="text-center text-muted-foreground">
//                       Loading forms...
//                     </TableCell>
//                   </TableRow>
//                 ) : forms.length === 0 ? (
//                   <TableRow>
//                     <TableCell colSpan={4} className="text-center text-muted-foreground">
//                       No forms yet. Create your first form from the sidebar.
//                     </TableCell>
//                   </TableRow>
//                 ) : (
//                   forms.map((f) => {
//                     const count = f.thumbnails?.length ?? 0
//                     const first = count > 0 ? f.thumbnails![0] : undefined
//                     const extra = count > 1 ? count - 1 : 0
//                     return (
//                       <TableRow key={f.id}>
//                         <TableCell className="min-w-56">
//                           <div className="flex items-center gap-3">
//                             <div className="relative">
//                               {first ? (
//                                 <img
//                                   src={first || "/placeholder.svg"}
//                                   alt={`${f.title} thumbnail`}
//                                   className="h-10 w-10 rounded object-cover border"
//                                 />
//                               ) : (
//                                 <img
//                                   src="/form-thumbnail-placeholder.png"
//                                   alt="No thumbnail"
//                                   className="h-10 w-10 rounded object-cover border opacity-70"
//                                 />
//                               )}
//                               {extra > 0 && (
//                                 <span className="absolute -bottom-2 -right-2 text-[10px] px-1.5 py-0.5 rounded bg-secondary border">
//                                   +{extra}
//                                 </span>
//                               )}
//                             </div>
//                             <div>
//                               <div className="font-medium">{f.title}</div>
//                               <div className="text-xs text-muted-foreground line-clamp-1">
//                                 {f.description || "No description"}
//                               </div>
//                             </div>
//                           </div>
//                         </TableCell>
//                         <TableCell>
//                           {f.active ? (
//                             <Badge className="bg-green-600 hover:bg-green-600">Active</Badge>
//                           ) : (
//                             <Badge variant="secondary">Inactive</Badge>
//                           )}
//                         </TableCell>
//                         <TableCell>
//                           <span className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleString()}</span>
//                         </TableCell>
//                         <TableCell className="text-right">
//                           <div className="flex justify-end gap-2">
//                             <Button
//                               size="icon"
//                               variant="ghost"
//                               title="Toggle Active"
//                               onClick={() => handleToggleActive(f.id)}
//                             >
//                               <Power className="h-4 w-4" />
//                             </Button>
//                             <Button
//                               size="icon"
//                               variant="ghost"
//                               title="Edit"
//                               onClick={() => handleEditClick(f.id)}
//                             >
//                               <Pencil className="h-4 w-4" />
//                             </Button>
//                             <Button
//                               size="icon"
//                               variant="ghost"
//                               title="Delete"
//                               onClick={() => handleDeleteClick(f.id)}
//                             >
//                               <Trash2 fill="red" color="red" className="h-4 w-4" />
//                             </Button>
//                             {/* <Button size="icon" variant="ghost" title="Preview (UI only)">
//                               <Eye className="h-4 w-4" />
//                             </Button> */}
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     )
//                   })
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Delete Confirmation Dialog */}
//       <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Delete Form</DialogTitle>
//             <DialogDescription>
//               Are you sure you want to delete the form "{formToDeleteDetails?.title}"?
//               This action cannot be undone and will permanently remove the form and all its data.
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => setDeleteDialogOpen(false)}
//               disabled={deletingForm}
//             >
//               Cancel
//             </Button>
//             <Button
//               variant="destructive"
//               onClick={handleDeleteConfirm}
//               disabled={deletingForm}
//             >
//               {deletingForm ? "Deleting..." : "Delete"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   )
// }

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { FormDefinition } from "./types";
import {
  Trash2,
  Pencil,
  Eye,
  Power,
  GripVertical,
  LinkIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Row Component
function SortableTableRow({
  form,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  form: FormDefinition;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: form.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const count = form.thumbnails?.length ?? 0;
  const first = count > 0 ? form.thumbnails![0] : undefined;
  const extra = count > 1 ? count - 1 : 0;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? "relative z-50" : ""}
    >
      <TableCell className="w-12">
        <button
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell className="min-w-56">
        <div className="flex items-center gap-3">
          <div className="relative">
            {first ? (
              <img
                src={first || "/placeholder.svg"}
                alt={`${form.title} thumbnail`}
                className="h-10 w-10 rounded object-cover border"
              />
            ) : (
              <img
                src="/form-thumbnail-placeholder.png"
                alt="No thumbnail"
                className="h-10 w-10 rounded object-cover border opacity-70"
              />
            )}
            {extra > 0 && (
              <span className="absolute -bottom-2 -right-2 text-[10px] px-1.5 py-0.5 rounded bg-secondary border">
                +{extra}
              </span>
            )}
          </div>
          <div>
            <div className="font-medium">{form.title}</div>
            <div className="text-xs truncate max-w-xs text-muted-foreground line-clamp-1">
              {form.description || "No description"}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {form.active ? (
          <Badge className="bg-green-600 hover:bg-green-600">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            {new Date(form.created_at).toLocaleString()}
          </span>
          {form.created_by && (
            <span className="text-xs text-muted-foreground">
              by <span className="font-medium">{form.created_by}</span>
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        {form.updated_at && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              {new Date(form.updated_at).toLocaleString()}
            </span>
            {form.updated_by && (
              <span className="text-xs text-muted-foreground">
                by <span className="font-medium">{form.updated_by}</span>
              </span>
            )}
          </div>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            size="icon"
            variant="ghost"
            title="Toggle Active"
            onClick={() => onToggleActive(form.id)}
          >
            <Power className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title="Edit"
            onClick={() => onEdit(form.id)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title="Delete"
            onClick={() => onDelete(form.id)}
          >
            <Trash2 fill="red" color="red" className="h-4 w-4" />
          </Button>
          <a
            href={`https://adhyatmparivar.com/forms?form=${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="icon" variant="ghost" title="Open Form Link">
              <LinkIcon className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function FormsList({
  onEdit,
  onDelete,
  onToggleActive,
}: {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}) {
  const { toast } = useToast();
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const [deletingForm, setDeletingForm] = useState(false);

  const API_URL = "/api/forms";

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function fetchForms() {
      setLoading(true);
      try {
        const res = await fetch(API_URL, { cache: "no-store" });
        if (!res.ok)
          throw new Error(`Failed to fetch forms: ${res.statusText}`);
        const data: FormDefinition[] = await res.json();
        // Sort by order field if it exists, otherwise by created_at
        const sorted = data.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
        setForms(sorted);
      } catch (err: any) {
        console.error("Error fetching forms:", err);
        toast({
          description: "Failed to fetch forms",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchForms();
  }, [toast]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = forms.findIndex((form) => form.id === active.id);
    const newIndex = forms.findIndex((form) => form.id === over.id);

    const newForms = arrayMove(forms, oldIndex, newIndex);

    // Update local state immediately for smooth UX
    setForms(newForms);

    // Update order on backend
    try {
      const updates = newForms.map((form, index) => ({
        id: form.id,
        order: index,
      }));

      const res = await fetch(`${API_URL}/reorder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update order: ${res.statusText}`);
      }

      toast({
        description: "Form order updated successfully.",
      });
    } catch (err: any) {
      console.error("Error updating form order:", err);
      toast({
        description: "Failed to update form order",
        variant: "destructive",
      });
      // Revert on error
      setForms(forms);
    }
  };

  const handleDeleteClick = (id: string) => {
    setFormToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!formToDelete) return;

    setDeletingForm(true);
    try {
      const res = await fetch(`${API_URL}/${formToDelete}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`Failed to delete form: ${res.statusText}`);
      }

      setForms(forms.filter((form) => form.id !== formToDelete));
      onDelete(formToDelete);

      toast({
        description: "Form deleted successfully.",
      });
    } catch (err: any) {
      console.error("Error deleting form:", err);
      toast({
        description: "Failed to delete form",
        variant: "destructive",
      });
    } finally {
      setDeletingForm(false);
      setDeleteDialogOpen(false);
      setFormToDelete(null);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const form = forms.find((f) => f.id === id);
      if (!form) return;

      const res = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: !form.active }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update form: ${res.statusText}`);
      }

      const updatedForm = await res.json();

      setForms(
        forms.map((f) =>
          f.id === id
            ? {
                ...f,
                active: !f.active,
                updated_by: updatedForm.updated_by,
                updated_at: updatedForm.updated_at,
              }
            : f
        )
      );

      onToggleActive(id);

      toast({
        description: `Form ${
          form.active ? "deactivated" : "activated"
        } successfully.`,
      });
    } catch (err: any) {
      console.error("Error toggling form status:", err);
      toast({
        description: "Failed to update form status",
        variant: "destructive",
      });
    }
  };

  const formToDeleteDetails = forms.find((f) => f.id === formToDelete);

  return (
    <>
      <Card>
        <CardContent>
          <div className="overflow-x-auto overflow-y-hidden font-anek">
            <Table className="overflow-hidden">
              <TableCaption>
                Manage your generated forms. Drag to reorder.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      Loading forms...
                    </TableCell>
                  </TableRow>
                ) : forms.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      No forms yet. Create your first form from the sidebar.
                    </TableCell>
                  </TableRow>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={forms.map((f) => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {forms.map((form) => (
                        <SortableTableRow
                          key={form.id}
                          form={form}
                          onEdit={onEdit}
                          onDelete={handleDeleteClick}
                          onToggleActive={handleToggleActive}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Form</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the form "
              {formToDeleteDetails?.title}"? This action cannot be undone and
              will permanently remove the form and all its data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletingForm}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletingForm}
            >
              {deletingForm ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
