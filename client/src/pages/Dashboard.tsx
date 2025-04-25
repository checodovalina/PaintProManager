import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { KanbanItem, StatCard, RevenueBreakdownItem, Activity } from '@/lib/types';
import StatsCard from '@/components/StatsCard';
import KanbanBoard from '@/components/KanbanBoard';
import RecentActivities from '@/components/RecentActivities';
import RevenueBreakdown from '@/components/RevenueBreakdown';
import NewProjectModal from '@/components/NewProjectModal';
import { Button } from '@/components/ui/button';
import { Filter, Plus } from 'lucide-react';

export default function Dashboard() {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['/api/dashboard'],
  });

  // Fetch projects data
  const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
    queryKey: ['/api/projects'],
  });

  // Fetch activities data
  const { data: activitiesData, isLoading: isActivitiesLoading } = useQuery({
    queryKey: ['/api/activities'],
  });

  // Set default values if data is undefined
  const statsCards: StatCard[] = dashboardData?.statsCards || [];
  const revenueBreakdown: RevenueBreakdownItem[] = dashboardData?.revenue || [];
  const activities: Activity[] = activitiesData?.activities || [];
  const kanbanItems: KanbanItem[] = projectsData?.projects || [];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
          <Button size="sm" onClick={() => setIsNewProjectModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, index) => (
          <StatsCard key={index} card={card} />
        ))}
      </div>

      {/* Revenue Breakdown */}
      <RevenueBreakdown data={revenueBreakdown} />

      {/* Kanban Board */}
      <KanbanBoard items={kanbanItems} isLoading={isProjectsLoading} />

      {/* Recent Activities */}
      <RecentActivities activities={activities} isLoading={isActivitiesLoading} />

      {/* New Project Modal */}
      <NewProjectModal 
        isOpen={isNewProjectModalOpen} 
        onClose={() => setIsNewProjectModalOpen(false)} 
      />
    </div>
  );
}
