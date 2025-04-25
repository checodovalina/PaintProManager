import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  ProjectInsert, 
  ClientInsert, 
  PersonnelInsert, 
  QuoteInsert, 
  ServiceOrderInsert,
  projectsInsertSchema,
  clientsInsertSchema,
  personnelInsertSchema,
  quotesInsertSchema,
  serviceOrdersInsertSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix
  const apiPrefix = '/api';

  // Users and authentication
  app.post(`${apiPrefix}/login`, async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      req.session.userId = user.id;
      return res.json({ message: "Logged in successfully", user: { id: user.id, username: user.username } });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "An error occurred during login" });
    }
  });

  app.post(`${apiPrefix}/logout`, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.json({ message: "Logged out successfully" });
    });
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
