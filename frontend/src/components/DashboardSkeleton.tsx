export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-card h-28 p-5">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton mt-3 h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-card h-80 p-5 lg:col-span-2">
          <div className="skeleton h-full w-full" />
        </div>
        <div className="glass-card h-80 p-5">
          <div className="skeleton h-full w-full" />
        </div>
      </div>
    </div>
  );
}
