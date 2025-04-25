import { useMutation } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Quote, Project } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Printer, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface QuoteDetailsModalProps {
  quote: Quote;
  isOpen: boolean;
  onClose: () => void;
  onPrint?: () => void;
}

export default function QuoteDetailsModal({ 
  quote, 
  isOpen, 
  onClose,
  onPrint 
}: QuoteDetailsModalProps) {
  const { toast } = useToast();
  
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "-";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const approveQuoteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/quotes/${quote.id}/approve`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      toast({
        title: "Cotización aprobada",
        description: "La cotización ha sido aprobada exitosamente.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al aprobar la cotización",
        description: error.message || "Ha ocurrido un error inesperado. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  });

  const handleApprove = () => {
    approveQuoteMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detalles de Cotización #{quote.quoteNumber}</DialogTitle>
            <Badge 
              variant={quote.isApproved ? "success" : "secondary"}
              className="ml-2"
            >
              {quote.isApproved ? "Aprobada" : "Pendiente"}
            </Badge>
          </div>
          <DialogDescription>
            Creada el {formatDate(quote.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Información del Proyecto</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-[1fr_2fr] gap-1 text-sm">
                  <dt className="font-medium">Nombre:</dt>
                  <dd>{quote.project?.title || "-"}</dd>
                  
                  <dt className="font-medium">Cliente:</dt>
                  <dd>{quote.project?.client?.name || "-"}</dd>
                  
                  <dt className="font-medium">Dirección:</dt>
                  <dd>{quote.project?.address || "-"}</dd>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Detalles de Cotización</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-[1fr_2fr] gap-1 text-sm">
                  <dt className="font-medium">Número:</dt>
                  <dd>{quote.quoteNumber}</dd>
                  
                  <dt className="font-medium">Fecha:</dt>
                  <dd>{formatDate(quote.createdAt)}</dd>
                  
                  {quote.isApproved && (
                    <>
                      <dt className="font-medium">Aprobada:</dt>
                      <dd>{formatDate(quote.approvalDate)}</dd>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Desglose de Costos</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Costo de Materiales</p>
                <p className="text-lg">{formatCurrency(Number(quote.materialsCost))}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Costo de Mano de Obra</p>
                <p className="text-lg">{formatCurrency(Number(quote.laborCost))}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Costos Adicionales</p>
                <p className="text-lg">{formatCurrency(Number(quote.additionalCosts))}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Margen de Ganancia</p>
                <p className="text-lg">{Number(quote.margin)}%</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-1">
              <p className="text-sm font-medium">Monto Total</p>
              <p className="text-2xl font-bold">{formatCurrency(Number(quote.totalAmount))}</p>
            </div>
          </div>

          {quote.notes && (
            <div className="space-y-2">
              <h3 className="font-medium">Notas</h3>
              <div className="p-3 bg-muted rounded-md">
                <p className="whitespace-pre-wrap text-sm">{quote.notes}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2 sm:mr-auto">
            {onPrint && (
              <Button 
                type="button" 
                variant="outline"
                size="sm"
                onClick={onPrint}
                className="flex items-center"
              >
                <Printer className="h-4 w-4 mr-1" />
                Imprimir
              </Button>
            )}
            
            <Button 
              type="button" 
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-1" />
              Descargar PDF
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
            
            {!quote.isApproved && (
              <Button 
                type="button"
                onClick={handleApprove}
                disabled={approveQuoteMutation.isPending}
                variant="success"
                className="flex items-center"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {approveQuoteMutation.isPending ? "Aprobando..." : "Aprobar Cotización"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}