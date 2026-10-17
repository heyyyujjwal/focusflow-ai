# FocusFlow — AI-Powered Study Planner

FocusFlow is a responsive study-planning application built with React, TypeScript, and Vite. It helps students organize tasks, track progress, and generate AI-powered study plans based on their current tasks and available study time.

**Live application:** https://focusflow-ai-xi.vercel.app

## Features

- **Dashboard:** View total, active, and completed tasks with overall progress.
- **Task management:** Add, edit, complete, and delete tasks.
- **Priority and deadlines:** Assign low, medium, or high priority and optional due dates.
- **Search and filters:** Find tasks and filter by all, active, or completed status.
- **Persistent storage:** Save task data in browser localStorage.
- **AI Study Plan:** Generate a prioritized, timed study plan from active tasks using the Gemini API.
- **Input validation:** Validate study hours and API request data.
- **Loading and error states:** Provide feedback during generation and when requests fail.
- **Responsive interface:** Support desktop and mobile layouts.
- **Accessibility considerations:** Use form labels, keyboard focus indicators, and appropriate status feedback.

## Technology Stack

- React 19
- TypeScript
- Vite
- Plain CSS
- Google Gemini API through the `@google/genai` SDK
- Vercel serverless functions
- Vitest and React Testing Library
- Oxlint

## Getting Started

### Prerequisites

Install Node.js (LTS recommended) and npm. A Google Gemini API key and a Vercel account are needed to run the AI endpoint locally and deploy the application.

### Installation

Clone the repository or open the project folder, then install dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root and add your Gemini API key:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
```

Replace the placeholder with your own key. Never commit real API keys to GitHub or expose them in frontend code.

The `.env.local` file is intended for local configuration. The Gemini key must remain server-side and must not use a `VITE_` prefix.

### Run Locally

Start the Vercel development environment so the frontend and serverless API are available together:

```bash
npx vercel dev
```

Open the local URL displayed in the terminal, usually `http://localhost:3000`.

The standard Vite command `npm run dev` starts the frontend only and does not, by itself, run the Vercel API function.

## AI Study Plan API

The application uses the server-side endpoint:

`POST /api/study-plan`

The frontend sends the current tasks and available study hours. Each task includes an ID, title, subject, priority, and completion status, with an optional due date.

Example request:

```json
{
  "tasks": [
    {
      "id": "task-1",
      "title": "Review TypeScript",
      "subject": "Programming",
      "priority": "high",
      "completed": false
    }
  ],
  "availableHours": 2
}
```

The endpoint validates the request, excludes completed tasks from planning, calls Gemini, and validates the generated plan before returning it.

A successful response contains a `plan` array and a `summary`. Plan items include the associated task ID, title, subject, allocated minutes, rationale, and suggested order.

Invalid requests and generation failures return an error response. The API key is accessed by the server and is not sent to the browser.

## Quality Checks

Run the automated tests:

```bash
npm test
```

Run lint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

The build runs TypeScript project compilation followed by the Vite production build.

### Verified Results

The following checks passed during local development:

- 14 automated tests passed across two test files.
- Lint completed with zero warnings and zero errors.
- The production build completed successfully.
- The AI Study Plan was tested in the browser using the local Vercel development server.
- The deployed application and AI Study Plan were manually tested on the production URL.

Lighthouse scores and accessibility audit results should be recorded separately after the audits are run.

## Deployment

The application is deployed on Vercel:

https://focusflow-ai-xi.vercel.app

To deploy a production build using the Vercel CLI:

```bash
npx vercel --prod
```

Configure `GEMINI_API_KEY` in the Vercel project settings for the Production environment. Keep the variable secret and redeploy after changing production environment variables.

After deployment, verify that the dashboard loads, task management works, and AI Study Plan generation returns a valid plan.

## Security and Limitations

- Never commit `.env.local` or real API credentials.
- Keep the Gemini API key in server-side environment variables.
- Validate both incoming requests and model-generated output.
- AI-generated study plans are suggestions and should be reviewed by the user.
- Gemini availability and usage limits can affect plan generation.

## Project Purpose

FocusFlow demonstrates how an existing frontend application can be extended with a server-side AI feature, input and output validation, automated tests, and a production deployment.
