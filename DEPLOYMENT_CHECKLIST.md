\# FocusFlow Deployment and Rollback Checklist



\## Pre-deployment checks



\- \[ ] Confirm `GEMINI\_API\_KEY` is configured in Vercel Production environment variables.

\- \[ ] Confirm no real API keys are committed to the repository.

\- \[ ] Run `npm test` and confirm all tests pass.

\- \[ ] Run `npm run lint` and confirm there are no warnings or errors.

\- \[ ] Run `npm run build` and confirm the production build succeeds.

\- \[ ] Review the changes before committing or deploying.



\## Production deployment



\- \[ ] Deploy using `npx vercel --prod`.

\- \[ ] Record the deployment URL and deployment identifier.

\- \[ ] Open the production URL in a browser.

\- \[ ] Confirm the dashboard loads.

\- \[ ] Add, complete, edit, and delete a test task.

\- \[ ] Generate an AI study plan using active tasks.

\- \[ ] Confirm the plan summary, task order, and allocated minutes appear.

\- \[ ] Verify a failed request displays a useful error message.

\- \[ ] Check the browser console for unexpected errors.



\## Accessibility and performance



\- \[ ] Run Lighthouse in Chrome DevTools on the production URL.

\- \[ ] Record Performance, Accessibility, Best Practices, and SEO scores.

\- \[ ] Review keyboard navigation and visible focus indicators.

\- \[ ] Verify form labels and error messages are understandable.

\- \[ ] Save screenshots or reports as submission evidence.



\## Rollback procedure



If the production deployment is broken:



1\. Open the FocusFlow project in the Vercel dashboard.

2\. Open the Deployments section.

3\. Identify the most recent known-good deployment.

4\. Use Vercel's rollback or promote-to-production option, if available.

5\. Reopen the production URL and verify the dashboard and AI feature.

6\. Record the reason for rollback and the corrective action required.



Do not delete the previous working deployment until the replacement has been verified.



\## Post-deployment notes



\- Production URL: https://focusflow-ai-xi.vercel.app

\- Deployment date: Record the actual deployment date.

\- Test results: Record the actual test, lint, and build results.

\- Lighthouse results: Fill in only after running the audit.

\- Known issues: Record any remaining issues discovered during verification.



