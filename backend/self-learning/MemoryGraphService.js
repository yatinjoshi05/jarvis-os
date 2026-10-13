import { KnowledgeGraph } from './KnowledgeGraph.js';

export class MemoryGraphService {
  static getGraphTopology() {
    return {
      nodes: [
        { id: 'node_char_ramesh', type: 'CHARACTER', label: 'Ramesh', properties: { age: 72 } },
        { id: 'node_emotion_sad', type: 'EMOTION', label: 'Sad & Nostalgic', properties: { retentionBoost: 37 } },
        { id: 'node_story_village', type: 'STORY', label: 'Village Homecoming', properties: { views: 95000 } },
        { id: 'node_audience_elders', type: 'AUDIENCE', label: 'Rural Elders', properties: { resonance: '99%' } },
        { id: 'node_learning_thumb', type: 'LEARNING', label: 'Yellow Headline CTR Boost', properties: { ctrDelta: '+2.4%' } }
      ],
      edges: [
        { source: 'node_char_ramesh', target: 'node_story_village', relationship: 'APPEARS_IN', weight: 1.0 },
        { source: 'node_story_village', target: 'node_emotion_sad', relationship: 'EVOKES', weight: 0.95 },
        { source: 'node_emotion_sad', target: 'node_audience_elders', relationship: 'RESONATES_WITH', weight: 0.98 },
        { source: 'node_audience_elders', target: 'node_learning_thumb', relationship: 'INFLUENCES', weight: 0.92 }
      ]
    };
  }

  static searchContext({ character, emotion }) {
    const graph = this.getGraphTopology();
    const matches = graph.nodes.filter(n =>
      (character && n.label.includes(character)) ||
      (emotion && n.label.toLowerCase().includes(emotion.toLowerCase()))
    );

    return {
      query: { character, emotion },
      matches,
      recommendedPath: 'Ramesh ➔ Sad Ending ➔ Village Story ➔ Yellow Headline CTR'
    };
  }
}
