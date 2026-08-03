"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { ArticleEditorForm, EMPTY_ARTICLE_FORM, type ArticleFormState } from "@/components/admin/ArticleEditorForm";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function NewArticlePage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [form, setForm] = useState<ArticleFormState>(EMPTY_ARTICLE_FORM);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const created = await apiFetch<{ id: string }>("/admin/articles", {
        method: "POST",
        token: accessToken,
        body: {
          ...form,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        },
      });
      router.push(`/admin/articles/${created.id}`);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader backHref="/admin/articles" backLabel="All articles" title="New article" />
      <ArticleEditorForm form={form} setForm={setForm} onSave={save} busy={busy} saveLabel="Create article" />
    </div>
  );
}
