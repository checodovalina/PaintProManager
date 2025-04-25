import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { KanbanItem, ProjectStatus } from "@/lib/types";
import { Filter, SortDesc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  items: KanbanItem[];
  isLoading: boolean;
}

// Define the column structure
const columns: { id: ProjectStatus; title: string }[] = [
  { id: "pending_visit", title: "Pending Visit" },
  { id: "quote_sent", title: "Quote Sent" },
  { id: "quote_approved", title: "Quote Approved" },
  { id: "in_preparation", title: "In Preparation" },
  { id: "in_progress", title: "In Progress" },
  { id: "final_review", title: "Final Review" },
  { id: "completed", title: "Completed" },
];

// Column border color map
const columnBorderColors: Record<ProjectStatus, string> = {
  pending_visit: "border-gray-400",
  quote_sent: "border-yellow-500",
  quote_approved: "border-blue-600",
  in_preparation: "border-teal-600",
  in_progress: "border-orange-500",
  final_review: "border-purple-500",
  completed: "border-green-600",
  archived: "border-gray-500",
};

// Column badge color map
const columnBadgeColors: Record<ProjectStatus, string> = {
  pending_visit: "bg-gray-100 text-gray-800",
  quote_sent: "bg-yellow-100 text-yellow-800",
  quote_approved: "bg-blue-100 text-blue-800",
  in_preparation: "bg-teal-100 text-teal-800",
  in_progress: "bg-orange-100 text-orange-800",
  final_review: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-800",
};

// Badge text map
const statusBadgeText: Record<ProjectStatus, string> = {
  pending_visit: "New",
  quote_sent: "Pending",
  quote_approved: "Approved",
  in_preparation: "Prep",
  in_progress: "Active",
  final_review: "Review",
  completed: "Completed",
  archived: "Archived",
};

export default function KanbanBoard({ items, isLoading }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<KanbanItem | null>(null);

  // Mutation for updating project status
  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: number; status: ProjectStatus }) => {
      return apiRequest(
        "PATCH",
        `/api/projects/${data.id}/status`,
        { status: data.status }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  // Function to handle drag start
  const handleDragStart = (e: React.DragEvent, item: KanbanItem) => {
    setIsDragging(true);
    setDraggedItem(item);
    e.dataTransfer.setData("text/plain", JSON.stringify(item));
    // Change opacity of dragged item
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  // Function to handle drag end
  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    setDraggedItem(null);
    // Reset opacity
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

  // Function to handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
    }
  };

  // Function to handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.backgroundColor = "rgba(243, 244, 246, 1)";
    }
  };

  // Function to handle drop
  const handleDrop = (e: React.DragEvent, columnId: ProjectStatus) => {
    e.preventDefault();
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.backgroundColor = "rgba(243, 244, 246, 1)";
    }

    if (draggedItem && draggedItem.status !== columnId) {
      updateStatusMutation.mutate({
        id: draggedItem.id,
        status: columnId,
      });
    }
  };

  // Group items by status
  const groupedItems = columns.reduce<Record<ProjectStatus, KanbanItem[]>>(
    (acc, column) => {
      acc[column.id] = items.filter((item) => item.status === column.id);
      return acc;
    },
    {
      pending_visit: [],
      quote_sent: [],
      quote_approved: [],
      in_preparation: [],
      in_progress: [],
      final_review: [],
      completed: [],
      archived: [],
    }
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Project Pipeline</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-1 h-4 w-4" /> Filter
          </Button>
          <Button variant="outline" size="sm">
            <SortDesc className="mr-1 h-4 w-4" /> Sort
          </Button>
        </div>
      </div>

      <ScrollArea className="w-full overflow-x-auto pb-4">
        <div className="inline-flex gap-4 min-w-full pb-4">
          {columns.map((column) => (
            <div key={column.id} className="w-72 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">
                  {column.title}
                </h3>
                <Badge
                  variant="outline"
                  className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-1"
                >
                  {groupedItems[column.id].length}
                </Badge>
              </div>
              <div
                className="bg-gray-100 p-2 rounded-md kanban-column"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {isLoading ? (
                  // Skeleton loaders while loading
                  Array.from({ length: 2 }).map((_, index) => (
                    <Card
                      key={index}
                      className="bg-white p-3 rounded-md shadow mb-3"
                    >
                      <div className="flex justify-between items-start">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-3 w-full mt-2" />
                      <div className="flex items-center mt-2">
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                    </Card>
                  ))
                ) : (
                  // Actual kanban cards
                  groupedItems[column.id].map((item) => (
                    <Card
                      key={item.id}
                      className={cn(
                        "kanban-card bg-white p-3 rounded-md shadow mb-3 border-l-4",
                        columnBorderColors[item.status]
                      )}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-medium text-gray-900">
                          {item.title}
                        </h4>
                        <Badge
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded",
                            columnBadgeColors[item.status]
                          )}
                        >
                          {statusBadgeText[item.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.description}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{item.address}</span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center text-xs">
                          {item.assignedTo ? (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>{item.assignedTo}</span>
                            </>
                          ) : (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>{item.date}</span>
                            </>
                          )}
                        </div>
                        {item.value ? (
                          <div className="text-xs text-primary font-medium">
                            ${item.value.toLocaleString()}
                          </div>
                        ) : item.timeStatus ? (
                          <div
                            className={cn(
                              "text-xs font-medium",
                              item.timeStatus === "on_schedule"
                                ? "text-green-600"
                                : "text-red-600"
                            )}
                          >
                            {item.timeStatus === "on_schedule" ? (
                              "On Schedule"
                            ) : (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3 mr-1 inline"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                {item.delayDays} days behind
                              </>
                            )}
                          </div>
                        ) : (
                          <button className="text-xs text-primary hover:text-primary/90">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
