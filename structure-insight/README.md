<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1-Kc1AEio_RcW0U7LusWKtyBhD4D0lRQw

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` (or `API_KEY`) in [.env.local](.env.local) to your Gemini API key.
3. Run the app:
   `npm run dev`

## Deployment Troubleshooting

### Error: "Cannot find cwd: .../structure-insight-web"

If you encounter an error like `Error: Cannot find cwd: /opt/buildhome/repo/structure-insight-web` during deployment (e.g., on Cloudflare Pages):

This indicates the deployment service is expecting the project files to be in a subdirectory named `structure-insight-web`, but they are in the root of your repository.

**Fix:**
1. Go to your deployment project settings (e.g., Cloudflare Pages > Settings > Build & deployments).
2. Locate the **Root Directory** setting in "Build configurations".
3. Change it to `/` (empty) to indicate the project is in the root directory.
