\# Week 8 Capstone Reflection — FocusFlow



\## Project Overview



For this capstone, I extended FocusFlow, an existing React and TypeScript study planner, with an AI-powered study planning feature. The feature uses the Gemini API to create a timed study plan from a student's active tasks and available study hours.



\## What I Built



I integrated a server-side API endpoint at `/api/study-plan` and connected it to a new AI Study Plan section in the frontend. The interface collects available study hours, sends the current tasks to the endpoint, and displays the generated plan summary, suggested task order, allocated minutes, and explanations.



I also added request and response validation, loading feedback, and error handling. The Gemini API key is configured through environment variables rather than being embedded in frontend code.



\## Testing and Verification



The project has two automated test files covering the API and the StudyPlanner component. During verification, 14 automated tests passed. The production build succeeded, and lint completed with zero warnings and zero errors.



I tested the AI Study Plan locally through the Vercel development server and then tested the deployed production application. The production dashboard loaded, and the AI planner generated a study plan successfully.



\## Challenges and How I Addressed Them



One challenge was debugging TypeScript errors in the test suite. Incorrect mock structure, duplicate variable declarations, and optional values prevented the build from passing. I inspected the relevant code, corrected the issues, and reran the build until it succeeded. I then ran the automated tests and lint checks.



Another challenge was configuring the server-side Gemini API key for local development and Vercel. I replaced the exposed key and updated the Development and Production environment variables.



\## What I Learned



This project helped me understand that adding an AI feature requires more than connecting a model API. The application also needs request validation, safe secret handling, useful error states, automated tests, and deployment verification.



I also learned to verify the complete user flow in a browser instead of relying only on a successful build or isolated API test.



\## Future Improvements



Possible improvements include stronger rate limiting, additional tests for API failures and unusual model responses, more detailed monitoring, and further accessibility and performance testing. I also want to evaluate the quality and consistency of generated study plans across a wider range of task lists.



\## Conclusion



FocusFlow now combines task management with AI-generated study planning in a deployed web application. The project gave me practical experience integrating an AI API into an existing frontend, validating model output, testing application behavior, managing environment variables, and deploying a production build.



