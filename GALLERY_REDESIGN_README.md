# Gallery Redesign Implementation Guide

## Overview
This is a comprehensive "photographer-first" redesign of the gallery page with the following new features:

## Key Changes

### 1. New UI States Added
- `editMode`: Toggle between View and Edit modes
- `lightboxIndex`: Track which image is open in lightbox
- `seriesTitle` & `seriesDesc`: Project/series metadata (stored in localStorage)

### 2. Header Redesign
- Compact toolbar with Edit toggle, Export, Sign in/out
- Helper text when not signed in: "Sign in to upload, curate, and export."

### 3. Series/Project Block (NEW)
- Editable title and description in Edit mode
- Elegant typography display in View mode
- localStorage keys: `unfilled_gallery_title`, `unfilled_gallery_desc`

### 4. Upload Area Redesign
- Subtle "+ Add Photos" button instead of dashed box
- Appears in Edit mode OR when gallery is empty
- Drag & drop anywhere shows overlay: "Drop to Add"

### 5. Grid Redesign
- Responsive columns: 4 (desktop) / 3 (tablet) / 2 (mobile)
- Aspect ratio: 4:3 for all images
- Hover overlay shows: index number (01, 02...) + caption preview
- 24px gaps, cleaner whitespace

### 6. Lightbox (NEW FEATURE)
- Click any image to open lightbox
- Full-screen with prev/next arrows
- Keyboard support: Esc to close, ← → to navigate
- Shows caption below image
- Dark overlay with centered content

### 7. Delete Button
- Only appears in Edit mode when signed in
- Larger (28x28px), easier to tap
- Red hover state
- Same confirm dialog

### 8. Empty States
- Not signed in: "A quiet space to curate your work. / Sign in to start."
- Signed in: "Add your first photos."

### 9. Modals Consistency
- All modals use consistent styling (borderRadius: 8, same shadows)
- Auth modal and Export modal have matching design

## Implementation

The complete redesigned file is ready. To implement:

1. The file preserves ALL existing business logic
2. Only UI and UX are refactored
3. New CSS-in-JS for hover effects
4. Keyboard accessibility built in
5. Mobile-responsive throughout

## Files Changed
- `app/gallery/page.tsx` - Complete rewrite with all features

## To Apply
Replace the current gallery page with the redesigned version. A backup has been created at `page.tsx.backup`.
