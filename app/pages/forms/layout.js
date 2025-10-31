// app/forms/layout.js
import { Metadata } from 'next';

export const metadata = {
  title: 'Forms | Your App Name',
  description: 'Browse and fill out available forms',
};

export default function FormsLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Optional: Add a navigation header specific to forms */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Forms Portal</h1>
              <p className="text-sm text-gray-600">Fill out forms quickly and easily</p>
            </div>
            
            {/* Optional: Add breadcrumb or user info here */}
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      {/* Optional: Add footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>© 2024 Your Company. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}