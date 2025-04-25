import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="container mx-auto py-6 md:py-10 px-4">
      <div className="flex items-center mb-6">
        <GitBranch className="h-8 w-8 text-blue-600 mr-3" />
        <h2 className="text-2xl md:text-3xl font-bold">Projects</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Projects Management</CardTitle>
          <CardDescription>
            View and manage all painting projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-10 text-gray-500">
            Projects management module is under development. Coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}