"use client"
import React from 'react';
import { FileEdit, Database } from 'lucide-react';

export default function AdminDashboard() {
  const handleNavigation = (path:any) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">Admin Dashboard</h1>
          <p className="text-foreground/60 text-lg">Manage your forms and view submissions</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form Builder Card */}
          <button
            onClick={() => handleNavigation('/admin/forms')}
            className="group relative bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-sm p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl text-left"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-sm bg-foreground/10 flex items-center justify-center group-hover:bg-foreground/15 transition-colors">
                <FileEdit className="w-10 h-10 text-foreground" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Form Builder</h2>
                <p className="text-foreground/60">Create and manage your forms with an intuitive drag-and-drop interface</p>
              </div>

              <div className="flex items-center text-foreground/80 group-hover:text-foreground transition-colors">
                <span className="text-sm font-medium">Get Started</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div className="absolute inset-0 rounded-sm border-2 border-transparent group-hover:border-foreground/20 transition-colors pointer-events-none" />
          </button>

          {/* View Submissions Card */}
          <button
            onClick={() => handleNavigation('/admin/submission-data')}
            className="group relative bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-sm p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl text-left"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-sm bg-foreground/10 flex items-center justify-center group-hover:bg-foreground/15 transition-colors">
                <Database className="w-10 h-10 text-foreground" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">View Submissions</h2>
                <p className="text-foreground/60">Access and analyze all form submissions in one centralized location</p>
              </div>

              <div className="flex items-center text-foreground/80 group-hover:text-foreground transition-colors">
                <span className="text-sm font-medium">View Data</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div className="absolute inset-0 rounded-sm border-2 border-transparent group-hover:border-foreground/20 transition-colors pointer-events-none" />
          </button>
        </div>
      </div>
    </div>
  );
}