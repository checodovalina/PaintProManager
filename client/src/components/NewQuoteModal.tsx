import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { QuoteInsert, Quote, Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface NewQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProjectId?: number;
}

interface FormData {
  projectId: number;
  quoteNumber: string;
  materialsCost: number | string;
  laborCost: number | string;
  additionalCosts: number | string;
  margin: number | string;
  totalAmount: number | string;
  notes: string;
}

export default function NewQuoteModal({ 
  isOpen, 
  onClose,
  selectedProjectId 
}: NewQuoteModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    projectId: selectedProjectId || 0,
    quoteNumber: "",
    materialsCost: 0,
    laborCost: 0,
    additionalCosts: 0,
    margin: 25, // Default margin percentage
    totalAmount: 0,
    notes: ""
  });

  // Generate a unique quote number
  useEffect(() => {
    if (isOpen) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const uniqueId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      
      setFormData(prev => ({
        ...prev,
        quoteNumber: `Q${year}${month}-${uniqueId}`
      }));
    }
  }, [isOpen]);

  // Fetch projects
  const { data: projectsData } = useQuery<{ projects: Project[] }>({
    queryKey: ['/api/projects'],
    enabled: isOpen
  });

  const projects = projectsData?.projects || [];

  // Calculate total amount when costs or margin change
  useEffect(() => {
    // Aseguramos que trabajamos con valores numéricos
    const materialsCost = typeof formData.materialsCost === 'number' ? formData.materialsCost : parseFloat(formData.materialsCost as string) || 0;
    const laborCost = typeof formData.laborCost === 'number' ? formData.laborCost : parseFloat(formData.laborCost as string) || 0;
    const additionalCosts = typeof formData.additionalCosts === 'number' ? formData.additionalCosts : parseFloat(formData.additionalCosts as string) || 0;
    const margin = typeof formData.margin === 'number' ? formData.margin : parseFloat(formData.margin as string) || 0;
    
    const subtotal = materialsCost + laborCost + additionalCosts;
    const marginAmount = subtotal * (margin / 100);
    const total = subtotal + marginAmount;
    
    setFormData(prev => ({
      ...prev,
      totalAmount: parseFloat(total.toFixed(2))
    }));
  }, [
    formData.materialsCost, 
    formData.laborCost, 
    formData.additionalCosts, 
    formData.margin
  ]);

  // Set initial project ID from prop
  useEffect(() => {
    if (selectedProjectId) {
      setFormData(prev => ({
        ...prev,
        projectId: selectedProjectId
      }));
    }
  }, [selectedProjectId]);

  const createQuoteMutation = useMutation<Quote, Error, any>({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/quotes", data);
      return await res.json();
    },
    onSuccess: (quote: Quote) => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      toast({
        title: "Cotización creada",
        description: `La cotización ${quote.quoteNumber} ha sido creada exitosamente.`,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear la cotización",
        description: error.message || "Ha ocurrido un error inesperado. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // For numeric fields, parse the value to a number
    if (['materialsCost', 'laborCost', 'additionalCosts', 'margin'].includes(name)) {
      const numValue = parseFloat(value) || 0;
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, projectId: parseInt(value) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId) {
      toast({
        title: "Proyecto requerido",
        description: "Debes seleccionar un proyecto para la cotización.",
        variant: "destructive",
      });
      return;
    }

    // Convertir valores numéricos a strings para la API
    const dataToSubmit = {
      ...formData,
      materialsCost: formData.materialsCost.toString(),
      laborCost: formData.laborCost.toString(),
      additionalCosts: formData.additionalCosts.toString(),
      margin: formData.margin.toString(),
      totalAmount: formData.totalAmount.toString()
    };

    createQuoteMutation.mutate(dataToSubmit);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Cotización</DialogTitle>
          <DialogDescription>
            Completa los detalles para crear una nueva cotización para el cliente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectId">Proyecto</Label>
                <Select
                  value={formData.projectId.toString()} 
                  onValueChange={handleSelectChange}
                  disabled={!!selectedProjectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project: Project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quoteNumber">Número de Cotización</Label>
                <Input
                  id="quoteNumber"
                  name="quoteNumber"
                  value={formData.quoteNumber}
                  onChange={handleInputChange}
                  readOnly
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="materialsCost">Costo de Materiales ($)</Label>
                <Input
                  id="materialsCost"
                  name="materialsCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.materialsCost}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="laborCost">Costo de Mano de Obra ($)</Label>
                <Input
                  id="laborCost"
                  name="laborCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.laborCost}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="additionalCosts">Costos Adicionales ($)</Label>
                <Input
                  id="additionalCosts"
                  name="additionalCosts"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.additionalCosts}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="margin">Margen de Ganancia (%)</Label>
                <Input
                  id="margin"
                  name="margin"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.margin}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">Monto Total ($)</Label>
              <Input
                id="totalAmount"
                name="totalAmount"
                type="number"
                step="0.01"
                value={formData.totalAmount}
                readOnly
                className="font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Añade detalles adicionales o comentarios sobre la cotización"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={createQuoteMutation.isPending}
            >
              {createQuoteMutation.isPending ? "Creando..." : "Crear Cotización"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}