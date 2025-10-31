import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const client = await pool.connect();
          
          // Query user from your Neon database
          const result = await client.query(
            'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
            [credentials.email]
          );
          
          client.release();

          if (result.rows.length === 0) {
            return null;
          }

          const user = result.rows[0];

          // Verify password
          const passwordMatch = await bcrypt.compare(credentials.password, user.password_hash);
          // bcrypt.hash('ap.formbuilder', 12, (err, hash) => { if (err) throw err; console.log(hash) });

          
          if (!passwordMatch) {
            return null;
          }

          // Return user object (without password)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };