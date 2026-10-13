import { useState, useEffect, useCallback } from 'react';
import * as ytApi from '../api/ytstudioApi';

export function useYTStudio() {
  const [channels, setChannels] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [apiServices, setApiServices] = useState<any[]>([]);
  const [strategyCards, setStrategyCards] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [chData, charData, stData, apiData, stratData] = await Promise.all([
        ytApi.fetchChannels().catch(() => ({ channels: [] })),
        ytApi.fetchCharacters().catch(() => ({ characters: [] })),
        ytApi.fetchStories().catch(() => ({ stories: [] })),
        ytApi.fetchApiStatus().catch(() => ({ services: [] })),
        ytApi.fetchStrategyBrain().catch(() => ({ cards: [] }))
      ]);

      if (chData.channels?.length) setChannels(chData.channels);
      if (charData.characters?.length) setCharacters(charData.characters);
      if (stData.stories?.length) setStories(stData.stories);
      if (apiData.services?.length) setApiServices(apiData.services);
      if (stratData.cards?.length) setStrategyCards(stratData.cards);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSyncChannel = async (channelId: string) => {
    try {
      const res = await ytApi.syncChannel(channelId);
      if (res.channel) {
        setChannels(prev => prev.map(c => c.id === channelId ? res.channel : c));
      }
      return res;
    } catch (err: any) {
      console.error('Failed to sync channel:', err);
      throw err;
    }
  };

  const handleTestApi = async (apiId: string) => {
    try {
      const res = await ytApi.testApiBridge(apiId);
      return res;
    } catch (err: any) {
      console.error('Failed to test API:', err);
      throw err;
    }
  };

  return {
    channels,
    characters,
    stories,
    apiServices,
    strategyCards,
    loading,
    error,
    refresh: loadData,
    handleSyncChannel,
    handleTestApi
  };
}
