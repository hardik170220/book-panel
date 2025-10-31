// app/api/forms/reorder/route.js
import { neon } from '@neondatabase/serverless';

// Initialize Neon connection
const sql = neon(process.env.DATABASE_URL);

// Helper to apply CORS headers
function withCORS(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// Handle OPTIONS preflight requests
export async function OPTIONS() {
  return withCORS({}, 200);
}

export async function PATCH(request) {
  try {
    const { updates } = await request.json();
    
    // Validate input
    if (!Array.isArray(updates) || updates.length === 0) {
      return withCORS(
        { error: 'Invalid updates format. Expected array of { id, order }' },
        400
      );
    }

    // Validate each update has required fields
    for (const update of updates) {
      if (!update.id || typeof update.order !== 'number') {
        return withCORS(
          { error: 'Each update must have id and order fields' },
          400
        );
      }
    }

    // Update all forms - execute updates sequentially
    const updateResults = [];
    
    for (const { id, order } of updates) {
      try {
        const result = await sql`
          UPDATE forms 
          SET "order" = ${order}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id}
          RETURNING id, "order"
        `;
        updateResults.push(result[0]);
      } catch (error) {
        console.error(`Error updating form ${id}:`, error);
        return withCORS(
          { 
            error: `Failed to update form ${id}`,
            details: error.message 
          },
          500
        );
      }
    }

    return withCORS({ 
      success: true,
      updated: updateResults.length,
      message: `Successfully updated order for ${updateResults.length} forms`,
      results: updateResults
    });

  } catch (error) {
    console.error('Error updating form order:', error);
    return withCORS(
      { 
        error: 'Failed to update form order',
        details: error.message
      },
      500
    );
  }
}

// Optional: GET method to retrieve forms in order
export async function GET() {
  try {
    const forms = await sql`
      SELECT * FROM forms 
      ORDER BY "order" ASC NULLS LAST, created_at DESC
    `;

    return withCORS(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    return withCORS({ error: 'Failed to fetch forms' }, 500);
  }
}