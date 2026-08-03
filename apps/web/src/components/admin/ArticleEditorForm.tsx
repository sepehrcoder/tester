"use client";

import { useState } from "react";
import { DetailSection } from "@/components/shared/DetailSection";
import { Button } from "@/components/ui/Button";

export interface ArticleFormState {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  category: "NEWS" | "GUIDE" | "AREA_INSIGHT";
  tags: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  metaTitle: string;
  metaDescription: string;
}

export const EMPTY_ARTICLE_FORM: ArticleFormState = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverImageUrl: "",
  category: "NEWS",
  tags: "",
  status: "DRAFT",
  metaTitle: "",
  metaDescription: "",
};

export function ArticleEditorForm({
  form,
  setForm,
  onSave,
  busy,
  saveLabel = "Save",
}: {
  form: ArticleFormState;
  setForm: (updater: (f: ArticleFormState) => ArticleFormState) => void;
  onSave: () => void;
  busy: boolean;
  saveLabel?: string;
}) {
  const [slugTouched, setSlugTouched] = useState(!!form.slug);

  function onTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: slugTouched
        ? f.slug
        : title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
    }));
  }

  return (
    <DetailSection title="Article">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="font-body text-xs text-ink-faint">Title</span>
          <input
            value={form.title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="font-body text-xs text-ink-faint">Slug</span>
          <input
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setForm((f) => ({ ...f, slug: e.target.value }));
            }}
            className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="font-body text-xs text-ink-faint">Excerpt</span>
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            rows={2}
            className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="font-body text-xs text-ink-faint">Body (Markdown)</span>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={12}
            className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="font-body text-xs text-ink-faint">Cover image URL</span>
          <input
            value={form.coverImageUrl}
            onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
            className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body text-xs text-ink-faint">Category</span>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ArticleFormState["category"] }))}
            className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
          >
            <option value="NEWS">News</option>
            <option value="GUIDE">Guide</option>
            <option value="AREA_INSIGHT">Area Insight</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body text-xs text-ink-faint">Status</span>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ArticleFormState["status"] }))}
            className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
          >
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="font-body text-xs text-ink-faint">Tags (comma-separated)</span>
          <input
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body text-xs text-ink-faint">Meta title</span>
          <input
            value={form.metaTitle}
            onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
            className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body text-xs text-ink-faint">Meta description</span>
          <input
            value={form.metaDescription}
            onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
            className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
          />
        </label>
      </div>
      <div className="mt-4">
        <Button variant="primary" onClick={onSave} disabled={busy}>
          {busy ? "Saving…" : saveLabel}
        </Button>
      </div>
    </DetailSection>
  );
}
