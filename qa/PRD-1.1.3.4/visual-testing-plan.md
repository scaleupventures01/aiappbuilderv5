# Visual Frontend Testing Plan - PRD-1.1.3.4

## Visual Test Cases

### 1. Layout Rendering Tests
- **VT-001**: BaseLayout renders with correct structure
- **VT-002**: Header displays user info and controls correctly  
- **VT-003**: Sidebar navigation items display with proper styling
- **VT-004**: UserDropdown shows all menu items and user info
- **VT-005**: Responsive breakpoints work (mobile, tablet, desktop)

### 2. Theme Switching Tests  
- **VT-006**: Light theme displays correct colors and contrast
- **VT-007**: Dark theme displays correct colors and contrast
- **VT-008**: System theme follows OS preference
- **VT-009**: Theme transitions are smooth (unless reduced motion)
- **VT-010**: All components update when theme changes

### 3. Interactive States Tests
- **VT-011**: Hover states on buttons and links
- **VT-012**: Focus states visible and accessible
- **VT-013**: Active/pressed states on interactive elements
- **VT-014**: Loading states during theme changes
- **VT-015**: Error states display correctly

### 4. Accessibility Visual Tests
- **VT-016**: Focus indicators meet WCAG contrast requirements
- **VT-017**: Text contrast ratios meet WCAG 2.1 AA (4.5:1)
- **VT-018**: Skip links appear on focus
- **VT-019**: Reduced motion preference respected
- **VT-020**: High contrast mode support

## Testing Methods

### 1. Manual Visual Testing
**Required Browser/Device Matrix:**
- Chrome (latest) - Desktop, Mobile
- Firefox (latest) - Desktop  
- Safari (latest) - Desktop, Mobile
- Edge (latest) - Desktop

**Screen Sizes:**
- Mobile: 375px, 414px
- Tablet: 768px, 1024px  
- Desktop: 1280px, 1920px

### 2. Automated Visual Testing
- Screenshot comparison testing
- Accessibility color contrast validation
- Responsive design validation

### 3. Live Development Server Testing
Start dev server and manually verify all visual cases

## Implementation

### Step 1: Start Development Server
```bash
cd app && npm run dev
```

### Step 2: Visual Verification Checklist
Navigate through each component and verify:

1. **Layout Structure** ✓
   - Header at top with correct height
   - Sidebar toggles properly on mobile
   - Main content area responsive
   - Footer positioning correct

2. **Component Styling** ✓
   - TailwindCSS classes applied correctly
   - Custom component styles working
   - Icons display properly
   - Typography consistent

3. **Theme Switching** ✓
   - Toggle between light/dark themes
   - System theme detection working
   - All colors update correctly
   - No flash of unstyled content

4. **Responsive Behavior** ✓
   - Mobile: Sidebar becomes overlay
   - Tablet: Condensed navigation
   - Desktop: Full sidebar visible
   - User dropdown adapts to screen size

5. **Accessibility Features** ✓
   - Focus indicators visible
   - Skip links appear on tab
   - Color contrast sufficient
   - Screen reader announcements working

### Step 3: Automated Checks