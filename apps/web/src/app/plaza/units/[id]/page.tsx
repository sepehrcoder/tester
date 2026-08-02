"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { RentalUnitDetail } from "@/components/shared/RentalUnitDetail";

export default function PlazaUnitDetailPage() {
  const params = useParams<{ id: string }>();
  return (
    <div>
      <PageHeader title="Unit" />
      <RentalUnitDetail unitId={params.id} />
    </div>
  );
}
