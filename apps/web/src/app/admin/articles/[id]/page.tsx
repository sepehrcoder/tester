"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { ArticleEditorForm, EMPTY_ARTICLE_FORM, type ArticleFormState } from "@/components/admin/ArticleEditorForm";
import { useAuthedFetch } from "@/lib/useAuthedFetch";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface ArticleDetail {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImageUrl: string | null;
  category: "NEWS" | "GUIDE" | "AREA_INSIGHT";
  tags: string[];
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  metaTitle: string | null;
  metaDescription: string | null;
  author: { name: string };
}

export default function EditArticlePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();
  const { data, loading, error, refetch } = useAuthedFetch<ArticleDetail>(`/admin/articles/${params.id}`);
  const [form, setForm] = useState<ArticleFormState>(EMPTY_ARTICLE_FORM);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local edit form from a freshly fetched record, not derived UI state
    setForm({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      body: data.body,
      coverImageUrl: data.coverImageUrl ?? "",
      category: data.category,
      tags: data.tags.join(", "),
      status: data.status,
      metaTitle: data.metaTitle ?? "",
      metaDescription: data.metaDescription ?? "",
    });
  }, [data]);

  async function save() {
    setBusy(true);
    try {
      await apiFetch(`/admin/articles/${params.id}`, {
        method: "PATCH",
        token: accessToken,
        body: {
          ...form,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        },
      });
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this article permanently?")) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/articles/${params.id}`, { method: "DELETE", token: accessToken });
      router.push("/admin/articles");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  if (loading) return <p className="font-body text-sm text-ink-soft">Loading…</p>;
  if (error) return <p className="font-body text-sm text-ember">{error}</p>;
  if (!data) return null;

  return (
    <div>
      <PageHeader
        backHref="/admin/articles"
        backLabel="All articles"
        title={data.title}
        subtitle={`By ${data.author.name}`}
        action={
          <button
            disabled={busy}
            onClick={remove}
            className="rounded-sm bg-ember px-3 py-1.5 font-body text-xs font-bold text-ember-ink disabled:opacity-50"
          >
            Delete
          </button>
        }
      />
      <ArticleEditorForm form={form} setForm={setForm} onSave={save} busy={busy} saveLabel="Save changes" />
    </div>
  );
}
