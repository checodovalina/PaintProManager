import { db } from "@db";
import { eq, desc, and, or, sql, isNull } from "drizzle-orm";
import {
  users,
  clients,
  projects,
  personnel,
  quotes,
  serviceOrders,
  projectImages,
  activities,
  projectAssignments,
  ClientInsert,
  ProjectInsert,
  PersonnelInsert,
  QuoteInsert,
  ServiceOrderInsert,
  ActivityInsert,
  InsertUser,
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "@db"; // Importar el pool directamente desde @db

// Helper function for dashboard statistics
async function getSystemStats() {
  // Get monthly profit stats
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  
  const lastMonthStart = new Date(currentMonthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  
  const lastMonthEnd = new Date(currentMonthStart);
  lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);
  lastMonthEnd.setHours(23, 59, 59, 999);
  
  // Calculate current month revenue from completed projects
  const completedProjectsThisMonth = await db.query.projects.findMany({
    where: and(
      eq(projects.status, "completed"),
      sql`${projects.endDate} >= ${currentMonthStart}`
    )
  });
  
  // Calculate total value of completed projects this month
  const currentMonthValue = completedProjectsThisMonth.reduce(
    (sum, project) => sum + (Number(project.value) || 0), 
    0
  );
  
  // Calculate last month revenue
  const completedProjectsLastMonth = await db.query.projects.findMany({
    where: and(
      eq(projects.status, "completed"),
      sql`${projects.endDate} >= ${lastMonthStart}`,
      sql`${projects.endDate} <= ${lastMonthEnd}`
    )
  });
  
  const lastMonthValue = completedProjectsLastMonth.reduce(
    (sum, project) => sum + (Number(project.value) || 0), 
    0
  );
  
  // Calculate percentage change
  const percentageChange = lastMonthValue === 0 
    ? 100 
    : Math.round(((currentMonthValue - lastMonthValue) / lastMonthValue) * 100);
  
  // Get active projects count
  const activeProjects = await db.query.projects.findMany({
    where: or(
      eq(projects.status, "in_preparation"),
      eq(projects.status, "in_progress")
    )
  });
  
  // Count projects with "high" or "urgent" priority
  const urgentProjects = activeProjects.filter(p => 
    p.priority === "high" || p.priority === "urgent"
  ).length;
  
  // Get pending quotes
  const pendingQuotes = await db.query.quotes.findMany({
    where: eq(quotes.isApproved, false)
  });
  
  // Calculate potential value of pending quotes
  const pendingQuotesValue = pendingQuotes.reduce(
    (sum, quote) => sum + Number(quote.totalAmount), 
    0
  );
  
  // Get personnel availability
  const allPersonnel = await db.query.personnel.findMany({
    where: eq(personnel.isActive, true)
  });
  
  // Get assigned personnel
  const assignedPersonnelIds = (await db.query.projectAssignments.findMany({
    where: isNull(projectAssignments.endDate)
  })).map(assignment => assignment.personnelId);
  
  // Calculate available personnel
  const availablePersonnel = allPersonnel.filter(
    p => !assignedPersonnelIds.includes(p.id)
  ).length;
  
  return {
    monthlyProfit: {
      value: Math.round(currentMonthValue * 0.43), // Assuming 43% profit margin
      change: percentageChange,
      total: currentMonthValue
    },
    activeProjects: {
      total: activeProjects.length,
      urgent: urgentProjects
    },
    pendingQuotes: {
      total: pendingQuotes.length,
      value: pendingQuotesValue
    },
    personnel: {
      available: availablePersonnel,
      total: allPersonnel.length
    }
  };
}

// Crear una instancia de la store para las sesiones de PostgreSQL
const PostgresSessionStore = connectPg(session);
const sessionStore = new PostgresSessionStore({ 
  pool, 
  createTableIfMissing: true 
});

export const storage = {
  // Propiedad sessionStore para el middleware de sesión
  sessionStore,

  // User operations
  async getUserByUsername(username: string) {
    return db.query.users.findFirst({
      where: eq(users.username, username)
    });
  },

  async getUser(id: number) {
    return db.query.users.findFirst({
      where: eq(users.id, id)
    });
  },

  async getAllUsers() {
    return db.query.users.findMany({
      orderBy: [desc(users.createdAt)]
    });
  },

  async createUser(data: InsertUser) {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  },

  async updateUser(id: number, data: Partial<InsertUser>) {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  },

  async deleteUser(id: number) {
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return deletedUser;
  },
  
  // Dashboard data
  async getDashboardData() {
    const stats = await getSystemStats();
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    return {
      statsCards: [
        {
          title: `Monthly Profit (${currentMonth})`,
          value: `$${stats.monthlyProfit.value.toLocaleString()}`,
          subValue: 'from last month',
          icon: '<i class="fas fa-dollar-sign"></i>',
          status: stats.monthlyProfit.change >= 0 ? 'success' : 'danger',
          statusText: `${Math.abs(stats.monthlyProfit.change)}%`,
          link: '/reports/monthly',
          linkText: 'View details',
          bgColor: 'bg-primary/10',
          iconColor: 'text-primary'
        },
        {
          title: 'Active Projects',
          value: stats.activeProjects.total,
          subValue: `${stats.activeProjects.urgent} require attention`,
          icon: '<i class="fas fa-paint-brush"></i>',
          link: '/projects/active',
          linkText: 'View all',
          bgColor: 'bg-secondary/10',
          iconColor: 'text-secondary'
        },
        {
          title: 'Pending Quotes',
          value: stats.pendingQuotes.total,
          subValue: `$${stats.pendingQuotes.value.toLocaleString()} potential value`,
          icon: '<i class="fas fa-file-invoice-dollar"></i>',
          link: '/quotes/pending',
          linkText: 'View all',
          bgColor: 'bg-warning/10',
          iconColor: 'text-warning'
        },
        {
          title: 'Team Availability',
          value: `${stats.personnel.available}/${stats.personnel.total}`,
          subValue: 'Team members available',
          icon: '<i class="fas fa-users"></i>',
          link: '/personnel/manage',
          linkText: 'Manage team',
          bgColor: 'bg-success/10',
          iconColor: 'text-success'
        }
      ],
      revenue: [
        {
          title: 'Total Revenue',
          value: stats.monthlyProfit.total,
          percentage: 100,
          color: 'bg-primary'
        },
        {
          title: 'Materials Cost',
          value: Math.round(stats.monthlyProfit.total * 0.28), // 28% materials cost
          percentage: 28,
          color: 'bg-secondary'
        },
        {
          title: 'Labor Cost',
          value: Math.round(stats.monthlyProfit.total * 0.29), // 29% labor cost
          percentage: 29,
          color: 'bg-accent'
        },
        {
          title: 'Net Profit',
          value: stats.monthlyProfit.value,
          percentage: 43,
          color: 'bg-success'
        }
      ]
    };
  },
  
  // Client operations
  async getAllClients() {
    return db.query.clients.findMany({
      orderBy: [desc(clients.createdAt)]
    });
  },
  
  async getClientsRequiringFollowUp() {
    const today = new Date();
    return db.query.clients.findMany({
      where: sql`${clients.nextFollowUp} <= ${today} AND ${clients.isProspect} = true`,
      orderBy: [clients.nextFollowUp]
    });
  },
  
  async getClientById(id: number) {
    return db.query.clients.findFirst({
      where: eq(clients.id, id),
      with: {
        projects: true
      }
    });
  },
  
  async createClient(data: ClientInsert) {
    // Si es un prospecto, establecer la fecha de siguiente seguimiento
    // al día siguiente si no se especifica
    if (data.isProspect && !data.nextFollowUp) {
      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate() + 7); // Seguimiento en 7 días por defecto
      data.nextFollowUp = nextDay.toISOString();
    }
    
    // Establecer la fecha de último contacto a hoy si no se especifica
    if (!data.lastContactDate) {
      data.lastContactDate = new Date().toISOString();
    }
    
    const [client] = await db.insert(clients).values(data).returning();
    
    // Crear actividad para el nuevo cliente o prospecto
    await this.createActivity({
      title: `Nuevo ${data.isProspect ? 'prospecto' : 'cliente'} creado: ${data.name}`,
      description: `Tipo: ${data.type}`,
      type: "info",
      relatedId: client.id,
      relatedType: "client",
      createdBy: data.createdBy || 1 // Usuario admin por defecto
    });
    
    return client;
  },
  
  async updateClient(id: number, data: Partial<ClientInsert>) {
    // Si el cliente pasa de prospecto a cliente, crear actividad
    if (data.isProspect === false) {
      const client = await this.getClientById(id);
      if (client && client.isProspect) {
        await this.createActivity({
          title: `Prospecto convertido a cliente: ${client.name}`,
          description: `El prospecto ha sido convertido a cliente regular`,
          type: "contract",
          relatedId: client.id,
          relatedType: "client",
          createdBy: data.createdBy || 1
        });
      }
    }
    
    // Si se actualiza la fecha de último contacto, establecer una nueva fecha de seguimiento
    if (data.lastContactDate && !data.nextFollowUp) {
      const nextFollowUp = new Date(data.lastContactDate);
      nextFollowUp.setDate(nextFollowUp.getDate() + 7); // Siguiente seguimiento en 7 días por defecto
      data.nextFollowUp = nextFollowUp.toISOString().split('T')[0];
    }
    
    // Convertir fechas tipo Date a string para PostgreSQL
    let updatedData = { ...data };
    
    const [updatedClient] = await db
      .update(clients)
      .set(updatedData)
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  },
  
  async deleteClient(id: number) {
    const [deletedClient] = await db
      .delete(clients)
      .where(eq(clients.id, id))
      .returning();
    return deletedClient;
  },
  
  // Project operations
  async getAllProjects() {
    return db.query.projects.findMany({
      orderBy: [desc(projects.createdAt)],
      with: {
        client: true
      }
    });
  },
  
  async getProjectById(id: number) {
    return db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: {
        client: true,
        quotes: true,
        serviceOrders: true,
        projectImages: true,
        projectAssignments: {
          with: {
            personnel: true
          }
        }
      }
    });
  },
  
  async createProject(data: ProjectInsert, userId: number) {
    const [project] = await db.insert(projects).values(data).returning();
    
    // Create activity for new project
    await this.createActivity({
      title: `New project created: ${data.title}`,
      description: data.description || "",
      type: "info",
      relatedId: project.id,
      relatedType: "project",
      createdBy: userId // Use the authenticated user ID
    });
    
    return project;
  },
  
  async updateProject(id: number, data: Partial<ProjectInsert>) {
    const [updatedProject] = await db
      .update(projects)
      .set(data)
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  },
  
  async updateProjectStatus(id: number, status: string) {
    // Validamos que el status sea uno de los valores permitidos
    const validStatuses = [
      "pending_visit", 
      "quote_sent", 
      "quote_approved", 
      "in_preparation", 
      "in_progress", 
      "final_review", 
      "completed", 
      "archived"
    ];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid project status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    const [updatedProject] = await db
      .update(projects)
      .set({ status: status as any }) // utilizamos type assertion
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  },
  
  // Personnel operations
  async getAllPersonnel() {
    return db.query.personnel.findMany({
      orderBy: [desc(personnel.createdAt)]
    });
  },
  
  async createPersonnel(data: PersonnelInsert) {
    const [person] = await db.insert(personnel).values(data).returning();
    return person;
  },
  
  // Quote operations
  async getAllQuotes() {
    return db.query.quotes.findMany({
      orderBy: [desc(quotes.createdAt)],
      with: {
        project: {
          with: {
            client: true
          }
        }
      }
    });
  },
  
  async getQuoteById(id: number) {
    return db.query.quotes.findFirst({
      where: eq(quotes.id, id),
      with: {
        project: {
          with: {
            client: true
          }
        }
      }
    });
  },
  
  async createQuote(data: QuoteInsert, userId: number) {
    const [quote] = await db.insert(quotes).values(data).returning();
    
    // Update project status to quote_sent if it was pending_visit
    const project = await this.getProjectById(data.projectId);
    if (project && project.status === "pending_visit") {
      await this.updateProjectStatus(project.id, "quote_sent");
    }
    
    // Create activity for new quote
    await this.createActivity({
      title: `Cotización creada para proyecto: ${project?.title || "Unknown"}`,
      description: `Monto: $${data.totalAmount}`,
      type: "info",
      relatedId: quote.id,
      relatedType: "quote",
      createdBy: userId // Use the current user's ID
    });
    
    return quote;
  },
  
  async approveQuote(id: number) {
    const [updatedQuote] = await db
      .update(quotes)
      .set({
        isApproved: true,
        approvalDate: new Date().toISOString()
      })
      .where(eq(quotes.id, id))
      .returning();
      
    return updatedQuote;
  },
  
  // Service Order operations
  async getAllServiceOrders() {
    return db.query.serviceOrders.findMany({
      orderBy: [desc(serviceOrders.createdAt)],
      with: {
        project: {
          with: {
            client: true
          }
        }
      }
    });
  },
  
  async getServiceOrderById(id: number) {
    return db.query.serviceOrders.findFirst({
      where: eq(serviceOrders.id, id),
      with: {
        project: {
          with: {
            client: true
          }
        }
      }
    });
  },

  async getServiceOrdersByProjectId(projectId: number) {
    return db.query.serviceOrders.findMany({
      where: eq(serviceOrders.projectId, projectId),
      orderBy: [desc(serviceOrders.createdAt)]
    });
  },
  
  async createServiceOrder(data: ServiceOrderInsert) {
    const [order] = await db.insert(serviceOrders).values(data).returning();
    
    // Crear actividad para la nueva orden de servicio
    await this.createActivity({
      title: `Nueva orden de trabajo: ${order.orderNumber}`,
      description: `Se ha creado una nueva orden de trabajo: ${order.description}`,
      type: 'info',
      relatedId: order.id,
      relatedType: 'service_order',
      createdBy: 1 // Usuario por defecto, se debería reemplazar por el ID real
    });
    
    return order;
  },
  
  async startServiceOrder(id: number, startSignature?: string) {
    const [order] = await db
      .update(serviceOrders)
      .set({
        startedAt: new Date().toISOString(),
        startSignature: startSignature || null
      })
      .where(eq(serviceOrders.id, id))
      .returning();
    
    if (order) {
      await this.createActivity({
        title: `Orden de trabajo iniciada: ${order.orderNumber}`,
        description: `Se ha iniciado el trabajo para la orden ${order.orderNumber}`,
        type: 'info',
        relatedId: order.id,
        relatedType: 'service_order',
        createdBy: 1 // Usuario por defecto
      });
    }
    
    return order;
  },
  
  async completeServiceOrder(id: number, endSignature?: string) {
    const [order] = await db
      .update(serviceOrders)
      .set({
        completedAt: new Date().toISOString(),
        endSignature: endSignature || null
      })
      .where(eq(serviceOrders.id, id))
      .returning();
    
    if (order) {
      await this.createActivity({
        title: `Orden de trabajo completada: ${order.orderNumber}`,
        description: `Se ha completado el trabajo para la orden ${order.orderNumber}`,
        type: 'info',
        relatedId: order.id,
        relatedType: 'service_order',
        createdBy: 1 // Usuario por defecto
      });
    }
    
    return order;
  },
  
  async updateServiceOrder(id: number, data: Partial<ServiceOrderInsert>) {
    const [order] = await db
      .update(serviceOrders)
      .set(data)
      .where(eq(serviceOrders.id, id))
      .returning();
    
    return order;
  },
  
  async deleteServiceOrder(id: number) {
    const [order] = await db
      .delete(serviceOrders)
      .where(eq(serviceOrders.id, id))
      .returning();
    
    return order;
  },
  
  // Project Image operations
  async addProjectImage(data: any) {
    const [image] = await db.insert(projectImages).values(data).returning();
    return image;
  },
  
  // Activity operations
  async getRecentActivities(limit = 10) {
    return db.query.activities.findMany({
      orderBy: [desc(activities.createdAt)],
      limit,
      with: {
        createdByUser: true
      }
    });
  },
  
  async createActivity(data: ActivityInsert) {
    const [activity] = await db.insert(activities).values(data).returning();
    return activity;
  }
};
