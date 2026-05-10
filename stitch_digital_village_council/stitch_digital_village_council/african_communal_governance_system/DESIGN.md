---
name: African Communal Governance System
colors:
  surface: '#111415'
  surface-dim: '#111415'
  surface-bright: '#373a3b'
  surface-container-lowest: '#0c0f10'
  surface-container-low: '#191c1d'
  surface-container: '#1d2021'
  surface-container-high: '#282a2b'
  surface-container-highest: '#323536'
  on-surface: '#e1e3e4'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#e1e3e4'
  inverse-on-surface: '#2e3132'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#e9c349'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#b9c7e4'
  on-secondary: '#233148'
  secondary-container: '#3c4962'
  on-secondary-container: '#abb9d6'
  tertiary: '#becef5'
  on-tertiary: '#20304f'
  tertiary-container: '#a3b3d8'
  on-tertiary-container: '#354565'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#b9c7e4'
  on-secondary-fixed: '#0d1c32'
  on-secondary-fixed-variant: '#39475f'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#b6c6ed'
  on-tertiary-fixed: '#091b39'
  on-tertiary-fixed-variant: '#374767'
  background: '#111415'
  on-background: '#e1e3e4'
  surface-variant: '#323536'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  mobile-h1:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  card-padding: 24px
---

## Brand & Style

The design system is anchored in the concept of "Digital Ubuntu"—emphasizing communal progress, transparency, and shared dignity. It targets community leaders and members who require a professional yet accessible environment for collective decision-making and financial stewardship. 

The style is **Corporate Modern with Tactile Metaphors**. It leverages the visual language of physical membership cards and official ledgers to instill a sense of permanence and belonging. By avoiding technical jargon and high-concept abstractions, the design system focuses on utility and warmth. The emotional response should be one of "secure belonging"—the feeling of entering a well-guarded, prestigious community hall. High-quality whitespace and gold accents elevate the experience from a mere utility to a premium governance tool.

## Colors

The palette is designed for high legibility and a "prestige" feel. 
- **Primary Background (#0A192F):** A deep navy that provides a stable, professional foundation.
- **Primary Accent (#D4AF37):** A rich gold used exclusively for primary calls to action, active states, and symbols of authority or achievement.
- **Surface Layer (#112240):** A subtle slate used for "membership cards" and containers, providing necessary contrast against the deep navy background.
- **Typography (#F8F9FA):** An off-white that reduces eye strain while maintaining maximum contrast.
- **Functional Green:** A specific green cue is reserved for mobile-money (M-Pesa) integration points to provide instant recognition for transaction-related tasks.

## Typography

The design system utilizes **Manrope** for headlines to provide a modern, geometric, and trustworthy character. For body text and functional labels, **Inter** is used due to its exceptional legibility on mobile screens and neutral, systematic feel.

Hierarchy is strictly enforced to ensure complex governance data remains readable. Labels use a slight letter-spacing increase and uppercase styling to distinguish them from interactive body text. Headline weights are kept bold to project authority and clear structure.

## Layout & Spacing

This design system uses a **Fixed Grid** on desktop and a **Fluid Grid** on mobile. 
- **Desktop:** A 12-column grid centered in a 1200px container.
- **Mobile:** A single-column layout with 16px side margins. 

The spacing rhythm is based on an 8px base unit. Component internal padding should be generous (24px for cards) to maintain a "sophisticated" and "uncluttered" feel. Layouts should prioritize vertical stacking for ease of use on mobile devices, where the majority of community members will access the platform.

## Elevation & Depth

Depth is conveyed through **Tonal Layering** and **Subtle Shadows**. 
1. **Base Layer:** Deep Navy (#0A192F) serves as the ground.
2. **Card Layer:** Subtle Slate (#112240) creates the primary "membership card" surface. This layer uses a soft, low-opacity black shadow (15% opacity, 12px blur) to appear slightly lifted.
3. **Interactive Layer:** Gold (#D4AF37) elements appear at the highest elevation, using a subtle outer glow rather than a dark shadow to emphasize their "active" and "valuable" nature.

Avoid glassmorphism; surfaces should feel solid and dependable, like physical cards or official documents.

## Shapes

The design system employs **Rounded** corners (0.5rem / 8px) to balance professionalism with warmth. 
- **Primary Buttons:** Use a slightly higher roundedness (rounded-lg) to make them feel more "clickable" and friendly.
- **Membership Cards:** Use the standard 8px radius to maintain a structured, official appearance.
- **Avatars:** Always circular to represent the "circle of the community."

The consistent use of soft corners avoids the aggressive feel of sharp edges while remaining more formal than fully pill-shaped "playful" designs.

## Components

### Membership Cards
The primary container for information. These should include a subtle "ID-card" top-border or an icon in the top right representing the member's status. Use the Slate background (#112240) with Off-White text.

### Buttons
- **Primary:** Rich Gold (#D4AF37) background with Navy (#0A192F) text. Bold weight.
- **Secondary:** Transparent with a 1px Gold border and Gold text.
- **M-Pesa Action:** A specialized green button with the mobile-money logo cue, used only for financial contributions.

### Input Fields
Darker than the card background to show "inset" depth. Use a 1px Slate-Light border that turns Gold on focus. Labels must always be visible above the field.

### Progress Indicators (Communal Goals)
Horizontal bars using a Gold fill on a Navy track. These represent community fundraising or voting milestones.

### Status Chips
Small, low-profile badges (e.g., "Verified Member," "Paid," "Active Proposal"). Use low-opacity versions of status colors with high-contrast text.

### Navigation
A bottom-bar navigation is preferred for mobile, using Gold for the active state icon and Off-White for inactive states. This ensures "thumb-friendly" access for governance on the go.