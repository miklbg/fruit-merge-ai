# Cache Update Testing Guide

This document explains how to test the iOS cache update functionality.

## What Was Implemented

1. **Service Worker Versioning**: The `sw.js` file now has a `VERSION` constant that controls cache naming
2. **Clear Cache Button**: A new button in the pause menu allows users to manually clear cache and reload
3. **Automatic Update Detection**: The app checks for updates every 60 seconds and when the tab becomes visible
4. **Network-First for HTML**: HTML files are fetched from the network first to ensure updates are delivered
5. **iOS-Specific Support**: Added meta tags for better iOS PWA support

## How to Test

### Testing the Clear Cache Button

1. Open the game at `http://localhost:8080` (or the deployed URL)
2. Click the menu button (☰) in the top-left corner
3. Verify you see a "Clear Cache & Reload" button at the bottom of the menu
4. Click the button
5. The page should reload, and you should see "Clearing..." briefly
6. Check browser console for cache clearing messages

### Testing Automatic Updates

1. With the game open in a browser, note the current state
2. Update the `VERSION` constant in `game/sw.js` (e.g., from `1.0.1` to `1.0.2`)
3. Deploy the changes to your server
4. Wait 60 seconds or switch away and back to the browser tab
5. The service worker should detect the update and automatically reload the page
6. Check the browser console for "New service worker activated" message

### Testing on iOS Safari

1. Open Safari on iOS and navigate to the game
2. Play the game to ensure it caches properly
3. Deploy an update (change the VERSION in sw.js)
4. Return to the game after a few minutes
5. Tap the menu (☰) button
6. Tap "Clear Cache & Reload"
7. Verify the game reloads and shows the latest version

### Testing as iOS PWA (Home Screen App)

1. Add the game to your iOS home screen (Share → Add to Home Screen)
2. Open the PWA from your home screen
3. Play the game to cache it
4. Deploy an update with a new VERSION number
5. Open the PWA again after 60+ seconds
6. The app should automatically update
7. Or manually tap menu → "Clear Cache & Reload"

## Verification Steps

After deploying an update:

1. Check browser console for these messages:
   - "ServiceWorker registered: [scope]"
   - "Opened cache: fruit-merge-v[VERSION]"
   - "Deleting old cache: fruit-merge-v[OLD_VERSION]"
   - "Service Worker updated to version: [VERSION]"

2. Verify in browser DevTools:
   - Open DevTools → Application → Service Workers
   - Should see the service worker registered
   - Check Cache Storage → should see only the latest version cache
   - Old version caches should be deleted

3. Test the Clear Cache button:
   - Should display "Clearing..." when clicked
   - Should reload the page
   - Should clear all caches in DevTools → Application → Cache Storage

## Common Issues and Solutions

### Issue: Old content still showing
**Solution**: 
- Click "Clear Cache & Reload" button
- Or increment the VERSION in sw.js and redeploy

### Issue: Service Worker not updating
**Solution**:
- In DevTools → Application → Service Workers → Click "Unregister"
- Reload the page
- The new service worker will be registered

### Issue: iOS Safari still caching aggressively
**Solution**:
- Use the "Clear Cache & Reload" button (easiest)
- Or: Settings → Safari → Clear History and Website Data
- Or: Delete and re-add the PWA from home screen

## Developer Workflow

When deploying updates:

1. Make your code changes
2. Update the `VERSION` constant in `game/sw.js` (e.g., `1.0.1` → `1.0.2`)
3. Deploy all files to your server
4. Users will automatically get updates:
   - Within 60 seconds if the app is open
   - Immediately when they return to the tab
   - When they tap "Clear Cache & Reload"

## Technical Details

### Service Worker Strategy

- **HTML files**: Network-first (always try to fetch fresh, fallback to cache)
- **Assets (images, CSS, JS)**: Cache-first (serve from cache, update in background)
- **Cache versioning**: Each version gets its own cache name
- **Old cache cleanup**: Automatic deletion when new version activates

### iOS-Specific Handling

- Network-first strategy ensures HTML updates are delivered
- `skipWaiting()` ensures new service worker activates immediately
- `clients.claim()` ensures new service worker takes control of all tabs
- Meta tags improve iOS PWA behavior
- Manual clear cache button for ultimate control
