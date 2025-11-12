// lib/db-direct.ts
// Direct database connection for Server Components (SSG/ISR)
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

export const sql = neon(process.env.DATABASE_URL)

// ===== Form Queries =====

export async function getAllForms() {
  return await sql`
    SELECT 
      f.*,
      u1.name as created_by,
      u2.name as updated_by
    FROM forms f
    LEFT JOIN users u1 ON f.created_by_id = u1.id
    LEFT JOIN users u2 ON f.updated_by_id = u2.id
    ORDER BY f."order" ASC NULLS LAST, f.created_at DESC
  `
}

export async function getPublicForms() {
  return await sql`
    SELECT 
      id, title, slug, link, tqmsg, tqmsg_description, description, 
      thumbnails, no_of_copies, show_mobile, show_name, show_sname, 
      show_pincode, show_state, show_city, show_address, show_copies, 
      show_gender, show_age, active, show, active_from, active_to,
      created_at, "order"
    FROM forms 
    WHERE active = true AND show = true
    ORDER BY "order" ASC NULLS LAST
  `
}

export async function getFormBySlug(slug: string) {
  const forms = await sql`
    SELECT 
      id, title, slug, link, tqmsg, tqmsg_description, description, 
      thumbnails, no_of_copies, show_mobile, show_name, show_sname, 
      show_pincode, show_state, show_city, show_address, show_copies, 
      show_gender, show_age, active, show, active_from, active_to,
      created_at
    FROM forms 
    WHERE slug = ${slug} AND active = true
  `
  
  if (forms.length === 0) return null
  
  const form = forms[0]
  
  // Check if form is within active date range
  const now = new Date()
  if (form.active_from && new Date(form.active_from) > now) {
    return null
  }
  
  if (form.active_to && new Date(form.active_to) < now) {
    return null
  }
  
  // Parse thumbnails if it's a JSON string
  if (typeof form.thumbnails === "string") {
    try {
      form.thumbnails = JSON.parse(form.thumbnails)
    } catch {
      form.thumbnails = []
    }
  }
  
  // Convert field flags to field array for easier frontend handling
  const fields = []
  if (form.show_name) fields.push("name")
  if (form.show_sname) fields.push("sname")
  if (form.show_mobile) fields.push("mobile")
  if (form.show_pincode) fields.push("pincode")
  if (form.show_state) fields.push("state")
  if (form.show_city) fields.push("city")
  if (form.show_address) fields.push("address")
  if (form.show_copies) fields.push("copies")
  if (form.show_gender) fields.push("gender")
  if (form.show_age) fields.push("age")
  
  return {
    ...form,
    fields,
    fieldConfig: {
      show_mobile: form.show_mobile,
      show_name: form.show_name,
      show_sname: form.show_sname,
      show_pincode: form.show_pincode,
      show_state: form.show_state,
      show_city: form.show_city,
      show_address: form.show_address,
      show_copies: form.show_copies,
      show_gender: form.show_gender,
      show_age: form.show_age,
    },
  }
}

export async function getFormById(id: number) {
  const forms = await sql`
    SELECT 
      f.*,
      u1.name as created_by,
      u2.name as updated_by
    FROM forms f
    LEFT JOIN users u1 ON f.created_by_id = u1.id
    LEFT JOIN users u2 ON f.updated_by_id = u2.id
    WHERE f.id = ${id}
  `
  
  return forms.length > 0 ? forms[0] : null
}

export async function getAllFormSlugs() {
  return await sql`
    SELECT slug FROM forms WHERE active = true
  `
}

// ===== Submission Queries (for public stats only) =====

export async function getFormSubmissionCount(formId: number) {
  const result = await sql`
    SELECT COUNT(*) as count 
    FROM form_submissions 
    WHERE form_id = ${formId}
  `
  return parseInt(result[0]?.count || '0')
}

export async function getRecentSubmissionsCount(hours: number = 24) {
  const result = await sql`
    SELECT COUNT(*) as count 
    FROM form_submissions 
    WHERE submitted_at > NOW() - INTERVAL '${hours} hours'
  `
  return parseInt(result[0]?.count || '0')
}