# Requirements Document

## Introduction

This feature enhances Niana's existing design generation system to support live HTML streaming. Currently, HTML content arrives all at once after the AI completes generation. This feature will:
1. Stream HTML content progressively to the existing iframe renderer (DesignNode) so users see the design build up in real-time
2. Add an inline document preview card in chat messages (like ai-chatbot) with a loading skeleton while generating

## Glossary

- **Design_Node**: The existing component that renders HTML designs in an iframe on the canvas
- **Document_Preview_Card**: A new inline card component shown in chat messages that displays loading state and links to the design
- **Inline_Skeleton**: An animated placeholder shown inside the document preview card while content is being generated
- **Streaming_Design**: A design that is currently receiving content chunks from the AI
- **Pending_Design**: A placeholder design shown on canvas while waiting for content (existing skeleton in DesignNode)

## Requirements

### Requirement 1: Progressive HTML Content Streaming

**User Story:** As a user, I want to see my HTML design build up in real-time in the existing iframe, so that I can watch the design being created.

#### Acceptance Criteria

1. WHEN the AI generates HTML content via create_artifact tool, THE Chat_API SHALL stream the HTML content in chunks rather than sending it all at once
2. THE Chat_API SHALL send an "artifact-start" event with artifact id and title when generation begins
3. THE Chat_API SHALL send multiple "artifact-delta" events containing incremental HTML content chunks
4. THE Chat_API SHALL send an "artifact-end" event when the artifact generation is complete
5. WHEN artifact-delta events are received, THE Design_Node iframe SHALL update its srcdoc with the accumulated content
6. THE Design_Node SHALL continue showing the skeleton until the first content chunk arrives

### Requirement 2: Inline Document Preview Card in Chat

**User Story:** As a user, I want to see a document preview card in the chat messages while my design is being created, so that I can track progress and click to view the design.

#### Acceptance Criteria

1. WHEN an artifact is being generated, THE System SHALL display a Document_Preview_Card in the chat message area
2. THE Document_Preview_Card SHALL show a header with a loading spinner icon and the artifact title during streaming
3. WHEN artifact is streaming and content is empty, THE Document_Preview_Card SHALL display the Inline_Skeleton inside the card body
4. THE Inline_Skeleton SHALL display animated placeholder lines mimicking document content (similar to ai-chatbot's InlineDocumentSkeleton)
5. WHEN artifact is streaming and content exists, THE Document_Preview_Card SHALL show a mini HTML preview
6. THE Document_Preview_Card SHALL include a fullscreen/expand icon button
7. WHEN the Document_Preview_Card is clicked, THE System SHALL select that artifact on the canvas

### Requirement 3: Streaming State Management

**User Story:** As a developer, I want to track which designs are currently streaming, so that UI components can show appropriate loading states.

#### Acceptance Criteria

1. THE System SHALL track streaming designs with their current content in the existing pendingDesigns state
2. WHEN an artifact-start event is received, THE System SHALL add a new streaming design entry with empty content
3. WHEN artifact-delta events are received, THE System SHALL update the streaming design's content by appending the chunk
4. WHEN an artifact-end event is received, THE System SHALL mark the design as complete and save to database
5. THE streaming design content SHALL be passed to Design_Node for live iframe updates

### Requirement 4: Chat API Streaming Enhancement

**User Story:** As a user, I want the chat API to stream HTML content progressively, so that I see the design build up in real-time.

#### Acceptance Criteria

1. WHEN processing create_artifact tool call, THE Chat_API SHALL NOT wait for complete content before sending
2. THE Chat_API SHALL stream the HTML content in chunks of approximately 100-200 characters
3. THE Chat_API SHALL send artifact-start event immediately when tool call begins
4. THE Chat_API SHALL send artifact-delta events as content chunks become available
5. THE Chat_API SHALL send artifact-end event with final content when tool call completes
6. IF an error occurs during streaming, THEN THE Chat_API SHALL send an error event

### Requirement 5: Visual Feedback During Streaming

**User Story:** As a user, I want clear visual feedback showing that content is being generated, so that I understand the system is working.

#### Acceptance Criteria

1. WHEN a design is streaming, THE Document_Preview_Card header SHALL display an animated spinning loader icon
2. WHEN a design is complete, THE Document_Preview_Card header SHALL display a static file icon
3. THE Inline_Skeleton SHALL include animated pulse effects on placeholder elements
4. THE Design_Node skeleton SHALL continue showing until first content chunk arrives
5. WHEN streaming completes, THE Document_Preview_Card SHALL smoothly transition to show the final preview
