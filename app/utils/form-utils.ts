import { FieldKey, FormDefinition } from '@/components/admin/types';

// Utility to convert database form to component format
export function dbFormToComponentFormat(dbForm: any): FormDefinition {
  const fields: FieldKey[] = [];
  
  // Map database boolean fields to FieldKey array
  if (dbForm.show_mobile) fields.push('phone');
  if (dbForm.show_name) fields.push('name');
  if (dbForm.show_sname) fields.push('sname');
  if (dbForm.show_pincode) fields.push('pincode');
  if (dbForm.show_state) fields.push('state');
  if (dbForm.show_city) fields.push('city');
  if (dbForm.show_address) fields.push('address');
  if (dbForm.show_copies) fields.push('copies');
  if (dbForm.show_gender) fields.push('gender');
  if (dbForm.show_age) fields.push('age');

  return {
    id: dbForm.id,
    title: dbForm.title,
    slug: dbForm.slug,
    link: dbForm.link,
    tqmsg: dbForm.tqmsg || '',
    tqmsg_description: dbForm.tqmsg_description || '',
    description: dbForm.description || '',
    fields,
    active: dbForm.active,
    show: dbForm.show,
    activeFrom: dbForm.active_from || '',
    activeTo: dbForm.active_to || '',
    no_of_copies: dbForm.no_of_copies || 0,
    thumbnails: dbForm.thumbnails || [],
    created_at: dbForm.created_at,
    submissions: dbForm.submissions || 0,
  };
}

// Utility to get default fields (all except gender and age)
export function getDefaultFields(): FieldKey[] {
  return ['phone', 'name', 'sname', 'pincode', 'state', 'city', 'address', 'copies'];
}