import { notFound } from 'next/navigation';

// ✅ This tells Next.js to generate static pages at build time
export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour (ISR)

// ✅ Generate static params for all forms at build time
export async function generateStaticParams() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/forms`, {
      cache: 'no-store'
    });
    
    if (!res.ok) {
      console.error('Failed to fetch forms for static generation');
      return [];
    }
    
    const forms = await res.json();
    
    // Return array of params for each form
    return forms
      .filter(form => form.active && form.slug) // Only generate for active forms
      .map(form => ({
        slug: form.slug,
      }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// ✅ Fetch form data at build time
async function getFormData(slug) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/forms/${slug}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!res.ok) {
      return null;
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching form:', error);
    return null;
  }
}

// ✅ Generate metadata for SEO
export async function generateMetadata({ params }) {
  const form = await getFormData(params.slug);
  
  if (!form) {
    return {
      title: 'Form Not Found',
    };
  }
  
  return {
    title: form.title,
    description: form.description || `Fill out the ${form.title} form`,
  };
}
