import { db } from "./index";
import * as schema from "@shared/schema";
import { eq, or } from "drizzle-orm";

async function seed() {
  try {
    console.log("Starting database seed...");

    // Check if we already have users
    const existingUsers = await db.query.users.findMany();
    if (existingUsers.length === 0) {
      console.log("Seeding users...");
      const users = await db.insert(schema.users).values([
        {
          username: "admin",
          password: "admin123", // In production, this would be hashed
          fullName: "John Dovalina",
          email: "admin@pinturapro.com",
          role: "admin"
        },
        {
          username: "manager",
          password: "manager123",
          fullName: "Maria Rodriguez",
          email: "maria@pinturapro.com",
          role: "manager"
        }
      ]).returning();
      console.log(`Created ${users.length} users`);
    }

    // Check if we already have clients
    const existingClients = await db.query.clients.findMany();
    if (existingClients.length === 0) {
      console.log("Seeding clients...");
      const clients = await db.insert(schema.clients).values([
        {
          name: "Martinez Residence",
          type: "residential",
          email: "martinez@example.com",
          phone: "512-555-1234",
          address: "456 Pine St",
          city: "Austin",
          state: "TX",
          zip: "78701",
          isProspect: false,
          createdBy: 1
        },
        {
          name: "Johnson Office",
          type: "commercial",
          email: "johnson@example.com",
          phone: "512-555-5678",
          address: "789 Oak Blvd",
          city: "Austin",
          state: "TX",
          zip: "78702",
          isProspect: true,
          createdBy: 1
        },
        {
          name: "Garcia Residence",
          type: "residential",
          email: "garcia@example.com",
          phone: "512-555-9012",
          address: "123 Main St",
          city: "Austin",
          state: "TX",
          zip: "78703",
          isProspect: false,
          createdBy: 1
        },
        {
          name: "Downtown Lofts",
          type: "commercial",
          email: "lofts@example.com",
          phone: "512-555-3456",
          address: "567 Center St",
          city: "Austin",
          state: "TX",
          zip: "78704",
          isProspect: false,
          createdBy: 1
        },
        {
          name: "Thompson Residence",
          type: "residential",
          email: "thompson@example.com",
          phone: "512-555-7890",
          address: "890 Riverside Dr",
          city: "Austin",
          state: "TX",
          zip: "78705",
          isProspect: false,
          createdBy: 1
        },
        {
          name: "Hillside Community Center",
          type: "commercial",
          email: "hillside@example.com",
          phone: "512-555-2345",
          address: "1200 Hills Rd",
          city: "Austin",
          state: "TX",
          zip: "78706",
          isProspect: false,
          createdBy: 1
        },
        {
          name: "Waterson Building",
          type: "commercial",
          email: "waterson@example.com",
          phone: "512-555-6789",
          address: "550 Business Park",
          city: "Austin",
          state: "TX",
          zip: "78707",
          isProspect: false,
          createdBy: 1
        },
        {
          name: "Sunview Apartments",
          type: "commercial",
          email: "sunview@example.com",
          phone: "512-555-0123",
          address: "300 Sunshine Blvd",
          city: "Austin",
          state: "TX",
          zip: "78708",
          isProspect: false,
          createdBy: 1
        },
        {
          name: "Parkside Hotel",
          type: "commercial",
          email: "parkside@example.com",
          phone: "512-555-4567",
          address: "420 Park Avenue",
          city: "Austin",
          state: "TX",
          zip: "78709",
          isProspect: false,
          createdBy: 1
        }
      ]).returning();
      console.log(`Created ${clients.length} clients`);
    }

    // Check if we already have personnel
    const existingPersonnel = await db.query.personnel.findMany();
    if (existingPersonnel.length === 0) {
      console.log("Seeding personnel...");
      const personnelData = await db.insert(schema.personnel).values([
        {
          name: "Miguel Rodriguez",
          type: "employee",
          email: "miguel@pinturapro.com",
          phone: "512-555-1111",
          rate: 25.00,
          specialty: "Interior Painting",
          isActive: true
        },
        {
          name: "Carlos Lopez",
          type: "employee",
          email: "carlos@pinturapro.com",
          phone: "512-555-2222",
          rate: 25.00,
          specialty: "Exterior Painting",
          isActive: true
        },
        {
          name: "Juan Martinez",
          type: "employee",
          email: "juan@pinturapro.com",
          phone: "512-555-3333",
          rate: 27.50,
          specialty: "Commercial Painting",
          isActive: true
        },
        {
          name: "Roberto Garcia",
          type: "employee",
          email: "roberto@pinturapro.com",
          phone: "512-555-4444",
          rate: 26.00,
          specialty: "Interior Painting",
          isActive: true
        },
        {
          name: "Austin Contracting LLC",
          type: "subcontractor",
          email: "info@austincontracting.com",
          phone: "512-555-5555",
          rate: 35.00,
          specialty: "Commercial Projects",
          isActive: true
        }
      ]).returning();
      console.log(`Created ${personnelData.length} personnel records`);
    }

    // Check if we already have projects
    const existingProjects = await db.query.projects.findMany();
    if (existingProjects.length === 0) {
      console.log("Seeding projects...");
      
      // Get client IDs
      const clients = await db.query.clients.findMany();
      const clientMap = clients.reduce((map, client) => {
        map[client.name] = client.id;
        return map;
      }, {} as Record<string, number>);
      
      const projectsData = await db.insert(schema.projects).values([
        {
          title: "Martinez Residence",
          description: "Interior painting - Living room",
          clientId: clientMap["Martinez Residence"],
          status: "pending_visit",
          address: "456 Pine St, Austin TX",
          visitDate: new Date("2025-04-25"),
          priority: "normal",
          createdBy: 1
        },
        {
          title: "Johnson Office",
          description: "Commercial repaint",
          clientId: clientMap["Johnson Office"],
          status: "pending_visit",
          address: "789 Oak Blvd, Austin TX",
          visitDate: new Date("2025-04-28"),
          priority: "normal",
          createdBy: 1
        },
        {
          title: "Garcia Residence",
          description: "Exterior trim and siding",
          clientId: clientMap["Garcia Residence"],
          status: "quote_sent",
          address: "123 Main St, Austin TX",
          visitDate: new Date("2025-04-15"),
          value: 2850.00,
          priority: "normal",
          createdBy: 1
        },
        {
          title: "Downtown Lofts",
          description: "Commercial hallway repaint",
          clientId: clientMap["Downtown Lofts"],
          status: "quote_approved",
          address: "567 Center St, Austin TX",
          visitDate: new Date("2025-04-12"),
          startDate: new Date("2025-04-30"),
          value: 5450.00,
          priority: "normal",
          createdBy: 1
        },
        {
          title: "Thompson Residence",
          description: "Kitchen and bathroom refresh",
          clientId: clientMap["Thompson Residence"],
          status: "in_preparation",
          address: "890 Riverside Dr, Austin TX",
          visitDate: new Date("2025-04-10"),
          startDate: new Date("2025-04-22"),
          value: 3750.00,
          priority: "normal",
          createdBy: 1
        },
        {
          title: "Hillside Community Center",
          description: "Complete interior repainting",
          clientId: clientMap["Hillside Community Center"],
          status: "in_progress",
          address: "1200 Hills Rd, Austin TX",
          visitDate: new Date("2025-03-28"),
          startDate: new Date("2025-04-12"),
          value: 12500.00,
          priority: "high",
          createdBy: 1
        },
        {
          title: "Waterson Building",
          description: "Office hallways and reception",
          clientId: clientMap["Waterson Building"],
          status: "in_progress",
          address: "550 Business Park, Austin TX",
          visitDate: new Date("2025-03-25"),
          startDate: new Date("2025-04-10"),
          value: 8200.00,
          priority: "normal",
          createdBy: 1
        },
        {
          title: "Sunview Apartments",
          description: "Exterior repaint and repair",
          clientId: clientMap["Sunview Apartments"],
          status: "final_review",
          address: "300 Sunshine Blvd, Austin TX",
          visitDate: new Date("2025-03-15"),
          startDate: new Date("2025-03-30"),
          endDate: new Date("2025-04-18"),
          value: 15800.00,
          priority: "normal",
          createdBy: 1
        },
        {
          title: "Parkside Hotel",
          description: "Lobby and conference rooms",
          clientId: clientMap["Parkside Hotel"],
          status: "completed",
          address: "420 Park Avenue, Austin TX",
          visitDate: new Date("2025-03-05"),
          startDate: new Date("2025-03-20"),
          endDate: new Date("2025-04-15"),
          value: 9750.00,
          priority: "high",
          createdBy: 1
        }
      ]).returning();
      console.log(`Created ${projectsData.length} projects`);
    }

    // Check if we already have project assignments
    const existingAssignments = await db.query.projectAssignments.findMany();
    if (existingAssignments.length === 0) {
      console.log("Seeding project assignments...");
      
      // Get project IDs
      const projects = await db.query.projects.findMany({
        where: or(
          eq(schema.projects.status, "in_preparation"),
          eq(schema.projects.status, "in_progress"),
          eq(schema.projects.status, "final_review")
        )
      });
      
      // Get personnel IDs
      const personnelList = await db.query.personnel.findMany();
      
      // Create assignments
      const assignmentsData = [];
      
      // Thompson Residence - assign Miguel Rodriguez
      const thompson = projects.find(p => p.title === "Thompson Residence");
      const miguel = personnelList.find(p => p.name === "Miguel Rodriguez");
      if (thompson && miguel) {
        assignmentsData.push({
          projectId: thompson.id,
          personnelId: miguel.id,
          startDate: new Date("2025-04-22")
        });
      }
      
      // Hillside Community Center - assign Juan Martinez and team
      const hillside = projects.find(p => p.title === "Hillside Community Center");
      const juan = personnelList.find(p => p.name === "Juan Martinez");
      const carlos = personnelList.find(p => p.name === "Carlos Lopez");
      const roberto = personnelList.find(p => p.name === "Roberto Garcia");
      if (hillside && juan && carlos && roberto) {
        assignmentsData.push(
          {
            projectId: hillside.id,
            personnelId: juan.id,
            startDate: new Date("2025-04-12")
          },
          {
            projectId: hillside.id,
            personnelId: carlos.id,
            startDate: new Date("2025-04-12")
          },
          {
            projectId: hillside.id,
            personnelId: roberto.id,
            startDate: new Date("2025-04-12")
          }
        );
      }
      
      // Waterson Building - assign Roberto Garcia and team
      const waterson = projects.find(p => p.title === "Waterson Building");
      const contractor = personnelList.find(p => p.name === "Austin Contracting LLC");
      if (waterson && roberto && contractor) {
        assignmentsData.push(
          {
            projectId: waterson.id,
            personnelId: roberto.id,
            startDate: new Date("2025-04-10")
          },
          {
            projectId: waterson.id,
            personnelId: contractor.id,
            startDate: new Date("2025-04-10")
          }
        );
      }
      
      // Sunview Apartments - assign to John (admin)
      const sunview = projects.find(p => p.title === "Sunview Apartments");
      if (sunview) {
        assignmentsData.push({
          projectId: sunview.id,
          personnelId: 1, // Admin user
          startDate: new Date("2025-04-18")
        });
      }
      
      if (assignmentsData.length > 0) {
        const assignments = await db.insert(schema.projectAssignments).values(assignmentsData).returning();
        console.log(`Created ${assignments.length} project assignments`);
      }
    }

    // Check if we already have quotes
    const existingQuotes = await db.query.quotes.findMany();
    if (existingQuotes.length === 0) {
      console.log("Seeding quotes...");
      
      // Get project IDs
      const projects = await db.query.projects.findMany({
        where: or(
          eq(schema.projects.status, "quote_sent"),
          eq(schema.projects.status, "quote_approved")
        )
      });
      
      const quotesData = [];
      
      // Garcia Residence quote
      const garcia = projects.find(p => p.title === "Garcia Residence");
      if (garcia) {
        quotesData.push({
          projectId: garcia.id,
          quoteNumber: "Q-2025-001",
          materialsCost: 1200.00,
          laborCost: 1000.00,
          additionalCosts: 150.00,
          margin: 20.00,
          totalAmount: 2850.00,
          notes: "Quote sent via email",
          isApproved: false,
          sentAt: new Date("2025-04-20")
        });
      }
      
      // Downtown Lofts quote
      const downtown = projects.find(p => p.title === "Downtown Lofts");
      if (downtown) {
        quotesData.push({
          projectId: downtown.id,
          quoteNumber: "Q-2025-002",
          materialsCost: 2200.00,
          laborCost: 2400.00,
          additionalCosts: 200.00,
          margin: 15.00,
          totalAmount: 5450.00,
          notes: "Quote approved by client",
          isApproved: true,
          approvalDate: new Date("2025-04-25"),
          sentAt: new Date("2025-04-18")
        });
      }
      
      if (quotesData.length > 0) {
        const quotes = await db.insert(schema.quotes).values(quotesData).returning();
        console.log(`Created ${quotes.length} quotes`);
      }
    }

    // Check if we already have activities
    const existingActivities = await db.query.activities.findMany();
    if (existingActivities.length === 0) {
      console.log("Seeding activities...");
      
      const activitiesData = await db.insert(schema.activities).values([
        {
          title: "Contract signed for Downtown Lofts project",
          description: "Commercial hallway repaint ($5,450)",
          type: "contract",
          relatedId: (await db.query.projects.findFirst({ where: eq(schema.projects.title, "Downtown Lofts") }))?.id,
          relatedType: "project",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          createdBy: 1
        },
        {
          title: "Parkside Hotel project completed",
          description: "Final inspection passed and client signed off",
          type: "completed",
          relatedId: (await db.query.projects.findFirst({ where: eq(schema.projects.title, "Parkside Hotel") }))?.id,
          relatedType: "project",
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          createdBy: 1
        },
        {
          title: "Hillside Community Center project delayed",
          description: "Material delivery issues - 2 days behind schedule",
          type: "warning",
          relatedId: (await db.query.projects.findFirst({ where: eq(schema.projects.title, "Hillside Community Center") }))?.id,
          relatedType: "project",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          createdBy: 1
        }
      ]).returning();
      console.log(`Created ${activitiesData.length} activities`);
    }

    console.log("Seed completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

seed();
