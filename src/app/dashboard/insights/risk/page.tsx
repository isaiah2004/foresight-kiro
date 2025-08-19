export default function RiskAssessmentPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Risk Assessment</h2>
        <p className="text-muted-foreground">
          Analyze your financial risk profile and get personalized recommendations
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Coming Soon</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Risk assessment tools will be available here.
          </p>
        </div>
      </div>
    </div>
  );
}