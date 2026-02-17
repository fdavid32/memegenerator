# Meme Generator

A full-stack meme generator with posting and upvoting, powered by InstantDB.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add template images** (optional)
   Place your template images in `public/assets/`. The app expects files like:
   - `cointreau-p.jpg`, `cointreau.png`, `image.png`, etc.
   You can add any images and update the template list in `src/meme-editor.ts`.

3. **Push schema and permissions to InstantDB**
   Log in to InstantDB and push your schema:
   ```bash
   npx instant-cli@latest login
   npx instant-cli@latest push schema
   npx instant-cli@latest push perms
   ```

4. **Run the app**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173

## Features

- Create memes with templates or your own images
- Add and edit text layers with drag-to-reposition
- Sign in as guest to post memes to the feed
- Upvote memes (one vote per user per meme)
- Real-time feed updates

## Environment

The app uses `VITE_INSTANT_APP_ID` from `.env`. Ensure this is set to your InstantDB app ID.
