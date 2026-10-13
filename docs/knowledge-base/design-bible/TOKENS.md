# Design Tokens (TOKENS.md)

This file acts as the single source of truth for the variables and design tokens that compile into CSS custom properties, Tailwind tokens, and Electron wrappers.

> [!NOTE]
> The value definitions are intentionally blank. Values will be populated once visual alignment tests are conducted.

---

## 1. Color Tokens

| Token Category | Token Variable | Type / Format | Expected Value |
| :--- | :--- | :--- | :--- |
| **Backgrounds** | `--bg-pure-black` | CSS Color | |
| | `--bg-panel-dark` | CSS Color | |
| | `--bg-glass-card` | CSS Color | |
| **Accents** | `--color-voltage-yellow` | CSS Color | |
| | `--color-voltage-glow` | CSS Color | |
| **Borders** | `--border-muted` | CSS Color | |
| | `--border-highlight` | CSS Color | |
| **Statuses** | `--status-success` | CSS Color | |
| | `--status-warning` | CSS Color | |
| | `--status-error` | CSS Color | |

---

## 2. Typography Tokens

| Token Category | Token Variable | Type / Format | Expected Value |
| :--- | :--- | :--- | :--- |
| **Font Family** | `--font-system-sans` | String | |
| | `--font-system-mono` | String | |
| **Font Sizes** | `--text-xs` | Rem / Pixel | |
| | `--text-sm` | Rem / Pixel | |
| | `--text-base` | Rem / Pixel | |
| | `--text-lg` | Rem / Pixel | |
| | `--text-xl` | Rem / Pixel | |
| | `--text-2xl` | Rem / Pixel | |
| | `--text-display-lg` | Rem / Pixel | |
| **Font Weights**| `--font-weight-light` | Numeric | |
| | `--font-weight-regular`| Numeric | |
| | `--font-weight-medium` | Numeric | |
| | `--font-weight-bold` | Numeric | |
| | `--font-weight-black` | Numeric | |

---

## 3. Spacing & Grid Tokens

| Token Variable | Type / Format | Expected Value |
| :--- | :--- | :--- |
| `--spacing-xs` | Rem / Pixel | |
| `--spacing-sm` | Rem / Pixel | |
| `--spacing-md` | Rem / Pixel | |
| `--spacing-lg` | Rem / Pixel | |
| `--spacing-xl` | Rem / Pixel | |
| `--spacing-xxl` | Rem / Pixel | |

---

## 4. Radius Tokens

| Token Variable | Type / Format | Expected Value |
| :--- | :--- | :--- |
| `--radius-sm` | Rem / Pixel | |
| `--radius-md` | Rem / Pixel | |
| `--radius-lg` | Rem / Pixel | |
| `--radius-xl` | Rem / Pixel | |
| `--radius-full` | String | |

---

## 5. Elevation, Glow & Shadows

| Token Variable | Type / Format | Expected Value |
| :--- | :--- | :--- |
| `--shadow-card-flat` | CSS shadow | |
| `--shadow-card-elevated` | CSS shadow | |
| `--glow-voltage-sm` | CSS drop-shadow | |
| `--glow-voltage-lg` | CSS drop-shadow | |

---

## 6. Opacity, Blur & Glassmorphism

| Token Variable | Type / Format | Expected Value |
| :--- | :--- | :--- |
| `--opacity-disabled` | Decimal (0-1) | |
| `--opacity-muted` | Decimal (0-1) | |
| `--opacity-glass-bg` | Decimal (0-1) | |
| `--blur-backdrop-sm` | CSS filter | |
| `--blur-backdrop-lg` | CSS filter | |

---

## 7. Motion & Animation Tokens

| Token Variable | Type / Format | Expected Value |
| :--- | :--- | :--- |
| `--duration-instant` | Milliseconds | |
| `--duration-fast` | Milliseconds | |
| `--duration-normal` | Milliseconds | |
| `--duration-slow` | Milliseconds | |
| `--ease-linear` | Cubic Bezier | |
| `--ease-in` | Cubic Bezier | |
| `--ease-out` | Cubic Bezier | |
| `--ease-in-out` | Cubic Bezier | |
