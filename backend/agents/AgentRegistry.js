export class AgentRegistry {
  static agents = new Map([
    ['ProducerAgent', { id: 'agent-1', name: 'Producer Agent', role: 'Production Manager', status: 'idle', currentTask: null, completedTasks: 142, failedTasks: 0, avgProcessingTime: '1.2s', performanceScore: 99.4 }],
    ['TrendResearchAgent', { id: 'agent-2', name: 'Trend Research Agent', role: 'Viral Intelligence', status: 'idle', currentTask: null, completedTasks: 210, failedTasks: 1, avgProcessingTime: '2.4s', performanceScore: 98.6 }],
    ['StoryWriterAgent', { id: 'agent-3', name: 'Story Writer Agent', role: 'Scriptwriter', status: 'idle', currentTask: null, completedTasks: 195, failedTasks: 2, avgProcessingTime: '3.1s', performanceScore: 97.9 }],
    ['CharacterAgent', { id: 'agent-4', name: 'Character Agent', role: 'Visual Identity Manager', status: 'idle', currentTask: null, completedTasks: 180, failedTasks: 0, avgProcessingTime: '1.8s', performanceScore: 99.1 }],
    ['CinematographyAgent', { id: 'agent-5', name: 'Cinematography Agent', role: 'Director of Photography', status: 'idle', currentTask: null, completedTasks: 165, failedTasks: 0, avgProcessingTime: '2.0s', performanceScore: 98.8 }],
    ['VoiceAgent', { id: 'agent-6', name: 'Voice Agent', role: 'Audio & Speech Synthesizer', status: 'idle', currentTask: null, completedTasks: 190, failedTasks: 1, avgProcessingTime: '2.7s', performanceScore: 98.2 }],
    ['VideoEditorAgent', { id: 'agent-7', name: 'Video Editor Agent', role: 'Post-Production Editor', status: 'idle', currentTask: null, completedTasks: 175, failedTasks: 0, avgProcessingTime: '4.5s', performanceScore: 99.0 }],
    ['ThumbnailAgent', { id: 'agent-8', name: 'Thumbnail Agent', role: 'CTR Visual Artist', status: 'idle', currentTask: null, completedTasks: 155, failedTasks: 0, avgProcessingTime: '1.5s', performanceScore: 97.5 }],
    ['SEOAgent', { id: 'agent-9', name: 'SEO Agent', role: 'Search & Metadata Specialist', status: 'idle', currentTask: null, completedTasks: 205, failedTasks: 0, avgProcessingTime: '0.9s', performanceScore: 99.6 }],
    ['PublisherAgent', { id: 'agent-10', name: 'Publisher Agent', role: 'YouTube Upload Manager', status: 'idle', currentTask: null, completedTasks: 200, failedTasks: 1, avgProcessingTime: '3.8s', performanceScore: 98.7 }],
    ['AnalyticsAgent', { id: 'agent-11', name: 'Analytics Agent', role: 'Audience Data Analyst', status: 'idle', currentTask: null, completedTasks: 230, failedTasks: 0, avgProcessingTime: '1.1s', performanceScore: 99.2 }],
    ['QualityControlAgent', { id: 'agent-12', name: 'Quality Control Agent', role: 'Chief Quality Inspector', status: 'idle', currentTask: null, completedTasks: 198, failedTasks: 3, avgProcessingTime: '1.4s', performanceScore: 98.5 }]
  ]);

  /**
   * List all registered agents
   */
  static listAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent by name
   */
  static getAgent(agentName) {
    return this.agents.get(agentName) || null;
  }

  /**
   * Update agent status and current task
   */
  static updateStatus(agentName, status, currentTask = null) {
    const agent = this.agents.get(agentName);
    if (agent) {
      agent.status = status;
      agent.currentTask = currentTask;
      if (status === 'idle') {
        agent.completedTasks += 1;
      }
    }
  }
}
