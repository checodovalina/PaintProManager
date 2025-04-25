import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitBranch, ClipboardList, Plus, AlignLeft, RefreshCw } from "lucide-react";
import KanbanBoard from "@/components/KanbanBoard";
import NewProjectModal from "@/components/NewProjectModal";
import ProjectDetailsModal from "@/components/ProjectDetailsModal";
import ProjectListView from "@/components/ProjectListView";
import { KanbanItem, Project } from "@/lib/types";

export default function ProjectsPage() {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewType, setViewType] = useState<"kanban" | "list">("kanban");

  // Fetch projects
  const { data: projectsData, isLoading: isLoadingProjects, refetch } = useQuery({
    queryKey: ['/api/projects'],
  });

  // Map projects to KanbanItem format for KanbanBoard component
  const kanbanItems: KanbanItem[] = projectsData?.projects?.map((project: any) => ({
    id: project.id,
    title: project.title,
    status: project.status,
    description: project.description || '',
    address: project.address || '',
    date: project.visitDate ? new Date(project.visitDate).toLocaleDateString() : '',
    clientId: project.clientId,
    priority: project.priority,
    value: project.value,
    // Add other properties as needed
  })) || [];

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
  };

  return (
    <div className="container mx-auto py-6 md:py-10 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <GitBranch className="h-8 w-8 text-blue-600 mr-3" />
          <h2 className="text-2xl md:text-3xl font-bold">Proyectos</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="sm"
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </Button>
          
          <Button 
            onClick={() => setIsNewProjectModalOpen(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Proyecto
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <CardTitle>Gestión de Proyectos</CardTitle>
              <CardDescription>
                Ver y administrar todos los proyectos de pintura.
              </CardDescription>
            </div>
            <Tabs 
              value={viewType} 
              onValueChange={(value) => setViewType(value as "kanban" | "list")}
              className="mt-4 md:mt-0"
            >
              <TabsList>
                <TabsTrigger value="kanban" className="flex items-center">
                  <AlignLeft className="h-4 w-4 mr-1" />
                  Tablero
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center">
                  <ClipboardList className="h-4 w-4 mr-1" />
                  Lista
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {viewType === "kanban" ? (
            <KanbanBoard 
              items={kanbanItems} 
              isLoading={isLoadingProjects} 
            />
          ) : (
            <ProjectListView 
              projects={projectsData?.projects || []} 
              isLoading={isLoadingProjects} 
              onProjectClick={handleProjectClick}
            />
          )}
        </CardContent>
      </Card>
      
      {/* New Project Modal */}
      <NewProjectModal 
        isOpen={isNewProjectModalOpen} 
        onClose={() => setIsNewProjectModalOpen(false)} 
      />
      
      {/* Project Details Modal */}
      {selectedProject && (
        <ProjectDetailsModal 
          project={selectedProject}
          isOpen={!!selectedProject} 
          onClose={() => setSelectedProject(null)} 
        />
      )}
    </div>
  );
}