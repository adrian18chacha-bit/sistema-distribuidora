---
name: mobile-responsive
user-invocable: true
description: "Use when the web app looks bad on celular/móvil. Review index.html and related styles, identify layout and viewport issues, and propose or apply mobile-friendly fixes."
---

# Mobile Responsive Fixer

## What this skill does

- Reviews the current HTML and CSS for mobile layout issues.
- Detects missing viewport metadata, fixed widths, overflow, and poor spacing.
- Suggests responsive improvements for smaller screens.
- Provides step-by-step changes to make the app look good on celular.

## Workflow

1. Inspect `index.html` and any linked styles for mobile compatibility.
2. Check for a mobile viewport meta tag and responsive layout structures.
3. Find layout problems such as elements that are too wide, buttons too small, text cut off, or navigation that does not adapt.
4. Recommend fixes using fluid widths, CSS flex/grid, media queries, and mobile spacing.
5. Apply HTML/CSS updates and verify the design at phone screen widths.

## Use cases

- The app header or cards overflow on celular.
- The page uses fixed pixel widths that break on small screens.
- The navigation buttons do not fit on a mobile toolbar.
- The interface needs a mobile-friendly layout and spacing.

## Example prompts

- "Use the mobile-responsive skill to fix the celular layout in `index.html`."
- "Review the web app for mobile display issues and suggest responsive CSS changes."
- "Improve the phone view of this page and make it look good on smaller screens."
