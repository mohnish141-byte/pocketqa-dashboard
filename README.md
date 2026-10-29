# PocketQA — Manual mobile testing workspace

Run `npm install` once, then `npm run dev`. Keep the terminal open and use the printed local URL.

## Workflow
1. Create a test case with title, device/OS, steps, expected result, and priority.
2. Test the app manually, edit the case to record actual results and bug notes.
3. Change the status to Pass, Fail, Blocked, or Not Run.
4. Search text and filter by status/device. Summary cards filter by status.
5. Export all cases as CSV, or print the current filtered report. Expand case details before printing if your browser hides collapsed details.
6. Download a JSON backup regularly. Restore adds missing case IDs and keeps existing cases; it never replaces existing records.
7. Delete supports Undo for the current session. Restore deleted cases before refreshing if needed.

## Data and limits
Data is saved in localStorage for this browser and origin. It does not sync between Chrome and the in-app browser, ports, computers, or users. Clearing browser data removes it: use JSON backups. Screenshots, Appium, automatic device discovery, server accounts, and historical test runs are not implemented. Device names and OS versions are entered manually. Execution progress counts Pass and Fail; Blocked is not considered executed.

## Validation
`npm run build` performs TypeScript checks and creates the production build.

## Manual smoke check
- Add a case with all fields, edit it, and refresh: fields and status should remain.
- Filter by device and status; clear filters to return to all cases.
- Export CSV and check multiline steps and escaped quotation marks.
- Download JSON, delete a case, then restore JSON: the missing case should return without duplicates.
- Delete two cases and Undo: both should return. Undo history ends on refresh.
- Try an invalid JSON backup: it should show an error and preserve existing cases.

## Projects and versions
Each case can have a project/app name and app version/build. Existing cases appear under General. Use project and version filters in the library; CSV and JSON exports include these fields. These are case labels, not separate project records or run history.


## Live application
[Open PocketQA](https://pocketqa-dashboard.vercel.app/)

## Deployment
Vite static app. Build command: `npm run build`. Output directory: `dist`.
