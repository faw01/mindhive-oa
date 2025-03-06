# Frontend

Next.js application with AI-powered chat interface for Subway outlet information.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **UI**: TailwindCSS + Shadcn/ui
- **AI**: Vercel AI SDK
- **Maps**: Mapbox GL
- **Testing**: Vitest

## Key Features

- Streaming chat interface with GPT-4o
- RAG Vector search using text embeddings model
- Interactive map for outlet locations
- Responsive design optimized for mobile

## Development

```bash
npm install
npm run dev
```

## Testing

```bash
npm test
```

## Architecture

- `app/` - Next.js app router pages and API routes
- `components/` - React components and UI elements
- `lib/` - Utility functions and AI/embedding logic
- `styles/` - Global styles and Tailwind config
