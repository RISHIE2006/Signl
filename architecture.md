# Application Architecture Design

This document outlines the system architecture of the **Signl** application, reflecting the core platform and the recently added job search automation features.

## Architecture Diagram

```mermaid
graph TD
    %% Styling Definitions
    classDef frontend fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:white,rx:8px,ry:8px
    classDef backend fill:#10b981,stroke:#047857,stroke-width:2px,color:white,rx:8px,ry:8px
    classDef storage fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:white,rx:8px,ry:8px
    classDef external fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:white,rx:8px,ry:8px
    classDef user fill:#64748b,stroke:#475569,stroke-width:2px,color:white,rx:20px,ry:20px

    User((User / Browser)):::user

    subgraph Client [Client-Side App Browser Context]
        UI[Next.js React Frontend<br/>Pages, Tailwind, Framer Motion]:::frontend
        Store[(Local Storage<br/>User Data Persistence)]:::storage
    end

    subgraph Server [Next.js Server Backend]
        API[Next.js API Routes<br/>/api/analyse, /api/cover-letter, /api/feedback, /api/learning-path]:::backend
        Parsers[Document Parsers<br/>mammoth, pdf-parse]:::backend
    end

    subgraph Ext [External Services]
        Clerk[Clerk<br/>Authentication & Session]:::external
        Gemini[Google Gemini API<br/>gemini-2.0-flash / gemini-flash-latest]:::external
    end

    %% Relationships and Flows
    User -->|Interacts with| UI
    
    UI <-->|Authenticates / Gets User ID| Clerk
    UI <-->|Saves & Reads Data by Namespace| Store
    UI -->|Sends Input & Files via HTTP POST| API
    
    API -->|Extracts Text from Resumes| Parsers
    Parsers -->|Returns Parsed Text| API
    
    API <-->|Sends Prompts & Receives Structured JSON| Gemini
```

## Component Overview

### 1. Frontend (Client-Side)
- **Framework**: Next.js (App Router, React 19) with Tailwind CSS for styling.
- **Interactivity**: Framer Motion for micro-animations and smooth page transitions.
- **Visuals**: Lucide-React for iconography and Recharts for data visualization (funnels, benchmarks).
- **Navigation**: Centrally managed via `src/components/Sidebar.js`.

### 2. State Management & Data Persistence
- **Local Cache**: All user data (profiles, applications, analyses, interview prep, and benchmarks) is stored in the browser's **`localStorage`**.
- **Namespacing**: `src/lib/store.js` uses Clerk's `userId` as a namespace prefix to ensure data privacy if different users log in on the same browser instance.

### 3. Core AI Integration (The Gemini Engine)
- **Primary AI**: Google Gemini API (`@google/generative-ai` SDK).
- **Models**: Uses `gemini-2.0-flash` for high-speed, intelligent processing, with an automatic fallback to `gemini-flash-latest` for maximum reliability.
- **Flow**: API routes act as a secure proxy, providing Gemini with structured context (Resume + JD) and enforcing JSON output schemas.

### 4. Extended Job Search Suite (New Features)
- **Outreach Generator (`/api/cover-letter`)**: Synthesizes resume highlights with job requirements to draft professional cover letters and cold emails.
- **Interview Sandbox (`/api/feedback`)**: Evaluates user practice answers against a 1-10 scale using the STAR method, providing specific improvements and ideal sample responses.
- **Learning Bridge (`/api/learning-path`)**: Automatically creates a curated study plan with external resource links to bridge identified "Skill Gaps" from the Resume Analyser.

### 5. Authentication & Security
- **Clerk**: Handles the entire auth lifecycle. Session management is handled on the server via Clerk middleware, ensuring only authenticated users can access the dashboard and APIs.

## Sequence Diagrams

### 1. Resume Analysis Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend (React)
    participant B as Backend (Next.js API)
    participant P as Parsers (mammoth/pdf)
    participant G as Gemini AI

    U->>F: Upload Resume + Paste JD
    F->>B: POST /api/analyse (FormData)
    B->>P: Extract Text (Buffer)
    P-->>B: Return Raw Text
    B->>G: Send Prompt (Text + JD)
    G-->>B: Return JSON Analysis
    B-->>F: Return Result + Extracted Text
    F->>F: Save to LocalStorage[userId]
    F-->>U: Display Match Score & Gaps
```

### 2. Outreach & Interview Feedback Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend (React)
    participant B as Backend (Next.js API)
    participant G as Gemini AI

    U->>F: Click "Generate Cover Letter" or "Submit Answer"
    F->>F: Retrieve Context from LocalStorage
    F->>B: POST /api/outreach OR /api/feedback (JSON)
    B->>G: Send Tailored Prompt
    G-->>B: Return Structured Response
    B-->>F: Return Result
    F-->>U: Display Content/Score
```

## Data Model (Local Storage)
All data is stored as JSON objects in `localStorage`, namespaced by the user's unique Clerk ID (`signl_{clerk_id}_{type}`).

| Key | Description | Structure |
| :--- | :--- | :--- |
| `profile` | User onboarding info | `{ name, goal, experienceLevel }` |
| `applications` | Tracked job status | `Array<{ id, company, role, stage, date }>` |
| `analyses` | AI Match results | `Array<{ id, resumeText, jdText, matchScore, gaps, coachInsight }>` |
| `preps` | Interview sessions | `Array<{ id, company, role, questions: [] }>` |
| `benchmarks` | Market data pulse | `{ salary, demand, competition }` |
