import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ProjectPriority } from "@/lib/types";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  title: string;
  clientId: number;
  description: string;
  priority: ProjectPriority;
  address: string;
  notes?: string;
}

export default function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const [visitDate, setVisitDate] = useState<Date | undefined>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
    staleTime: 60000,
  });

  const { register, handleSubmit, formState: { errors, isValid }, reset, setValue } = useForm<FormData>({
    defaultValues: {
      title: "",
      clientId: 0,
      description: "",
      priority: "normal",
      address: "",
      notes: "",
    }
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Format the data for the API
      const apiData = {
        ...data,
        // Convert clientId to number if it's a string
        clientId: typeof data.clientId === 'string' ? parseInt(data.clientId) : data.clientId,
        // Format date to string "YYYY-MM-DD"
        visitDate: visitDate ? visitDate.toISOString().split('T')[0] : null,
        // Default status to pending_visit
        status: "pending_visit" as const,
      };
      
      const response = await apiRequest("POST", "/api/projects", apiData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({
        title: "Proyecto creado",
        description: "El proyecto ha sido creado exitosamente",
        variant: "default",
      });
      onClose();
      reset();
      setVisitDate(undefined);
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear proyecto",
        description: error.message || "Hubo un error al crear el proyecto. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: FormData) => {
    if (!visitDate) {
      toast({
        title: "Fecha de visita requerida",
        description: "Por favor selecciona una fecha de visita para el proyecto",
        variant: "destructive",
      });
      return;
    }
    createProjectMutation.mutate(data);
  };

  const handleSelectChange = (value: string, field: keyof FormData) => {
    setValue(field, value as any);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        reset();
        setVisitDate(undefined);
      }
    }}>
      <DialogContent className="sm:max-w-[500px] md:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-gray-900">Crear Nuevo Proyecto</DialogTitle>
          <DialogDescription>
            Completa los detalles para crear un nuevo proyecto
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del Proyecto</Label>
              <Input 
                id="title" 
                placeholder="Título o nombre del proyecto" 
                {...register("title", { required: "El título es requerido", minLength: { value: 5, message: "El título debe tener al menos 5 caracteres"} })}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientId">Cliente</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("clientId", { required: "El cliente es requerido", valueAsNumber: true })}
              >
                <option value="">Seleccionar cliente</option>
                {clients.map((client: any) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {errors.clientId && <p className="text-sm text-red-500">{errors.clientId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea 
                id="description" 
                placeholder="Breve descripción del proyecto"
                className="min-h-[80px]"
                {...register("description", { required: "La descripción es requerida", minLength: { value: 10, message: "La descripción debe tener al menos 10 caracteres" } })}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visitDate">Fecha de Visita</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !visitDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {visitDate ? format(visitDate, "PPP") : <span>Seleccionar fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={visitDate}
                      onSelect={setVisitDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("priority", { required: "La prioridad es requerida" })}
                >
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
                {errors.priority && <p className="text-sm text-red-500">{errors.priority.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input 
                id="address" 
                placeholder="Dirección completa" 
                {...register("address", { required: "La dirección es requerida" })}
              />
              {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Textarea 
                id="notes" 
                placeholder="Detalles adicionales o instrucciones especiales"
                className="min-h-[60px]"
                {...register("notes")}
              />
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button 
              type="submit" 
              disabled={createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? "Creando..." : "Crear Proyecto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
