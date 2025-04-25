import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  title: string;
  clientId: number;
  description: string;
  visitDate: Date;
  priority: "normal" | "high" | "urgent";
  address: string;
  notes?: string;
}

export default function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const [date, setDate] = useState<Date>();
  const queryClient = useQueryClient();

  // Fetch clients for dropdown
  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      title: "",
      clientId: 0,
      description: "",
      priority: "normal",
      address: "",
      notes: ""
    }
  });

  // Watch form fields for validation
  const watchClientId = watch("clientId");
  const watchTitle = watch("title");

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (data: FormData) => {
      // Format the data for the API
      const apiData = {
        ...data,
        // Convert clientId to number if it's a string
        clientId: typeof data.clientId === 'string' ? parseInt(data.clientId) : data.clientId,
        // Format date to string "YYYY-MM-DD"
        visitDate: date ? date.toISOString().split('T')[0] : null,
        // Make sure priority matches the enum values
        priority: data.priority.toLowerCase() as "normal" | "high" | "urgent",
        // Default status to pending_visit
        status: "pending_visit" as const,
        // Get user ID from the current auth session
        createdBy: 1, // Will be replaced by actual user ID in the backend
      };
      
      return apiRequest("POST", "/api/projects", apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      // Also update dashboard data and activities
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      onClose();
      reset();
    }
  });

  const onSubmit = (data: FormData) => {
    createProjectMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-gray-900">Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input 
                id="title" 
                placeholder="Project title or name" 
                {...register("title", { required: true })}
              />
              {errors.title && <p className="text-sm text-red-500">Title is required</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientId">Client</Label>
              <Select onValueChange={(value) => setValue("clientId", parseInt(value))} {...register("clientId", { required: true, valueAsNumber: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Search or select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {clients?.map((client: any) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.clientId && <p className="text-sm text-red-500">Client is required</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Brief description of the project"
                {...register("description", { required: true })}
              />
              {errors.description && <p className="text-sm text-red-500">Description is required</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visitDate">Visit Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select defaultValue="normal" onValueChange={(value) => setValue("priority", value as "normal" | "high" | "urgent")} {...register("priority")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                placeholder="Full address" 
                {...register("address", { required: true })}
              />
              {errors.address && <p className="text-sm text-red-500">Address is required</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea 
                id="notes" 
                placeholder="Additional details or special instructions"
                {...register("notes")}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createProjectMutation.isPending}>
              {createProjectMutation.isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
