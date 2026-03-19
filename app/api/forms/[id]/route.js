// app/api/forms/[id]/route.js
import { neon } from '@neondatabase/serverless';
import { v2 as cloudinary } from 'cloudinary';
import { uploadToCloudinary, deleteFromCloudinary } from '../../../../../book-panel/lib/cloudinary';
import { v4 as uuidv4 } from 'uuid';

// Initialize Neon connection
const sql = neon(process.env.DATABASE_URL);

// Helper to get current user from request
import { getToken } from "next-auth/jwt";

async function getCurrentUser(request) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token) {
      return {
        id: token.sub,
        name: token.name,
        email: token.email,
        role: token.role
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Helper to apply CORS headers
function withCORS(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// ✅ Handle OPTIONS preflight requests
export async function OPTIONS() {
  return withCORS({}, 200);
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Check if id is a number or a slug
    const isNumeric = /^\d+$/.test(id);

    let result;
    if (isNumeric) {
      // Handle numeric ID (admin access) - include user names
      result = await sql`
        SELECT 
          f.*,
          u1.name as created_by,
          u2.name as updated_by
        FROM forms f
        LEFT JOIN users u1 ON f.created_by_id = u1.id
        LEFT JOIN users u2 ON f.updated_by_id = u2.id
        WHERE f.id = ${parseInt(id)}
      `;
    } else {
      // Handle slug (public access)
      result = await sql`
        SELECT 
          id, title, slug, book_label, link, tqmsg, tqmsg_description, description, thumbnails, no_of_copies, stock, copy_question,
          show_mobile, show_name, show_sname, show_pincode, 
          show_state, show_city, show_address, show_copies, 
          show_gender, show_age, active, show, active_from, active_to, language,
          created_at
        FROM forms 
        WHERE slug = ${id} AND active = true
      `;

      if (result.length === 0) {
        return withCORS({ message: "Form not found or inactive" }, 404);
      }

      const form = result[0];

      // Check if form is within active date range
      const now = new Date();
      if (form.active_from && new Date(form.active_from) > now) {
        return withCORS(
          { message: "Form is not yet available", availableFrom: form.active_from },
          400
        );
      }

      if (form.active_to && new Date(form.active_to) < now) {
        return withCORS(
          { message: "Form is no longer accepting responses", closedAt: form.active_to },
          400
        );
      }

      // Parse thumbnails if it's a JSON string
      if (typeof form.thumbnails === "string") {
        try {
          form.thumbnails = JSON.parse(form.thumbnails);
        } catch {
          form.thumbnails = [];
        }
      }

      // Convert field flags to field array for easier frontend handling
      const fields = [];
      if (form.show_gender) fields.push("gender");
      if (form.show_age) fields.push("age");
      // if (form.show_language) fields.push("language");
      if (form.show_sname) fields.push("sname");
      if (form.show_mobile) fields.push("mobile");
      if (form.show_pincode) fields.push("pincode");
      if (form.show_state) fields.push("state");
      if (form.show_city) fields.push("city");
      if (form.show_address) fields.push("address");
      if (form.show_copies) fields.push("copies");
      if (form.show_name) fields.push("name");


      const responseData = {
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
          // show_language: form.show_language,
        },
      };

      return withCORS(responseData);
    }

    if (result.length === 0) {
      return withCORS({ message: "Form not found" }, 404);
    }

    return withCORS(result[0]);
  } catch (error) {
    console.error("Database error:", error);
    return withCORS({ message: "Error fetching form" }, 500);
  }
}


export async function PUT(request, { params }) {
  try {
    const { id } = await params;

    // Get current user
    const currentUser = await getCurrentUser(request);
    const userId = currentUser?.id || null;

    // Only allow numeric IDs for updates (admin only)
    if (!/^\d+$/.test(id)) {
      return Response.json({ message: 'Invalid form ID for update' }, { status: 400 });
    }

    const formId = parseInt(id);

    // Parse FormData
    const formData = await request.formData();

    const title = formData.get('title');
    const slug = formData.get('slug');
    const book_label = formData.get('book_label');
    const link = formData.get('link');
    const tqmsg = formData.get('tqmsg') || '';
    const tqmsg_description = formData.get('tqmsg_description') || '';
    const description = formData.get('description') || '';
    const active = formData.get('active') === 'true';
    const show = formData.get('show') === 'true';
    const activeFrom = formData.get('activeFrom') || null;
    const activeTo = formData.get('activeTo') || null;
    const no_of_copies = parseInt(formData.get('no_of_copies')) || 0;
    const stock = parseInt(formData.get('stock')) || 0;
    const language = formData.get('language') || 'english';
    const copy_question = formData.get('copy_question') || '';

    // Field visibility flags
    const show_mobile = formData.get('show_mobile') === 'true';
    const show_name = formData.get('show_name') === 'true';
    const show_sname = formData.get('show_sname') === 'true';
    const show_pincode = formData.get('show_pincode') === 'true';
    const show_state = formData.get('show_state') === 'true';
    const show_city = formData.get('show_city') === 'true';
    const show_address = formData.get('show_address') === 'true';
    const show_copies = formData.get('show_copies') === 'true';
    const show_gender = formData.get('show_gender') === 'true';
    const show_age = formData.get('show_age') === 'true';
    // const show_language = formData.get('show_language') === 'true';

    // Validation
    if (!title) {
      return Response.json({ message: 'Title is required' }, { status: 400 });
    }

    if (!slug) {
      return Response.json({ message: 'Slug is required' }, { status: 400 });
    }

    // Check if slug already exists for a different form
    const slugCheck = await sql`SELECT id FROM forms WHERE slug = ${slug} AND id != ${formId}`;
    if (slugCheck.length > 0) {
      return Response.json({ message: 'Slug already exists' }, { status: 400 });
    }

    // Check if form exists and get existing data
    const existingForm = await sql`SELECT * FROM forms WHERE id = ${formId}`;
    if (existingForm.length === 0) {
      return Response.json({ message: 'Form not found' }, { status: 404 });
    }

    // Handle thumbnail files
    let newThumbnailPaths = [];
    const thumbnailFiles = formData.getAll('thumbnails');
    const removeExistingThumbnails = formData.get('removeExistingThumbnails') === 'true';

    // Get existing and removed thumbnails from form data
    const existingThumbnailsData = formData.get('existingThumbnails');
    const removedThumbnailsData = formData.get('removedThumbnails');

    let keepThumbnails = [];
    let removeThumbnails = [];

    try {
      keepThumbnails = existingThumbnailsData ? JSON.parse(existingThumbnailsData) : [];
      removeThumbnails = removedThumbnailsData ? JSON.parse(removedThumbnailsData) : [];
    } catch (error) {
      console.error('Error parsing thumbnail data:', error);
    }

    // Upload new thumbnail files to Cloudinary
    if (thumbnailFiles && thumbnailFiles.length > 0) {
      for (const file of thumbnailFiles) {
        if (file instanceof File && file.size > 0) {
          try {
            const imageUrl = await uploadToCloudinary(file);
            newThumbnailPaths.push(imageUrl);
          } catch (error) {
            console.error('File upload error:', error);
            return Response.json({ message: 'Error uploading files' }, { status: 500 });
          }
        }
      }
    }

    // Delete removed thumbnails from Cloudinary
    if (removeThumbnails.length > 0) {
      for (const thumbnailUrl of removeThumbnails) {
        await deleteFromCloudinary(thumbnailUrl);
      }
    }

    // Determine final thumbnails
    let finalThumbnails = [];

    if (removeExistingThumbnails && newThumbnailPaths.length > 0) {
      // Replace all existing with new ones
      const allExistingThumbnails = existingForm[0].thumbnails || [];
      for (const thumbnailUrl of allExistingThumbnails) {
        await deleteFromCloudinary(thumbnailUrl);
      }
      finalThumbnails = newThumbnailPaths;
    } else {
      // Keep remaining existing thumbnails and add new ones
      finalThumbnails = [...keepThumbnails, ...newThumbnailPaths];
    }

    // Update form in database with updated_by_id
    const result = await sql`
      UPDATE forms SET 
        title = ${title}, 
        book_label = ${book_label}, 
        slug = ${slug}, 
        link = ${link}, 
        tqmsg = ${tqmsg}, 
        tqmsg_description = ${tqmsg_description}, 
        description = ${description}, 
        active = ${active}, 
        show = ${show}, 
        active_from = ${activeFrom}, 
        active_to = ${activeTo}, 
        no_of_copies = ${no_of_copies},
        stock = ${stock},
        show_mobile = ${show_mobile}, 
        show_name = ${show_name}, 
        show_sname = ${show_sname}, 
        show_pincode = ${show_pincode}, 
        show_state = ${show_state}, 
        show_city = ${show_city}, 
        show_address = ${show_address}, 
        show_copies = ${show_copies}, 
        show_gender = ${show_gender}, 
        show_age = ${show_age},
        thumbnails = ${JSON.stringify(finalThumbnails)}, 
        updated_by_id = ${userId},
        updated_at = CURRENT_TIMESTAMP,
        language = ${language},
        copy_question = ${copy_question}
      WHERE id = ${formId}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ message: 'Form not found' }, { status: 404 });
    }

    // Get the updated form with user names
    const formWithNames = await sql`
      SELECT 
        f.*,
        u1.name as created_by,
        u2.name as updated_by
      FROM forms f
      LEFT JOIN users u1 ON f.created_by_id = u1.id
      LEFT JOIN users u2 ON f.updated_by_id = u2.id
      WHERE f.id = ${formId}
    `;

    return Response.json(formWithNames[0]);
  } catch (error) {
    console.error('Database error:', error);
    return Response.json({ message: 'Error updating form' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Only allow numeric IDs for deletion (admin only)
    if (!/^\d+$/.test(id)) {
      return Response.json({ message: 'Invalid form ID for deletion' }, { status: 400 });
    }

    const formId = parseInt(id);

    // Get form data to delete associated files
    const existingForm = await sql`SELECT * FROM forms WHERE id = ${formId}`;
    if (existingForm.length === 0) {
      return Response.json({ message: 'Form not found' }, { status: 404 });
    }

    // Delete thumbnails from Cloudinary
    const thumbnails = existingForm[0].thumbnails || [];
    if (thumbnails.length > 0) {
      for (const thumbnailUrl of thumbnails) {
        await deleteFromCloudinary(thumbnailUrl);
      }
    }

    // Delete form from database
    const result = await sql`DELETE FROM forms WHERE id = ${formId} RETURNING *`;

    if (result.length === 0) {
      return Response.json({ message: 'Form not found' }, { status: 404 });
    }

    return Response.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    return Response.json({ message: 'Error deleting form' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;

    // Get current user
    const currentUser = await getCurrentUser(request);
    const userId = currentUser?.id || null;

    // Only allow numeric IDs for patches (admin only)
    if (!/^\d+$/.test(id)) {
      return Response.json({ message: 'Invalid form ID for update' }, { status: 400 });
    }

    const formId = parseInt(id);
    const { active } = await request.json();

    // Update only the active column with updated_by_id
    const result = await sql`
      UPDATE forms 
      SET active = ${active}, 
          updated_by_id = ${userId},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${formId}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ message: 'Form not found' }, { status: 404 });
    }

    // Get the updated form with user names
    const formWithNames = await sql`
      SELECT 
        f.*,
        u1.name as created_by,
        u2.name as updated_by
      FROM forms f
      LEFT JOIN users u1 ON f.created_by_id = u1.id
      LEFT JOIN users u2 ON f.updated_by_id = u2.id
      WHERE f.id = ${formId}
    `;

    return Response.json(formWithNames[0]);
  } catch (error) {
    console.error('Database error (PATCH):', error);
    return Response.json({ message: 'Error updating active state' }, { status: 500 });
  }
}
