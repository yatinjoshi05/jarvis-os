// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — BrainEngine (Phase 2.2 extended)
// Context-aware AI execution with memory intelligence + auto-memory
// ─────────────────────────────────────────────────────────────────────────────

export class BrainEngine {
  constructor(services) { Object.assign(this, services); }

  async execute(request) {
    const conversationId = request.conversationId || crypto.randomUUID();
    this.events.publish('BrainStarted', { conversationId });
    this.conversations.append(conversationId, { role: 'user', content: request.message });

    try {
      const conversation = this.conversations.get(conversationId);

      // ── Memory context retrieval (Phase 2.2: semantic search) ─────────────
      let memoryReferences = [];
      let memoryContextString = '';

      if (this.memory) {
        try {
          // Use semantic search if intelligence service is available
          const searchFn = this.memoryIntelligence
            ? (q, opts) => this.memoryIntelligence.semanticSearch(q, opts)
            : (q, opts) => this.memory.search({ query: q, limit: opts.limit });

          const searchResults = await searchFn(request.message, { limit: 6, threshold: 0.15 });

          // Results are { entry, totalScore, explanation } (semantic) or { memory, score } (keyword)
          memoryReferences = searchResults.map(r => r.entry || r.memory).filter(Boolean);

          // Build context string for prompt injection
          if (this.memoryIntelligence && searchResults.length > 0) {
            const context = await this.memoryIntelligence.buildContext(request.message, 5);
            memoryContextString = context.contextString;
          }
        } catch (err) {
          console.warn('[BrainEngine] Memory retrieval error:', err.message);
        }
      }

      const context = await this.context.build({
        conversation,
        selectedAgent: request.selectedAgent,
        runtime: request.runtime,
        preferences: request.preferences,
        activeTasks: request.activeTasks,
        memoryReferences,
      });

      this.events.publish('Thinking', { conversationId });
      const plan = await this.planner.plan(request, context);
      const agentResults = await this.agents.dispatch(plan);

      // Compose system prompt with injected memory context
      const systemPrompt = this.prompts.composeWithMemory(request, memoryContextString);

      const completion = await this.providers.complete({
        messages: conversation.messages,
        systemPrompt,
        preferredProvider: request.preferredProvider,
        config: request.config,
      });

      const response = this.composer.compose({ completion, agentResults });
      this.conversations.append(conversationId, { role: 'assistant', content: response.text });
      this.events.publish('ResponseCompleted', { conversationId });

      // ── Auto-memory evaluation (Phase 2.2) ───────────────────────────────
      if (this.autoMemory) {
        this.autoMemory.evaluate(conversation, response, {
          conversationId,
          source: request.selectedAgent || 'chat',
          projectId: request.projectId,
          missionId: request.missionId,
        }).catch(err => console.warn('[BrainEngine] AutoMemory evaluation error:', err.message));
      }

      return { conversationId, plan, response };
    } catch (error) {
      this.events.publish('ErrorOccurred', { conversationId, message: error.message });
      throw error;
    }
  }
}
