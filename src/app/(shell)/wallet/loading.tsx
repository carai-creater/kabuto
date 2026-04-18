import { Skeleton } from "@/components/skeleton";

export default function WalletLoading() {
  return (
    <div className="w-full space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-16 rounded-full" />
        <Skeleton className="h-8 w-48 rounded-lg" />
      </div>
      <Skeleton className="h-28 rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
