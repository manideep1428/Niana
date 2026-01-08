# Implementation Plan: Live HTML Streaming

## Overview

This implementation plan enhances Niana's existing design generation to support live HTML streaming. The approach modifies the Chat API to stream content in chunks and updates the client to handle progressive updates to the existing DesignNode iframe.

## Tasks

- [x] 1. Create Inline Document Skeleton Component
  - [x] 1.1 Create `Niana/components/inline-document-skeleton.tsx`
    - Create InlineDocumentSkeleton component with animated placeholder lines
    - Use animate-pulse class for loading animation
    - Style with muted-foreground/20 background colors matching ai-chatbot pattern
    - Export component for use in DocumentPreviewCard
    - _Requirements: 2.4_

- [x] 2. Create Mini HTML Preview Component
  - [x] 2.1 Create `Niana/components/mini-html-preview.tsx`
    - Create MiniHtmlPreview component that renders HTML in a scaled iframe
    - Wrap partial HTML in valid document structure if needed
    - Apply CSS transform scale(0.5) for thumbnail view
    - Set pointer-events-none to prevent interaction
    - _Requirements: 2.5_

- [x] 3. Create Document Preview Card Component
  - [x] 3.1 Create `Niana/components/document-preview-card.tsx`
    - Create DocumentPreviewCard with props: artifactId, title, content, isStreaming, onClick
    - Render header with Loader2 spinner when streaming, FileIcon when complete
    - Render InlineDocumentSkeleton when streaming with empty content
    - Render MiniHtmlPreview when content exists
    - Include fullscreen icon in header
    - Handle click to call onClick with artifactId
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7_

  - [ ]* 3.2 Write property test for conditional rendering
    - **Property 4: Document Preview Conditional Rendering**
    - **Validates: Requirements 2.3, 2.5**

- [x] 4. Checkpoint - UI Components Complete
  - Ensure components render correctly
  - Test skeleton and preview states manually
  - Ask the user if questions arise

- [x] 5. Update Chat API for Progressive Streaming
  - [x] 5.1 Modify `Niana/app/(auth)/api/chat/route.ts` to stream artifact content
    - Add new SSE event types: artifact-start, artifact-delta, artifact-end
    - When create_artifact tool call is detected, send artifact-start immediately
    - Stream content in chunks of ~150 characters using artifact-delta events
    - Send artifact-end with complete content when done
    - Add small delay between chunks (10ms) for visual streaming effect
    - Handle errors by sending error event with artifactId
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 5.2 Write property test for content chunking
    - **Property 1: Content Chunking**
    - **Validates: Requirements 1.1, 1.3, 4.2, 4.4**

  - [ ]* 5.3 Write property test for event ordering
    - **Property 2: Event Ordering**
    - **Validates: Requirements 1.2, 4.3**

- [x] 6. Update Design Page State Management
  - [x] 6.1 Add streaming designs state to `Niana/app/(design)/design/[id]/page.tsx`
    - Add streamingDesigns Map state to track designs being streamed
    - Create handleArtifactStart function to initialize streaming design
    - Create handleArtifactDelta function to append content chunks
    - Create handleArtifactEnd function to save to database and clear streaming state
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 6.2 Write property test for content accumulation
    - **Property 3: Content Accumulation**
    - **Validates: Requirements 3.3**

- [x] 7. Update SSE Event Handler
  - [x] 7.1 Modify handleSendMessage in design page to handle new event types
    - Add case for artifact-start: call handleArtifactStart
    - Add case for artifact-delta: call handleArtifactDelta
    - Add case for artifact-end: call handleArtifactEnd, save to DB
    - Update existing tool_call handling to work with new streaming flow
    - _Requirements: 1.5, 3.5_

- [x] 8. Checkpoint - Streaming Infrastructure Complete
  - Test that artifact-start, artifact-delta, artifact-end events are sent
  - Test that streaming designs state updates correctly
  - Ask the user if questions arise

- [x] 9. Integrate Document Preview Card into Chat Messages
  - [x] 9.1 Update messages rendering in `Niana/components/app-sidebar.tsx` or message component
    - Import DocumentPreviewCard component
    - Detect streaming artifacts in messages
    - Render DocumentPreviewCard for each artifact with streaming state
    - Pass onClick handler to select artifact on canvas
    - _Requirements: 2.1, 2.7_

- [x] 10. Update DesignNode for Live Content Updates
  - [x] 10.1 Ensure DesignNode receives streaming content from state
    - Verify designs array includes streaming designs with current content
    - Confirm iframe srcdoc updates when content changes
    - Verify skeleton shows when content is empty
    - _Requirements: 1.5, 1.6, 5.4_

  - [ ]* 10.2 Write property test for skeleton display
    - **Property 5: Skeleton Display Until Content**
    - **Validates: Requirements 1.6**

- [x] 11. Final Checkpoint - Integration Complete
  - Test end-to-end flow: send message → see skeleton in chat → see live HTML in canvas
  - Verify DocumentPreviewCard shows loading state then preview
  - Verify clicking card selects artifact on canvas
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- The implementation uses TypeScript and builds on existing Niana patterns
- No new context providers needed - uses existing state management
