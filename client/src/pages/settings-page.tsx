import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6 md:py-10 px-4">
      <div className="flex items-center mb-6">
        <Settings className="h-8 w-8 text-purple-600 mr-3" />
        <h2 className="text-2xl md:text-3xl font-bold">System Settings</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription>
            Configure system settings and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-10 text-gray-500">
            System settings module is under development. Coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}