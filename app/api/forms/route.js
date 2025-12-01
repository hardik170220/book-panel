// app/api/forms/route.js
import { neon } from '@neondatabase/serverless';
import { uploadMultipleToCloudinary } from '../../lib/cloudinary';

// Initialize Neon connection
const sql = neon(process.env.DATABASE_URL);

// Helper to get current user from request
async function getCurrentUser(request) {
  try {
    // Get the authorization header or cookie
    const cookieHeader = request.headers.get('cookie');

    // Make internal request to whoami endpoint
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = request.headers.get('host');
    const whoamiUrl = `${protocol}://${host}/api/whoami`;

    const whoamiRes = await fetch(whoamiUrl, {
      headers: {
        cookie: cookieHeader || '',
      },
    });

    if (whoamiRes.ok) {
      const userData = await whoamiRes.json();
      return userData;
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

// Handle OPTIONS preflight requests
export async function OPTIONS() {
  return withCORS({}, 200);
}

export async function GET(request) {
  try {
    // Updated to include created_by and updated_by names
    const result = await sql`
      SELECT 
        f.*,
        u1.name as created_by,
        u2.name as updated_by
      FROM forms f
      LEFT JOIN users u1 ON f.created_by_id = u1.id
      LEFT JOIN users u2 ON f.updated_by_id = u2.id
      ORDER BY f."order" ASC NULLS LAST, f.created_at DESC
    `;
    return withCORS(result);
  } catch (error) {
    console.error("Database error:", error);
    return withCORS({ message: "Error fetching forms" }, 500);
  }
}

export async function POST(request) {
  try {
    // Get current user
    const currentUser = await getCurrentUser(request);
    const userId = currentUser?.id || null;

    const formData = await request.formData();

    // Extract fields
    const title = formData.get("title");
    const slug = formData.get("slug");
    const link = formData.get("link");
    const tqmsg = formData.get("tqmsg") || "";
    const tqmsg_description = formData.get("tqmsg_description") || "";
    const description = formData.get("description") || "";
    const active = formData.get("active") === "true";
    const show = formData.get("show") === "true";
    const activeFrom = formData.get("activeFrom");
    const activeTo = formData.get("activeTo");
    const no_of_copies = parseInt(formData.get("no_of_copies")) || 0;
    const stock = parseInt(formData.get("stock")) || 0;
    const language = formData.get("language") || "english";

    // Visibility flags
    const show_mobile = formData.get("show_mobile") === "true";
    const show_name = formData.get("show_name") === "true";
    const show_sname = formData.get("show_sname") === "true";
    const show_pincode = formData.get("show_pincode") === "true";
    const show_state = formData.get("show_state") === "true";
    const show_city = formData.get("show_city") === "true";
    const show_address = formData.get("show_address") === "true";
    const show_copies = formData.get("show_copies") === "true";
    const show_gender = formData.get("show_gender") === "true";
    const show_age = formData.get("show_age") === "true";
    // const show_language = formData.get("show_language") === "true"; // Removed as per new requirement

    // Validation
    if (!title) {
      return withCORS({ message: "Title is required" }, 400);
    }
    if (!slug) {
      return withCORS({ message: "Slug is required" }, 400);
    }

    // Check if slug exists
    const slugCheck = await sql`SELECT id FROM forms WHERE slug = ${slug}`;
    if (slugCheck.length > 0) {
      return withCORS({ message: "Slug already exists" }, 400);
    }

    // Handle thumbnails
    const files = formData.getAll("thumbnails").filter((file) => file.size > 0);
    let thumbnailPaths = [];
    if (files.length > 0) {
      try {
        thumbnailPaths = await uploadMultipleToCloudinary(files, {
          folder: "forms",
          transformation: [
            { quality: "auto" },
            { fetch_format: "auto" },
            { width: 800, height: 600, crop: "limit" },
          ],
        });
      } catch (error) {
        console.error("File upload error:", error);
        return withCORS({ message: "Error uploading files" }, 500);
      }
    }

    // Get the current max order value to append new form at the end
    const maxOrderResult = await sql`
      SELECT COALESCE(MAX("order"), -1) as max_order FROM forms
    `;
    const nextOrder = maxOrderResult[0].max_order + 1;

    // Insert form with created_by_id and updated_by_id
    const result = await sql`
      INSERT INTO forms (
        title, slug, link, tqmsg, tqmsg_description, description, active, show, active_from, active_to, no_of_copies,
        show_mobile, show_name, show_sname, show_pincode, show_state, 
        show_city, show_address, show_copies, show_gender, show_age, thumbnails,
        "order", created_by_id, updated_by_id, created_at, updated_at, language, stock
      )
      VALUES (
        ${title}, ${slug}, ${link}, ${tqmsg}, ${tqmsg_description}, ${description}, ${active}, ${show},
        ${activeFrom || null}, ${activeTo || null}, ${no_of_copies},
        ${show_mobile}, ${show_name}, ${show_sname}, ${show_pincode}, 
        ${show_state}, ${show_city}, ${show_address}, ${show_copies},
        ${show_gender}, ${show_age}, ${JSON.stringify(thumbnailPaths)},
        ${nextOrder}, ${userId}, ${userId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ${language}, ${stock}
      )
      RETURNING *
    `;

    // Get the created form with user names
    const formWithNames = await sql`
      SELECT 
        f.*,
        u1.name as created_by,
        u2.name as updated_by
      FROM forms f
      LEFT JOIN users u1 ON f.created_by_id = u1.id
      LEFT JOIN users u2 ON f.updated_by_id = u2.id
      WHERE f.id = ${result[0].id}
    `;

    return withCORS(formWithNames[0], 201);
  } catch (error) {
    console.error("Database error:", error);
    return withCORS({ message: "Error creating form" }, 500);
  }
}