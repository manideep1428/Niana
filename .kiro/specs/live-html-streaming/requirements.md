# Requirements Document

## Introduction

This feature implements a live data streaming system for Niana that renders HTML content in an iframe in real-time as it streams from the AI. Similar to the ai-chatbot's data streaming architecture, but specifically designed for live HTML preview rendering. The system will show a loading skeleton while content is being generated and progressively render HTML in an iframe as chunks arrive.

## Glossary

- **Data_Stream_Provider**: A React context provider that manages the streaming data state and provides access to stream data throughout the component tree
- **Data_Stream_Handler**: A component that processes incoming stream deltas and updates the artifact state accordingly
- **Artifact**: A generated HTML design document with associated metadata (id, title, content, status)
- **Iframe_Renderer**: A component that renders HTML content inside an iframe with live updates during streaming
- **Stream_Delta**: An individual chunk of data received from the server during streaming
- **Skeleton_Loader**: A placeholder UI component that displays animated loading states while content is being generated

## Requirements

### Requirement 1: Data Stream Provider

**User Story:** As a developer, I want a centralized data stream context, so that streaming data can be accessed and managed consistently across components.

#### Acceptance Criteria

1. THE Data_Stream_Provider SHALL provide a React context that stores an array of stream deltas
2. THE Data_Stream_Provider SHALL expose a setDataStream function to update the stream state
3. WHEN a component outside the Data_Stream_Provider attempts to use useDataStream, THEN THE System SHALL throw an error indicating the hook must be used within the provider
4. THE Data_Stream_Provider SHALL memoize the context value to prevent unnecessary re-renders

### Requirement 2: Data Stream Handler

**User Story:** As a user, I want the system to process streaming data automatically, so that I see live updates without manual intervention.

#### Acceptance Criteria

1. WHEN stream deltas are received, THE Data_Stream_Handler SHALL process each delta and update the artifact state
2. WHEN a delta of type "data-id" is received, THE Data_Stream_Handler SHALL update the artifact's documentId and set status to "streaming"
3. WHEN a delta of type "data-title" is received, THE Data_Stream_Handler SHALL update the artifact's title
4. WHEN a delta of type "data-content" is received, THE Data_Stream_Handler SHALL append the content to the artifact's existing content
5. WHEN a delta of type "data-finish" is received, THE Data_Stream_Handler SHALL set the artifact status to "idle"
6. WHEN a delta of type "data-clear" is received, THE Data_Stream_Handler SHALL clear the artifact's content and set status to "streaming"
7. THE Data_Stream_Handler SHALL clear processed deltas from the stream after handling them

### Requirement 3: Live Iframe HTML Rendering

**User Story:** As a user, I want to see my HTML design render live in an iframe as it streams, so that I can preview the design in real-time.

#### Acceptance Criteria

1. WHEN artifact content is updated during streaming, THE Iframe_Renderer SHALL update the iframe's srcdoc attribute with the current HTML content
2. THE Iframe_Renderer SHALL render a complete HTML document structure even with partial content
3. WHEN the artifact status is "streaming", THE Iframe_Renderer SHALL continue accepting and rendering content updates
4. WHEN the artifact status changes to "idle", THE Iframe_Renderer SHALL display the final complete content
5. THE Iframe_Renderer SHALL handle malformed HTML gracefully without crashing

### Requirement 4: Streaming Skeleton Loader

**User Story:** As a user, I want to see a loading indicator while content is being generated, so that I know the system is working.

#### Acceptance Criteria

1. WHEN artifact status is "streaming" and content is empty, THE Skeleton_Loader SHALL display an animated loading skeleton
2. THE Skeleton_Loader SHALL display a "Creating design..." message with animated dots
3. WHEN artifact content begins arriving, THE Skeleton_Loader SHALL transition to showing the live iframe preview
4. THE Skeleton_Loader SHALL include animated shimmer effects to indicate active generation
5. WHEN artifact status is "idle", THE Skeleton_Loader SHALL not be displayed

### Requirement 5: Artifact State Management

**User Story:** As a developer, I want a robust artifact state management system, so that streaming artifacts can be tracked and updated reliably.

#### Acceptance Criteria

1. THE Artifact_State SHALL include: documentId, title, content, status, and isVisible properties
2. WHEN a new artifact stream begins, THE System SHALL initialize the artifact with status "streaming"
3. THE System SHALL support multiple concurrent streaming artifacts tracked by their documentId
4. WHEN setStreamingArtifact is called, THE System SHALL update or create the artifact entry in the streaming artifacts map
5. WHEN clearStreamingArtifact is called, THE System SHALL remove the artifact from the streaming artifacts map

### Requirement 6: Chat API Streaming Integration

**User Story:** As a user, I want the chat API to stream HTML content progressively, so that I see the design build up in real-time.

#### Acceptance Criteria

1. WHEN the AI generates HTML content via create_artifact tool, THE Chat_API SHALL stream the content in chunks
2. THE Chat_API SHALL send stream events with type "artifact-content-delta" containing partial HTML content
3. THE Chat_API SHALL send a "artifact-finish" event when the artifact generation is complete
4. WHEN streaming begins, THE Chat_API SHALL first send "artifact-id" and "artifact-title" events
5. IF an error occurs during streaming, THEN THE Chat_API SHALL send an error event and close the stream gracefully

### Requirement 7: Design Preview Component Integration

**User Story:** As a user, I want to click on a design preview card to open the full iframe view, so that I can see and interact with my design.

#### Acceptance Criteria

1. WHEN isStreaming is true, THE Design_Preview SHALL display the skeleton loader
2. WHEN isStreaming is false and content exists, THE Design_Preview SHALL display a clickable preview card
3. WHEN the preview card is clicked, THE System SHALL open the full iframe renderer with the artifact content
4. THE Design_Preview SHALL display the artifact title on the preview card
5. WHEN transitioning from streaming to idle, THE Design_Preview SHALL animate smoothly to the final state
