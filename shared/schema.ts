import { pgTable, text, serial, integer, date, timestamp, decimal, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Enums
export const clientTypeEnum = pgEnum('client_type', ['residential', 'commercial', 'industrial']);
export const projectStatusEnum = pgEnum('project_status', [
  'pending_visit', 
  'quote_sent', 
  'quote_approved', 
  'in_preparation', 
  'in_progress', 
  'final_review', 
  'completed', 
  'archived'
]);
export const projectPriorityEnum = pgEnum('project_priority', ['normal', 'high', 'urgent']);
export const personnelTypeEnum = pgEnum('personnel_type', ['employee', 'subcontractor']);
export const userRoleEnum = pgEnum('user_role', ['superadmin', 'admin', 'member', 'viewer']);

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  email: text("email"),
  role: userRoleEnum("role").default("viewer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Clients
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: clientTypeEnum("type").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  isProspect: boolean("is_prospect").default(true),
  notes: text("notes"),
  lastContactDate: date("last_contact_date"),
  nextFollowUp: date("next_follow_up"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

// Projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  status: projectStatusEnum("status").default("pending_visit").notNull(),
  address: text("address"),
  visitDate: date("visit_date"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  value: decimal("value", { precision: 10, scale: 2 }),
  priority: projectPriorityEnum("priority").default("normal"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

// Personnel (employees and subcontractors)
export const personnel = pgTable("personnel", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: personnelTypeEnum("type").notNull(),
  position: text("position").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  rate: text("rate"),
  taxId: text("tax_id"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Project assignments (which personnel is assigned to which project)
export const projectAssignments = pgTable("project_assignments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  personnelId: integer("personnel_id").references(() => personnel.id).notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quotes
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  quoteNumber: text("quote_number").notNull(),
  materialsCost: decimal("materials_cost", { precision: 10, scale: 2 }),
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 }),
  additionalCosts: decimal("additional_costs", { precision: 10, scale: 2 }),
  margin: decimal("margin", { precision: 5, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  isApproved: boolean("is_approved").default(false),
  approvalDate: date("approval_date"),
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at"),
});

// Service orders
export const serviceOrders = pgTable("service_orders", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  orderNumber: text("order_number").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions"),
  startSignature: text("start_signature"),
  endSignature: text("end_signature"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdBy: integer("created_by").references(() => users.id),
});

// Project images (before/after)
export const projectImages = pgTable("project_images", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  imageUrl: text("image_url").notNull(),
  type: text("type").default("before"), // 'before' or 'after'
  caption: text("caption"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id),
});

// Activities
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'contract', 'completed', 'warning', 'info'
  relatedId: integer("related_id"), // Can refer to project, client, etc.
  relatedType: text("related_type"), // 'project', 'client', 'quote', etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  projects: many(projects),
  projectImages: many(projectImages),
  activities: many(activities),
  serviceOrders: many(serviceOrders),
}));

export const clientsRelations = relations(clients, ({ many, one }) => ({
  projects: many(projects),
  createdByUser: one(users, {
    fields: [clients.createdBy],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  createdByUser: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
  quotes: many(quotes),
  serviceOrders: many(serviceOrders),
  projectImages: many(projectImages),
  projectAssignments: many(projectAssignments),
}));

export const personnelRelations = relations(personnel, ({ many }) => ({
  projectAssignments: many(projectAssignments),
}));

export const projectAssignmentsRelations = relations(projectAssignments, ({ one }) => ({
  project: one(projects, {
    fields: [projectAssignments.projectId],
    references: [projects.id],
  }),
  personnel: one(personnel, {
    fields: [projectAssignments.personnelId],
    references: [personnel.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  project: one(projects, {
    fields: [quotes.projectId],
    references: [projects.id],
  }),
}));

export const serviceOrdersRelations = relations(serviceOrders, ({ one }) => ({
  project: one(projects, {
    fields: [serviceOrders.projectId],
    references: [projects.id],
  }),
  createdByUser: one(users, {
    fields: [serviceOrders.createdBy],
    references: [users.id],
  }),
}));

export const projectImagesRelations = relations(projectImages, ({ one }) => ({
  project: one(projects, {
    fields: [projectImages.projectId],
    references: [projects.id],
  }),
  uploadedByUser: one(users, {
    fields: [projectImages.uploadedBy],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  createdByUser: one(users, {
    fields: [activities.createdBy],
    references: [users.id],
  }),
}));

// Validation Schemas
export const clientsInsertSchema = createInsertSchema(clients, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  email: (schema) => schema.email("Must provide a valid email").optional().nullable(),
  phone: (schema) => schema.min(10, "Phone must be at least 10 characters").optional().nullable(),
});

export const projectsInsertSchema = createInsertSchema(projects, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  description: (schema) => schema.min(5, "Description must be at least 5 characters").optional().nullable(),
});

export const personnelInsertSchema = createInsertSchema(personnel, {
  name: (schema) => schema.min(2, "El nombre debe tener al menos 2 caracteres"),
  position: (schema) => schema.min(2, "La posición debe tener al menos 2 caracteres"),
  phone: (schema) => schema.min(10, "El teléfono debe tener al menos 10 caracteres"),
  email: (schema) => schema.email("Debe proporcionar un email válido").optional().nullable(),
  address: (schema) => schema.optional().nullable(),
  rate: (schema) => schema.optional().nullable(),
  taxId: (schema) => schema.optional().nullable(),
  notes: (schema) => schema.optional().nullable(),
});

export const quotesInsertSchema = createInsertSchema(quotes);
export const serviceOrdersInsertSchema = createInsertSchema(serviceOrders, {
  description: (schema) => schema.min(5, "Description must be at least 5 characters"),
});
export const projectImagesInsertSchema = createInsertSchema(projectImages);
export const activitiesInsertSchema = createInsertSchema(activities, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
});

// Types
export type Client = typeof clients.$inferSelect;
export type ClientInsert = z.infer<typeof clientsInsertSchema>;

export type Project = typeof projects.$inferSelect;
export type ProjectInsert = z.infer<typeof projectsInsertSchema>;

export type Personnel = typeof personnel.$inferSelect;
export type PersonnelInsert = z.infer<typeof personnelInsertSchema>;

export type Quote = typeof quotes.$inferSelect;
export type QuoteInsert = z.infer<typeof quotesInsertSchema>;

export type ServiceOrder = typeof serviceOrders.$inferSelect;
export type ServiceOrderInsert = z.infer<typeof serviceOrdersInsertSchema>;

export type ProjectImage = typeof projectImages.$inferSelect;
export type ProjectImageInsert = z.infer<typeof projectImagesInsertSchema>;

export type Activity = typeof activities.$inferSelect;
export type ActivityInsert = z.infer<typeof activitiesInsertSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  password: (schema) => schema.min(6, "La contraseña debe tener al menos 6 caracteres"),
  email: (schema) => schema.email("Debe proporcionar un email válido").optional(),
  fullName: (schema) => schema.min(3, "El nombre completo debe tener al menos 3 caracteres").optional(),
});
