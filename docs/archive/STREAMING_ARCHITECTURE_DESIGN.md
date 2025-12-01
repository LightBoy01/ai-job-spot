# Streaming Architecture Design

**Objective:** Refactor the data pipeline to use a streaming architecture, improving memory efficiency and scalability.

## 1. Current Architecture Limitations

The current architecture buffers all remote items into a `remoteItems` array in memory. This is inefficient for large datasets and can lead to memory exhaustion.

## 2. Proposed Streaming Architecture

The new architecture will use Node.js streams to process data in chunks, without buffering the entire dataset in memory.

### 2.1. Core Components

*   **Source Stream (Readable):** Each data source will be adapted to produce a `Readable` stream. For API-based sources, this will involve fetching data in pages and pushing each item to the stream.
*   **Transformer Streams (Transform):** A series of `Transform` streams will process the data. These will include:
    *   A `Transform` stream to get the ID of each item.
    *   A `Transform` stream to parse and transform the raw item into a `StandardJob` or `StandardBriefing`.
    *   A `Transform` stream to sanitize HTML content.
*   **Writer Stream (Writable):** A `Writable` stream will consume the final processed items and write them to the filesystem.

### 2.2. Data Flow

The data will flow through the pipeline as follows:

`Source Stream` -> `ID Transformer` -> `Parser Transformer` -> `Sanitizer Transformer` -> `Writer Stream`

## 3. Implementation Plan

### 3.1. Create a Generic Stream-based Runner

Create a new `runStreamSource` function that accepts a source stream and an array of transform streams, and pipes them together.

### 3.2. Adapt Sources to be Readable Streams

Refactor each data source to implement a method that returns a `Readable` stream.

### 3.3. Create Transform Streams for Processing

Create `Transform` stream classes for each processing step (ID extraction, parsing, sanitization).

### 3.4. Create a Writable Stream for Writing

Create a `Writable` stream class that takes processed items and writes them to the appropriate files.

### 3.5. Refactor Orchestrators

Refactor `orchestrateJobs` and `orchestrateBriefings` to use the new `runStreamSource` function.

## 4. Rollout Plan

This change will be developed on a separate feature branch. A feature flag will be used to switch between the old and new pipeline implementations to allow for safe testing and a gradual rollout.
