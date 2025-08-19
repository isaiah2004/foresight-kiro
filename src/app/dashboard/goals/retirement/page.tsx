export default function RetirementGoalsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Retirement Planning</h2>
        <p className="text-muted-foreground">
          Plan for your retirement with goal setting and progress tracking
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Coming Soon</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Retirement planning tools will be available here.
          </p>
        </div>
      </div>
    </div>
  );
}