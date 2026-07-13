import { Lead, Customer, Task, Activity } from './interfaces';

export class CRMAnalytics {
  /**
   * Evaluates CRM metrics including pipeline values, task completion rates, and agent performance.
   */
  public static calculateAnalytics(
    leads: Lead[],
    customers: Customer[],
    tasks: Task[],
    activities: Activity[]
  ) {
    // 1. Lead Conversion Rate: Won / (Won + Lost)
    const wonLeads = leads.filter((l) => l.status === 'Won').length;
    const lostLeads = leads.filter((l) => l.status === 'Lost').length;
    const closedCount = wonLeads + lostLeads;
    const conversionRatePercent = closedCount > 0 ? (wonLeads / closedCount) * 100 : 0;

    // 2. Pipeline Value: Sum of potential deals ($1,000 * lead score)
    const pipelineValue = leads
      .filter((l) => l.status !== 'Won' && l.status !== 'Lost')
      .reduce((sum, l) => sum + (l.score * 1000), 0);

    // 3. Agent Performance metrics
    const agentPerformance: Record<string, { completedTasks: number; wonLeadsCount: number }> = {};
    
    leads.forEach((l) => {
      if (l.ownerId) {
        if (!agentPerformance[l.ownerId]) {
          agentPerformance[l.ownerId] = { completedTasks: 0, wonLeadsCount: 0 };
        }
        if (l.status === 'Won') {
          agentPerformance[l.ownerId].wonLeadsCount++;
        }
      }
    });

    tasks.forEach((t) => {
      if (t.status === 'completed' && t.leadId) {
        const lead = leads.find((l) => l.id === t.leadId);
        if (lead && lead.ownerId) {
          if (!agentPerformance[lead.ownerId]) {
            agentPerformance[lead.ownerId] = { completedTasks: 0, wonLeadsCount: 0 };
          }
          agentPerformance[lead.ownerId].completedTasks++;
        }
      }
    });

    // 4. Follow-up completion rate: completed tasks / total tasks
    const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
    const totalTasksCount = tasks.length;
    const taskCompletionRatePercent = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

    // 5. Customer Engagement Index: average activities count per target
    const customerActivityCounts: Record<string, number> = {};
    activities.forEach((act) => {
      const targetId = act.customerId || act.leadId;
      if (targetId) {
        customerActivityCounts[targetId] = (customerActivityCounts[targetId] || 0) + 1;
      }
    });

    const totalEngagedEntities = Object.keys(customerActivityCounts).length;
    const totalActivityLogCount = activities.length;
    const averageEngagementScore = totalEngagedEntities > 0 ? totalActivityLogCount / totalEngagedEntities : 0;

    return {
      conversionRatePercent,
      pipelineValue,
      taskCompletionRatePercent,
      averageEngagementScore,
      agentPerformance,
      totalLeadsCount: leads.length,
      totalCustomersCount: customers.length
    };
  }
}

export default CRMAnalytics;
