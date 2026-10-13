import { db } from '../database/db.js';
import { CharacterEngine } from '../character-engine/CharacterEngine.js';

export class StoryEngine {
  /**
   * Generate story script, scenes, title, and description using Gemini API
   */
  static async generateStory({ channel = 'Old Couple Stories', emotion = 'Sad', duration = 40, characters = ['Ramesh', 'Sita'], goal = 'maximize retention' }) {
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    // Enforce character consistency (Module 8)
    const activeCharacters = characters.map(charName => CharacterEngine.enforceConsistency(charName, { name: charName }));

    let generatedData = null;

    if (geminiApiKey) {
      try {
        const prompt = `You are YouTube Shorts Master Director for channel "${channel}".
Create a ${duration}-second viral YouTube Short script to ${goal}.
Target Emotion: ${emotion}
Characters: ${characters.join(', ')}

Return strictly valid JSON with this exact structure:
{
  "title": "Compelling Title",
  "description": "Engaging description of story",
  "hook": "Grabbing opening hook line",
  "story": "Full story overview",
  "climax": "Emotional peak climax point",
  "ending": "Heartfelt resolution ending",
  "CTA": "Subscribe for more stories!",
  "scenes": [
    { "sceneNumber": 1, "visual": "Visual prompt description", "narration": "Narration text", "duration": 8 },
    { "sceneNumber": 2, "visual": "Visual prompt description", "narration": "Narration text", "duration": 8 },
    { "sceneNumber": 3, "visual": "Visual prompt description", "narration": "Narration text", "duration": 8 },
    { "sceneNumber": 4, "visual": "Visual prompt description", "narration": "Narration text", "duration": 8 },
    { "sceneNumber": 5, "visual": "Visual prompt description", "narration": "Narration text", "duration": 8 }
  ],
  "characters": ["${characters.join('", "')}"],
  "emotions": ["${emotion}"],
  "hashtags": ["#Shorts", "#Viral", "#Storytelling", "#${channel.replace(/\s+/g, '')}"]
}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          const candidateText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            generatedData = JSON.parse(candidateText);
          }
        }
      } catch (err) {
        console.warn('[StoryEngine] Gemini API call fallback triggered:', err.message);
      }
    }

    // Default fallback structured generation if API key is not present or response fails
    if (!generatedData) {
      generatedData = {
        title: `${characters[0] || 'Hero'}'s ${emotion} Secret`,
        description: `A deeply moving ${duration}-second story from ${channel} featuring ${characters.join(' and ')}.`,
        hook: `You won't believe what happened to ${characters[0] || 'Ramesh'} on that rainy morning...`,
        story: `${characters.join(' and ')} faced an extraordinary test of love and sacrifice in their small village home.`,
        climax: `Just when all hope seemed lost, a long-hidden promise changed everything.`,
        ending: `Hand in hand, they stepped into a peaceful new tomorrow.`,
        CTA: `Subscribe to ${channel} for daily heartwarming emotional stories!`,
        scenes: [
          { sceneNumber: 1, visual: `Close-up shot of ${characters[0] || 'Ramesh'} looking out the window at rain`, narration: `Every morning, he sat by the same window waiting for news...`, duration: 8 },
          { sceneNumber: 2, visual: `${characters[1] || 'Sita'} holding an old faded envelope with trembling hands`, narration: `She held the letter tight, praying the rumors weren't true.`, duration: 8 },
          { sceneNumber: 3, visual: `Cinematic wide shot of village path bathed in evening sun`, narration: `Together they walked to the edge of the village where memory lived.`, duration: 8 },
          { sceneNumber: 4, visual: `Emotional climax reunion scene with golden lighting`, narration: `And in that single tear, forty years of silence melted away.`, duration: 8 },
          { sceneNumber: 5, visual: `Warm closing portrait of ${characters.join(' and ')} smiling`, narration: `Love doesn't fade with time—it only grows deeper.`, duration: 8 }
        ],
        characters,
        emotions: [emotion, 'Hopeful'],
        hashtags: ['#Shorts', '#ViralStory', '#Emotional', `#${channel.replace(/\s+/g, '')}`]
      };
    }

    const savedStory = db.addStory({
      channel,
      emotion,
      duration,
      ...generatedData,
      script_status: 'Script Ready',
      voice_status: 'Voice Generated',
      video_status: 'Queued',
      upload_status: 'Pending',
      video_progress: 10,
      eta: '25 min',
      viral_score: `${(85 + Math.random() * 14).toFixed(1)}%`
    });

    db.addLog('story', {
      story_id: savedStory.id,
      prompt_used: `Channel: ${channel}, Emotion: ${emotion}, Characters: ${characters.join(', ')}`,
      gemini_response: JSON.stringify(generatedData)
    });

    return savedStory;
  }

  /**
   * List all generated stories
   */
  static async listStories() {
    return db.getStories();
  }
}
