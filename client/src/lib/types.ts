// PinturaPro shared interface types

export type ClientType = 'residential' | 'commercial' | 'industrial';
export type ProjectStatus = 
  'pending_visit' | 
  'quote_sent' | 
  'quote_approved' | 
  'in_preparation' | 
  'in_progress' | 
  'final_review' | 
  'completed' | 
  'archived';

export type ProjectPriority = 'normal' | 'high' | 'urgent';
export type PersonnelType = 'employee' | 'subcontractor';

export interface KanbanItem {
  id: number;
  title: string;
  status: ProjectStatus;
  description: string;
  address: string;
  date: string;
  assignedTo?: string;
  timeStatus?: 'on_schedule' | 'delayed';
  delayDays?: number;
  value?: number;
  priority?: ProjectPriority;
  clientId: number;
}

export interface StatCard {
  title: string;
  value: string | number;
  subValue?: string;
  icon: string;
  status?: 'success' | 'warning' | 'danger';
  statusText?: string;
  link: string;
  linkText: string;
  bgColor: string;
  iconColor: string;
}

export interface RevenueBreakdownItem {
  title: string;
  value: number;
  percentage: number;
  color: string;
}

export interface Activity {
  id: number;
  title: string;
  description: string;
  time: string;
  type: 'contract' | 'completed' | 'warning' | 'info'; 
}
