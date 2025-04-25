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
} from "@shared/schema";

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

export const storage = {
  // User operations
  async getUserByUsername(username: string) {
    return db.query.users.findFirst({
      where: eq(users.username, username)
    });
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
  
  async getClientById(id: number) {
    return db.query.clients.findFirst({
      where: eq(clients.id, id),
      with: {
        projects: true
      }
    });
  },
  
  async createClient(data: ClientInsert) {
    const [client] = await db.insert(clients).values(data).returning();
    return client;
  },
  
  async updateClient(id: number, data: Partial<ClientInsert>) {
    const [updatedClient] = await db
      .update(clients)
      .set(data)
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
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
  
  async createProject(data: ProjectInsert) {
    const [project] = await db.insert(projects).values(data).returning();
    
    // Create activity for new project
    await this.createActivity({
      title: `New project created: ${data.title}`,
      description: data.description || "",
      type: "info",
      relatedId: project.id,
      relatedType: "project",
      createdBy: 1 // Default admin user
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
    const [updatedProject] = await db
      .update(projects)
      .set({ status })
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
  
  async createQuote(data: QuoteInsert) {
    const [quote] = await db.insert(quotes).values(data).returning();
    
    // Update project status to quote_sent if it was pending_visit
    const project = await this.getProjectById(data.projectId);
    if (project && project.status === "pending_visit") {
      await this.updateProjectStatus(project.id, "quote_sent");
    }
    
    // Create activity for new quote
    await this.createActivity({
      title: `Quote created for project: ${project?.title || "Unknown"}`,
      description: `Amount: $${data.totalAmount}`,
      type: "info",
      relatedId: quote.id,
      relatedType: "quote",
      createdBy: 1 // Default admin user
    });
    
    return quote;
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
  
  async createServiceOrder(data: ServiceOrderInsert) {
    const [order] = await db.insert(serviceOrders).values(data).returning();
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
