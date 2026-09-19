# SCHOLENTRA — PHASE 6 UI/UX DESIGN SYSTEM & ANTI-VIBE-CODING DIRECTIVE

## CONTEXT

You are already working on the Scholentra project.

The backend phase has been completed.

You are now entering:

**PHASE 6 — Next.js Web Dashboard**

After Phase 6 is fully completed, the project will proceed to:

**PHASE 7 — React Native Mobile Application**

This instruction applies primarily to Phase 6, but the design principles, visual language, component semantics, spacing, typography, status meanings, and interaction patterns established during Phase 6 must be reusable and consistent when Phase 7 begins.

The goal is not simply to make the dashboard "look modern."

The goal is to make Scholentra look like a **professionally designed, production-grade school management SaaS product** that could have been designed and maintained by an experienced product design and frontend engineering team.

It must NOT look like a generic AI-generated dashboard, admin template, Tailwind starter, MUI demo, or "vibe-coded" application.

---

# 1. AUTHORITATIVE DESIGN REFERENCES

Two design-system references have been provided:

### REFERENCE A — SCHOLENTRA COLOR THEME

This contains the official Scholentra light and dark color palettes, including:

* Primary / Brand Blue
* Secondary / Success Green
* Error / Danger Red
* Warning / Pending Yellow
* Info Blue
* Neutral scale
* Light background
* Dark background
* Surface
* Card
* Border
* Text
* Muted text

### REFERENCE B — SCHOLENTRA CORE UI COMPONENT SYSTEM

This contains the approved UI component vocabulary covering:

* Buttons
* Inputs
* Date/time pickers
* Selection controls
* Layout primitives
* Surfaces
* Data display
* Feedback
* Dialogs
* Navigation
* Typography
* Utilities
* Forms
* Filtering/search
* File/media
* System utilities

These two references are the **design-system foundation for Scholentra**.

Before implementing Phase 6 UI, inspect and understand both references.

Do not invent a competing color system.

Do not invent a competing component vocabulary.

Do not introduce random colors, random component styles, random border radii, random shadows, or random interaction patterns.

---

# 2. IMPORTANT — THE COMPONENT LIST IS NOT A CHECKLIST

The Core UI Component System is a **design-system vocabulary**, NOT an instruction to build every component immediately.

Do NOT create 100+ components simply because they appear in the reference.

Build components when they are actually required by the dashboard.

For example:

If the Students module only needs:

* Button
* SearchInput
* FilterBar
* DataGrid
* Avatar
* Badge
* Dialog
* Pagination

then implement those components/patterns properly.

Do not create unrelated components merely to increase the component count.

Avoid overengineering.

The objective is:

**Reusable where repetition exists. Simple where simplicity is appropriate.**

---

# 3. PRIMARY UI OBJECTIVE

Every screen should feel:

* intentional
* structured
* calm
* professional
* trustworthy
* information-dense without being cluttered
* consistent
* accessible
* responsive
* predictable
* appropriate for daily school administration

Scholentra is school-management software.

It should visually communicate:

**organization + trust + clarity + efficiency**

It should NOT visually communicate:

* cryptocurrency dashboard
* fintech startup
* gaming application
* AI chatbot
* developer tool
* marketing landing page
* generic SaaS template
* experimental design system

---

# 4. ABSOLUTELY AVOID "VIBE-CODED" UI

Do not automatically generate the following patterns.

## Avoid excessive statistic cards

Do not make every page:

```text
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Students │ │ Teachers │ │ Revenue  │ │ Present  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

A statistic card should exist only when the information is genuinely useful for the page.

A page does not need KPI cards merely because it is a dashboard.

---

## Avoid excessive rounded containers

Do not put every piece of content inside:

* rounded cards
* nested cards
* floating cards
* cards inside cards
* panels inside panels

Use surfaces deliberately.

Some content should simply exist within the page layout without a container.

---

## Avoid excessive shadows

Do not apply large shadows to everything.

Use elevation only where the UI hierarchy requires it.

Prefer:

* spacing
* borders
* surface contrast
* typography
* grouping

before using heavy shadows.

---

## Avoid excessive gradients

Do not introduce gradients merely to make the interface appear modern.

The Scholentra brand is based on a controlled color system.

Use the defined colors intentionally.

---

## Avoid decorative glassmorphism

Do not use glassmorphism as a default visual style.

The system may contain a `GlassCard`, but that does NOT mean every card should be glass.

Use it only when there is a clear design reason.

---

## Avoid giant headings

Do not make normal application pages look like marketing landing pages.

Page titles should establish hierarchy without consuming excessive screen space.

---

## Avoid oversized icons

Do not place huge icons inside colored circles simply because the interface is an admin dashboard.

Icons should support recognition and actions.

They should not become decoration.

---

## Avoid meaningless badges

Do not turn ordinary text into pills.

Bad:

```text
[ ACTIVE ]
[ SCHOOL ]
[ VERIFIED ]
[ TOTAL ]
[ NORMAL ]
```

unless the status genuinely benefits from a status indicator.

---

## Avoid fake data

Never create fake:

* students
* teachers
* payments
* attendance
* revenue
* grades
* notifications
* reports
* statistics

to make the dashboard appear populated.

Use real backend data.

When no data exists, design a proper empty state.

---

## Avoid meaningless charts

Do not add charts simply because "dashboards need charts."

Every chart must answer a useful operational question.

If a table or simple number communicates the information better, use the simpler solution.

---

## Avoid unnecessary animation

Animations must communicate state or improve usability.

Do not add:

* excessive page transitions
* bouncing elements
* animated counters everywhere
* floating decorative elements
* excessive hover animations
* unnecessary skeleton animations

Use subtle motion where appropriate.

Respect reduced-motion preferences.

---

# 5. DESIGN BEFORE IMPLEMENTATION

Before building each major page, determine:

1. Who is using this page?
2. What is the user's primary task?
3. What information is most important?
4. What action is most important?
5. What actions are secondary?
6. What information can be progressively disclosed?
7. Should the information be presented as:

   * table
   * list
   * form
   * detail page
   * drawer
   * dialog
   * card
   * timeline
   * chart
   * simple text
8. What happens when there is:

   * no data
   * loading
   * an error
   * a successful operation
   * a partially completed operation
   * a permission restriction?

Do not begin by selecting components.

Begin with the user workflow.

Then select the appropriate components.

---

# 6. USE THE COMPONENT SYSTEM INTENTIONALLY

The Core UI Component System should provide reusable building blocks.

Examples:

### Forms

Use consistent:

* Form
* FormField
* FormRow
* FormSection
* FormActions
* FormLabel
* FormHelperText
* FormError

patterns.

### Data-heavy pages

Use appropriate:

* Table
* DataGrid
* SearchBar
* FilterBar
* SortDropdown
* Pagination
* EmptyState
* ErrorState
* Loading/Skeleton states

### Destructive operations

Use:

* ConfirmDialog
* AlertDialog

where appropriate.

### Navigation

Use a consistent:

* Navbar
* Sidebar
* Breadcrumbs
* Tabs
* Menu

system.

Do not create page-specific navigation patterns without a genuine UX reason.

---

# 7. MUI + TAILWIND DISCIPLINE

The project uses:

**Next.js + MUI + Tailwind**

Do not allow the two styling systems to become chaotic.

Establish clear responsibilities.

For example:

### MUI

Use MUI where its component behavior and accessibility provide substantial value:

* DataGrid
* Dialog
* Menu
* Select
* Autocomplete
* Date/time pickers
* complex form controls
* accessibility-sensitive interactive components

### Tailwind

Use Tailwind primarily for:

* layout
* spacing
* responsive behavior
* positioning
* structural composition
* controlled utility styling

Do not randomly mix MUI `sx`, Tailwind classes, inline styles, CSS modules, and arbitrary CSS for the same component without a reason.

Do not create style conflicts.

Follow one coherent implementation strategy.

---

# 8. COLOR SYSTEM ENFORCEMENT

Use the provided Scholentra color theme as the authoritative source.

## Light theme

Primary:

```text
#2F6BFF
```

Success:

```text
#16B364
```

Error:

```text
#DC2626
```

Warning:

```text
#F59E0B
```

Info:

```text
#0EA5E9
```

Neutral/background:

```text
Background: #F9FAFB
Surface:    #FFFFFF
Card:       #FFFFFF
Border:     #E5E7EB
Text:       #111827
Muted:      #6B7280
```

Use the complete supplied palette where appropriate.

## Dark theme

Use the supplied dark palette.

Core surfaces:

```text
Background: #0B1220
Surface:    #111827
Card:       #1F2937
Border:     #2D3748
Text:       #E5E7EB
Muted:      #9CA3AF
```

Do not introduce arbitrary colors simply because a UI library defaults to them.

Do not allow MUI defaults to silently replace the Scholentra palette.

---

# 9. SEMANTIC COLOR USAGE

Color must communicate meaning consistently.

### Blue

Primary actions, navigation emphasis, brand identity and selected states.

### Green

Successful/completed/present/positive states.

### Red

Danger, failed, absent, destructive actions.

### Yellow/Amber

Warning, late, pending, attention required.

### Info Blue/Cyan

Informational/system/report-related states.

Do not use green, red, yellow, or blue merely as decoration.

A user should be able to understand status from the color semantics.

However, do not rely on color alone.

Use:

* text
* icons
* labels
* status indicators

where necessary.

---

# 10. TYPOGRAPHY

Typography must establish hierarchy without visual noise.

Use a controlled hierarchy for:

* page title
* section title
* subsection
* body
* labels
* helper text
* metadata
* table content
* captions

Do not use five different font sizes on one small card.

Do not make everything bold.

Do not use uppercase text excessively.

Text should be easy to scan during long administrative sessions.

---

# 11. SPACING

Use a consistent spacing scale.

Do not manually invent arbitrary spacing for every page.

Related content should be visually grouped.

Unrelated content should have sufficient separation.

Whitespace is part of the design.

Do not fill every available pixel with cards and controls.

---

# 12. BORDER RADIUS

Use a controlled radius system.

Do not make every element extremely rounded.

Avoid the "everything is a pill" aesthetic.

Use stronger rounding for:

* dialogs
* larger surfaces
* cards where appropriate

Use smaller or minimal rounding for:

* tables
* inputs
* dense controls
* administrative interfaces

The interface should feel professional rather than playful.

---

# 13. TABLES ARE FIRST-CLASS COMPONENTS

Scholentra is an information-heavy administrative system.

Tables will often be more appropriate than cards.

Tables should handle realistic data such as:

* long student names
* long staff names
* long email addresses
* large numbers of students
* many invoice records
* long payment references
* multiple statuses
* dates
* currency values
* pagination
* sorting
* filtering
* search
* empty states
* loading states
* errors

Do not turn every table into a mobile card automatically.

Choose the appropriate responsive strategy.

---

# 14. FORMS MUST FEEL PROFESSIONAL

Forms should have:

* clear labels
* logical grouping
* appropriate field widths
* helper text when necessary
* validation
* error messaging
* loading/submitting states
* disabled states
* clear primary action
* safe cancellation

Avoid giant forms where everything is dumped onto one page.

Use sections and progressive disclosure when appropriate.

---

# 15. FINANCE UI REQUIRES EXTRA PRECISION

Finance screens must feel trustworthy and precise.

Do not make financial screens visually playful.

Important information should be immediately understandable:

* amount
* amount paid
* balance
* due date
* payment date
* invoice number
* payment reference
* student
* status
* payment method

Currency formatting must be consistent.

Dates must be consistent.

Amounts must be aligned correctly.

Do not hide important financial information behind unnecessary interactions.

---

# 16. PAYMENT UI

Payment interfaces must clearly distinguish:

* initiated
* pending
* successful
* failed
* reversed
* cancelled

Never assume a frontend callback means a payment is successfully completed.

The UI must reflect the authoritative backend/payment-provider state.

Do not display "Payment Successful" simply because a browser redirect occurred.

---

# 17. DASHBOARD DESIGN

The main dashboard should answer real school-management questions.

For example:

* What requires attention?
* What happened today?
* What needs approval?
* What attendance issues exist?
* What financial items need attention?
* What upcoming events matter?
* What operational tasks remain?

Do not fill the dashboard with arbitrary cards just to make it look full.

Information hierarchy is more important than visual density.

---

# 18. NAVIGATION

Navigation should represent the user's workflow.

Do not blindly expose every backend module as a top-level navigation item.

Organize related functionality logically.

The sidebar should make it obvious:

* where the user is
* what section they are in
* where related functions live
* what is available based on permissions

Use nested navigation only where it genuinely improves discoverability.

---

# 19. ROLE AND PERMISSION AWARENESS

The UI must respect backend authorization.

Do not merely hide buttons visually while assuming the backend will handle everything.

The frontend should:

* show appropriate actions
* hide unavailable actions where appropriate
* communicate insufficient permissions clearly
* handle unauthorized responses gracefully

Never design the UI around assumptions that every user has administrator privileges.

---

# 20. LOADING / EMPTY / ERROR STATES ARE PART OF THE DESIGN

Every major page must deliberately handle:

### Loading

Use:

* SkeletonLoader
* Spinner
* Progress indicators

where appropriate.

### Empty

Explain:

* what is empty
* why it may be empty
* what the user can do next

### Error

Provide:

* clear explanation
* retry where appropriate
* safe recovery

### Success

Provide appropriate confirmation without excessive celebration.

Do not leave blank screens.

---

# 21. MODALS AND DRAWERS

Do not put entire workflows into giant dialogs simply because dialogs are convenient to code.

Use:

### Dialog

For focused tasks.

### Drawer / SidePanel

For contextual editing or detail views when the user should remain oriented within the current page.

### Full page

For complex workflows requiring substantial attention.

Choose based on task complexity.

---

# 22. DETAIL PAGES

Student, staff, parent, class, invoice and similar detail pages should have clear information hierarchy.

Avoid:

```text
Card
  Card
    Card
      Card
```

Instead, establish a clear page structure.

Use tabs only when they represent genuinely distinct information categories.

---

# 23. RESPONSIVE DESIGN

The web dashboard must work properly on:

* desktop
* laptop
* tablet
* mobile browser

Do not simply shrink the desktop interface.

Determine how each component behaves at smaller widths.

For example:

* sidebar may collapse
* tables may scroll or change presentation
* filters may move into a drawer
* secondary actions may move into menus
* forms may become single-column
* dense information may use progressive disclosure

Responsive behavior must be intentional.

---

# 24. ACCESSIBILITY

Build accessibility into the component system.

Ensure:

* semantic HTML
* keyboard navigation
* visible focus states
* accessible labels
* appropriate ARIA usage
* sufficient contrast
* usable touch targets
* accessible dialogs
* accessible menus
* screen-reader meaningful states

Never sacrifice accessibility simply for visual appearance.

---

# 25. ICON SYSTEM

Use one coherent icon library.

Do not randomly mix:

* MUI icons
* Lucide
* Font Awesome
* random SVGs
* emoji

unless there is a documented reason.

Icons should have consistent:

* size
* stroke/visual weight
* alignment
* meaning

Avoid using icons merely as decoration.

---

# 26. ANIMATION

Use motion sparingly.

Appropriate examples:

* drawer opening
* dialog transitions
* dropdown transitions
* subtle hover/focus transitions
* meaningful state changes

Avoid:

* bouncing cards
* unnecessary floating animations
* animated statistics everywhere
* excessive page transitions
* decorative movement

The interface should remain fast and calm.

---

# 27. REALISTIC DATA MUST DRIVE THE DESIGN

Do not design only around:

```text
John Doe
John Doe
John Doe
```

Consider real-world conditions:

* long names
* multiple surnames
* long school names
* long email addresses
* large classes
* hundreds/thousands of students
* many payments
* overdue invoices
* zero balances
* zero attendance
* missing profile images
* long references
* multiple statuses
* pagination
* permission restrictions

The UI should remain usable under these conditions.

---

# 28. NO "WELCOME BACK" TEMPLATE DASHBOARD

Do not automatically start every page with:

> Welcome back, Admin!

This is one of the common generic SaaS/dashboard patterns.

Use contextual page titles and useful information instead.

For example:

```text
Students
Manage student records, enrollment and academic information.
```

or simply:

```text
Students
```

if additional description is unnecessary.

---

# 29. NO FAKE PRODUCTIVITY THEATER

Do not create artificial UI elements such as:

* "Productivity Score"
* "School Health: 92%"
* "Efficiency: 87%"
* "Performance Index"
* "AI Insights"
* "Growth: +24%"
* "System Health" cards

unless these are genuine product features backed by real data and clearly defined metrics.

Never invent metrics to make the dashboard look sophisticated.

---

# 30. REUSABILITY WITHOUT OVER-ABSTRACTION

When the same UI pattern appears repeatedly, create a reusable component.

Examples:

```text
PageHeader
DataTable
StatusBadge
EmptyState
ConfirmDialog
SearchBar
FilterBar
FormSection
FormActions
CurrencyDisplay
DateDisplay
UserAvatar
PermissionGate
```

But do not create:

```text
UniversalSuperCard
UniversalSmartContainer
UniversalDynamicThing
GenericDashboardWidget
```

just to avoid writing a few lines of markup.

Abstractions should improve consistency and maintainability.

---

# 31. DESIGN TOKENS MUST BE CENTRALIZED

Centralize:

* colors
* typography
* spacing
* radius
* shadows
* breakpoints
* component states

Do not scatter hard-coded design values throughout the application.

The design system should be maintainable.

If the brand blue changes later, it should not require searching hundreds of files.

---

# 32. DARK MODE

Dark mode is not simply:

```text
background → black
text → white
```

Implement the supplied Scholentra dark palette intentionally.

Pay attention to:

* surface hierarchy
* border visibility
* muted text
* hover states
* selected states
* disabled states
* input backgrounds
* table rows
* dialogs
* menus
* charts
* status colors

Do not use pure black backgrounds unless specifically required.

---

# 33. DO NOT REDESIGN THE PRODUCT RANDOMLY

Before changing an existing UI pattern:

1. Inspect the existing implementation.
2. Inspect at least 2–3 existing screens.
3. Identify established patterns.
4. Determine whether the proposed change improves consistency or usability.
5. Reuse existing patterns whenever possible.

Do not create a new visual language for every module.

The entire application should feel like one product.

---

# 34. VISUAL CONSISTENCY CHECK

Before completing a major module, compare it against existing modules.

Check:

* page header
* spacing
* typography
* buttons
* inputs
* tables
* status badges
* dialogs
* drawers
* navigation
* colors
* border radius
* shadows
* responsive behavior

A user moving from:

Students → Staff → Attendance → Finance

should feel that they are still inside the same product.

---

# 35. DO NOT LET MUI DEFAULTS DEFINE SCHOLENTRA

MUI is an implementation framework.

It is not the Scholentra visual identity.

Configure MUI to respect the Scholentra design system.

Do not allow default:

* primary colors
* border radius
* typography
* shadows
* component spacing
* button appearance
* focus behavior

to accidentally become the application's final design language.

---

# 36. DO NOT LET TAILWIND DEFAULTS DEFINE SCHOLENTRA

Tailwind is a utility system.

It is not the design.

Do not randomly use arbitrary Tailwind colors such as:

```text
bg-blue-500
bg-green-500
text-gray-700
```

when Scholentra's semantic design tokens already exist.

Use the project's centralized tokens.

---

# 37. PAGE IMPLEMENTATION PROCESS

For every major page:

### STEP 1 — Understand

Understand:

* user role
* user goal
* data
* actions
* permissions
* API state

### STEP 2 — Structure

Determine:

* page hierarchy
* primary action
* secondary actions
* content sections
* table/list/card usage
* responsive strategy

### STEP 3 — Reuse

Identify existing components/patterns that can be reused.

### STEP 4 — Implement

Build using the Scholentra design system.

### STEP 5 — Test

Check:

* loading
* empty
* error
* success
* validation
* permissions
* responsive layouts

### STEP 6 — Visual review

Actually inspect the rendered page.

Do not judge the UI only from source code.

### STEP 7 — Refine

Fix:

* alignment
* spacing
* typography
* inconsistent controls
* visual noise
* awkward responsive behavior
* excessive cards
* excessive colors
* unnecessary UI

---

# 38. BEFORE CODING EACH MAJOR MODULE

Do not immediately generate the UI.

First inspect:

* current project structure
* existing components
* theme configuration
* Tailwind configuration
* MUI configuration
* typography
* color tokens
* layout system
* navigation
* authentication state
* permission system
* API contracts
* existing screens

Then implement the new module so it extends the existing system rather than creating a parallel one.

---

# 39. PHASE 6 ARCHITECTURE

Phase 6 should establish a strong foundation for Phase 7.

The web dashboard should establish reusable concepts for:

* design tokens
* semantic colors
* typography
* spacing
* status semantics
* forms
* validation
* data presentation
* navigation
* permissions
* feedback states
* loading states
* empty states
* error handling

Where appropriate, separate visual presentation from business logic so concepts can later be translated into React Native.

Do NOT attempt to make web and mobile UI identical.

They should share the same product language and design principles while respecting platform conventions.

---

# 40. PHASE 7 PREPARATION

When Phase 6 is complete, the React Native application should inherit the Scholentra product language.

The mobile application should reuse the conceptual design system:

* color semantics
* typography hierarchy
* status meanings
* spacing principles
* button hierarchy
* form hierarchy
* feedback patterns
* navigation concepts

But do not simply copy web components into React Native.

Mobile requires mobile-specific interaction design.

---

# 41. PRODUCTION QUALITY GATE

A Phase 6 page is NOT finished merely because:

* it compiles
* TypeScript passes
* the API works
* the route loads
* the buttons function

It must also pass a visual and UX review.

Check:

### Visual

* Is the hierarchy clear?
* Is spacing consistent?
* Are colors intentional?
* Is the page visually calm?
* Are cards being overused?
* Are there unnecessary decorations?
* Are typography sizes appropriate?

### UX

* Is the main action obvious?
* Can users understand what they are looking at?
* Are errors recoverable?
* Are empty states useful?
* Are destructive actions safe?

### Responsive

* Desktop
* Laptop
* Tablet
* Mobile

### Accessibility

* Keyboard
* Focus
* Contrast
* Labels
* Semantic structure

### Engineering

* Reusable components
* No unnecessary duplication
* No console errors
* No broken states
* No fake data
* No hard-coded business values
* No random styling

---

# 42. FINAL ANTI-VIBE-CODING RULE

Before implementing any UI, inspect the existing design system and at least 2–3 existing screens.

**Reuse established patterns.**

Do not introduce a new visual pattern unless there is a documented UX reason for it.

The question is not:

> "How can I make this screen look impressive?"

The question is:

> "What is the clearest, most efficient and most trustworthy way for this user to complete this task?"

---

# 43. SCHOLENTRA DESIGN PHILOSOPHY

The visual direction should be:

**Restrained modern enterprise SaaS.**

Not:

**Flashy modern SaaS.**

Scholentra should look like software that school administrators, teachers, accountants and management can use every day for years.

The interface should become familiar.

It should not constantly demand attention.

Good design should feel intentional rather than decorative.

---

# 44. REQUIRED AGENT BEHAVIOR

While implementing Phase 6:

* Do not ask for permission to follow these design principles.
* Do not create a new design system unless the current project genuinely lacks one.
* Do not overwrite working backend functionality unnecessarily.
* Do not modify backend business logic merely to accommodate UI preferences.
* Do not fabricate API responses.
* Do not fabricate data.
* Do not create unnecessary dependencies.
* Do not introduce unnecessary component libraries.
* Do not replace MUI/Tailwind with another UI framework.
* Do not create one-off visual patterns for individual pages.
* Do not blindly follow generic dashboard templates.
* Do not optimize for screenshots at the expense of usability.
* Do not optimize for visual novelty at the expense of consistency.

---

# 45. REQUIRED FINAL REPORT FOR EACH MAJOR UI MILESTONE

When completing a major dashboard module, report:

### Implemented

List the pages/components completed.

### Reused

List existing components/design patterns reused.

### Added

List genuinely new reusable components.

### Design decisions

Briefly explain significant UX decisions.

### Responsive behavior

Explain important responsive adaptations.

### States

Confirm loading/empty/error/success states.

### Accessibility

Confirm accessibility considerations.

### Validation

Confirm that the rendered UI was visually inspected.

### Issues

Clearly identify anything that remains incomplete.

Do not claim visual validation if you only inspected source code.

---

# FINAL DIRECTIVE

Treat the two supplied files as the **Scholentra UI foundation**.

The color theme defines the visual language.

The Core UI Component System defines the component vocabulary.

The actual product workflows determine which components should be used.

Build Phase 6 as a cohesive, production-grade web application.

Do not build a collection of attractive-looking pages.

Build **one coherent product**.

The standard is:

**Intentional. Consistent. Restrained. Accessible. Responsive. Production-ready.**

Not:

**Fancy. Over-animated. Over-carded. Template-like. AI-generated-looking.**

When in doubt, prefer the simpler and more purposeful design.
