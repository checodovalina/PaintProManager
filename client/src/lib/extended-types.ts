import { Quote, Project, Client } from "@shared/schema";

// Extendido para incluir relaciones
export interface QuoteWithRelations extends Quote {
  project?: ProjectWithClient;
}

export interface ProjectWithClient extends Project {
  client?: Client;
}