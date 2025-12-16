# Branch Management Screen & Bulk Creation – Development Plan

## Overview
This document outlines the plan for implementing a new Branch Management screen in the admin UI, allowing tenant admins to create new branches (single or bulk), manage branch types, and view existing branches for context.

---

## UX/UI Design Improvements

### Design Philosophy
- **Minimize clicks**: Single screen for viewing, creating, and managing branches
- **Contextual guidance**: Show existing branches alongside creation form to prevent duplicates
- **Progressive disclosure**: Start simple, reveal advanced options when needed
- **Instant feedback**: Real-time validation and immediate success/error messages
- **Responsive design**: Works seamlessly on desktop, tablet, and mobile devices

---

## Features & UX

### 1. Branch Management Dashboard (Main Screen)
**Layout: Split-panel design**
- **Left Panel (60%)**: Table/list of existing branches with search and filters
- **Right Panel (40%)**: Quick-create form (always visible for rapid entry)

**Existing Branches Table Features:**
- **Columns**: Branch Name, Type, Created Date, Status (Active/Inactive), Actions
- **Search**: Real-time search by branch name or type
- **Filters**: Filter by branch type, status, date range
- **Sort**: Clickable column headers to sort
- **Quick Actions**: Edit icon, Delete icon (with confirmation), Set Default
- **Empty State**: Friendly message with "Create Your First Branch" CTA when no branches exist
- **Pagination**: Show 10/25/50 branches per page for large datasets
- **Visual Indicators**: Color-coded badges for branch types (retail=blue, warehouse=green, service=orange)

### 2. Quick Create Form (Right Panel)
- **Form Fields:**
  - Branch Name (required, real-time duplicate check)
  - Branch Type (required, combobox: type or select from predefined + add new)
  - Branch Status (toggle: Active by default)
  - Optional: Location/Address (expandable field)
  - Optional: Contact Phone/Email (expandable "Advanced" section)
- **Smart Features:**
  - Auto-suggest branch types based on existing branches
  - Real-time validation with inline error messages
  - Character counter for branch name (max 50 chars)
  - Duplicate name warning (checks against existing branches)
- **Actions:**
  - "Create Branch" button (primary, disabled until valid)
  - "Create & Add Another" button (saves and clears form for next entry)
  - "Cancel/Reset" link (clears form)
- **Success Feedback:**
  - Toast notification with branch name
  - New branch highlights in the table (fades after 3 seconds)
  - Form resets automatically for "Add Another" workflow

### 3. Branch Type Management (Integrated)
**Combobox Implementation:**
- Dropdown shows existing types with usage count (e.g., "Retail (3)")
- Type to search or add new type
- "Create new type: [entered text]" option appears dynamically
- Most-used types appear at top
- Custom types are saved to the backend and available for all future branches

**Predefined Types (with icons):**
- 🏪 Retail
- 📦 Warehouse
- 🔧 Service Center
- 🏢 Office
- 🏭 Manufacturing
- 🚚 Distribution Center
- Custom (user-defined)

### 4. Bulk Import from CSV
**Location**: Button in table header: "Import Branches" with upload icon
**Flow:**
1. Click "Import" → Modal opens
2. Show CSV template download link with example format
3. Drag-and-drop or click to upload CSV file
4. Preview table shows parsed data with validation indicators
5. Show validation summary: X valid, Y errors
6. Option to "Import Valid Branches Only" or "Fix Errors"
7. Progress indicator during import
8. Results screen: Success count, error details, option to download error report

**CSV Format:**
```
branch_name,branch_type,status,location,contact_phone,contact_email
Main Store,retail,active,"123 Main St",555-0100,main@example.com
Warehouse A,warehouse,active,"456 Industrial Rd",555-0101,warehouse@example.com
```

**Validation:**
- Check for required fields (name, type)
- Detect duplicates within CSV
- Check against existing branches
- Validate email format, phone format
- Row-by-row error reporting

### 5. Advanced Features

**Batch Operations:**
- Checkbox column in table for multi-select
- Bulk actions toolbar appears when items selected:
  - Activate/Deactivate selected branches
  - Delete selected branches (with confirmation)
  - Export selected to CSV

**Branch Templates:**
- "Save as Template" option after creating a branch
- Quick-create from template (pre-fills form with template data)
- Useful for franchise/chain businesses with standard branch setups

**Search & Filter:**
- Global search bar in table header
- Advanced filter panel (collapsible):
  - Filter by type (multi-select)
  - Filter by status (active/inactive/all)
  - Date range (created between X and Y)
  - Location/region (if location field is used)

### 6. Access Control & Permissions
- **Visibility**: Branch Management menu item only visible to "owner" role
- **Page Guard**: Route protected - redirects non-owners to dashboard with error message
- **API Security**: Backend validates owner role before any create/update/delete operations
- **Audit Trail**: Log who created/modified branches with timestamps (backend)

---

## Database Schema Updates

### Current branches table:
- id (TEXT, PRIMARY KEY, auto-generated UUID)
- tenant_id (TEXT, NOT NULL, foreign key)
- name (TEXT, NOT NULL)
- type (TEXT, optional)
- created_at (DATETIME, auto-generated)

### Recommended additions (Phase 2):
- status (TEXT, default 'active', values: 'active'|'inactive')
- location (TEXT, optional, for physical address)
- contact_phone (TEXT, optional)
- contact_email (TEXT, optional)
- is_default (BOOLEAN, default false, only one per tenant)
- updated_at (DATETIME, auto-update on changes)
- created_by (TEXT, foreign key to users.id)
- updated_by (TEXT, foreign key to users.id)

### New table: branch_types (Phase 2 - for better type management)
- id (TEXT, PRIMARY KEY)
- tenant_id (TEXT, NOT NULL) -- types can be tenant-specific
- name (TEXT, NOT NULL)
- icon (TEXT, optional, icon identifier)
- color (TEXT, optional, hex color for visual coding)
- is_system (BOOLEAN, default false) -- system types vs custom types
- created_at (DATETIME)

---

## Implementation Phases

### Phase 1: Core Functionality (MVP)
**Timeline: 3-4 days**

**Frontend:**
1. Create `BranchManagementPage.tsx` in `src/pages/`
2. Create supporting components:
   - `BranchTable.tsx` - Display existing branches
   - `BranchCreateForm.tsx` - Quick create form
   - `BranchTypeCombobox.tsx` - Type selector with add new
3. Add navigation item to `Sidebar.tsx` (owner-only)
4. Add route to `App.tsx` with role protection
5. Implement state management (React Query or Zustand)
6. Add form validation with react-hook-form + zod

**Backend:**
1. Update `BranchController.js`:
   - `POST /api/branches` - Create single branch
   - `GET /api/branches/:tenantId` - List branches (already exists)
   - `PUT /api/branches/:id` - Update branch (new)
   - `DELETE /api/branches/:id` - Delete branch (new)
   - Add duplicate name check
   - Add owner role validation
2. Update `BranchService.js` with new methods
3. Update `BranchRepository.js` for database operations
4. Add validation middleware for branch data

**Testing:**
- Manual testing: Create, view, edit, delete branches
- Test role-based access (non-owners blocked)
- Test duplicate name prevention
- Test across different tenants (data isolation)

### Phase 2: Enhanced Features
**Timeline: 2-3 days**

**Frontend:**
1. Implement CSV import modal component
2. Add CSV parsing and validation logic
3. Implement batch operations (select multiple, bulk delete)
4. Add search and filter functionality
5. Add pagination for large datasets
6. Implement branch templates feature
7. Add advanced fields (location, contact info) with expandable UI

**Backend:**
1. Create CSV import endpoint:
   - `POST /api/branches/import` - Bulk create from CSV
   - CSV parsing with validation
   - Return detailed success/error report
2. Create batch operations endpoint:
   - `POST /api/branches/batch` - Bulk update/delete
3. Update database schema (add new fields)
4. Create migration script for schema changes
5. Implement audit logging

**Testing:**
- CSV import with various formats and error cases
- Batch operations with multiple branches
- Performance testing with 100+ branches
- Mobile responsiveness testing

### Phase 3: Polish & Optimization
**Timeline: 1-2 days**

1. Add loading states and skeleton screens
2. Implement optimistic UI updates
3. Add keyboard shortcuts (Ctrl+N for new branch, etc.)
4. Add tooltips and help text
5. Implement error boundaries
6. Add analytics tracking for feature usage
7. Performance optimization (virtualized table for 1000+ branches)
8. Accessibility audit (ARIA labels, keyboard navigation)
9. Cross-browser testing

---

## Technical Implementation Details

### Frontend Stack
- **UI Framework**: React 18 + TypeScript
- **Form Management**: react-hook-form (performance, validation)
- **Validation**: Zod schemas (type-safe validation)
- **Data Fetching**: React Query (caching, optimistic updates)
- **UI Components**: Tailwind CSS + Headless UI or shadcn/ui
- **Icons**: lucide-react (consistent with existing codebase)
- **CSV Parsing**: papaparse library
- **Notifications**: react-hot-toast (already in use?)

### Backend Stack
- **Framework**: Express.js (existing)
- **Database**: PostgreSQL (existing)
- **Validation**: express-validator or joi
- **CSV Parsing**: csv-parser (Node.js)
- **Authentication**: JWT (existing middleware)

### API Endpoints

```
GET    /api/branches/:tenantId           - List all branches for tenant
POST   /api/branches                     - Create single branch
PUT    /api/branches/:id                 - Update branch
DELETE /api/branches/:id                 - Delete branch
POST   /api/branches/import              - Bulk import from CSV
POST   /api/branches/batch               - Batch operations
GET    /api/branches/types/:tenantId     - Get branch types
POST   /api/branches/types               - Create custom type
```

### Request/Response Examples

**Create Branch:**
```json
POST /api/branches
{
  "tenant_id": "uuid",
  "name": "Downtown Store",
  "type": "retail",
  "status": "active",
  "location": "123 Main St",
  "contact_phone": "555-0100"
}

Response: 201 Created
{
  "id": "uuid",
  "tenant_id": "uuid",
  "name": "Downtown Store",
  "type": "retail",
  "status": "active",
  "created_at": "2025-12-17T10:30:00Z"
}
```

**Validation & Error Handling:**
- 400 Bad Request: Invalid data, duplicate name
- 401 Unauthorized: No auth token
- 403 Forbidden: Non-owner trying to create branch
- 404 Not Found: Branch ID doesn't exist (for update/delete)
- 500 Server Error: Database or server issues

### State Management Strategy

**Use React Query for:**
- Fetching branches list (with caching)
- Creating/updating/deleting branches
- Optimistic updates (instant UI feedback)
- Automatic refetch after mutations

**Use Local State for:**
- Form inputs
- UI toggles (modals, filters)
- Selected rows for batch operations

### Security Considerations

1. **Role-based Access Control**:
   - Frontend: Hide UI elements for non-owners
   - Backend: Validate role in every endpoint
   
2. **Tenant Isolation**:
   - All queries filtered by tenant_id
   - Middleware validates user's tenant matches request
   
3. **Input Validation**:
   - Sanitize all inputs (prevent XSS, SQL injection)
   - Validate data types, lengths, formats
   - Rate limiting on create endpoints (prevent abuse)

4. **Audit Trail**:
   - Log all create/update/delete operations
   - Track who made changes and when
   - Useful for compliance and debugging

### Performance Optimization

1. **Frontend**:
   - Virtualized table for 1000+ branches (react-virtual)
   - Debounced search (300ms delay)
   - Lazy load CSV import modal
   - Memoize table rows and cells
   
2. **Backend**:
   - Database indexes on tenant_id, name, type
   - Pagination with cursor-based or offset
   - Cache frequently accessed data (Redis optional)
   - Batch insert for CSV import (transaction)

3. **Network**:
   - Compress API responses (gzip)
   - Implement ETag caching
   - Use React Query's stale-while-revalidate

---

## UX Best Practices & User Flow

### User Journey: Creating First Branch
1. Owner logs in → sees "Branch Management" in sidebar
2. Clicks "Branch Management" → sees empty state with prominent "Create Your First Branch" button
3. Clicks button → right panel form is highlighted
4. Fills in branch name and type → sees real-time validation
5. Clicks "Create Branch" → sees success toast and new branch appears in table with highlight
6. Can immediately create another or navigate away

### User Journey: Creating Multiple Branches
1. Owner opens Branch Management page
2. Sees existing branches in table (context)
3. Uses "Create & Add Another" workflow:
   - Fills form → clicks "Create & Add Another"
   - Form clears, focus returns to name field
   - Previous branch appears in table
   - Repeat until done
4. Alternative: Clicks "Import Branches" for CSV bulk import

### User Journey: Managing Existing Branches
1. Sees list of all branches with search/filter
2. Uses search to find specific branch
3. Clicks edit icon → inline editing or modal
4. Makes changes → sees instant validation
5. Saves → sees success confirmation
6. Branch updates in table immediately

### Visual Design Principles

**Color Coding:**
- Branch types have distinct colors (retail=blue, warehouse=green, etc.)
- Active branches: normal styling
- Inactive branches: greyed out with badge
- Default branch: gold star icon

**Iconography:**
- Each branch type has an associated icon
- Visual consistency across the application
- Accessible (not relying on color alone)

**Spacing & Layout:**
- Comfortable padding for touch targets (44px minimum)
- Clear visual hierarchy (headers, body, actions)
- Responsive breakpoints (mobile, tablet, desktop)

**Loading States:**
- Skeleton screens during initial load
- Inline spinners during operations
- Disabled states with cursor feedback

**Empty States:**
- Friendly illustrations
- Clear call-to-action
- Educational content ("Branches help organize...")

---

## Accessibility (A11y) Requirements

1. **Keyboard Navigation:**
   - Tab through form fields in logical order
   - Enter to submit form
   - Escape to close modals
   - Arrow keys for table navigation
   - Keyboard shortcuts (Ctrl+N for new, etc.)

2. **Screen Reader Support:**
   - Semantic HTML (table, form, button elements)
   - ARIA labels for icons and actions
   - ARIA live regions for dynamic content
   - Descriptive link text (not "click here")

3. **Visual Accessibility:**
   - WCAG AA contrast ratios (4.5:1 for text)
   - Focus indicators (visible outline)
   - Text resizing support (up to 200%)
   - No information conveyed by color alone

4. **Error Handling:**
   - Clear error messages next to fields
   - Error summary at top of form
   - Focus moves to first error on submit
   - Errors announced to screen readers

---

## Testing Strategy

### Unit Tests
- Form validation logic
- CSV parsing functions
- Duplicate detection
- Branch type management

### Integration Tests
- API endpoint responses
- Database operations
- Authentication/authorization
- Tenant isolation

### E2E Tests (Playwright/Cypress)
- Complete create branch flow
- CSV import flow
- Edit and delete operations
- Search and filter functionality
- Role-based access control

### Manual Testing Checklist
- [ ] Owner can access page, non-owners cannot
- [ ] Create branch with all field types
- [ ] Duplicate name is prevented
- [ ] Edit existing branch
- [ ] Delete branch with confirmation
- [ ] CSV import with valid data
- [ ] CSV import with errors shows proper feedback
- [ ] Search filters results correctly
- [ ] Pagination works with many branches
- [ ] Mobile responsive design
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Cross-browser (Chrome, Firefox, Safari, Edge)

---

## Future Enhancement Ideas

### Phase 4+ (Post-MVP)
1. **Branch Analytics:**
   - Performance metrics per branch
   - Revenue comparison charts
   - Staff productivity by branch
   
2. **Branch Hierarchy:**
   - Parent-child relationships (regional → local)
   - Cascading permissions
   - Rollup reporting

3. **Geolocation Features:**
   - Map view of all branches
   - Distance calculator
   - Territory management

4. **Branch Cloning:**
   - Duplicate branch with all settings
   - Clone inventory, staff, configs
   - Useful for franchises

5. **Branch Transfer:**
   - Move customers between branches
   - Transfer inventory
   - Transfer staff assignments

6. **Advanced Import:**
   - Import from Google Sheets (API integration)
   - Scheduled imports (automated sync)
   - Import validation rules by admin

7. **Branch Groups/Tags:**
   - Group branches by region, type, etc.
   - Apply bulk settings to groups
   - Reporting by groups

8. **Notifications:**
   - Email admin when new branch is created
   - Alert when branch is deleted
   - Slack/Teams integration

---

## Documentation Requirements

### User Documentation
1. **Help Center Article**: "How to Create and Manage Branches"
2. **Video Tutorial**: Screen recording of branch creation workflow
3. **CSV Import Guide**: Template, field descriptions, troubleshooting
4. **FAQ**: Common questions and answers

### Developer Documentation
1. **API Documentation**: OpenAPI/Swagger spec for branch endpoints
2. **Component Documentation**: Storybook for React components
3. **Database Schema**: ERD diagram with relationships
4. **Architecture Decision Records**: Why certain tech choices were made

---

## Success Metrics

### Quantitative Metrics
- Time to create a branch (target: < 30 seconds)
- CSV import success rate (target: > 95%)
- Page load time (target: < 2 seconds)
- Error rate (target: < 1%)
- Mobile usage percentage

### Qualitative Metrics
- User satisfaction survey (post-feature)
- Number of support tickets related to branches
- Feature adoption rate (% of owners using it)
- User feedback and feature requests

### Business Metrics
- Average number of branches per tenant
- Correlation between branches and revenue
- Feature usage over time (growing or declining)

---

## Rollout Plan

### Soft Launch (Week 1)
- Deploy to staging environment
- Internal testing by team
- Invite 5-10 beta users (power users)
- Collect feedback and iterate

### Beta Launch (Week 2-3)
- Deploy to production with feature flag
- Enable for 25% of owners
- Monitor metrics and error rates
- Fix critical bugs quickly

### Full Launch (Week 4)
- Enable for all owners
- Announce via email/in-app notification
- Publish help documentation
- Monitor support channels

### Post-Launch (Ongoing)
- Weekly metrics review
- Monthly user feedback sessions
- Quarterly feature enhancements
- Track feature requests for Phase 2+

---

## Notes
- **Start with Phase 1 MVP**: Core functionality only, get feedback early
- **Iterate based on real usage**: Don't over-engineer, build what users need
- **Mobile-first approach**: Many SMB owners manage on mobile devices
- **Performance is critical**: Fast = better user experience = more usage
- **Accessibility is not optional**: Inclusive design benefits everyone

---

## Appendix

### Recommended Libraries
- **react-hook-form**: Form state and validation (40KB)
- **zod**: Schema validation (11KB)
- **react-query**: Data fetching and caching (15KB)
- **papaparse**: CSV parsing (45KB)
- **react-hot-toast**: Notifications (5KB)
- **lucide-react**: Icons (already in use)
- **headlessui**: Accessible components (45KB)

### Design Resources
- Figma mockups (to be created)
- Component library (extend existing)
- Style guide (colors, typography, spacing)

### Related Documentation
- [Multi-Branch Implementation Plan](../MULTI_BRANCH_IMPLEMENTATION_PLAN.md)
- [NFR Implementation Plan](../NFR_IMPLEMENTATION_PLAN.md)
- [API Documentation](../../backend/API_DOCUMENTATION.md)

---

**Document Version: 2.0**  
**Last Updated: 2025-12-17**  
**Author: GitHub Copilot + Development Team**  
**Status: Ready for Implementation**
