import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserIcon, Pencil, Trash2, ShieldCheck } from "lucide-react";

// Schema for creating/editing users
const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Must provide a valid email"),
  role: z.enum(["admin", "member", "viewer"]),
});

type UserFormValues = z.infer<typeof userFormSchema>;

// User types
interface User {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  role: "superadmin" | "admin" | "member" | "viewer";
  createdAt: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Verify if the current user has admin permissions
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "superadmin";
  const isSuperAdmin = currentUser?.role === "superadmin";

  // Query to get all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: isAdmin, // Only execute the query if the user has permissions
  });

  // Form for creating or editing users
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: "viewer",
    },
  });

  // Mutation to create a new user
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const res = await apiRequest("POST", "/api/users", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "User created",
        description: "The user has been successfully created",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsNewUserDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error creating user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to update an existing user
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; userData: Partial<UserFormValues> }) => {
      const res = await apiRequest("PATCH", `/api/users/${data.id}`, data.userData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "The user has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error updating user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to delete a user
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/users/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "User deleted",
        description: "The user has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to open the edit modal
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.reset({
      username: user.username,
      fullName: user.fullName || "",
      email: user.email || "",
      role: user.role === "superadmin" ? "admin" : user.role, // Don't allow editing superadmin
      password: "", // Leave empty to not change the password
    });
  };

  // Function to handle form submission
  const onSubmit = (data: UserFormValues) => {
    if (editingUser) {
      // If we're editing a user, remove empty or unnecessary fields
      const updateData: Partial<UserFormValues> = { ...data };
      if (!updateData.password) {
        delete updateData.password;
      }
      updateUserMutation.mutate({ id: editingUser.id, userData: updateData });
    } else {
      // If we're creating a new user
      createUserMutation.mutate(data);
    }
  };

  // If the user doesn't have admin permissions, show a message
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this section.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>To access user management, you must have administrator permissions.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 md:py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center">
          <ShieldCheck className="h-8 w-8 text-blue-600 mr-3" />
          <h2 className="text-2xl md:text-3xl font-bold">User Management</h2>
        </div>
        
        <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserIcon className="mr-2 h-4 w-4" />
              New User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Complete the form to create a new user in the system.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormDescription>
                        Username for login
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormDescription>
                        Minimum 6 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First Last" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="user@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isSuperAdmin && <SelectItem value="admin">Administrator</SelectItem>}
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Defines the permissions the user will have
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? "Creating..." : "Create User"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Modal for editing users */}
        <Dialog open={editingUser !== null} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Modify the user's data.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormDescription>
                        Username for login
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password (optional)</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Leave blank to keep current" {...field} />
                      </FormControl>
                      <FormDescription>
                        Leave blank to keep the current password
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First Last" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="user@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isSuperAdmin && <SelectItem value="admin">Administrator</SelectItem>}
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Defines the permissions the user will have
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={updateUserMutation.isPending}>
                    {updateUserMutation.isPending ? "Updating..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>
            Manage users with access to the system and their permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <p>Loading users...</p>
            </div>
          ) : !users || users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No users to display.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead className="hidden md:table-cell">Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell className="hidden md:table-cell">{user.fullName || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell">{user.email || "-"}</TableCell>
                      <TableCell>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "superadmin" 
                            ? "bg-red-100 text-red-800" 
                            : user.role === "admin" 
                              ? "bg-purple-100 text-purple-800" 
                              : user.role === "member" 
                                ? "bg-blue-100 text-blue-800" 
                                : "bg-gray-100 text-gray-800"
                        }`}>
                          {user.role === "superadmin" 
                            ? "Super Admin" 
                            : user.role === "admin" 
                              ? "Administrator" 
                              : user.role === "member" 
                                ? "Member" 
                                : "Viewer"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {/* Don't allow editing superadmin unless you're superadmin */}
                        {(user.role !== "superadmin" || isSuperAdmin) && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditUser(user)}
                            className="mr-1"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Only superadmin can delete users, but not themselves */}
                        {isSuperAdmin && user.id !== currentUser?.id && user.role !== "superadmin" && (
                          <AlertDialog open={deleteDialogOpen && userToDelete?.id === user.id} onOpenChange={setDeleteDialogOpen}>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setUserToDelete(user)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm deletion?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. The user will be permanently deleted.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between p-4 sm:p-6">
          <p className="text-sm text-gray-500">
            Total users: {users?.length || 0}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}