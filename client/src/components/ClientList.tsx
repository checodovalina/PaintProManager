import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, PhoneCall, Mail, MoreVertical, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Client } from "@shared/schema";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onFollowUp: (client: Client) => void;
  isLoading: boolean;
}

export default function ClientList({ clients, onEdit, onDelete, onFollowUp, isLoading }: ClientListProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const getClientTypeColor = (type: string) => {
    switch (type) {
      case "residential":
        return "bg-blue-100 text-blue-800";
      case "commercial":
        return "bg-purple-100 text-purple-800";
      case "industrial":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getStatusColor = (isProspect: boolean | null) => {
    return isProspect === true
      ? "bg-yellow-100 text-yellow-800" 
      : "bg-green-100 text-green-800";
  };
  
  const isOverdueForFollowUp = (client: Client) => {
    if (!client.nextFollowUp || client.isProspect !== true) return false;
    
    const followUpDate = new Date(client.nextFollowUp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return followUpDate <= today;
  };
  
  const filteredClients = clients.filter(client => {
    const typeMatch = filterType === "all" || client.type === filterType;
    const statusMatch = filterStatus === "all" || 
      (filterStatus === "prospect" && client.isProspect) || 
      (filterStatus === "client" && !client.isProspect);
    
    return typeMatch && statusMatch;
  });
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Clients & Prospects</CardTitle>
            <CardDescription>
              Manage your client relationships and lead follow-ups
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={filterType === "all" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterType("all")}
              >
                All Types
              </Button>
              <Button 
                variant={filterType === "residential" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterType("residential")}
              >
                Residential
              </Button>
              <Button 
                variant={filterType === "commercial" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterType("commercial")}
              >
                Commercial
              </Button>
              <Button 
                variant={filterType === "industrial" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterType("industrial")}
              >
                Industrial
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={filterStatus === "all" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                All Status
              </Button>
              <Button 
                variant={filterStatus === "prospect" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterStatus("prospect")}
              >
                Prospects
              </Button>
              <Button 
                variant={filterStatus === "client" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterStatus("client")}
              >
                Clients
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          filteredClients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No clients or prospects found. Add your first one!
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Last Contact</TableHead>
                    <TableHead>Next Follow-up</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getClientTypeColor(client.type)}>
                          {client.type.charAt(0).toUpperCase() + client.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(client.isProspect)}>
                          {client.isProspect ? "Prospect" : "Client"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {client.email && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a href={`mailto:${client.email}`} className="text-blue-600 hover:text-blue-800">
                                    <Mail className="h-4 w-4" />
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{client.email}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {client.phone && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a href={`tel:${client.phone}`} className="text-green-600 hover:text-green-800">
                                    <PhoneCall className="h-4 w-4" />
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{client.phone}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.lastContactDate ? (
                          format(new Date(client.lastContactDate), "MMM d, yyyy")
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {client.nextFollowUp ? (
                            <>
                              {isOverdueForFollowUp(client) && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Follow-up overdue!</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {format(new Date(client.nextFollowUp), "MMM d, yyyy")}
                            </>
                          ) : (
                            "—"
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEdit(client)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {client.isProspect && (
                              <DropdownMenuItem onClick={() => onFollowUp(client)}>
                                <PhoneCall className="mr-2 h-4 w-4" />
                                Record Follow-up
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onDelete(client)}
                              className="text-red-600 hover:text-red-700 focus:text-red-700"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}