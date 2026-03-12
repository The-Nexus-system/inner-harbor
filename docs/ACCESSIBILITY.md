# Mosaic — Accessibility Notes

## Design Philosophy

Mosaic is built for disabled plural systems. Accessibility is not a feature — it is the foundation. The app prioritizes low cognitive load, calm aesthetics, and compatibility with assistive technology.

---

## Standards

- WCAG 2.1 AA compliance target
- Semantic HTML throughout
- ARIA labels on all interactive elements
- Keyboard-navigable interface (all features accessible without a mouse)

---

## Visual Accessibility

- **High contrast mode**: Togglable, increases contrast ratios beyond AA minimums
- **Dark mode**: Reduces visual strain; respects system preference
- **Font sizes**: Four levels (small, medium, large, extra large)
- **Font choice**: Atkinson Hyperlegible for body text (designed for low vision)
- **Color**: Never used as the only indicator — always paired with text or icons
- **Focus indicators**: 3px solid outline, high contrast, visible on all interactive elements

---

## Motor Accessibility

- **Large tap targets**: Minimum 44×44px on all interactive elements
- **Reduced motion**: Respects `prefers-reduced-motion` and provides in-app toggle
- **Spacing options**: Compact, normal, spacious layout modes
- **No drag-and-drop requirements**: All actions available via click/tap or keyboard

---

## Cognitive Accessibility

- **Plain language mode**: Simplifies labels and descriptions
- **Calm, non-clinical language**: No alarmist error messages
- **Consistent layout**: Sidebar navigation, predictable page structure
- **Low information density**: Cards with clear headers, progressive disclosure
- **Autosave**: Reduces anxiety about losing work (journal, check-ins)
- **Save status indicators**: Clear "Saved" / "Saving..." feedback

---

## Screen Reader Support

- Skip-to-content link on every page
- Semantic heading hierarchy (single H1 per page)
- ARIA labels on cards, forms, and interactive widgets
- Live regions for dynamic updates (save status, notifications)
- Table-based data views as primary (charts are supplementary)
- Screen reader optimization toggle in settings

---

## AAC and Communication Support

- Short, clear labels suitable for AAC users
- Emoji + text pairing for alter identification
- No reliance on hover states for essential information
- Compatible with switch access and eye-tracking input

---

## Testing Notes

- Tested with keyboard navigation
- Designed for VoiceOver (macOS/iOS) and NVDA (Windows) compatibility
- Braille-friendly labels (no icon-only buttons)
- Color contrast verified with WCAG contrast checker tools

---

## Known Limitations

- Charts (Recharts) have limited screen reader support — table views provided as accessible alternative
- Calendar widget may need additional ARIA work for complex date selection
- Drag-and-drop interactions are not used

---

## Reporting Issues

If you encounter an accessibility barrier, please open an issue with the label `accessibility`. Every barrier is treated as a bug.
