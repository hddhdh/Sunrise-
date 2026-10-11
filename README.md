# Beirut Sunrise Alarm

A lightweight installable PWA that shows the sunrise in Beirut and sets a browser notification for **2½ hours before sunrise** with one button.

## Use

1. Open the deployed site in a modern browser.
2. Allow notifications when prompted.
3. Tap **Set reminder for today**.
4. The button changes to **Cancel reminder** when the reminder is armed.

If today's reminder time has passed, the app fetches the next sunrise and offers the upcoming reminder instead. Times are displayed in the `Asia/Beirut` timezone.

## Publish on GitHub Pages

1. Create a GitHub repository (for example `beirut-sunrise-alarm`).
2. Upload all files in this folder to the repository root.
3. In **Settings → Pages**, select **Deploy from a branch**, choose `main` and `/ (root)`, then save.
4. Open the published HTTPS URL. HTTPS is required for PWA installation and notifications.

No build step or dependencies are needed. The app fetches sunrise data from [Sunrise-Sunset.org](https://sunrise-sunset.org/) and caches its shell for offline loading. Sunrise refresh requires a connection.

## Important alarm limitation

This is a **browser-side reminder**, not a native alarm clock or server push notification. The page/browser must remain open and the browser/device must be allowed to run and show notifications. Browsers may suspend timers, and this reminder is not guaranteed if the browser is closed, the device is asleep, or the operating system restricts background activity. For a dependable alarm, set a separate alarm in the device clock app.

## Local testing

Serve the folder over localhost (service workers require HTTPS or localhost), e.g. `python3 -m http.server 8000`, then visit `http://localhost:8000`.
