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
import { Quote } from "@shared/schema";
import { QuoteWithRelations } from "@/lib/extended-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Printer, Download, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { apiRequest, queryClient } from "@/lib/queryClient";
import jsPDF from "jspdf";
import 'jspdf-autotable';

interface QuoteDetailsModalProps {
  quote: QuoteWithRelations;
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
  const isMobile = useMobile();
  
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
  
  const handleDownloadPDF = () => {
    console.log("Print quote:", quote);
    
    // Definir funciones auxiliares dentro del bloque try
    try {
      // Función para sanitizar texto y evitar errores
      const sanitizeText = (text: string | null | undefined): string => {
        if (text === null || text === undefined) return "-";
        return String(text).replace(/[\n\r]+/g, " ").trim();
      };
      
      // Validaciones para evitar crash en jsPDF con valores nulos
      if (!quote || !quote.quoteNumber) {
        throw new Error("Datos de cotización incompletos");
      }
      
      // Inicializar el documento PDF con opciones explícitas
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Añadir título
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Dovalina Painting", 105, 20, { align: "center" });
      
      // Añadir subtítulo
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(`Cotización #${sanitizeText(quote.quoteNumber)}`, 105, 30, { align: "center" });
      
      // Añadir fecha
      doc.setFontSize(10);
      doc.text(`Fecha: ${formatDate(quote.createdAt)}`, 20, 40);
      
      // Status
      doc.setFontSize(10);
      doc.text(`Estado: ${quote.isApproved ? "Aprobada" : "Pendiente"}`, 20, 45);
      if (quote.isApproved && quote.approvalDate) {
        doc.text(`Fecha de aprobación: ${formatDate(quote.approvalDate)}`, 20, 50);
      }
      
      // Información del cliente y proyecto
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Información del Cliente y Proyecto", 20, 60);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      // Datos del cliente - con comprobaciones para evitar errores
      const clientName = quote.project?.client?.name ? sanitizeText(quote.project.client.name) : "-";
      const clientAddress = quote.project?.client?.address ? sanitizeText(quote.project.client.address) : "-";
      const clientCity = quote.project?.client?.city ? sanitizeText(quote.project.client.city) : "";
      const clientState = quote.project?.client?.state ? sanitizeText(quote.project.client.state) : "";
      const clientCityState = clientCity || clientState ? `${clientCity}${clientCity && clientState ? ', ' : ''}${clientState}` : "-";
      const clientPhone = quote.project?.client?.phone ? sanitizeText(quote.project.client.phone) : "-";
      const clientEmail = quote.project?.client?.email ? sanitizeText(quote.project.client.email) : "-";
      
      doc.text(`Cliente: ${clientName}`, 20, 70);
      doc.text(`Dirección: ${clientAddress}`, 20, 75);
      doc.text(`Ciudad/Estado: ${clientCityState}`, 20, 80);
      doc.text(`Teléfono: ${clientPhone}`, 20, 85);
      doc.text(`Email: ${clientEmail}`, 20, 90);
      
      // Datos del proyecto - con comprobaciones
      const projectTitle = quote.project?.title ? sanitizeText(quote.project.title) : "-";
      const projectAddress = quote.project?.address ? sanitizeText(quote.project.address) : "-";
      
      doc.text(`Proyecto: ${projectTitle}`, 115, 70);
      doc.text(`Dirección: ${projectAddress}`, 115, 75);
      
      // Desglose de costos
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Desglose de Costos", 20, 105);
      
      // Preparar datos para la tabla - asegurar que son números válidos
      const materialsCost = Number(quote.materialsCost) || 0;
      const laborCost = Number(quote.laborCost) || 0;
      const additionalCosts = Number(quote.additionalCosts) || 0;
      const margin = Number(quote.margin) || 0;
      const marginAmount = (materialsCost + laborCost + additionalCosts) * (margin / 100);
      
      // Tabla de costos
      const costData = [
        ["Concepto", "Monto"],
        ["Materiales", formatCurrency(materialsCost)],
        ["Mano de Obra", formatCurrency(laborCost)],
        ["Costos Adicionales", formatCurrency(additionalCosts)],
        [`Margen (${margin}%)`, formatCurrency(marginAmount)],
      ];
      
      // Generar tabla
      (doc as any).autoTable({
        startY: 110,
        head: [costData[0]],
        body: costData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        margin: { top: 110 },
      });
      
      // Total
      const finalY = (doc as any).lastAutoTable?.finalY || 150;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Monto Total: ${formatCurrency(Number(quote.totalAmount) || 0)}`, 150, finalY + 10, { align: "right" });
      
      // Notas
      if (quote.notes) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Notas:", 20, finalY + 25);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        // Sanitizar y limitar longitud de notas para evitar problemas
        const notesText = sanitizeText(quote.notes).substring(0, 500); // Limitar a 500 caracteres
        const splitNotes = doc.splitTextToSize(notesText, 170);
        doc.text(splitNotes, 20, finalY + 35);
      }
      
      // Pie de página
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          "Esta cotización tiene una validez de 30 días a partir de la fecha de emisión.",
          105,
          doc.internal.pageSize.height - 30,
          { align: "center" }
        );
        doc.text(
          "Dovalina Painting LLC - Todos los derechos reservados © 2025",
          105,
          doc.internal.pageSize.height - 20,
          { align: "center" }
        );
        doc.text(
          `Página ${i} de ${pageCount}`,
          105,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }
      
      // Descargar el PDF
      const filename = `Cotizacion_${sanitizeText(quote.quoteNumber).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      doc.save(filename);
      
      toast({
        title: "PDF generado",
        description: "La cotización ha sido descargada en formato PDF.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      
      // Si es un dispositivo móvil, ofrecer una alternativa
      if (isMobile) {
        toast({
          title: "Error en dispositivo móvil",
          description: "La generación de PDF en dispositivos móviles puede ser limitada. Intenta usar un navegador de escritorio para esta función.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error al generar PDF",
          description: "Ha ocurrido un error al generar el PDF. Inténtalo de nuevo más tarde.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`
        ${isMobile ? 'w-[95vw] max-w-[95vw] p-4' : 'sm:max-w-[700px]'}
        max-h-[90vh] overflow-y-auto
      `}>
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
            
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
              <div className={`space-y-1 ${isMobile ? 'pb-2' : ''}`}>
                <p className="text-sm font-medium">Costo de Materiales</p>
                <p className="text-lg">{formatCurrency(Number(quote.materialsCost))}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Costo de Mano de Obra</p>
                <p className="text-lg">{formatCurrency(Number(quote.laborCost))}</p>
              </div>
            </div>
            
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
              <div className={`space-y-1 ${isMobile ? 'pb-2' : ''}`}>
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
                {isMobile ? "" : "Imprimir"}
              </Button>
            )}
            
            <Button 
              type="button" 
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-1" />
              {isMobile ? "PDF" : "Descargar PDF"}
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
                {approveQuoteMutation.isPending 
                  ? (isMobile ? "..." : "Aprobando...") 
                  : (isMobile ? "Aprobar" : "Aprobar Cotización")}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}