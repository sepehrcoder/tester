"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { ConversationInbox } from "@/components/shared/ConversationInbox";

export default function CustomerMessagesPage() {
  return (
    <div>
      <PageHeader title="Messages" subtitle="Conversations with dealers about your requirements and listings." />
      <ConversationInbox />
    </div>
  );
}
