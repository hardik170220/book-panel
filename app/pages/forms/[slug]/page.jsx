// app/forms/[slug]/page.js
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const FIELD_LABELS = {
  name: 'Full Name',
  sname: 'Surname',
  mobile: 'Mobile Number',
  email: 'Email Address',
  pincode: 'Pincode',
  state: 'State',
  city: 'City',
  address: 'Full Address',
  copies: 'Number of Copies',
  gender: 'Gender',
  age: 'Age'
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export default function DynamicFormPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (params.slug) {
      fetchForm(params.slug);
    }
  }, [params.slug]);

  const fetchForm = async (slug) => {
    try {
      setLoading(true);
      // Use the unified [id] route which now handles both IDs and slugs
      const response = await fetch(`/api/forms/${slug}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Form Not Found",
            description: "The requested form could not be found or is not available.",
            variant: "destructive"
          });
          router.push('/forms');
          return;
        }
        throw new Error('Failed to fetch form');
      }

      const formData = await response.json();
      setForm(formData);

      // Initialize form data with default values
      const initialData = {};
      formData.fields.forEach(field => {
        initialData[field] = field === 'copies' ? formData.no_of_copies || 0 : '';
      });
      setFormData(initialData);

    } catch (error) {
      console.error('Error fetching form:', error);
      toast({
        title: "Error",
        description: "Failed to load the form. Please try again.",
        variant: "destructive"
      });
      router.push('/forms');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (fieldName, value) => {
    const newErrors = { ...errors };

    switch (fieldName) {
      case 'name':
      case 'sname':
        if (form.fieldConfig[`show_${fieldName}`] && !value?.trim()) {
          newErrors[fieldName] = `${FIELD_LABELS[fieldName]} is required`;
        } else {
          delete newErrors[fieldName];
        }
        break;

      case 'mobile':
        if (form.fieldConfig.show_mobile) {
          if (!value?.trim()) {
            newErrors.mobile = 'Mobile number is required';
          } else if (!/^[6-9]\d{9}$/.test(value.replace(/\s+/g, ''))) {
            newErrors.mobile = 'Please enter a valid 10-digit mobile number';
          } else {
            delete newErrors.mobile;
          }
        }
        break;

      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;

      case 'pincode':
        if (form.fieldConfig.show_pincode) {
          if (!value?.trim()) {
            newErrors.pincode = 'Pincode is required';
          } else if (!/^\d{6}$/.test(value)) {
            newErrors.pincode = 'Please enter a valid 6-digit pincode';
          } else {
            delete newErrors.pincode;
          }
        }
        break;

      case 'age':
        if (value && (value < 1 || value > 120)) {
          newErrors.age = 'Please enter a valid age between 1 and 120';
        } else {
          delete newErrors.age;
        }
        break;

      case 'copies':
        if (value < 0) {
          newErrors.copies = 'Number of copies cannot be negative';
        } else {
          delete newErrors.copies;
        }
        break;

      default:
        if (form.fieldConfig[`show_${fieldName}`] && !value?.trim()) {
          newErrors[fieldName] = `${FIELD_LABELS[fieldName]} is required`;
        } else {
          delete newErrors[fieldName];
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    validateField(fieldName, value);
  };

  const validateForm = () => {
    const newErrors = {};

    form.fields.forEach(field => {
      const value = formData[field];
      const fieldConfig = form.fieldConfig[`show_${field}`];

      // Check required fields
      if (fieldConfig && ['name', 'sname', 'mobile', 'pincode'].includes(field) && !value?.trim()) {
        newErrors[field] = `${FIELD_LABELS[field]} is required`;
      }

      // Validate specific field formats
      validateField(field, value);
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const submissionData = {
        form_id: form.id,
        ...formData
      };

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit form');
      }

      setSubmitted(true);
      toast({
        title: "Success!",
        description: "Your form has been submitted successfully.",
      });

    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Submission Error",
        description: error.message || "Failed to submit form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  if (!form) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Form Not Found</h2>
          <p className="text-gray-600 mb-4">The requested form could not be found.</p>
          <Link href="/forms">
            <Button>Back to Forms</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardContent className="pt-6">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-green-700 mb-2">
                Form Submitted Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                Thank you for submitting <strong>{form.title}</strong>.
                Your response has been recorded.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/forms">
                  <Button variant="outline">View Other Forms</Button>
                </Link>
                <Button onClick={() => {
                  setSubmitted(false);
                  setFormData({});
                  setErrors({});
                  // Reset form data
                  const initialData = {};
                  form.fields.forEach(field => {
                    initialData[field] = field === 'copies' ? form.no_of_copies || 0 : '';
                  });
                  setFormData(initialData);
                }}>
                  Submit Another Response
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/forms" className="inline-flex items-center gap-2 text-primary hover:underline mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Forms
        </Link>

        <div className="flex items-start gap-6">
          {/* Form Thumbnails */}
          {form.thumbnails && form.thumbnails.length > 0 && (
            <div className="hidden md:block">
              <img
                src={form.thumbnails[0]}
                alt={form.title}
                className="w-32 h-32 rounded-lg object-cover shadow-md"
              />
            </div>
          )}

          {/* Form Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{form.title}</h1>
            {form.description && (
              <p className="text-gray-600 mb-4">{form.description}</p>
            )}

            {/* Form Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {form.active_to && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Closes on {formatDate(form.active_to)}</span>
                </div>
              )}
              {form.no_of_copies > 0 && (
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>Default copies: {form.no_of_copies}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Fill out the form</CardTitle>
            <CardDescription>
              Please provide accurate information. Required fields are marked with *
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {form.fields.map((field) => (
                <FormField
                  key={field}
                  field={field}
                  label={FIELD_LABELS[field]}
                  value={formData[field] || ''}
                  onChange={(value) => handleInputChange(field, value)}
                  error={errors[field]}
                  required={['name', 'sname', 'mobile', 'pincode'].includes(field)}
                  form={form}
                />
              ))}

              {/* Additional Thumbnails Preview */}
              {form.thumbnails && form.thumbnails.length > 1 && (
                <div className="border-t pt-6">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Form Reference Images
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {form.thumbnails.map((thumbnail, index) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden">
                        <img
                          src={thumbnail}
                          alt={`Reference ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => window.open(thumbnail, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={submitting || Object.keys(errors).length > 0}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Form'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Reset form
                    const initialData = {};
                    form.fields.forEach(field => {
                      initialData[field] = field === 'copies' ? form.no_of_copies || 0 : '';
                    });
                    setFormData(initialData);
                    setErrors({});
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Form Field Component
function FormField({ field, label, value, onChange, error, required, form }) {
  const fieldId = `field-${field}`;

  const renderField = () => {
    switch (field) {
      case 'gender':
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={error ? "border-red-500" : ""}>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'state':
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={error ? "border-red-500" : ""}>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {INDIAN_STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'age':
      case 'copies':
        return (
          <Input
            id={fieldId}
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : '')}
            placeholder={`Enter ${label.toLowerCase()}`}
            className={error ? "border-red-500" : ""}
            min={field === 'age' ? 1 : 0}
            max={field === 'age' ? 120 : undefined}
          />
        );

      case 'mobile':
        return (
          <Input
            id={fieldId}
            type="tel"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter 10-digit mobile number"
            className={error ? "border-red-500" : ""}
            maxLength={10}
          />
        );

      case 'email':
        return (
          <Input
            id={fieldId}
            type="email"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter email address"
            className={error ? "border-red-500" : ""}
          />
        );

      case 'pincode':
        return (
          <Input
            id={fieldId}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter 6-digit pincode"
            className={error ? "border-red-500" : ""}
            maxLength={6}
            pattern="\d{6}"
          />
        );

      case 'address':
        return (
          <Textarea
            id={fieldId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter full address"
            className={error ? "border-red-500" : ""}
            rows={3}
          />
        );

      default:
        return (
          <Input
            id={fieldId}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
            className={error ? "border-red-500" : ""}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId} className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {renderField()}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}