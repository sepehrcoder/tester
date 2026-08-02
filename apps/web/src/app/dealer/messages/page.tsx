"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { ConversationInbox } from "@/components/shared/ConversationInbox";

export default function DealerMessagesPage() {
  return (
    <div>
      <PageHeader title="Messages" subtitle="Conversations with buyers about leads and listings." />
      <ConversationInbox />
    </div>
  );
}
