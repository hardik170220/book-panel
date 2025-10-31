// import { Pool } from 'pg';

// const pool = new Pool({
//   user:'postgres',
//   host:'localhost',
//   database:'ap_forms',
//   password:'root',
//   port:  5432,
// });

// export const query = (text :any, params : any) => pool.query(text, params);

// export default pool;


// lib/db.js
import { neon } from '@neondatabase/serverless';

// Create the SQL connection
const sql = neon(process.env.DATABASE_URL);

// Updated query function to work with Neon's serverless driver
export const query = async (text, params = []) => {
  try {
    // Neon uses template literals, so we need to convert parameterized queries
    // For simple queries with parameters, we'll use a helper function
    if (params && params.length > 0) {
      // Convert $1, $2, etc. to actual values for Neon
      let queryText = text;
      params.forEach((param, index) => {
        const placeholder = `$${index + 1}`;
        // Handle different data types properly
        const value = typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : param;
        queryText = queryText.replace(placeholder, value);
      });
      
      const result = await sql([queryText]);
      return { rows: result };
    } else {
      // For queries without parameters
      const result = await sql([text]);
      return { rows: result };
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Alternative: Using Neon's template literal approach directly
export const queryNeon = async (query, ...values) => {
  try {
    const result = await sql(query, ...values);
    return { rows: result };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export default sql;