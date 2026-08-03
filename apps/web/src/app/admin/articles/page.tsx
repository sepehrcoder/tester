"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/shared/Table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface ArticleRow {
  id: string;
  title: string;
  category: string;
  status: string;
  viewCount: number;
  createdAt: string;
  author: { name: string };
}

export default function AdminArticlesPage() {
  const { data, loading, error } = useAuthedFetch<ArticleRow[]>("/admin/articles");

  return (
    <div>
      <PageHeader
        title="Articles"
        subtitle="News, guides, and area-insight content."
        action={
          <Link href="/admin/articles/new">
            <Button variant="primary">New article</Button>
          </Link>
        }
      />

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}

      {data && (
        <Table
          rows={data}
          keyFor={(a) => a.id}
          emptyMessage="No articles yet."
          columns={[
            {
              header: "Title",
              cell: (a) => (
                <Link href={`/admin/articles/${a.id}`} className="hover:underline">
                  {a.title}
                </Link>
              ),
            },
            { header: "Category", cell: (a) => <Badge variant="ghost">{a.category.replaceAll("_", " ")}</Badge> },
            { header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
            { header: "Author", cell: (a) => a.author.name },
            { header: "Views", cell: (a) => a.viewCount.toLocaleString(), className: "tabular" },
            { header: "Created", cell: (a) => new Date(a.createdAt).toLocaleDateString() },
          ]}
        />
      )}
    </div>
  );
}
