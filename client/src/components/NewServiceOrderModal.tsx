import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ProjectWithClient } from "@/lib/extended-types";
import { Loader2 } from "lucide-react";

// Schema para validación del formulario
const formSchema = z.object({
  projectId: z.number({
    required_error: "Selecciona un proyecto",
    invalid_type_error: "Selecciona un proyecto válido",
  }),
  orderNumber: z.string().min(1, "El número de orden es requerido"),
  description: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
  instructions: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewServiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewServiceOrderModal({ isOpen, onClose }: NewServiceOrderModalProps) {
  const { toast } = useToast();
  const [isGeneratingOrderNumber, setIsGeneratingOrderNumber] = useState(false);
  
  // Cargar proyectos que estén aprobados o en progreso
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery<{projects: ProjectWithClient[]}>({
    queryKey: ['/api/projects'],
    select: (data) => {
      console.log("Datos originales de proyectos:", data);
      if (!data || !data.projects) return { projects: [] };
      // Filtrar proyectos con cotizaciones enviadas, aprobadas, pendientes de visita o en progreso
      const filteredProjects = data.projects.filter((project: ProjectWithClient) => 
        ['pending_visit', 'quote_sent', 'quote_approved', 'in_preparation', 'in_progress'].includes(project.status)
      );
      console.log("Proyectos filtrados:", filteredProjects);
      return { projects: filteredProjects };
    }
  });
  
  const projects: ProjectWithClient[] = projectsData?.projects || [];
  console.log("Proyectos disponibles para la vista:", projects);
  
  // Configurar el formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: undefined,
      orderNumber: "",
      description: "",
      instructions: "",
    },
  });
  
  // Mutation para crear la orden de servicio
  const createOrderMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/service-orders", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Orden de trabajo creada",
        description: "La orden de trabajo ha sido creada exitosamente."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/service-orders'] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear la orden",
        description: error.message || "Ocurrió un error al crear la orden de trabajo.",
        variant: "destructive",
      });
    }
  });
  
  // Generar un número de orden automáticamente
  const generateOrderNumber = () => {
    setIsGeneratingOrderNumber(true);
    const date = new Date();
    const year = date.getFullYear().toString().slice(2); // Últimos 2 dígitos del año
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    const orderNumber = `WO${year}${month}${day}-${random}`;
    form.setValue('orderNumber', orderNumber);
    setIsGeneratingOrderNumber(false);
  };
  
  // Al seleccionar un proyecto, pre-llenar datos
  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === parseInt(projectId));
    if (project) {
      // Si el proyecto tiene una dirección, podemos pre-llenar la descripción
      const description = project.address 
        ? `Trabajo de pintura en ${project.address}`
        : "Trabajo de pintura";
      
      form.setValue('description', description);
    }
  };
  
  // Manejar el envío del formulario
  const onSubmit = (values: FormValues) => {
    createOrderMutation.mutate(values);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Orden de Trabajo</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proyecto</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(parseInt(value));
                      handleProjectChange(value);
                    }}
                    value={field.value?.toString()}
                    disabled={isLoadingProjects}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un proyecto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem 
                          key={project.id} 
                          value={project.id.toString()}
                        >
                          {project.title} - {project.client?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="orderNumber"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Número de Orden</FormLabel>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={generateOrderNumber}
                      disabled={isGeneratingOrderNumber}
                    >
                      {isGeneratingOrderNumber ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : "Generar"}
                    </Button>
                  </div>
                  <FormControl>
                    <Input {...field} placeholder="Ej: WO250425-001" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Descripción del trabajo a realizar" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instrucciones</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Instrucciones específicas para el equipo"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : "Crear Orden"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}