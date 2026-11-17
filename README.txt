DANCEDESK — VS CODE PROJECT

WHAT IT DOES
- Add as many rehearsal slots as you need for any date.
- Every slot can have a different client/group, time, activity, choreographer(s), venue and notes.
- Select another date to see that day's schedule.
- Search the selected day's schedule.
- Edit or delete individual slots.
- Generate a WhatsApp-ready message for the selected date and copy it.
- Data is saved in your browser using localStorage.

HOW TO OPEN IN VS CODE
1. Extract the DanceDesk_VSCode.zip file.
2. Open VS Code.
3. Choose File > Open Folder.
4. Select the extracted DanceDesk_VSCode folder.
5. Open index.html.
6. Right-click index.html and choose "Open with Live Server" (if you have the Live Server extension).
   If you do not have Live Server, you can open index.html directly in Chrome/Edge.

IMPORTANT
- This first version saves data only in the browser and device where you enter it.
- It does not automatically sync between your phone, iPad and laptop.
- Do not clear browser data unless you have a backup.
- To download a backup: open the browser developer console and run exportDanceDesk().
- The Google Fonts import needs internet; the app itself works without it using fallback fonts.

PROJECT FILES
index.html — page structure
style.css — design and mobile layout
app.js — schedule logic and browser storage
