import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { ServiceOrder } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";

interface ServiceOrderListProps {
  orders: ServiceOrder[];
  isLoading: boolean;
  onViewOrder: (order: ServiceOrder) => void;
}

export function ServiceOrderList({ orders, isLoading, onViewOrder }: ServiceOrderListProps) {
  const isMobile = useMobile();
  
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  // Helper function to determine status
  const getStatus = (order: ServiceOrder) => {
    if (order.completedAt) return { label: "Completada", color: "success" };
    if (order.startedAt) return { label: "En Progreso", color: "warning" };
    return { label: "Pendiente", color: "secondary" };
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }
  
  if (orders.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        No hay órdenes de trabajo disponibles. Crea una nueva orden para empezar.
      </Card>
    );
  }
  
  if (isMobile) {
    return (
      <div className="space-y-4">
        {orders.map((order) => {
          const status = getStatus(order);
          
          return (
            <Card key={order.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{order.orderNumber}</h3>
                  <Badge variant={status.color as any}>{status.label}</Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onViewOrder(order)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-sm space-y-1 mt-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Descripción:</span>
                  <span className="font-medium truncate max-w-[200px]">{order.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                {order.startedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comenzado:</span>
                    <span>{formatDate(order.startedAt)}</span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Fecha de Creación</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const status = getStatus(order);
          
          return (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.orderNumber}</TableCell>
              <TableCell className="max-w-[200px] truncate">{order.description}</TableCell>
              <TableCell>{formatDate(order.createdAt)}</TableCell>
              <TableCell>
                <Badge variant={status.color as any}>{status.label}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onViewOrder(order)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}