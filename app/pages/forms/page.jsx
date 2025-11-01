// app/forms/page.js
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, FileText, Calendar, Users } from 'lucide-react';

export default function FormsListingPage() {
  const [forms, setForms] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchForms();
  }, []);

  useEffect(() => {
    // Filter forms based on search term
    const filtered = forms.filter(form => 
      form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredForms(filtered);
  }, [forms, searchTerm]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/forms');
      
      if (!response.ok) {
        throw new Error('Failed to fetch forms');
      }
      
      const data = await response.json();
      
      // Filter only active forms for public display
      const activeForms = data.filter(form => {
        if (!form.active) return false;
        
        const now = new Date();
        
        // Check if form is within active date range
        if (form.active_from && new Date(form.active_from) > now) return false;
        if (form.active_to && new Date(form.active_to) < now) return false;
        
        return true;
      });
      
      setForms(activeForms);
    } catch (error) {
      console.error('Error fetching forms:', error);
      setError('Failed to load forms. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isFormClosingSoon = (activeTo) => {
    if (!activeTo) return false;
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return new Date(activeTo) <= threeDaysFromNow;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={fetchForms} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Available Forms
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose from our collection of forms. Click on any form to fill it out.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Forms Grid */}
      {filteredForms.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No forms match your search' : 'No forms available'}
          </h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms.' : 'Please check back later.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredForms.map((form) => (
            <FormCard key={form.id} form={form} />
          ))}
        </div>
      )}
    </div>
  );
}

function FormCard({ form }) {
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isClosingSoon = (activeTo) => {
    if (!activeTo) return false;
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return new Date(activeTo) <= threeDaysFromNow;
  };

  // Parse thumbnails if it's a string
  let thumbnails = form.thumbnails;
  if (typeof thumbnails === 'string') {
    try {
      thumbnails = JSON.parse(thumbnails);
    } catch (e) {
      thumbnails = [];
    }
  }
  thumbnails = Array.isArray(thumbnails) ? thumbnails : [];

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
      <CardHeader className="pb-4">
        {/* Thumbnail */}
        {thumbnails.length > 0 ? (
          <div className="w-full h-48 rounded-lg overflow-hidden mb-4">
            <img
              src={thumbnails[0]}
              alt={form.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full h-48 rounded-lg bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center mb-4">
            <FileText className="h-16 w-16 text-blue-400" />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors">
              {form.title}
            </CardTitle>
            {isClosingSoon(form.active_to) && (
              <Badge variant="destructive" className="text-xs">
                Closing Soon
              </Badge>
            )}
          </div>
          
          {form.description && (
            <CardDescription className="text-gray-600 line-clamp-3">
              {form.description}
            </CardDescription>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Form Details */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {form.active_to && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Until {formatDate(form.active_to)}</span>
              </div>
            )}
            
            {form.no_of_copies > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{form.no_of_copies} copies</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Link href={`/pages/forms/${form.slug}`} className="block">
            <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              Fill This Form
            </Button>
          </Link>

          {/* Additional Thumbnails Preview */}
          {thumbnails.length > 1 && (
            <div className="flex gap-2 mt-2">
              {thumbnails.slice(1, 4).map((thumbnail, index) => (
                <div key={index} className="w-12 h-12 rounded overflow-hidden">
                  <img
                    src={thumbnail}
                    alt={`${form.title} preview ${index + 2}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
              {thumbnails.length > 4 && (
                <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                  +{thumbnails.length - 4}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}