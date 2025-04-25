import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle, Printer, ClipboardEdit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { ServiceOrder } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ServiceOrderDetailsModalProps {
  order: ServiceOrder;
  isOpen: boolean;
  onClose: () => void;
}

export default function ServiceOrderDetailsModal({ order, isOpen, onClose }: ServiceOrderDetailsModalProps) {
  const { toast } = useToast();
  const isMobile = useMobile();
  
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    // Formato simple sin usar el objeto Date directamente
    return dateString.toString().substring(0, 10);
  };
  
  // Helper function to determine status
  const getStatus = () => {
    if (order.completedAt) return { label: "Completada", color: "success" };
    if (order.startedAt) return { label: "En Progreso", color: "warning" };
    return { label: "Pendiente", color: "secondary" };
  };
  
  const status = getStatus();
  
  // Mutation para iniciar una orden de trabajo
  const startOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/service-orders/${order.id}/start`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-orders'] });
      toast({
        title: "Orden iniciada",
        description: "La orden de trabajo ha sido marcada como iniciada.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al iniciar la orden",
        description: error.message || "Ha ocurrido un error inesperado.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation para completar una orden de trabajo
  const completeOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/service-orders/${order.id}/complete`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-orders'] });
      toast({
        title: "Orden completada",
        description: "La orden de trabajo ha sido marcada como completada.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al completar la orden",
        description: error.message || "Ha ocurrido un error inesperado.",
        variant: "destructive",
      });
    }
  });
  
  const handlePrint = () => {
    window.print();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`
        ${isMobile ? 'w-[95vw] max-w-[95vw] p-4' : 'sm:max-w-[600px]'}
        max-h-[90vh] overflow-y-auto
      `}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Orden de Trabajo #{order.orderNumber}</DialogTitle>
            <Badge 
              variant={status.color as any}
              className="ml-2"
            >
              {status.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Información del Proyecto</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[1fr_2fr] gap-1 text-sm">
                <dt className="font-medium">Proyecto ID:</dt>
                <dd>{order.projectId}</dd>
                
                <dt className="font-medium">Creada:</dt>
                <dd>{formatDate(order.createdAt)}</dd>
                
                {order.startedAt && (
                  <>
                    <dt className="font-medium">Iniciada:</dt>
                    <dd>{formatDate(order.startedAt)}</dd>
                  </>
                )}
                
                {order.completedAt && (
                  <>
                    <dt className="font-medium">Completada:</dt>
                    <dd>{formatDate(order.completedAt)}</dd>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-2">Descripción</h3>
            <p className="text-sm">{order.description}</p>
          </div>
          
          {order.instructions && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Instrucciones</h3>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm whitespace-pre-wrap">{order.instructions}</p>
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Firmas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Inicio de Trabajo</p>
                {order.startSignature ? (
                  <div className="border p-2 rounded-md">
                    <img 
                      src={order.startSignature} 
                      alt="Firma de inicio" 
                      className="max-h-24"
                    />
                  </div>
                ) : (
                  <div className="border border-dashed p-4 rounded-md flex items-center justify-center text-muted-foreground text-sm">
                    No hay firma
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">Fin de Trabajo</p>
                {order.endSignature ? (
                  <div className="border p-2 rounded-md">
                    <img 
                      src={order.endSignature} 
                      alt="Firma de finalización" 
                      className="max-h-24"
                    />
                  </div>
                ) : (
                  <div className="border border-dashed p-4 rounded-md flex items-center justify-center text-muted-foreground text-sm">
                    No hay firma
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2 sm:mr-auto">
            <Button 
              type="button" 
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center"
            >
              <Printer className="h-4 w-4 mr-1" />
              {isMobile ? "" : "Imprimir"}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cerrar
            </Button>
            
            {!order.startedAt && !order.completedAt && (
              <Button 
                type="button"
                onClick={() => startOrderMutation.mutate()}
                disabled={startOrderMutation.isPending}
                variant="default"
                className="flex items-center"
              >
                <Play className="h-4 w-4 mr-1" />
                {startOrderMutation.isPending 
                  ? (isMobile ? "..." : "Iniciando...") 
                  : (isMobile ? "Iniciar" : "Iniciar Trabajo")}
              </Button>
            )}
            
            {order.startedAt && !order.completedAt && (
              <Button 
                type="button"
                onClick={() => completeOrderMutation.mutate()}
                disabled={completeOrderMutation.isPending}
                variant="success"
                className="flex items-center"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {completeOrderMutation.isPending 
                  ? (isMobile ? "..." : "Completando...") 
                  : (isMobile ? "Completar" : "Completar Trabajo")}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}