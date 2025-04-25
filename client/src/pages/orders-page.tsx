import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clipboard, Plus, RefreshCw } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import { ServiceOrder } from "@shared/schema";
import ServiceOrderList from "@/components/ServiceOrderList";
import NewServiceOrderModal from "@/components/NewServiceOrderModal";
import ServiceOrderDetailsModal from "@/components/ServiceOrderDetailsModal";

export default function OrdersPage() {
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const isMobile = useMobile();
  
  // Fetch service orders
  const { data: serviceOrdersData, isLoading: isLoadingOrders, refetch } = useQuery<ServiceOrder[]>({
    queryKey: ['/api/service-orders'],
  });

  const serviceOrders = serviceOrdersData || [];

  const handleViewOrder = (order: ServiceOrder) => {
    setSelectedOrder(order);
  };

  return (
    <div className="container mx-auto py-6 md:py-10 px-2 md:px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-6">
        <div className="flex items-center">
          <Clipboard className="h-8 w-8 text-blue-600 mr-2" />
          <h2 className="text-xl md:text-3xl font-bold">Órdenes de Trabajo</h2>
        </div>
        
        <div className="flex items-center space-x-2 mt-2 md:mt-0">
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="sm"
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            {isMobile ? "" : "Actualizar"}
          </Button>
          
          <Button 
            onClick={() => setIsNewOrderModalOpen(true)}
            className="flex items-center"
            size={isMobile ? "sm" : "default"}
          >
            <Plus className="h-4 w-4 mr-1" />
            {isMobile ? "Nueva" : "Nueva Orden"}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <CardTitle>Gestión de Órdenes de Trabajo</CardTitle>
              <CardDescription>
                Crea, visualiza y administra todas las órdenes de servicio de los proyectos.
              </CardDescription>
            </div>
            <Clipboard className="h-10 w-10 text-muted-foreground mt-4 md:mt-0 hidden md:block" />
          </div>
        </CardHeader>
        <CardContent>
          <ServiceOrderList 
            orders={serviceOrders}
            isLoading={isLoadingOrders}
            onViewOrder={handleViewOrder}
          />
        </CardContent>
      </Card>
      
      {/* New Service Order Modal */}
      {isNewOrderModalOpen && (
        <NewServiceOrderModal 
          isOpen={isNewOrderModalOpen} 
          onClose={() => setIsNewOrderModalOpen(false)} 
        />
      )}
      
      {/* Service Order Details Modal */}
      {selectedOrder && (
        <ServiceOrderDetailsModal 
          order={selectedOrder}
          isOpen={!!selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
}