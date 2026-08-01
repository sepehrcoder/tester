"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { RentalUnitDetail } from "@/components/shared/RentalUnitDetail";

export default function RentalDetailPage() {
  const params = useParams<{ id: string }>();
  return (
    <div>
      <PageHeader title="Rental property" />
      <RentalUnitDetail unitId={params.id} />
    </div>
  );
}
