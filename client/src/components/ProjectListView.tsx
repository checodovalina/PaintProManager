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
            placeholder="Buscar proyectos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {(searchTerm || priorityFilter || statusFilter) && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Filter className="mr-1 h-4 w-4" />
            Filtros
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell">Proyecto</TableHead>
              <TableHead className="md:hidden">Proyecto/Estado</TableHead>
              <TableHead className="hidden md:table-cell">Estado</TableHead>
              <TableHead className="hidden md:table-cell">Prioridad</TableHead>
              <TableHead className="hidden md:table-cell">Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Fecha Visita</TableHead>
              <TableHead className="hidden md:table-cell">Dirección</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cargando proyectos...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No se encontraron proyectos
                  {searchTerm && ` que coincidan con "${searchTerm}"`}
                  {(priorityFilter || statusFilter) && " con los filtros seleccionados"}
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{project.title}</span>
                      {project.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-xs hidden md:block">
                          {project.description}
                        </p>
                      )}
                      
                      {/* Mobile-only content */}
                      <div className="md:hidden mt-1 flex flex-col space-y-1">
                        <Badge 
                          className={cn(
                            "px-2 py-1 inline-flex w-fit", 
                            statusColors[project.status as ProjectStatus] || "bg-gray-100"
                          )}
                        >
                          {statusNames[project.status as ProjectStatus] || project.status}
                        </Badge>

                        <div className="flex items-center text-xs text-muted-foreground">
                          <span className="font-medium mr-1">Cliente:</span> 
                          {project.client?.name || "-"}
                        </div>
                      
                        <div className="flex items-center text-xs text-muted-foreground">
                          <span className="font-medium mr-1">Visita:</span> 
                          {formatDate(project.visitDate)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Desktop-only columns */}
                  <TableCell className="hidden md:table-cell">
                    <Badge 
                      className={cn(
                        "px-2 py-1", 
                        statusColors[project.status as ProjectStatus] || "bg-gray-100"
                      )}
                    >
                      {statusNames[project.status as ProjectStatus] || project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "capitalize",
                        project.priority === "high" ? "text-orange-600 border-orange-300" :
                        project.priority === "urgent" ? "text-red-600 border-red-300" :
                        "text-blue-600 border-blue-300"
                      )}
                    >
                      {project.priority === "high" ? "Alta" : 
                       project.priority === "urgent" ? "Urgente" : 
                       project.priority === "normal" ? "Normal" : "Normal"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{project.client?.name || "-"}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(project.visitDate)}</TableCell>
                  <TableCell className="hidden md:table-cell truncate max-w-xs">
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
                      <span className="sr-only">Ver detalles</span>
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