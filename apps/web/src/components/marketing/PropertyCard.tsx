import Link from "next/link";
import { IconMapPin } from "@repo/icons/web";
import { Badge } from "@/components/ui/Badge";

export interface Property {
  id?: string;
  price: string;
  title: string;
  location: string;
  verified?: boolean;
  tag: string;
}

export function PropertyCard({ id, price, title, location, verified, tag }: Property) {
  const card = (
    <article className="surface-flat flex gap-4 p-4">
      <div className="h-20 w-24 flex-shrink-0 rounded-sm bg-linear-to-br from-violet to-cyan" />
      <div className="min-w-0 flex-1">
        <p className="tabular font-display text-lg font-extrabold text-ink">{price}</p>
        <h3 className="truncate font-body text-sm font-semibold text-ink">{title}</h3>
        <p className="flex items-center gap-1 truncate text-xs text-ink-soft">
          <IconMapPin size={13} className="flex-shrink-0" />
          {location}
        </p>
        <div className="mt-2 flex gap-1.5">
          {verified && <Badge variant="teal">Verified</Badge>}
          <Badge variant="ghost">{tag}</Badge>
        </div>
      </div>
    </article>
  );

  return id ? (
    <Link href={`/listings/${id}`} className="block transition-transform hover:scale-[1.01]">
      {card}
    </Link>
  ) : (
    card
  );
}
