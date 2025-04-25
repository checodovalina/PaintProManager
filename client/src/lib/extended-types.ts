import { Quote, Project, Client, ServiceOrder } from "@shared/schema";

// Extendido para incluir relaciones
export interface QuoteWithRelations extends Quote {
  project?: ProjectWithClient;
}

export interface ProjectWithClient extends Project {
  client?: Client;
}

export interface ServiceOrderWithRelations extends ServiceOrder {
  project?: ProjectWithClient;
}