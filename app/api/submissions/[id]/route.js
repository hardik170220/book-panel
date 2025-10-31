// import { neon } from '@neondatabase/serverless';

// const sql = neon(process.env.DATABASE_URL);

// export async function GET(request, { params }) {
//   try {
//     const { id } = params;
    
//     const result = await sql`
//       SELECT 
//         s.*,
//         f.title as form_title,
//         f.slug as form_slug,
//         f.description as form_description
//       FROM form_submissions s 
//       JOIN forms f ON s.form_id = f.id 
//       WHERE s.id = ${parseInt(id)}
//     `;
    
//     if (result.length === 0) {
//       return Response.json({ message: 'Submission not found' }, { status: 404 });
//     }

//     return Response.json(result[0]);
//   } catch (error) {
//     console.error('Database error:', error);
//     return Response.json({ message: 'Error fetching submission' }, { status: 500 });
//   }
// }

// export async function PUT(request, { params }) {
//   try {
//     const { id } = params;
//     const body = await request.json();
//     const {
//       name,
//       sname,
//       mobile,
//       email,
//       pincode,
//       state,
//       city,
//       address,
//       copies,
//       gender,
//       age,
//       notes, // Optional admin notes field
//     } = body;

//     // Check if submission exists
//     const existingSubmission = await sql`
//       SELECT id FROM form_submissions WHERE id = ${parseInt(id)}
//     `;

//     if (existingSubmission.length === 0) {
//       return Response.json({ message: 'Submission not found' }, { status: 404 });
//     }

//     // Update submission
//     const result = await sql`
//       UPDATE form_submissions SET 
//         name = ${name || null},
//         sname = ${sname || null},
//         mobile = ${mobile || null},
//         email = ${email || null},
//         pincode = ${pincode || null},
//         state = ${state || null},
//         city = ${city || null},
//         address = ${address || null},
//         copies = ${parseInt(copies) || null},
//         gender = ${gender || null},
//         age = ${parseInt(age) || null},
//         notes = ${notes || null},
//         updated_at = CURRENT_TIMESTAMP
//       WHERE id = ${parseInt(id)}
//       RETURNING *
//     `;

//     return Response.json({
//       message: 'Submission updated successfully',
//       submission: result[0]
//     });
//   } catch (error) {
//     console.error('Database error:', error);
//     return Response.json({ message: 'Error updating submission' }, { status: 500 });
//   }
// }

// export async function DELETE(request, { params }) {
//   try {
//     const { id } = params;
    
//     const result = await sql`
//       DELETE FROM form_submissions 
//       WHERE id = ${parseInt(id)}
//       RETURNING *
//     `;

//     if (result.length === 0) {
//       return Response.json({ message: 'Submission not found' }, { status: 404 });
//     }

//     return Response.json({ 
//       message: 'Submission deleted successfully',
//       deleted_submission: result[0]
//     });
//   } catch (error) {
//     console.error('Database error:', error);
//     return Response.json({ message: 'Error deleting submission' }, { status: 500 });
//   }
// }

// // Optional: PATCH for partial updates (like marking as reviewed, etc.)
// export async function PATCH(request, { params }) {
//   try {
//     const { id } = params;
//     const body = await request.json();
    
//     // This could be used for admin actions like marking as reviewed
//     const { status, notes, reviewed_by } = body;

//     const result = await sql`
//       UPDATE form_submissions SET 
//         status = COALESCE(${status}, status),
//         notes = COALESCE(${notes}, notes),
//         reviewed_by = COALESCE(${reviewed_by}, reviewed_by),
//         updated_at = CURRENT_TIMESTAMP
//       WHERE id = ${parseInt(id)}
//       RETURNING *
//     `;

//     if (result.length === 0) {
//       return Response.json({ message: 'Submission not found' }, { status: 404 });
//     }

//     return Response.json({
//       message: 'Submission status updated successfully',
//       submission: result[0]
//     });
//   } catch (error) {
//     console.error('Database error:', error);
//     return Response.json({ message: 'Error updating submission status' }, { status: 500 });
//   }
// }



// app/api/submissions/[id]/route.js
import { neon } from '@neondatabase/serverless';

// Initialize Neon connection
const sql = neon(process.env.DATABASE_URL);

export async function GET(request, { params }) {
  try {
    const { id } = await params; // Await params
    
    const result = await sql`
      SELECT 
        s.*,
        f.title as form_title,
        f.slug as form_slug,
        f.description as form_description
      FROM form_submissions s 
      JOIN forms f ON s.form_id = f.id 
      WHERE s.id = ${parseInt(id)}
    `;
    
    if (result.length === 0) {
      return Response.json({ message: 'Submission not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('Database error:', error);
    return Response.json({ message: 'Error fetching submission' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params; // Await params
    const body = await request.json();
    const {
      name,
      sname,
      mobile,
      email,
      pincode,
      state,
      city,
      address,
      copies,
      gender,
      age,
      notes, // Optional admin notes field
    } = body;

    // Check if submission exists
    const existingSubmission = await sql`
      SELECT id FROM form_submissions WHERE id = ${parseInt(id)}
    `;

    if (existingSubmission.length === 0) {
      return Response.json({ message: 'Submission not found' }, { status: 404 });
    }

    // Update submission
    const result = await sql`
      UPDATE form_submissions SET 
        name = ${name || null},
        sname = ${sname || null},
        mobile = ${mobile || null},
        email = ${email || null},
        pincode = ${pincode || null},
        state = ${state || null},
        city = ${city || null},
        address = ${address || null},
        copies = ${parseInt(copies) || null},
        gender = ${gender || null},
        age = ${parseInt(age) || null},
        notes = ${notes || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;

    return Response.json({
      message: 'Submission updated successfully',
      submission: result[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    return Response.json({ message: 'Error updating submission' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params; // Await params
    
    const result = await sql`
      DELETE FROM form_submissions 
      WHERE id = ${parseInt(id)}
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

// Optional: PATCH for partial updates (like marking as reviewed, etc.)
export async function PATCH(request, { params }) {
  try {
    const { id } = await params; // Await params
    const body = await request.json();
    
    // This could be used for admin actions like marking as reviewed
    const { status, notes, reviewed_by } = body;

    const result = await sql`
      UPDATE form_submissions SET 
        status = COALESCE(${status}, status),
        notes = COALESCE(${notes}, notes),
        reviewed_by = COALESCE(${reviewed_by}, reviewed_by),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ message: 'Submission not found' }, { status: 404 });
    }

    return Response.json({
      message: 'Submission status updated successfully',
      submission: result[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    return Response.json({ message: 'Error updating submission status' }, { status: 500 });
  }
}