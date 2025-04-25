import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, CalculatorIcon, RefreshCw } from "lucide-react";
import QuoteList from "@/components/QuoteList";
import NewQuoteModal from "@/components/NewQuoteModal";
import QuoteDetailsModal from "@/components/QuoteDetailsModal";
import { Quote } from "@shared/schema";
import { QuoteWithRelations } from "@/lib/extended-types";

export default function QuotesPage() {
  const [isNewQuoteModalOpen, setIsNewQuoteModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteWithRelations | null>(null);
  
  // Fetch quotes
  const { data: quotesData, isLoading: isLoadingQuotes, refetch } = useQuery<QuoteWithRelations[]>({
    queryKey: ['/api/quotes'],
  });

  const quotes = quotesData || [];

  const handleViewQuote = (quote: QuoteWithRelations) => {
    setSelectedQuote(quote);
  };

  const handlePrintQuote = (quote: QuoteWithRelations) => {
    // Implementar funcionalidad de impresión aquí
    console.log("Print quote:", quote);
    window.print();
  };

  return (
    <div className="container mx-auto py-6 md:py-10 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <FileText className="h-8 w-8 text-blue-600 mr-3" />
          <h2 className="text-2xl md:text-3xl font-bold">Cotizaciones</h2>
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
            onClick={() => setIsNewQuoteModalOpen(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nueva Cotización
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <CardTitle>Gestión de Cotizaciones</CardTitle>
              <CardDescription>
                Crea, visualiza y administra todas las cotizaciones de proyectos.
              </CardDescription>
            </div>
            <CalculatorIcon className="h-10 w-10 text-muted-foreground mt-4 md:mt-0 hidden md:block" />
          </div>
        </CardHeader>
        <CardContent>
          <QuoteList 
            quotes={quotes}
            isLoading={isLoadingQuotes}
            onViewQuote={handleViewQuote}
            onPrintQuote={handlePrintQuote}
          />
        </CardContent>
      </Card>
      
      {/* New Quote Modal */}
      <NewQuoteModal 
        isOpen={isNewQuoteModalOpen} 
        onClose={() => setIsNewQuoteModalOpen(false)} 
      />
      
      {/* Quote Details Modal */}
      {selectedQuote && (
        <QuoteDetailsModal 
          quote={selectedQuote}
          isOpen={!!selectedQuote} 
          onClose={() => setSelectedQuote(null)} 
          onPrint={() => handlePrintQuote(selectedQuote)}
        />
      )}
    </div>
  );
}