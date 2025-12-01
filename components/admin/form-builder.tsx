"use client";

import type React from "react";

import { useEffect, useMemo, useRef, useState } from "react";
import { AVAILABLE_FIELDS, type FieldKey, type FormDefinition } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type FormDraft = {
  title: string;
  slug: string;
  link: string;
  tqmsg: string;
  tqmsg_description: string;
  description: string;
  no_of_copies: number;
  stock: number;
  thumbnails: string[];
  thumbnailFiles: File[];
  existingThumbnails: string[];
  removedThumbnails: string[];
  fields: FieldKey[];
  active: boolean;
  show: boolean;
  activeFrom?: string;
  activeTo?: string;
  language: "hindi" | "english" | "gujarati";
  copy_question: string;
};

const DEFAULT_MESSAGES = {
  gujarati: {
    tqmsg: "આપનો પુસ્તક મેળવવા માટે રિકવેસ્ટ નંબર નીચે મુજબ છે.",
    tqmsg_description: "એની નોંધ કરી લેશો.",
    copy_question: "આપને આ પુસ્તકની કેટલી નકલની આવશ્યકતા છે?"
  },
  hindi: {
    tqmsg: "यह आपका किताब पाने के लिए रिक्वेस्ट नंबर है।",
    tqmsg_description: "कृपया इसे नोट कर लें।",
    copy_question: "आपको इस पुस्तक की कितनी प्रतियों की आवश्यकता है?"
  },
  english: {
    tqmsg: "This is your request number to receive the book.",
    tqmsg_description: "Please note this.",
    copy_question: "How many copies of this book do you need?"
  }
};

// Function to get default fields (all except gender and age)
function getDefaultFields(): FieldKey[] {
  return AVAILABLE_FIELDS
    .filter(field => !['gender', 'age', 'email'].includes(field.key))
    .map(field => field.key);
}

export function FormBuilder({
  onCreate,
  onUpdate,
  editingForm,
  onFinishEdit,
}: {
  onCreate: (
    payload: Omit<FormDefinition, "id" | "created_at" | "submissions">
  ) => void;
  onUpdate: (
    id: string,
    updates: Partial<Omit<FormDefinition, "id" | "createdAt" | "submissions">>
  ) => void;
  editingForm?: FormDefinition | null;
  onFinishEdit?: () => void;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const initial: FormDraft = useMemo(
    () => ({
      title: editingForm?.title ?? "",
      slug: editingForm?.slug ?? "",
      link: editingForm?.link ?? "",
      tqmsg: editingForm?.tqmsg ?? DEFAULT_MESSAGES.english.tqmsg,
      tqmsg_description: editingForm?.tqmsg_description ?? DEFAULT_MESSAGES.english.tqmsg_description,

      description: editingForm?.description ?? "",
      thumbnails: editingForm?.thumbnails ?? [],
      thumbnailFiles: [],
      existingThumbnails: editingForm?.thumbnails ?? [], // Keep track of existing thumbnails
      removedThumbnails: [],
      fields: editingForm?.fields ?? getDefaultFields(),
      active: editingForm?.active ?? true,
      show: editingForm?.show ?? false,
      activeFrom: formatDateForInput(editingForm?.activeFrom),
      activeTo: formatDateForInput(editingForm?.activeTo),
      no_of_copies: editingForm?.no_of_copies ?? 0,
      stock: editingForm?.stock ?? 0,
      language: editingForm?.language ?? "english",
      copy_question: editingForm?.copy_question ?? DEFAULT_MESSAGES[editingForm?.language ?? "english"].copy_question,
    }),
    [editingForm]
  );

  const [draft, setDraft] = useState<FormDraft>(initial);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  function setField<K extends keyof FormDraft>(key: K, value: FormDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function onToggleField(f: FieldKey, checked: boolean) {
    setDraft((d) => ({
      ...d,
      fields: checked
        ? Array.from(new Set([...d.fields, f]))
        : d.fields.filter((x) => x !== f),
    }));
  }

  function formatDateForInput(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  }


  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      // Validate file types and sizes
      const validFiles = files.filter(file => {
        if (!file.type.startsWith('image/')) {
          toast({
            description: `${file.name} is not a valid image file.`,
            variant: "destructive"
          });
          return false;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast({
            description: `${file.name} is too large. Maximum file size is 5MB.`,
            variant: "destructive"
          });
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        // Create object URLs for preview
        const urls = validFiles.map((f) => URL.createObjectURL(f));
        setDraft((d) => ({
          ...d,
          thumbnails: [...d.thumbnails, ...urls],
          thumbnailFiles: [...d.thumbnailFiles, ...validFiles]
        }));
      }
    }
  }

  function removeThumb(idx: number) {
    setDraft((d) => {
      const isExistingThumbnail = idx < d.existingThumbnails.length;

      if (isExistingThumbnail) {
        // Mark existing thumbnail for removal
        const thumbnailToRemove = d.existingThumbnails[idx];
        return {
          ...d,
          thumbnails: d.thumbnails.filter((_, i) => i !== idx),
          existingThumbnails: d.existingThumbnails.filter((_, i) => i !== idx),
          removedThumbnails: [...d.removedThumbnails, thumbnailToRemove],
        };
      } else {
        // Remove new file and clean up object URL
        const fileIndex = idx - d.existingThumbnails.length;
        URL.revokeObjectURL(d.thumbnails[idx]);
        return {
          ...d,
          thumbnails: d.thumbnails.filter((_, i) => i !== idx),
          thumbnailFiles: d.thumbnailFiles.filter((_, i) => i !== fileIndex)
        };
      }
    });
  }

  //         function getFormLink(slug :any) {
  //   if (slug === "bhagwan-mahavir") {
  //     return "https://bhagwanmahavirform-fahifz22ha-uc.a.run.app";
  //   } else if (slug === "udayanmantri") {
  //     return "https://udayanmantriform-fahifz22ha-uc.a.run.app";
  //   } else if (slug === "mahabharat") {
  //     return "https://mahabharatform-fahifz22ha-uc.a.run.app";
  //   } else if (slug === "ravanni-bhitarma") {
  //     return "https://ravannibhitarmaform-fahifz22ha-uc.a.run.app";
  //   }else if (slug === "aapno-gyanvaibhav") {
  //     return "https://universalform-fahifz22ha-uc.a.run.app/aapnoGyanvaibhavForm";
  //   }
  //    else if (slug === "calendar-2082") {
  //     return "https://calendar2082form-fahifz22ha-uc.a.run.app";
  //   } else {
  //     return `https://universalform-fahifz22ha-uc.a.run.app/${slug}`;
  //   }
  // }

  function getFormLink(slug: any) {
    // Special cases with fixed slug names
    if (slug === "aapno-gyanvaibhav") {
      return "https://universalform-fahifz22ha-uc.a.run.app?form=aapnoGyanvaibhavForm";
    } else if (slug === "sanskrutam-saralam") {
      return "https://universalform-fahifz22ha-uc.a.run.app?form=sanskrutam-saralam";
    }

    // For all other slugs, just remove hyphens
    const formattedSlug = slug.replace(/-/g, '');
    return `https://universalform-fahifz22ha-uc.a.run.app?form=${formattedSlug}&slug=${slug}`;
  }

  function reset() {
    // Clean up object URLs
    draft.thumbnailFiles.forEach((_, idx) => {
      const urlIdx = draft.existingThumbnails.length + idx;
      if (urlIdx < draft.thumbnails.length) {
        URL.revokeObjectURL(draft.thumbnails[urlIdx]);
      }
    });

    setDraft({
      title: "",
      description: "",
      slug: "",
      link: getFormLink(draft.slug),
      tqmsg: DEFAULT_MESSAGES.english.tqmsg,
      tqmsg_description: DEFAULT_MESSAGES.english.tqmsg_description,
      thumbnails: [],
      thumbnailFiles: [],
      existingThumbnails: [],
      removedThumbnails: [],
      fields: getDefaultFields(),
      active: true,
      show: false,
      activeFrom: "",
      activeTo: "",
      no_of_copies: 0,
      stock: 0,
      language: "english",
      copy_question: DEFAULT_MESSAGES.english.copy_question,
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  // Convert fields array to boolean flags for API
  function fieldsToApiFormat(fields: FieldKey[]) {
    return {
      show_mobile: fields.includes('phone'),
      show_name: fields.includes('name'),
      show_sname: fields.includes('sname'),
      show_pincode: fields.includes('pincode'),
      show_state: fields.includes('state'),
      show_city: fields.includes('city'),
      show_address: fields.includes('address'),
      show_copies: fields.includes('copies'),
      show_gender: fields.includes('gender'),
      show_age: fields.includes('age'),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!draft.title.trim()) {
      toast({ description: "Please add a title.", variant: "destructive" });
      return;
    }

    if (!draft.slug.trim()) {
      toast({ description: "Please add a slug.", variant: "destructive" });
      return;
    }

    // Validate slug format (optional but recommended)
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugPattern.test(draft.slug.trim())) {
      toast({
        description: "Slug must contain only lowercase letters, numbers, and hyphens.",
        variant: "destructive"
      });
      return;
    }

    // Validate date range
    if (draft.activeFrom && draft.activeTo && draft.activeFrom > draft.activeTo) {
      toast({
        description: "Active From date must be before Active To date.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Add basic form fields
      formData.append('title', draft.title.trim());
      formData.append('slug', draft.slug.trim());
      formData.append('link', getFormLink(draft.slug.trim()));
      formData.append('tqmsg', draft.tqmsg.trim());
      formData.append('tqmsg_description', draft.tqmsg_description.trim());
      formData.append('description', draft.description.trim());
      formData.append('active', draft.active.toString());
      formData.append('show', draft.show.toString());
      formData.append('activeFrom', draft.activeFrom || '');
      formData.append('activeTo', draft.activeTo || '');
      formData.append('no_of_copies', draft.no_of_copies.toString());
      formData.append('stock', draft.stock.toString());
      formData.append('language', draft.language);
      formData.append('copy_question', draft.copy_question.trim());

      // Add field visibility flags
      const fieldFlags = fieldsToApiFormat(draft.fields);
      Object.entries(fieldFlags).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      // For updates, handle existing thumbnails and removals
      if (editingForm) {
        // Send remaining existing thumbnails
        formData.append('existingThumbnails', JSON.stringify(draft.existingThumbnails));

        // Send thumbnails to be removed
        if (draft.removedThumbnails.length > 0) {
          formData.append('removedThumbnails', JSON.stringify(draft.removedThumbnails));
        }

        // Flag to indicate if we should replace all existing thumbnails
        formData.append('removeExistingThumbnails',
          (draft.removedThumbnails.length > 0 || draft.thumbnailFiles.length > 0).toString()
        );
      }

      // Add new thumbnail files
      draft.thumbnailFiles.forEach((file) => {
        formData.append('thumbnails', file);
      });

      let response: Response;
      let responseData: any;

      if (editingForm) {
        // Update existing form
        response = await fetch(`/api/forms/${editingForm.id}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        // Create new form
        response = await fetch('/api/forms', {
          method: 'POST',
          body: formData,
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      responseData = await response.json();

      // Convert API response back to frontend format
      const processedForm = {
        ...responseData,
        fields: convertApiFieldsToFrontend(responseData),
        thumbnails: Array.isArray(responseData.thumbnails)
          ? responseData.thumbnails
          : (typeof responseData.thumbnails === 'string'
            ? JSON.parse(responseData.thumbnails)
            : [])
      };

      if (editingForm) {
        onUpdate(editingForm.id, processedForm);
        toast({ description: "Form updated successfully!" });
        onFinishEdit?.();
      } else {
        onCreate(processedForm);
        toast({ description: "Form created successfully!" });
        reset();
      }
    } catch (error: any) {
      console.error('Form submission error:', error);

      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Helper function to convert API response fields to frontend format
  function convertApiFieldsToFrontend(apiData: any): FieldKey[] {
    const fields: FieldKey[] = [];

    if (apiData.show_mobile) fields.push('phone');
    if (apiData.show_name) fields.push('name');
    if (apiData.show_sname) fields.push('sname');
    if (apiData.show_pincode) fields.push('pincode');
    if (apiData.show_state) fields.push('state');
    if (apiData.show_city) fields.push('city');
    if (apiData.show_address) fields.push('address');
    if (apiData.show_copies) fields.push('copies');
    if (apiData.show_gender) fields.push('gender');
    if (apiData.show_age) fields.push('age');

    return fields;
  }

  return (
    <div className="max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-pretty">
            {editingForm ? "Edit Form" : "Create a New Form"}
          </CardTitle>
          <CardDescription>
            Add title, description, thumbnail, choose the fields, and set active
            state. Files are uploaded to Cloudinary for optimal performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="title">Form Title *</Label>
              <Input
                id="title"
                placeholder="Enter the Title of form"
                value={draft.title}
                onChange={(e) => setField("title", e.target.value)}
                required
                maxLength={255}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="desc">Form Description</Label>
              <Textarea
                id="desc"
                placeholder="Enter the description of form"
                className="min-h-24"
                value={draft.description}
                onChange={(e) => setField("description", e.target.value)}
                maxLength={1000}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                placeholder="Enter the Slug of form (lowercase, hyphens allowed)"
                value={draft.slug}
                onChange={(e) => setField("slug", e.target.value)}
                required
                maxLength={255}
              />
              <p className="text-xs text-muted-foreground">
                Only lowercase letters, numbers, and hyphens are allowed. Must be unique.
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Language</Label>
              <RadioGroup
                value={draft.language}
                onValueChange={(val: "hindi" | "english" | "gujarati") => {
                  setField("language", val);
                  // Update default messages based on language
                  setField("tqmsg", DEFAULT_MESSAGES[val].tqmsg);
                  setField("tqmsg_description", DEFAULT_MESSAGES[val].tqmsg_description);
                  setField("copy_question", DEFAULT_MESSAGES[val].copy_question);
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hindi" id="lang-hindi" />
                  <Label htmlFor="lang-hindi">Hindi</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="english" id="lang-english" />
                  <Label htmlFor="lang-english">English</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gujarati" id="lang-gujarati" />
                  <Label htmlFor="lang-gujarati">Gujarati</Label>
                </div>
              </RadioGroup>
            </div>

            {/* <div className="grid gap-2">
              <Label htmlFor="link">Link *</Label>
              <Input
                id="link"
                placeholder="Enter the link for the submmission (firebase-function)"
                value={draft.link}
                onChange={(e) => setField("link", e.target.value)}
                required
              />
    
            </div> */}

            <div className="grid gap-2">
              <Label htmlFor="tqmsg">Thank you message *</Label>
              <Input
                id="tqmsg"
                placeholder="Enter the thank you message, seen after the submmission"
                value={draft.tqmsg}
                onChange={(e) => setField("tqmsg", e.target.value)}
              />
              {/* <p className="text-xs text-muted-foreground">
                Only lowercase letters, numbers, and hyphens are allowed. Must be unique.
              </p> */}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tqmsg_desc">Thank You Message Description</Label>
              <Textarea
                id="tqmsg_desc"
                placeholder="Enter the thank you message description of form"
                className="min-h-24"
                value={draft.tqmsg_description}
                onChange={(e) => setField("tqmsg_description", e.target.value)}
                maxLength={1000}
              />
            </div>



            <div className="grid gap-2">
              <Label htmlFor="thumbs">Thumbnails (optional)</Label>
              <div className="flex flex-col gap-3">
                <Input
                  id="thumbs"
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileRef}
                  onChange={onPickFiles}
                />
                <p className="text-xs text-muted-foreground">
                  Upload images up to 5MB each. Supported formats: JPG, PNG, GIF, WebP
                </p>
                {draft.thumbnails.length === 0 ? (
                  <div className="flex items-center gap-3">
                    <img
                      src="/form-thumbnail-placeholder.png"
                      alt="No thumbnails"
                      className="h-16 w-16 rounded object-cover border opacity-70"
                    />
                    <p className="text-sm text-muted-foreground">
                      No thumbnails added. You can upload one or multiple
                      images.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {draft.thumbnails.map((src, idx) => {
                      const isExisting = idx < draft.existingThumbnails.length;
                      return (
                        <div
                          key={`${src}-${idx}`}
                          className="relative group border rounded p-1"
                        >
                          <img
                            src={src || "/placeholder.svg"}
                            alt={`Thumbnail ${idx + 1}`}
                            className="h-20 w-full rounded object-cover"
                            loading="lazy"
                          />
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                              #{idx + 1} {isExisting ? "(existing)" : "(new)"}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeThumb(idx)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
                }
                {draft.thumbnails.length > 0 ? (
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        // Clean up object URLs for new files
                        draft.thumbnailFiles.forEach((_, idx) => {
                          const urlIdx = draft.existingThumbnails.length + idx;
                          if (urlIdx < draft.thumbnails.length) {
                            URL.revokeObjectURL(draft.thumbnails[urlIdx]);
                          }
                        });
                        setDraft((d) => ({
                          ...d,
                          thumbnails: [],
                          thumbnailFiles: [],
                          existingThumbnails: [],
                          removedThumbnails: editingForm?.thumbnails ?? []
                        }));
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Clear all thumbnails
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Fields to include</Label>
              <p className="text-sm text-muted-foreground mb-2">
                By default, all fields except Gender and Age are selected.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_FIELDS.map((f) => {
                  const checked = draft.fields.includes(f.key);
                  return (
                    <label
                      key={f.key}
                      className="flex items-center gap-2 rounded border p-2 hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(val) =>
                          onToggleField(f.key, Boolean(val))
                        }
                        aria-label={f.label}
                      />
                      <span className="text-sm">{f.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="no_of_copies">Number of Copies</Label>
              <p className="text-sm text-muted-foreground mb-2">
                0 means unlimited copies can be enter.
              </p>
              <Input
                id="no_of_copies"
                type="number"
                min={0}
                max={999}
                value={draft.no_of_copies}
                onChange={(e) =>
                  setField("no_of_copies", Number(e.target.value))
                }
                placeholder="Enter number of copies"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="copy_question">Question for Copy Field</Label>
              <Input
                id="copy_question"
                placeholder="Enter the question for copy field"
                value={draft.copy_question}
                onChange={(e) => setField("copy_question", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stock">Stock</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Enter the number of books present in stock.
              </p>
              <Input
                id="stock"
                type="number"
                min={0}
                value={draft.stock}
                onChange={(e) =>
                  setField("stock", Number(e.target.value))
                }
                placeholder="Enter stock quantity"
              />
            </div>

            <div className="flex items-center justify-between rounded border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive forms are hidden from users.
                </p>
              </div>
              <Switch
                id="active"
                checked={draft.active}
                onCheckedChange={(v) => setField("active", v)}
              />
            </div>

            <div className="flex items-center justify-between rounded border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="show">Show on Event Page</Label>
                <p className="text-sm text-muted-foreground">
                  show forms are appear on the event page.
                </p>
              </div>
              <Switch
                id="show"
                checked={draft.show}
                onCheckedChange={(s) => setField("show", s)}
              />
            </div>

            <div className="grid gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label htmlFor="activeFrom">Active From</Label>
                  <Input
                    id="activeFrom"
                    type="date"
                    value={draft.activeFrom || ""}
                    onChange={(e) => setField("activeFrom", e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="activeTo">Active To</Label>
                  <Input
                    id="activeTo"
                    type="date"
                    value={draft.activeTo || ""}
                    onChange={(e) => setField("activeTo", e.target.value)}
                    min={draft.activeFrom || undefined}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Optional: Set a date range when the form should be active.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button
                type="submit"
                className="min-w-32"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    {editingForm ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editingForm ? "Save Changes" : "Create Form"
                )}
              </Button>
              {editingForm ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onFinishEdit}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={reset}
                  disabled={isSubmitting}
                >
                  Reset
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}