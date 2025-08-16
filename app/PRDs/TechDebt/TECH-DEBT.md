# Technical Debt - Elite Trading Coach AI

## Overview
This document tracks technical debt items that need to be addressed in future development cycles.

## Critical Items

### 1. Layout System Duplication (Priority: High)
**Issue**: Two competing layout systems exist
- **Current**: `DesktopLayout` (in use, working)  
- **New**: `BaseLayout` (implemented per PRD-1.1.3.4, not integrated)

**Impact**: 
- Code duplication and maintenance overhead
- Missing theme switching functionality in current layout
- Inconsistent component architecture

**Resolution Required**:
- [ ] Decide on single layout system approach
- [ ] Migrate DesktopLayout to use BaseLayout components OR
- [ ] Integrate UserDropdown/theme switching into DesktopLayout
- [ ] Remove unused layout components
- [ ] Update documentation and component exports

**Files Affected**:
- `src/components/layout/DesktopLayout.tsx` (current)
- `src/components/layout/BaseLayout.tsx` (new)
- `src/components/layout/Header.tsx` (new, unused)
- `src/components/layout/UserDropdown.tsx` (new, unused)
- `src/App.tsx` (imports DesktopLayout)

**Estimated Effort**: 4-8 hours
**Risk Level**: Medium (breaking change potential)

## Medium Priority Items

### 2. Theme Management Integration
**Issue**: Theme switching UI not available to users
- ThemeContext implemented but no UI access
- UserDropdown with theme toggle exists but unused

**Resolution Required**:
- [ ] Add theme switching to DesktopHeader
- [ ] Test theme persistence across sessions
- [ ] Verify dark/light/system theme functionality

### 3. Component Architecture Consistency
**Issue**: Mixed component patterns and naming conventions
- Some components use memo, others don't
- Inconsistent prop interfaces
- Mixed file naming (Header vs DesktopHeader)

**Resolution Required**:
- [ ] Standardize component patterns
- [ ] Consolidate similar components
- [ ] Update naming conventions

## Low Priority Items

### 4. CSS Class Optimization
**Issue**: Custom CSS classes vs TailwindCSS inconsistency
- Some components use custom classes (.desktop-layout)
- Others use pure TailwindCSS
- Potential for unused CSS

**Resolution Required**:
- [ ] Audit CSS usage
- [ ] Standardize on TailwindCSS where possible
- [ ] Remove unused custom classes

### 5. Performance Monitoring Integration
**Issue**: usePerformanceMonitor hook created but not widely used
- Only used in new BaseLayout components
- Missing from existing DesktopLayout system

**Resolution Required**:
- [ ] Add performance monitoring to all major components
- [ ] Set up performance dashboards
- [ ] Implement performance budgets

## Technical Documentation

### Impact Assessment
- **User Impact**: Theme switching missing (user-visible)
- **Developer Impact**: Code duplication, confusion about which components to use
- **Maintenance Impact**: Two layout systems to maintain

### Recommended Timeline
1. **Sprint 1**: Resolve layout duplication (#1)
2. **Sprint 2**: Theme management integration (#2)  
3. **Sprint 3**: Component architecture cleanup (#3)
4. **Sprint 4**: CSS and performance optimization (#4, #5)

## Notes
- PRD-1.1.3.4 implementation was successful but created architectural divergence
- Current DesktopLayout is functional and should be preserved during migration
- User experience should not be disrupted during debt resolution

---
**Last Updated**: 2025-01-15
**Next Review**: Next sprint planning