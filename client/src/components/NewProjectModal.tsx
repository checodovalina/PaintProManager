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
  clientId: string;
  projectType: string;
  description: string;
  visitDate: Date;
  priority: string;
  address: string;
}

export default function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const [date, setDate] = useState<Date>();
  const queryClient = useQueryClient();

  // Fetch clients for dropdown
  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    defaultValues: {
      clientId: "",
      projectType: "Interior Painting",
      description: "",
      priority: "Normal",
      address: "",
    }
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (data: FormData) => {
      return apiRequest("POST", "/api/projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      onClose();
      reset();
    }
  });

  const onSubmit = (data: FormData) => {
    if (date) {
      data.visitDate = date;
      createProjectMutation.mutate(data);
    }
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
              <Label htmlFor="clientId">Client</Label>
              <Select onValueChange={(value) => register("clientId").onChange({ target: { value } })} {...register("clientId", { required: true })}>
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
              <Label htmlFor="projectType">Project Type</Label>
              <Select defaultValue="Interior Painting" onValueChange={(value) => register("projectType").onChange({ target: { value } })} {...register("projectType", { required: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Interior Painting">Interior Painting</SelectItem>
                  <SelectItem value="Exterior Painting">Exterior Painting</SelectItem>
                  <SelectItem value="Commercial Repaint">Commercial Repaint</SelectItem>
                  <SelectItem value="Decorative Finishes">Decorative Finishes</SelectItem>
                  <SelectItem value="Repair & Restoration">Repair & Restoration</SelectItem>
                </SelectContent>
              </Select>
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
                <Select defaultValue="Normal" onValueChange={(value) => register("priority").onChange({ target: { value } })} {...register("priority")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
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
