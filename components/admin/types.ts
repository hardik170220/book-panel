export type FieldKey = "name" | "sname" | "email" | "copies" | "city" | "state" | "pincode" | "phone" | "address" | "age" | "gender" | "comments" | "attachment"

export const AVAILABLE_FIELDS: { key: FieldKey; label: string }[] = [
  { key: "phone", label: "Phone" },
  { key: "name", label: "Name" },
  { key: "sname", label: "Surname" },
  { key: "email", label: "Email" },
  { key: "pincode", label: "Pincode" },
  { key: "state", label: "State" },
  { key: "city", label: "City" },
  { key: "address", label: "Address" },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender" },
  // { key: "comments", label: "Comments" },
  { key: "attachment", label: "Attachment" },
  { key: "copies", label: "Copies" },

]

export type Submission = {
  id: string
  created_at: string
}

export type FormDefinition = {
  id: string
  title: string
  book_label: string
  slug: string
  order?: number
  link: string
  tqmsg: string
  tqmsg_description: string
  description?: string
  // thumbnails are stored as object URLs for preview (UI only)
  thumbnails?: string[]
  fields: FieldKey[]
  active: boolean
  show: boolean
  no_of_copies: number | 0
  stock: number | 0
  language: "hindi" | "english" | "gujarati"
  copy_question?: string
  created_at: string
  created_by_id?: number | null;
  updated_by_id?: number | null;
  created_by?: string; // User name
  updated_by?: string; // User name
  updated_at: string
  activeFrom: string | undefined
  activeTo: string | undefined
  submissions: Submission[]
}
