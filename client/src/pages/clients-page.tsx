import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Client } from "@shared/schema";
import ClientList from "@/components/ClientList";
import ClientForm from "@/components/ClientForm";
import FollowUpCard from "@/components/FollowUpCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function ClientsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showClientForm, setShowClientForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  
  // Fetch all clients
  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    retry: 1,
  });
  
  // Fetch clients requiring follow-up
  const { data: followUpClients = [], isLoading: isLoadingFollowUp } = useQuery<Client[]>({
    queryKey: ['/api/clients/follow-up'],
    retry: 1,
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (data: Partial<Client>) => {
      // Add the current user ID as creator
      const clientData = {
        ...data,
        createdBy: user?.id
      };
      
      const res = await apiRequest('POST', '/api/clients', clientData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients/follow-up'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({ 
        title: "Success", 
        description: "Client created successfully" 
      });
      setShowClientForm(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: `Failed to create client: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (data: { id: number; client: Partial<Client> }) => {
      // Add the current user ID as the updater
      const clientData = {
        ...data.client,
        createdBy: user?.id
      };
      
      const res = await apiRequest('PATCH', `/api/clients/${data.id}`, clientData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients/follow-up'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({ 
        title: "Success", 
        description: "Client updated successfully" 
      });
      setClientToEdit(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: `Failed to update client: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/clients/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients/follow-up'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({ 
        title: "Success", 
        description: "Client deleted successfully" 
      });
      setClientToDelete(null);
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: `Failed to delete client: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  const handleClientSubmit = (data: Partial<Client>) => {
    if (clientToEdit) {
      updateClientMutation.mutate({ id: clientToEdit.id, client: data });
    } else {
      createClientMutation.mutate(data);
    }
  };
  
  const handleDelete = (client: Client) => {
    setClientToDelete(client);
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = () => {
    if (clientToDelete) {
      deleteClientMutation.mutate(clientToDelete.id);
    }
  };
  
  const handleFollowUp = (client: Client, notes: string, nextFollowUpDate: Date) => {
    const today = new Date();
    
    updateClientMutation.mutate({
      id: client.id,
      client: {
        lastContactDate: today,
        nextFollowUp: nextFollowUpDate,
        notes: notes ? `${today.toISOString().split('T')[0]}: ${notes}\n\n${client.notes || ''}` : client.notes
      }
    });
  };
  
  const isSubmitting = createClientMutation.isPending || updateClientMutation.isPending;
  const isDeleting = deleteClientMutation.isPending;
  
  return (
    <div className="container mx-auto py-6 md:py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Users className="h-8 w-8 text-blue-600 mr-3" />
          <h2 className="text-2xl md:text-3xl font-bold">Clients & Prospects</h2>
        </div>
        <Button onClick={() => setShowClientForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>
      
      {/* Follow-up Alerts Section */}
      {followUpClients.length > 0 && (
        <div className="mb-6">
          <FollowUpCard
            clients={followUpClients} 
            onFollowUp={handleFollowUp}
            isLoading={isLoadingFollowUp}
          />
        </div>
      )}
      
      {/* Client List */}
      <ClientList 
        clients={clients} 
        onEdit={setClientToEdit}
        onDelete={handleDelete}
        onFollowUp={(client) => setClientToEdit(client)}
        isLoading={isLoading}
      />
      
      {/* Create/Edit Client Dialog */}
      <Dialog open={showClientForm || !!clientToEdit} onOpenChange={(open) => {
        if (!open) {
          setShowClientForm(false);
          setClientToEdit(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{clientToEdit ? "Edit Client" : "Add New Client"}</DialogTitle>
            <DialogDescription>
              {clientToEdit 
                ? "Update the client information below" 
                : "Fill in the details to add a new client or prospect"}
            </DialogDescription>
          </DialogHeader>
          <ClientForm 
            defaultValues={clientToEdit || undefined}
            onSubmit={handleClientSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the client
              {clientToDelete ? ` "${clientToDelete.name}"` : ''} and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}