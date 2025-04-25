import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project, ProjectStatus } from "@/lib/types";

interface ProjectDetailsModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

// Map for status badge colors
const statusColors: Record<ProjectStatus, string> = {
  pending_visit: "bg-gray-100 text-gray-800",
  quote_sent: "bg-yellow-100 text-yellow-800",
  quote_approved: "bg-blue-100 text-blue-800",
  in_preparation: "bg-teal-100 text-teal-800",
  in_progress: "bg-orange-100 text-orange-800",
  final_review: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-800",
};

// Map for status display names
const statusNames: Record<ProjectStatus, string> = {
  pending_visit: "Pending Visit",
  quote_sent: "Quote Sent",
  quote_approved: "Quote Approved",
  in_preparation: "In Preparation",
  in_progress: "In Progress",
  final_review: "Final Review",
  completed: "Completed",
  archived: "Archived",
};

export default function ProjectDetailsModal({ project, isOpen, onClose }: ProjectDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("details");
  const queryClient = useQueryClient();

  // Fetch full project details including relations
  const { data: projectDetails, isLoading } = useQuery({
    queryKey: [`/api/projects/${project.id}`],
    enabled: isOpen,
  });

  // Get client details
  const { data: clientDetails } = useQuery({
    queryKey: [`/api/clients/${project.clientId}`],
    enabled: isOpen && !!project.clientId,
  });

  // Mutation to update project status
  const updateStatusMutation = useMutation({
    mutationFn: (status: ProjectStatus) => {
      return apiRequest(
        "PATCH",
        `/api/projects/${project.id}/status`,
        { status }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}`] });
    },
  });

  // Handle status change
  const handleStatusChange = (status: ProjectStatus) => {
    updateStatusMutation.mutate(status);
  };

  // Format date to readable string
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center justify-between">
            <span>{project.title}</span>
            <Badge 
              className={statusColors[project.status as ProjectStatus] || "bg-gray-100"}
            >
              {statusNames[project.status as ProjectStatus] || project.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs 
          defaultValue="details" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mt-4"
        >
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1">{project.description || "No description available"}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Client</h3>
                <p className="mt-1 font-medium">{clientDetails?.name || "Loading..."}</p>
                {clientDetails && (
                  <div className="mt-1 text-sm text-gray-500">
                    <p>{clientDetails.email}</p>
                    <p>{clientDetails.phone}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Visit Date</h3>
                <p className="mt-1">{formatDate(project.visitDate)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                <p className="mt-1">{formatDate(project.startDate)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                <p className="mt-1">{formatDate(project.endDate)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                <p className="mt-1 capitalize">{project.priority || "Normal"}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Address</h3>
              <p className="mt-1">{project.address || "No address provided"}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Notes</h3>
              <p className="mt-1">{project.notes || "No notes available"}</p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Update Status</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusNames).map(([key, name]) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={project.status === key ? "default" : "outline"}
                    className="text-xs"
                    onClick={() => handleStatusChange(key as ProjectStatus)}
                    disabled={updateStatusMutation.isPending}
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quotes" className="space-y-4">
            {isLoading ? (
              <p>Loading quotes...</p>
            ) : projectDetails?.quotes?.length > 0 ? (
              <div className="space-y-4">
                {projectDetails.quotes.map((quote: any) => (
                  <div key={quote.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">Quote #{quote.quoteNumber}</h3>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(quote.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={quote.isApproved ? "success" : "outline"}>
                        {quote.isApproved ? "Approved" : "Pending"}
                      </Badge>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Materials:</span> ${quote.materialsCost}
                      </div>
                      <div>
                        <span className="text-gray-500">Labor:</span> ${quote.laborCost}
                      </div>
                      <div>
                        <span className="text-gray-500">Additional:</span> ${quote.additionalCosts}
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span> <span className="font-bold">${quote.totalAmount}</span>
                      </div>
                    </div>
                    
                    {quote.notes && (
                      <p className="mt-2 text-sm">{quote.notes}</p>
                    )}
                    
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No quotes found for this project.</p>
                <Button className="mt-4">Create Quote</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            {isLoading ? (
              <p>Loading team assignments...</p>
            ) : projectDetails?.projectAssignments?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectDetails.projectAssignments.map((assignment: any) => (
                  <div key={assignment.id} className="border rounded-md p-4">
                    <h3 className="font-medium">{assignment.personnel.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {assignment.personnel.type} • {assignment.personnel.specialty}
                    </p>
                    
                    <div className="mt-2 text-sm">
                      <div>
                        <span className="text-gray-500">Start date:</span> {formatDate(assignment.startDate)}
                      </div>
                      <div>
                        <span className="text-gray-500">End date:</span> {formatDate(assignment.endDate)}
                      </div>
                    </div>
                    
                    {assignment.notes && (
                      <p className="mt-2 text-sm border-t pt-2">{assignment.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No team members assigned to this project.</p>
                <Button className="mt-4">Assign Team Members</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            {isLoading ? (
              <p>Loading project images...</p>
            ) : projectDetails?.projectImages?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectDetails.projectImages.map((image: any) => (
                  <div key={image.id} className="border rounded-md overflow-hidden">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      <img 
                        src={image.imageUrl} 
                        alt={image.caption || "Project image"} 
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="capitalize">
                          {image.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(image.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {image.caption && (
                        <p className="mt-2 text-sm">{image.caption}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No images have been uploaded for this project.</p>
                <Button className="mt-4">Upload Images</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="default">Edit Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}