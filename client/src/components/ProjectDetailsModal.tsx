import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project, ProjectStatus } from "@/lib/types";
import { useMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";

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
  pending_visit: "Visita Pendiente",
  quote_sent: "Cotización Enviada",
  quote_approved: "Cotización Aprobada",
  in_preparation: "En Preparación",
  in_progress: "En Progreso",
  final_review: "Revisión Final",
  completed: "Completado",
  archived: "Archivado",
};

export default function ProjectDetailsModal({ project, isOpen, onClose }: ProjectDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("details");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useMobile();

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
    mutationFn: async (status: ProjectStatus) => {
      const response = await apiRequest(
        "PATCH",
        `/api/projects/${project.id}/status`,
        { status }
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({
        title: "Estado actualizado",
        description: "El estado del proyecto ha sido actualizado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar estado",
        description: error.message || "Ha ocurrido un error al actualizar el estado del proyecto",
        variant: "destructive",
      });
    }
  });

  // Handle status change
  const handleStatusChange = (status: ProjectStatus) => {
    updateStatusMutation.mutate(status);
  };

  // Format date to readable string
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No establecido";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] p-4' : 'max-w-3xl p-6'}`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <span className="break-words">{project.title}</span>
            <Badge 
              className={`${statusColors[project.status as ProjectStatus] || "bg-gray-100"} inline-block`}
            >
              {statusNames[project.status as ProjectStatus] || project.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {clientDetails?.name ? `Cliente: ${clientDetails.name}` : 'Cargando detalles...'}
          </DialogDescription>
        </DialogHeader>

        <Tabs 
          defaultValue="details" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mt-4"
        >
          <TabsList className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} mb-4`}>
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="quotes">Cotizaciones</TabsTrigger>
            {isMobile ? null : <TabsTrigger value="team">Equipo</TabsTrigger>}
            {isMobile ? null : <TabsTrigger value="images">Imágenes</TabsTrigger>}
            {isMobile ? <TabsTrigger value="team">Equipo</TabsTrigger> : null}
            {isMobile ? <TabsTrigger value="images">Imágenes</TabsTrigger> : null}
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
                    <p className="mt-1">{project.description || "Sin descripción disponible"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
                    <p className="mt-1 font-medium">{clientDetails?.name || "Cargando..."}</p>
                    {clientDetails && (
                      <div className="mt-1 text-sm text-gray-500">
                        {clientDetails.email && <p>Email: {clientDetails.email}</p>}
                        {clientDetails.phone && <p>Teléfono: {clientDetails.phone}</p>}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Fecha de Visita</h3>
                    <p className="mt-1">{formatDate(project.visitDate)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Fecha de Inicio</h3>
                    <p className="mt-1">{formatDate(project.startDate)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Fecha Final</h3>
                    <p className="mt-1">{formatDate(project.endDate)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Prioridad</h3>
                    <p className="mt-1 capitalize">
                      {project.priority === 'normal' ? 'Normal' : 
                      project.priority === 'high' ? 'Alta' : 
                      project.priority === 'urgent' ? 'Urgente' : 'Normal'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Dirección</h3>
                  <p className="mt-1">{project.address || "Sin dirección"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Notas</h3>
                  <p className="mt-1">{project.notes || "Sin notas disponibles"}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Actualizar Estado</h3>
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
              </>
            )}
          </TabsContent>

          <TabsContent value="quotes" className="space-y-4 min-h-[200px]">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : projectDetails && 'quotes' in projectDetails && Array.isArray(projectDetails.quotes) && projectDetails.quotes.length > 0 ? (
              <div className="space-y-4">
                {projectDetails.quotes.map((quote: any) => (
                  <div key={quote.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">Cotización #{quote.quoteNumber}</h3>
                        <p className="text-sm text-gray-500">
                          Creado: {new Date(quote.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={quote.isApproved ? "default" : "outline"}>
                        {quote.isApproved ? "Aprobado" : "Pendiente"}
                      </Badge>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Materiales:</span> ${quote.materialsCost}
                      </div>
                      <div>
                        <span className="text-gray-500">Mano de obra:</span> ${quote.laborCost}
                      </div>
                      <div>
                        <span className="text-gray-500">Adicionales:</span> ${quote.additionalCosts}
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span> <span className="font-bold">${quote.totalAmount}</span>
                      </div>
                    </div>
                    
                    {quote.notes && (
                      <p className="mt-2 text-sm">{quote.notes}</p>
                    )}
                    
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" variant="outline">Ver Detalles</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay cotizaciones para este proyecto.</p>
                <Button className="mt-4">Crear Cotización</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-4 min-h-[200px]">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : projectDetails && 'projectAssignments' in projectDetails && Array.isArray(projectDetails.projectAssignments) && projectDetails.projectAssignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectDetails.projectAssignments.map((assignment: any) => (
                  <div key={assignment.id} className="border rounded-md p-4">
                    <h3 className="font-medium">{assignment.personnel?.name || 'Personal'}</h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {assignment.personnel?.type === 'employee' ? 'Empleado' : 'Subcontratista'} • {assignment.personnel?.specialty || 'Especialista'}
                    </p>
                    
                    <div className="mt-2 text-sm">
                      <div>
                        <span className="text-gray-500">Fecha inicio:</span> {formatDate(assignment.startDate)}
                      </div>
                      <div>
                        <span className="text-gray-500">Fecha fin:</span> {formatDate(assignment.endDate)}
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
                <p className="text-gray-500">No hay personal asignado a este proyecto.</p>
                <Button className="mt-4">Asignar Personal</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="images" className="space-y-4 min-h-[200px]">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : projectDetails && 'projectImages' in projectDetails && Array.isArray(projectDetails.projectImages) && projectDetails.projectImages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectDetails.projectImages.map((image: any) => (
                  <div key={image.id} className="border rounded-md overflow-hidden">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      <img 
                        src={image.imageUrl} 
                        alt={image.caption || "Imagen del proyecto"} 
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="capitalize">
                          {image.type || 'Foto'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {image.uploadedAt ? new Date(image.uploadedAt).toLocaleDateString() : 'Sin fecha'}
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
                <p className="text-gray-500">No hay imágenes para este proyecto.</p>
                <Button className="mt-4">Subir Imágenes</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button variant="default">Editar Proyecto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}