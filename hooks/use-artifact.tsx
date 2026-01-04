"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ArtifactContextType {
  selectedArtifactId: string | null;
  setSelectedArtifactId: (id: string | null) => void;
  streamingArtifacts: Map<string, { title: string; content: string }>;
  setStreamingArtifact: (
    id: string,
    data: { title: string; content: string }
  ) => void;
  clearStreamingArtifact: (id: string) => void;
}

const ArtifactContext = createContext<ArtifactContextType | null>(null);

export function ArtifactProvider({ children }: { children: ReactNode }) {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    null
  );
  const [streamingArtifacts, setStreamingArtifacts] = useState<
    Map<string, { title: string; content: string }>
  >(new Map());

  const setStreamingArtifact = (
    id: string,
    data: { title: string; content: string }
  ) => {
    setStreamingArtifacts((prev) => {
      const next = new Map(prev);
      next.set(id, data);
      return next;
    });
  };

  const clearStreamingArtifact = (id: string) => {
    setStreamingArtifacts((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <ArtifactContext.Provider
      value={{
        selectedArtifactId,
        setSelectedArtifactId,
        streamingArtifacts,
        setStreamingArtifact,
        clearStreamingArtifact,
      }}
    >
      {children}
    </ArtifactContext.Provider>
  );
}

export function useArtifact() {
  const context = useContext(ArtifactContext);
  if (!context) {
    throw new Error("useArtifact must be used within an ArtifactProvider");
  }
  return context;
}
