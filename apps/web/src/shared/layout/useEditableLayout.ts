import { useState, useCallback } from 'react';

export interface LayoutElementConfig {
  id: string;
  label: string;
  order: number;
  widthRatio: number;   // 0.25 to 1.0
  heightPx: number;     // Min 150px
  opacity: number;      // 0.1 to 1.0
  fontSizeScale: number;// 0.7 to 1.4
  visible: boolean;
}

export type PresetSlot = 'layout_1' | 'layout_2' | 'layout_3';

export interface PageLayoutSchema {
  activePreset: PresetSlot;
  presets: Record<PresetSlot, LayoutElementConfig[]>;
}

export function useEditableLayout(
  pageId: string,
  defaultElements: LayoutElementConfig[]
) {
  const storageKey = `jarvis_layout_${pageId}`;

  const createDefaultSchema = (): PageLayoutSchema => ({
    activePreset: 'layout_1',
    presets: {
      layout_1: JSON.parse(JSON.stringify(defaultElements)),
      layout_2: JSON.parse(JSON.stringify(defaultElements)),
      layout_3: JSON.parse(JSON.stringify(defaultElements)),
    },
  });

  const [schema, setSchema] = useState<PageLayoutSchema>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.presets) {
            return parsed;
          }
        }
      }
    } catch (_) {}
    return createDefaultSchema();
  });

  const [isEditMode, setIsEditMode] = useState(false);

  // Sync to localStorage
  const persistSchema = useCallback(
    (newSchema: PageLayoutSchema) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(storageKey, JSON.stringify(newSchema));
        }
      } catch (_) {}
    },
    [storageKey]
  );

  const activeElements = schema.presets[schema.activePreset] || defaultElements;

  const updateElement = useCallback(
    (id: string, partial: Partial<LayoutElementConfig>) => {
      setSchema((prev) => {
        const currentList = prev.presets[prev.activePreset] || defaultElements;
        const updatedList = currentList.map((el) => {
          if (el.id === id) {
            return { ...el, ...partial };
          }
          return el;
        });

        const nextSchema: PageLayoutSchema = {
          ...prev,
          presets: {
            ...prev.presets,
            [prev.activePreset]: updatedList,
          },
        };
        persistSchema(nextSchema);
        return nextSchema;
      });
    },
    [defaultElements, persistSchema]
  );

  const reorderElements = useCallback(
    (sourceId: string, targetId: string) => {
      setSchema((prev) => {
        const currentList = [...(prev.presets[prev.activePreset] || defaultElements)];
        const srcIdx = currentList.findIndex((e) => e.id === sourceId);
        const tgtIdx = currentList.findIndex((e) => e.id === targetId);
        if (srcIdx === -1 || tgtIdx === -1 || srcIdx === tgtIdx) return prev;

        const [moved] = currentList.splice(srcIdx, 1);
        currentList.splice(tgtIdx, 0, moved);

        const reordered = currentList.map((el, idx) => ({ ...el, order: idx }));
        const nextSchema: PageLayoutSchema = {
          ...prev,
          presets: {
            ...prev.presets,
            [prev.activePreset]: reordered,
          },
        };
        persistSchema(nextSchema);
        return nextSchema;
      });
    },
    [defaultElements, persistSchema]
  );

  const switchPreset = useCallback(
    (slot: PresetSlot) => {
      setSchema((prev) => {
        const nextSchema = { ...prev, activePreset: slot };
        persistSchema(nextSchema);
        return nextSchema;
      });
    },
    [persistSchema]
  );

  const resetToDefault = useCallback(() => {
    const fresh = createDefaultSchema();
    setSchema(fresh);
    persistSchema(fresh);
  }, [defaultElements, persistSchema]);

  return {
    isEditMode,
    setIsEditMode,
    activePreset: schema.activePreset,
    activeElements,
    updateElement,
    reorderElements,
    switchPreset,
    resetToDefault,
  };
}
