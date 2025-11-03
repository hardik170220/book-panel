"use client"
import React, { useState, useEffect } from 'react';
import { Calendar, Book, User, MapPin, Eye, EyeOff, ExternalLink, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const [selectedForm, setSelectedForm] = useState(null);
  const [formsData, setFormsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchForms() {
      try {
        setLoading(true);
        const res = await fetch("https://apformgenerator.netlify.app/api/forms");
        
        if (!res.ok) {
          throw new Error(`Failed to fetch forms: ${res.statusText}`);
        }
        
        const data = await res.json();
        
        // Sort by order field (ascending)
        const sortedData = data.sort((a, b) => {
          if (a.order !== null && a.order !== undefined && b.order !== null && b.order !== undefined) {
            return a.order - b.order;
          }
          if (a.order !== null && a.order !== undefined) return -1;
          if (b.order !== null && b.order !== undefined) return 1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
        
        setFormsData(sortedData);
        setError(null);
      } catch (err) {
        console.error("Error fetching forms:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchForms();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getStatusBadge = (form) => {
    if (!form.active) {
      return <span className="px-2 py-1 bg-foreground text-background  text-xs rounded-sm">Inactive</span>;
    }
    return <span className="px-2 py-1   border  text-xs rounded-sm">Active</span>;
  };

  const getTotalForms = () => formsData.length;
  const getActiveForms = () => formsData.filter(form => form.active).length;
  const getVisibleForms = () => formsData.filter(form => form.show).length;
  const getTotalCopies = () => formsData.reduce((sum, form) => sum + (form.no_of_copies || 0), 0);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen  font-poppins">
        <div className=" mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin  mx-auto mb-4" />
              <p className="">Loading forms...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen  font-poppins">
        <div className="mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-2">Error loading forms</p>
              <p className=" text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 font-poppins">
      <div className=" mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold  mb-2">Forms Dashboard</h1>
          <p className="/70">Manage and overview your forms</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="border  rounded-sm p-6 ">
            <div className="flex items-center justify-between">
              <div>
                <p className="/70 text-sm">Total Forms</p>
                <p className="text-2xl font-bold ">{getTotalForms()}</p>
              </div>
              <Book className="h-8 w-8 " />
            </div>
          </div>
          
          <div className="border  rounded-sm p-6 ">
            <div className="flex items-center justify-between">
              <div>
                <p className="/70 text-sm">Active Forms</p>
                <p className="text-2xl font-bold ">{getActiveForms()}</p>
              </div>
              <Eye className="h-8 w-8 " />
            </div>
          </div>
          
          <div className="border  rounded-sm p-6 ">
            <div className="flex items-center justify-between">
              <div>
                <p className="/70 text-sm">Visible Forms</p>
                <p className="text-2xl font-bold ">{getVisibleForms()}</p>
              </div>
              <User className="h-8 w-8 " />
            </div>
          </div>
        </div>

        {/* Empty state */}
        {formsData.length === 0 ? (
          <div className="text-center py-12 border  rounded-sm ">
            <Book className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className=" text-lg">No forms found</p>
            <p className=" text-sm mt-2">Create your first form to get started</p>
          </div>
        ) : (
          <>
            {/* Forms Grid */}
            <div className="grid grid-cols-1 font-anek lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {formsData.map((form) => (
                <div 
                  key={form.id} 
                  className={`border shadow-md hover:shadow-xl rounded-sm p-6 cursor-pointer transition-all duration-200 ${
                    selectedForm?.id === form.id 
                      ? '' 
                      : ''
                  }`}
                  onClick={() => setSelectedForm(selectedForm?.id === form.id ? null : form)}
                >
                  {/* Thumbnail */}
                  {form.thumbnails && form.thumbnails.length > 0 && (
                    <div className="mb-4">
                      <img 
                        src={form.thumbnails[0]} 
                        alt={form.title}
                        className="w-full h-32 object-contain rounded-sm"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Form Title */}
                  <h3 className="font-semibold text-lg mb-3 line-clamp-2">{form.title}</h3>

                  {/* Status and Visibility */}
                  <div className="flex items-center justify-between mb-3">
                    {getStatusBadge(form)}
                    <div className="flex items-center gap-1">
                      {form.show ? (
                        <>
                          <Eye className="h-4 w-4" />
                          <span className="text-xs">Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4" />
                          <span className="text-xs">Hidden</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Form Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Order:</span>
                      <span className="font-semibold">{form.order ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Copies:</span>
                      <span className="font-semibold">{form.no_of_copies || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{formatDate(form.created_at)}</span>
                    </div>
                    {form.active_from && (
                      <div className="flex justify-between">
                        <span>From:</span>
                        <span>{formatDate(form.active_from)}</span>
                      </div>
                    )}
                    {form.active_to && (
                      <div className="flex justify-between">
                        <span>To:</span>
                        <span>{formatDate(form.active_to)}</span>
                      </div>
                    )}
                  </div>

                  {/* Link */}
                  <div className="mt-4 pt-4 border-t">
                    <a 
                      href={`https://adhyatm-parivar-stagging.netlify.app/pages/forms?form=${form.slug}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 text-sm hover:underline ${
                        selectedForm?.id === form.id ? '' : ''
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Form
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Form Details */}
            {selectedForm && (
              <div className="mt-8 border  rounded-sm p-6 ">
                <h3 className="text-xl font-bold  mb-4">Form Details: {selectedForm.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold  mb-2">Basic Information</h4>
                    <div className="space-y-1 text-sm /80">
                      <p><strong>Slug:</strong> {selectedForm.slug}</p>
                      <p><strong>ID:</strong> {selectedForm.id}</p>
                      <p><strong>Order:</strong> {selectedForm.order ?? 'N/A'}</p>
                      <p><strong>Status:</strong> {selectedForm.active ? 'Active' : 'Inactive'}</p>
                      <p><strong>Visibility:</strong> {selectedForm.show ? 'Visible' : 'Hidden'}</p>
                      <p><strong>Copies:</strong> {selectedForm.no_of_copies || 0}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold  mb-2">Timeline</h4>
                    <div className="space-y-1 text-sm /80">
                      <p><strong>Created:</strong> {formatDate(selectedForm.created_at)}</p>
                      <p><strong>Active From:</strong> {formatDate(selectedForm.active_from)}</p>
                      <p><strong>Active To:</strong> {formatDate(selectedForm.active_to)}</p>
                    </div>
                  </div>
                </div>
                {selectedForm.description && (
                  <div className="mt-4">
                    <h4 className="font-semibold  mb-2">Description</h4>
                    <p className="text-sm /80">{selectedForm.description}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;