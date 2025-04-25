import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="container mx-auto py-6 md:py-10 px-4">
      <div className="flex items-center mb-6">
        <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
        <h2 className="text-2xl md:text-3xl font-bold">Reports</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Business Reports</CardTitle>
          <CardDescription>
            View and generate business reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-10 text-gray-500">
            Reports module is under development. Coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}