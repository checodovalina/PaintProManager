import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LockKeyhole } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Redirect to home if user is already logged in
  if (user) {
    navigate("/");
    return null;
  }

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Login successful",
          description: "Welcome to Dovalina Painting LLC",
        });
        navigate("/");
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 overflow-auto">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8">
        {/* Hero section */}
        <div className="flex flex-col justify-center items-center md:items-start">
          <img 
            src="/images/dovalina-logo.svg" 
            alt="Dovalina Painting LLC Logo" 
            className="w-48 h-auto mb-6"
          />
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-800 text-transparent bg-clip-text text-center md:text-left">
            Dovalina Painting LLC
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 mb-6 text-center md:text-left">
            Management system for efficient handling of clients, projects, personnel, and quotes.
          </p>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 md:p-6 w-full">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Key features:</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Client and prospect management</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Kanban-style project tracking</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Quote generation and tracking</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Personnel and assignment management</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Auth form */}
        <div className="flex items-center justify-center mt-8 md:mt-0">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <LockKeyhole className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>
                Enter your credentials to access the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="********" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full mt-6" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Loading..." : "Login"}
                  </Button>
                </form>
              </Form>
              <div className="mt-6 text-center text-sm text-gray-500">
                <p>If you don't have an account, please contact an administrator to provide you with access to the system.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}