import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  ProjectInsert, 
  ClientInsert, 
  PersonnelInsert, 
  QuoteInsert, 
  ServiceOrderInsert,
  InsertUser,
  projectsInsertSchema,
  clientsInsertSchema,
  personnelInsertSchema,
  quotesInsertSchema,
  serviceOrdersInsertSchema,
  insertUserSchema
} from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";

// Middleware to check if user has the required role
const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You don't have permission to perform this action" });
    }
    
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix
  const apiPrefix = '/api';

  // Setup authentication with Passport
  setupAuth(app);

  // User module routes (only accessible by administrators)
  app.get(`${apiPrefix}/users`, checkRole(['superadmin', 'admin']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't return passwords
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      return res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error getting users:", error);
      return res.status(500).json({ message: "Error retrieving the user list" });
    }
  });

  app.post(`${apiPrefix}/users`, checkRole(['superadmin', 'admin']), async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(validatedData);
      // Don't return password
      const { password, ...userWithoutPassword } = newUser;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Error creating the user" });
    }
  });

  app.get(`${apiPrefix}/users/:id`, checkRole(['superadmin', 'admin']), async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error getting user:", error);
      return res.status(500).json({ message: "Error retrieving the user" });
    }
  });

  app.patch(`${apiPrefix}/users/:id`, checkRole(['superadmin', 'admin']), async (req, res) => {
    try {
      // Only superadmin can modify another superadmin
      if (req.user.role !== 'superadmin') {
        const userToUpdate = await storage.getUser(parseInt(req.params.id));
        if (userToUpdate && userToUpdate.role === 'superadmin') {
          return res.status(403).json({ message: "You don't have permission to modify a superadmin" });
        }
      }

      const validatedData = insertUserSchema.partial().parse(req.body);
      const updatedUser = await storage.updateUser(parseInt(req.params.id), validatedData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      // Don't return password
      const { password, ...userWithoutPassword } = updatedUser;
      return res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating user:", error);
      return res.status(500).json({ message: "Error updating the user" });
    }
  });

  app.delete(`${apiPrefix}/users/:id`, checkRole(['superadmin']), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Don't allow a user to delete their own account
      if (userId === req.user.id) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }
      
      const deletedUser = await storage.deleteUser(userId);
      if (!deletedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json({ message: "User successfully deleted" });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({ message: "Error deleting the user" });
    }
  });

  // Dashboard data
  app.get(`${apiPrefix}/dashboard`, async (req, res) => {
    try {
      const dashboardData = await storage.getDashboardData();
      return res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      return res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Clients
  app.get(`${apiPrefix}/clients`, async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      return res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      return res.status(500).json({ message: "Failed to fetch clients" });
    }
  });
  
  // Clients requiring follow-up
  app.get(`${apiPrefix}/clients/follow-up`, async (req, res) => {
    try {
      const clients = await storage.getClientsRequiringFollowUp();
      return res.json(clients);
    } catch (error) {
      console.error("Error fetching clients requiring follow-up:", error);
      return res.status(500).json({ message: "Failed to fetch clients requiring follow-up" });
    }
  });

  app.get(`${apiPrefix}/clients/:id`, async (req, res) => {
    try {
      const client = await storage.getClientById(parseInt(req.params.id));
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      return res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      return res.status(500).json({ message: "Failed to fetch client details" });
    }
  });

  app.post(`${apiPrefix}/clients`, async (req, res) => {
    try {
      const validatedData = clientsInsertSchema.parse(req.body);
      const newClient = await storage.createClient(validatedData);
      return res.status(201).json(newClient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating client:", error);
      return res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.patch(`${apiPrefix}/clients/:id`, async (req, res) => {
    try {
      const validatedData = clientsInsertSchema.partial().parse(req.body);
      const updatedClient = await storage.updateClient(parseInt(req.params.id), validatedData);
      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      return res.json(updatedClient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating client:", error);
      return res.status(500).json({ message: "Failed to update client" });
    }
  });
  
  app.delete(`${apiPrefix}/clients/:id`, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      
      // Primero verificamos si existen proyectos asociados a este cliente
      const client = await storage.getClientById(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      if (client.projects && client.projects.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete client with associated projects. Please delete or reassign projects first." 
        });
      }
      
      // Si no hay proyectos asociados, procedemos con la eliminación
      const deletedClient = await storage.deleteClient(clientId);
      
      return res.json({ 
        message: "Client successfully deleted", 
        client: deletedClient 
      });
    } catch (error) {
      console.error("Error deleting client:", error);
      return res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Projects
  app.get(`${apiPrefix}/projects`, async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      return res.json({ projects });
    } catch (error) {
      console.error("Error fetching projects:", error);
      return res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get(`${apiPrefix}/projects/:id`, async (req, res) => {
    try {
      const project = await storage.getProjectById(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      return res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      return res.status(500).json({ message: "Failed to fetch project details" });
    }
  });

  app.post(`${apiPrefix}/projects`, async (req, res) => {
    try {
      const validatedData = projectsInsertSchema.parse(req.body);
      const newProject = await storage.createProject(validatedData);
      return res.status(201).json(newProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating project:", error);
      return res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch(`${apiPrefix}/projects/:id`, async (req, res) => {
    try {
      const validatedData = projectsInsertSchema.partial().parse(req.body);
      const updatedProject = await storage.updateProject(parseInt(req.params.id), validatedData);
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      return res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating project:", error);
      return res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.patch(`${apiPrefix}/projects/:id/status`, async (req, res) => {
    try {
      const { status } = req.body;
      const projectId = parseInt(req.params.id);
      const updatedProject = await storage.updateProjectStatus(projectId, status);
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Create an activity record for status change
      await storage.createActivity({
        title: `Project ${updatedProject.title} status updated`,
        description: `Status changed to ${status}`,
        type: "info",
        relatedId: projectId,
        relatedType: "project",
        createdBy: req.session.userId || 1  // Default to admin if no user in session
      });
      
      return res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project status:", error);
      return res.status(500).json({ message: "Failed to update project status" });
    }
  });

  // Personnel
  app.get(`${apiPrefix}/personnel`, async (req, res) => {
    try {
      const personnel = await storage.getAllPersonnel();
      return res.json(personnel);
    } catch (error) {
      console.error("Error fetching personnel:", error);
      return res.status(500).json({ message: "Failed to fetch personnel" });
    }
  });

  app.post(`${apiPrefix}/personnel`, async (req, res) => {
    try {
      const validatedData = personnelInsertSchema.parse(req.body);
      const newPersonnel = await storage.createPersonnel(validatedData);
      return res.status(201).json(newPersonnel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating personnel:", error);
      return res.status(500).json({ message: "Failed to create personnel" });
    }
  });

  // Quotes
  app.get(`${apiPrefix}/quotes`, async (req, res) => {
    try {
      const quotes = await storage.getAllQuotes();
      return res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      return res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.post(`${apiPrefix}/quotes`, async (req, res) => {
    try {
      const validatedData = quotesInsertSchema.parse(req.body);
      const newQuote = await storage.createQuote(validatedData);
      return res.status(201).json(newQuote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating quote:", error);
      return res.status(500).json({ message: "Failed to create quote" });
    }
  });

  // Service Orders
  app.get(`${apiPrefix}/service-orders`, async (req, res) => {
    try {
      const serviceOrders = await storage.getAllServiceOrders();
      return res.json(serviceOrders);
    } catch (error) {
      console.error("Error fetching service orders:", error);
      return res.status(500).json({ message: "Failed to fetch service orders" });
    }
  });

  app.post(`${apiPrefix}/service-orders`, async (req, res) => {
    try {
      const validatedData = serviceOrdersInsertSchema.parse(req.body);
      const newServiceOrder = await storage.createServiceOrder(validatedData);
      return res.status(201).json(newServiceOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating service order:", error);
      return res.status(500).json({ message: "Failed to create service order" });
    }
  });

  // Activities
  app.get(`${apiPrefix}/activities`, async (req, res) => {
    try {
      const activities = await storage.getRecentActivities();
      return res.json({ activities });
    } catch (error) {
      console.error("Error fetching activities:", error);
      return res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Project Images
  app.post(`${apiPrefix}/project-images/:projectId`, async (req, res) => {
    try {
      const { imageUrl, type, caption } = req.body;
      const projectId = parseInt(req.params.projectId);
      
      const newImage = await storage.addProjectImage({
        projectId,
        imageUrl,
        type,
        caption,
        uploadedBy: req.session.userId || 1
      });
      
      return res.status(201).json(newImage);
    } catch (error) {
      console.error("Error uploading project image:", error);
      return res.status(500).json({ message: "Failed to upload project image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
