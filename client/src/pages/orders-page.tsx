import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clipboard } from "lucide-react";

export default function OrdersPage() {
  return (
    <div className="container mx-auto py-6 md:py-10 px-4">
      <div className="flex items-center mb-6">
        <Clipboard className="h-8 w-8 text-blue-600 mr-3" />
        <h2 className="text-2xl md:text-3xl font-bold">Service Orders</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Service Orders Management</CardTitle>
          <CardDescription>
            Create and manage service orders for all projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-10 text-gray-500">
            Service orders module is under development. Coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}