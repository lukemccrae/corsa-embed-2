import { Skeleton } from "primereact/skeleton";

export function LoadingSkeleton() {
  return (
    <div className="p-5 bg-[#121212] rounded-xl max-w-[900px] mx-auto">
      {/* Profile card skeleton */}
      <div className="flex gap-4 mb-5">
        <Skeleton shape="circle" size="72px" className="!bg-[#2a2a2a] flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2.5 pt-1">
          <Skeleton width="60%" height="14px" className="!bg-[#2a2a2a]" />
          <Skeleton width="40%" height="14px" className="!bg-[#2a2a2a]" />
          <Skeleton width="80%" height="14px" className="!bg-[#2a2a2a]" />
        </div>
      </div>
      {/* Map skeleton */}
      <Skeleton width="100%" height="300px" className="!bg-[#2a2a2a] !rounded-lg mb-5" />
      {/* Stats skeleton */}
      <div className="flex gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} width="100%" height="48px" className="!bg-[#2a2a2a] !rounded-lg flex-1" />
        ))}
      </div>
    </div>
  );
}
