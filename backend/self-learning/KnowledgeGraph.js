export class KnowledgeGraph {
  static graph = [
    {
      character: 'Ramesh',
      emotion: 'sad',
      storyType: 'Village Story',
      audienceReaction: '99% Touched & Emotional',
      performance: { retention: '92.4%', ctr: '9.8%', viewsAvg: '145K' }
    },
    {
      character: 'Sita',
      emotion: 'emotional',
      storyType: 'Family Reunion',
      audienceReaction: '98% Loving & Sympathetic',
      performance: { retention: '89.1%', ctr: '8.9%', viewsAvg: '110K' }
    },
    {
      character: 'Farmer',
      emotion: 'flood',
      storyType: 'Disaster Survival',
      audienceReaction: '97% High Suspense',
      performance: { retention: '94.5%', ctr: '10.2%', viewsAvg: '210K' }
    }
  ];

  static getGraph() {
    return this.graph;
  }

  static findPath(characterName) {
    return this.graph.filter(n => n.character.toLowerCase() === characterName.toLowerCase());
  }

  static addNode(node) {
    this.graph.push(node);
    return node;
  }
}
