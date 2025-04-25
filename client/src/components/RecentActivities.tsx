import { Activity } from "@/lib/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckIcon, FileTextIcon, AlertTriangleIcon, InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentActivitiesProps {
  activities: Activity[];
  isLoading: boolean;
}

export default function RecentActivities({
  activities,
  isLoading,
}: RecentActivitiesProps) {
  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "contract":
        return (
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
            <FileTextIcon className="h-5 w-5 text-primary" />
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-success/10">
            <CheckIcon className="h-5 w-5 text-success" />
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-warning/10">
            <AlertTriangleIcon className="h-5 w-5 text-warning" />
          </span>
        );
      case "info":
        return (
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
            <InfoIcon className="h-5 w-5 text-blue-600" />
          </span>
        );
    }
  };

  return (
    <Card className="bg-white shadow rounded-lg overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">
          Recent Activities
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {isLoading
            ? // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="flex items-start">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-3 w-full mt-2" />
                    </div>
                  </div>
                </div>
              ))
            : // Actual activity items
              activities.map((activity) => (
                <div key={activity.id} className="px-6 py-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <span className="text-xs text-gray-500">
                          {activity.time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </CardContent>

      <CardFooter className="bg-gray-50 px-6 py-3">
        <div className="text-sm">
          <a
            href="#"
            className="font-medium text-primary hover:text-primary/90"
          >
            View all activity
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
