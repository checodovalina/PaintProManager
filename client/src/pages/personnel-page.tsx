import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Personnel } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search, Trash2, Edit, RefreshCcw } from "lucide-react";
import { PersonnelForm } from "../components/PersonnelForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function PersonnelPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [newPersonnelDialogOpen, setNewPersonnelDialogOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personnelToDelete, setPersonnelToDelete] = useState<Personnel | null>(null);

  // Obtener todo el personal
  const { data: personnel = [], isLoading } = useQuery<Personnel[]>({
    queryKey: ['/api/personnel'],
  });

  // Mutation para eliminar personal
  const deletePersonnelMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/personnel/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Personal eliminado",
        description: "El personal ha sido eliminado exitosamente."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/personnel'] });
      setDeleteDialogOpen(false);
      setPersonnelToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar",
        description: error.message || "Ocurrió un error al eliminar el personal.",
        variant: "destructive",
      });
    }
  });

  // Filtrar personal según búsqueda y tipo
  const filteredPersonnel = personnel.filter((person) => {
    const matchesSearch = 
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.phone.includes(searchQuery) ||
      (person.email && person.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === "all" || person.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Manejar confirmación de eliminación
  const handleDeleteConfirm = () => {
    if (personnelToDelete) {
      deletePersonnelMutation.mutate(personnelToDelete.id);
    }
  };

  // Mostrar diálogo de eliminación
  const handleDeleteClick = (person: Personnel) => {
    setPersonnelToDelete(person);
    setDeleteDialogOpen(true);
  };

  // Abrir diálogo de edición
  const handleEditClick = (person: Personnel) => {
    setEditingPersonnel(person);
    setNewPersonnelDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold">Gestión de Personal</h1>
        <Button onClick={() => {
          setEditingPersonnel(null);
          setNewPersonnelDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Personal
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, posición, teléfono o correo..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={setTypeFilter}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Tipo de personal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="employee">Empleados</SelectItem>
            <SelectItem value="subcontractor">Subcontratistas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="flex-1 overflow-hidden">
        <CardHeader className="px-6 py-4">
          <CardTitle>Lista de Personal</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPersonnel.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <RefreshCcw className="h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No se encontró personal</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No hay personal que coincida con los criterios de búsqueda.
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Posición</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Correo Electrónico</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPersonnel.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-medium">{person.name}</TableCell>
                      <TableCell>
                        <Badge variant={person.type === "employee" ? "default" : "outline"}>
                          {person.type === "employee" ? "Empleado" : "Subcontratista"}
                        </Badge>
                      </TableCell>
                      <TableCell>{person.position}</TableCell>
                      <TableCell>{person.phone}</TableCell>
                      <TableCell>{person.email || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(person)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(person)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para crear/editar personal */}
      <Dialog open={newPersonnelDialogOpen} onOpenChange={setNewPersonnelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPersonnel ? "Editar Personal" : "Nuevo Personal"}
            </DialogTitle>
          </DialogHeader>
          <PersonnelForm
            defaultValues={editingPersonnel || undefined}
            onSubmitSuccess={() => {
              setNewPersonnelDialogOpen(false);
              setEditingPersonnel(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente a <span className="font-semibold">{personnelToDelete?.name}</span> del sistema. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              disabled={deletePersonnelMutation.isPending}
            >
              {deletePersonnelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}