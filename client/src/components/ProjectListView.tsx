import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Search, Filter } from "lucide-react";
import { Project, ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProjectListViewProps {
  projects: Project[];
  isLoading: boolean;
  onProjectClick: (project: Project) => void;
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
  pending_visit: "Visita Pendiente",
  quote_sent: "Cotización Enviada",
  quote_approved: "Cotización Aprobada",
  in_preparation: "En Preparación",
  in_progress: "En Progreso",
  final_review: "Revisión Final",
  completed: "Completado",
  archived: "Archivado",
};

export default function ProjectListView({ projects, isLoading, onProjectClick }: ProjectListViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | null>(null);

  // Filter projects based on search term and filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      !searchTerm || 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (project.address && project.address.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPriority = !priorityFilter || project.priority === priorityFilter;
    const matchesStatus = !statusFilter || project.status === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Function to format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setPriorityFilter(null);
    setStatusFilter(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {(searchTerm || priorityFilter || statusFilter) && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear filters
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Filter className="mr-1 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Visit Date</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading projects...
                </TableCell>
              </TableRow>
            ) : filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No projects found
                  {searchTerm && ` matching "${searchTerm}"`}
                  {(priorityFilter || statusFilter) && " with the selected filters"}
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    {project.title}
                    {project.description && (
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {project.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        "px-2 py-1", 
                        statusColors[project.status as ProjectStatus] || "bg-gray-100"
                      )}
                    >
                      {statusNames[project.status as ProjectStatus] || project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "capitalize",
                        project.priority === "high" ? "text-orange-600 border-orange-300" :
                        project.priority === "urgent" ? "text-red-600 border-red-300" :
                        "text-blue-600 border-blue-300"
                      )}
                    >
                      {project.priority || "Normal"}
                    </Badge>
                  </TableCell>
                  <TableCell>{project.client?.name || "-"}</TableCell>
                  <TableCell>{formatDate(project.visitDate)}</TableCell>
                  <TableCell className="truncate max-w-xs">
                    {project.address || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => onProjectClick(project)}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View details</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}