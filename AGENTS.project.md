# Kyle Liang — builder preferences

These override default data architecture for this app and for later apps
built the same way.

## Local-first (default)

Compute and user data live in the **browser** (IndexedDB / local caches).
The cloud is not the live store.

When an app has accounts or “save my stuff”:

1. **Source of truth:** the device. Reads, writes, photos, and UI never wait
   on Neon/Vercel for ordinary use.
2. **Cloud is only:**
   - account auth (sign-in, session, sign-out)
   - **cold backup:** a full snapshot the user starts (not a write-through
     sync). Recording or editing must **not** upload in the background.
3. **Restore** from backup only when this browser has **no** journal for that
   user (new phone / empty profile). If local data exists, local wins.
4. Do **not** list or fetch user records on every page load, focus, or timer.
5. The user can keep using the app offline. Backup happens when they ask.

Auth and database still follow the platform closed list (only turn them on
when the product actually needs accounts). Once they are on, use this
local-first shape instead of “Neon as the live database.”
