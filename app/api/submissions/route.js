// import { query } from '../../lib/db';

// export async function POST(request) {
//   try {
//     const body = await request.json();
//     const {
//       form_id,
//       name,
//       mobile,
//       pincode,
//       state,
//       city,
//       address,
//       copies,
//     } = body;

//     if (!form_id) {
//       return Response.json({ message: 'Form ID is required' }, { status: 400 });
//     }

//     const result = await query(
//       `INSERT INTO form_submissions (form_id, name, mobile, pincode, state, city, address, copies)
//        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
//        RETURNING *`,
//       [form_id, name, mobile, pincode, state, city, address, copies]
//     );

//     return Response.json(result.rows[0], { status: 201 });
//   } catch (error) {
//     console.error('Database error:', error);
//     return Response.json({ message: 'Error submitting form' }, { status: 500 });
//   }
// }

// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const form_id = searchParams.get('form_id');
    
//     let queryText = `
//       SELECT s.*, f.title as form_title 
//       FROM form_submissions s 
//       JOIN forms f ON s.form_id = f.id 
//     `;
//     let queryParams = [];

//     if (form_id) {
//       queryText += 'WHERE s.form_id = $1 ';
//       queryParams.push(form_id);
//     }

//     queryText += 'ORDER BY s.submitted_at DESC';

//     const result = await query(queryText, queryParams);
//     return Response.json(result.rows);
//   } catch (error) {
//     console.error('Database error:', error);
//     return Response.json({ message: 'Error fetching submissions' }, { status: 500 });
//   }
// }


// app/api/submissions/route.js
import { neon } from '@neondatabase/serverless';

// Initialize Neon connection
const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      form_id,
      name,
      sname, // surname
      mobile,
      email,
      pincode,
      state,
      city,
      address,
      copies,
      gender,
      age,
    } = body;

    // Validation
    if (!form_id) {
      return Response.json({ message: 'Form ID is required' }, { status: 400 });
    }

    // Verify form exists and is active
    const formCheck = await sql`
      SELECT id, active, active_from, active_to, title 
      FROM forms 
      WHERE id = ${parseInt(form_id)}
    `;

    if (formCheck.length === 0) {
      return Response.json({ message: 'Form not found' }, { status: 404 });
    }

    const form = formCheck[0];
    
    // Check if form is active
    if (!form.active) {
      return Response.json({ message: 'This form is no longer accepting submissions' }, { status: 400 });
    }

    // Check date range if specified
    const now = new Date();
    if (form.active_from && new Date(form.active_from) > now) {
      return Response.json({ message: 'This form is not yet open for submissions' }, { status: 400 });
    }
    
    if (form.active_to && new Date(form.active_to) < now) {
      return Response.json({ message: 'This form has closed for submissions' }, { status: 400 });
    }

    // Insert submission
    const result = await sql`
      INSERT INTO form_submissions (
        form_id, name, sname, mobile, email, pincode, state, city, 
        address, copies, gender, age, submitted_at
      )
      VALUES (
        ${parseInt(form_id)}, ${name || null}, ${sname || null}, ${mobile || null}, 
        ${email || null}, ${pincode || null}, ${state || null}, ${city || null}, 
        ${address || null}, ${parseInt(copies) || null}, ${gender || null}, 
        ${parseInt(age) || null}, CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    // Return success response with submission data
    return Response.json({
      message: 'Form submitted successfully',
      submission: result[0],
      form_title: form.title
    }, { status: 201 });

  } catch (error) {
    console.error('Database error:', error);
    
    // Handle specific database errors
    if (error.message.includes('foreign key')) {
      return Response.json({ message: 'Invalid form ID' }, { status: 400 });
    }
    
    return Response.json({ 
      message: 'Error submitting form. Please try again.' 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const form_id = searchParams.get('form_id');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const search = searchParams.get('search');
    
    let baseQuery = `
      SELECT 
        s.*,
        f.title as form_title,
        f.slug as form_slug
      FROM form_submissions s 
      JOIN forms f ON s.form_id = f.id 
    `;
    
    // Build WHERE conditions
    const conditions = [];
    const params = [];
    
    if (form_id) {
      conditions.push(`s.form_id = ${parseInt(form_id)}`);
    }
    
    if (search) {
      conditions.push(`(
        s.name ILIKE '%${search.replace(/'/g, "''")}%' OR 
        s.sname ILIKE '%${search.replace(/'/g, "''")}%' OR 
        s.mobile ILIKE '%${search.replace(/'/g, "''")}%' OR 
        s.email ILIKE '%${search.replace(/'/g, "''")}%' OR
        f.title ILIKE '%${search.replace(/'/g, "''")}%'
      )`);
    }
    
    if (conditions.length > 0) {
      baseQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    baseQuery += ` ORDER BY s.submitted_at DESC`;
    
    // Add pagination
    if (limit) {
      baseQuery += ` LIMIT ${parseInt(limit)}`;
    }
    
    if (offset) {
      baseQuery += ` OFFSET ${parseInt(offset)}`;
    }

    const result = await sql([baseQuery]);
    
    // Also get total count for pagination (if needed)
    let totalCount = null;
    if (limit || offset) {
      let countQuery = `
        SELECT COUNT(*) as total 
        FROM form_submissions s 
        JOIN forms f ON s.form_id = f.id
      `;
      
      if (conditions.length > 0) {
        countQuery += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      const countResult = await sql([countQuery]);
      totalCount = parseInt(countResult[0]?.total || 0);
    }

    const response = {
      submissions: result,
      ...(totalCount !== null && { 
        pagination: {
          total: totalCount,
          limit: limit ? parseInt(limit) : null,
          offset: offset ? parseInt(offset) : 0,
          hasMore: totalCount > (parseInt(offset || 0) + result.length)
        }
      })
    };

    return Response.json(response);
  } catch (error) {
    console.error('Database error:', error);
    return Response.json({ message: 'Error fetching submissions' }, { status: 500 });
  }
}

// Optional: Add DELETE endpoint to remove submissions
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const submission_id = searchParams.get('id');
    
    if (!submission_id) {
      return Response.json({ message: 'Submission ID is required' }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM form_submissions 
      WHERE id = ${parseInt(submission_id)}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ message: 'Submission not found' }, { status: 404 });
    }

    return Response.json({ 
      message: 'Submission deleted successfully',
      deleted_submission: result[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    return Response.json({ message: 'Error deleting submission' }, { status: 500 });
  }
}