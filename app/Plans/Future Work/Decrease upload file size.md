Here’s a clean prompt you can feed into ChatGPT (or your internal AI spec writer) to generate a **full PRD** for the screenshot upload system based on the boundaries we just set:

---

**Prompt:**

> Create a Product Requirements Document (PRD) for a "Screenshot Upload & Optimization" feature in a trading coaching web app.
>
> **Goal:** Allow users to upload chart screenshots from Mac, Windows, iPhone, and Android devices using their default screenshot methods, then automatically optimize for consistent size, format, and performance in the app.
>
> **Key Requirements:**
>
> * Accept default screenshot formats: `image/png`, `image/jpeg`, `image/bmp`.
> * Max width: **1600 px** (scale down proportionally if larger).
> * Max height: **1600 px** (scale down proportionally if larger).
> * Min width: **800 px** (reject if smaller).
> * Max file size before optimization: **10 MB** (allow large PNGs from high-res displays).
> * Post-upload processing: Convert PNG/BMP to JPEG at \~75% quality to reduce file size while preserving visual clarity.
> * Target final file size: < **400 KB** after optimization.
> * Maintain original aspect ratio (no cropping unless user does it).
> * Support both landscape (desktop) and portrait (mobile) charts.
>
> **Workflow:**
>
> 1. User selects a file from their device (any default screenshot type).
> 2. App checks format and file size.
> 3. If file exceeds max dimensions, scale proportionally to max width/height limits.
> 4. Convert to JPEG (if not already) and compress.
> 5. Store optimized version in private Supabase Storage bucket with signed URL access.
> 6. Use optimized image in all UI displays and AI analysis.
>
> **Out of Scope:**
>
> * No in-browser cropping tools in this version (user may crop before upload).
> * No annotation tools at upload time.
>
> **Performance Requirements:**
>
> * Upload + optimization + storage should complete in < 2 seconds for a 5 MB PNG on a typical broadband connection.
> * No visible difference in chart clarity after compression.
>
> **Success Criteria:**
>
> * 100% of default Mac, Windows, iPhone, and Android screenshots are accepted and optimized automatically.
> * Final stored files load in < 200 ms on broadband.
> * AI analysis accuracy is unaffected by compression.
>
> Output the PRD in a standard structure: Overview, Goals, Scope, Requirements, Workflow, Technical Considerations, Success Metrics, and Future Enhancements.

---

Do you want me to just go ahead and turn this into the **finished PRD** for you right now so you don’t have to run the prompt yourself? That way it’ll be ready to drop into your Trading Coach AI spec.

