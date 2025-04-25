import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  Printer, 
  CheckCircle,
  Clock,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Quote } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface QuoteListProps {
  quotes: Quote[];
  isLoading: boolean;
  onViewQuote: (quote: Quote) => void;
  onPrintQuote?: (quote: Quote) => void;
  onApproveQuote?: (quote: Quote) => void;
}

export default function QuoteList({ 
  quotes, 
  isLoading, 
  onViewQuote, 
  onPrintQuote, 
  onApproveQuote 
}: QuoteListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredQuotes = quotes.filter(quote => {
    const projectTitle = quote.project?.title?.toLowerCase() || "";
    const quoteNumber = quote.quoteNumber.toLowerCase();
    const term = searchTerm.toLowerCase();
    
    return projectTitle.includes(term) || quoteNumber.includes(term);
  });
  
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "-";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="h-5 w-5 text-gray-400" />
        <Input
          placeholder="Buscar por número de cotización o proyecto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell"># Cotización</TableHead>
              <TableHead className="md:hidden">Cotización/Proyecto</TableHead>
              <TableHead className="hidden md:table-cell">Proyecto</TableHead>
              <TableHead className="hidden md:table-cell">Monto Total</TableHead>
              <TableHead className="hidden md:table-cell">Estado</TableHead>
              <TableHead className="hidden md:table-cell">Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cargando cotizaciones...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No se encontraron cotizaciones
                  {searchTerm && ` que coincidan con "${searchTerm}"`}
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{quote.quoteNumber}</span>
                      
                      {/* Mobile-only content */}
                      <div className="md:hidden mt-1 flex flex-col space-y-1">
                        <span className="text-sm">{quote.project?.title || "-"}</span>
                        
                        <Badge 
                          variant={quote.isApproved ? "success" : "secondary"}
                          className="inline-flex w-fit"
                        >
                          {quote.isApproved ? "Aprobada" : "Pendiente"}
                        </Badge>

                        <div className="flex items-center text-xs text-muted-foreground">
                          <span className="font-medium mr-1">Total:</span> 
                          {formatCurrency(Number(quote.totalAmount))}
                        </div>
                      
                        <div className="flex items-center text-xs text-muted-foreground">
                          <span className="font-medium mr-1">Fecha:</span> 
                          {formatDate(quote.createdAt)}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Desktop-only columns */}
                  <TableCell className="hidden md:table-cell">
                    {quote.project?.title || "-"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatCurrency(Number(quote.totalAmount))}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge 
                      variant={quote.isApproved ? "success" : "secondary"}
                    >
                      {quote.isApproved ? "Aprobada" : "Pendiente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(quote.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => onViewQuote(quote)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver detalles</span>
                      </Button>
                      
                      {onPrintQuote && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => onPrintQuote(quote)}
                        >
                          <Printer className="h-4 w-4" />
                          <span className="sr-only">Imprimir</span>
                        </Button>
                      )}
                      
                      {onApproveQuote && !quote.isApproved && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => onApproveQuote(quote)}
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span className="sr-only">Aprobar</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}