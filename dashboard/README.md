# E-commerce Orchestrator Dashboard

A comprehensive React-based dashboard for the E-commerce Orchestrator project. This dashboard provides a user-friendly interface to manage, monitor, and visualize e-commerce automation workflows.

## Features

- **Real-time Test Execution**: Run and monitor automation tests directly from the dashboard
- **Interactive Controls**: Configure test parameters with an intuitive interface
- **Visual Results**: View screenshots and detailed logs from test runs
- **Test History**: Browse and filter past test results
- **Responsive Design**: Optimized for desktop and mobile devices
- **Accessibility**: High contrast mode and other accessibility features

## Technology Stack

- **Next.js**: React framework for server-rendered applications
- **Material UI**: Component library for modern UI design
- **React Query**: Data fetching and state management
- **TypeScript**: Type-safe JavaScript
- **Docker**: Containerized deployment

## Getting Started

### Prerequisites

- Node.js 18+ (or Docker for containerized setup)
- Backend API running (see main project README)

### Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Docker Setup

The dashboard can be run as part of the complete E-commerce Orchestrator stack using Docker Compose:

```bash
docker-compose up -d
```

This will start the dashboard along with the backend API, worker service, and required databases.

## Project Structure

```
dashboard/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Next.js pages
│   │   ├── dashboard/  # Dashboard pages
│   │   ├── _app.tsx    # App wrapper
│   │   └── index.tsx   # Entry point
│   ├── styles/         # Global styles
│   └── utils/          # Utility functions
├── public/             # Static assets
├── Dockerfile          # Docker configuration
├── next.config.js      # Next.js configuration
├── package.json        # Dependencies
└── tsconfig.json       # TypeScript configuration
```

## API Integration

The dashboard communicates with the backend API through RESTful endpoints. The API base URL is configured in the `.env` file or through environment variables in Docker.

## Accessibility

The dashboard is designed with accessibility in mind, featuring:

- High contrast mode
- Keyboard navigation
- Screen reader compatibility
- Proper ARIA attributes
- Responsive design for various devices
