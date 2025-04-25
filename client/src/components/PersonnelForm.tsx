import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Personnel, personnelInsertSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Adaptando el esquema de Zod para el formulario
const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  type: z.enum(["employee", "subcontractor"], {
    required_error: "Selecciona el tipo de personal",
    invalid_type_error: "Tipo de personal no válido",
  }),
  position: z.string().min(2, "La posición debe tener al menos 2 caracteres"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  email: z.string().email("Ingresa un correo electrónico válido").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  rate: z.string().optional().or(z.literal("")),
  taxId: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

interface PersonnelFormProps {
  defaultValues?: Partial<FormValues>;
  onSubmitSuccess: () => void;
}

export function PersonnelForm({ defaultValues, onSubmitSuccess }: PersonnelFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "employee",
      position: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
      rate: "",
      taxId: "",
      ...defaultValues,
    },
  });

  const createPersonnelMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest(
        defaultValues?.name ? "PATCH" : "POST",
        defaultValues?.name ? `/api/personnel/${defaultValues.name}` : "/api/personnel",
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: defaultValues ? "Personal actualizado" : "Personal creado",
        description: defaultValues
          ? "El personal ha sido actualizado exitosamente."
          : "El personal ha sido creado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/personnel"] });
      onSubmitSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al procesar la solicitud.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    createPersonnelMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nombre completo" autoComplete="name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="employee">Empleado</SelectItem>
                  <SelectItem value="subcontractor">Subcontratista</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Posición</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Pintor, Supervisor, etc." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Número de teléfono"
                  type="tel"
                  autoComplete="tel"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico (Opcional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="correo@ejemplo.com"
                  type="email"
                  autoComplete="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección (Opcional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Dirección completa" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {form.watch("type") === "employee" 
                  ? "Salario (Opcional)" 
                  : "Tarifa (Opcional)"}
              </FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder={form.watch("type") === "employee" 
                    ? "Salario por hora/día/semana" 
                    : "Tarifa por trabajo/hora"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("type") === "subcontractor" && (
          <FormField
            control={form.control}
            name="taxId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Identificación Fiscal (Opcional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="RFC o ID fiscal" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas Adicionales (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Información adicional relevante"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onSubmitSuccess}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {defaultValues ? "Actualizando..." : "Creando..."}
              </>
            ) : defaultValues ? (
              "Actualizar"
            ) : (
              "Crear"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}