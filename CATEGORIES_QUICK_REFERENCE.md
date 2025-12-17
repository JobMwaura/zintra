# 🏗️ Construction Categories - Quick Reference

**Quick lookup guide for Zintra construction categories**

---

## 📦 Import Statements

```javascript
// Import category data
import {
  RFQ_CATEGORIES,
  VENDOR_CATEGORIES,
  CONSTRUCTION_PROFESSIONALS,
  MATERIALS_CATEGORIES,
  EQUIPMENT_CATEGORIES,
  ALL_PROFESSIONAL_SERVICES,
  ALL_MATERIALS,
  ALL_EQUIPMENT
} from '@/lib/constructionCategories';

// Import components
import {
  RFQCategorySelect,
  VendorCategorySelect,
  ProfessionalServicesSelect,
  MaterialsSelect,
  CategoryCards,
  CategoryFilter
} from '@/components/CategorySelector';
```

---

## 🎯 RFQ Categories (15 total)

| Icon | Value | Label |
|------|-------|-------|
| 🧱 | `building_materials` | Building Materials |
| 🎨 | `finishing_interior` | Finishing & Interior |
| 💡 | `electrical_lighting` | Electrical & Lighting |
| 🚿 | `plumbing_sanitation` | Plumbing & Sanitation |
| 🏠 | `roofing` | Roofing Materials |
| 🚪 | `doors_windows` | Doors & Windows |
| 🔧 | `hardware_tools` | Hardware & Tools |
| 🌳 | `landscaping` | Landscaping & Outdoor |
| 🔒 | `security_safety` | Security & Safety |
| ❄️ | `hvac` | HVAC & Cooling |
| ☀️ | `renewable_energy` | Renewable Energy |
| 🍳 | `kitchen_bathroom` | Kitchen & Bathroom |
| 🚜 | `equipment_hire` | Equipment Hire |
| 👷 | `professional_services` | Professional Services |
| 📦 | `other` | Other |

---

## 👷 Vendor Categories (22 total)

| Value | Label |
|-------|-------|
| `general_contractor` | General Contractor |
| `architect` | Architect |
| `engineer` | Structural Engineer |
| `quantity_surveyor` | Quantity Surveyor |
| `interior_designer` | Interior Designer |
| `electrician` | Electrician |
| `plumber` | Plumber |
| `carpenter` | Carpenter |
| `mason` | Mason/Bricklayer |
| `painter` | Painter & Decorator |
| `tiler` | Tiler |
| `roofer` | Roofer |
| `welder` | Welder/Metal Fabricator |
| `landscaper` | Landscaper |
| `solar_installer` | Solar Installer |
| `hvac_technician` | HVAC Technician |
| `waterproofing` | Waterproofing Specialist |
| `security_installer` | Security System Installer |
| `materials_supplier` | Building Materials Supplier |
| `equipment_rental` | Equipment Rental |
| `hardware_store` | Hardware Store |
| `other` | Other |

---

## 🛠️ Professional Services by Category

### Design & Planning
- Architects (10 services)
- Structural Engineers (8 services)
- Quantity Surveyors (8 services)
- Interior Designers (9 services)
- Urban Planners (5 services)

### Building & Construction
- General Contractors (7 services)
- Masons & Bricklayers (7 services)
- Concrete Specialists (7 services)
- Carpenters (9 services)
- Welders & Metal Fabricators (7 services)
- Roofers (8 services)

### Finishing & Interior
- Painters & Decorators (8 services)
- Tilers (7 services)
- Flooring Specialists (8 services)
- Ceiling Installers (6 services)
- Plasterers (6 services)
- Cabinet Makers (5 services)

### Electrical
- Electricians (9 services)
- Solar Installers (6 services)
- Lighting Specialists (5 services)
- Generator Installers (4 services)

### Plumbing
- Plumbers (11 services)
- Drainage Specialists (6 services)
- Water Treatment Specialists (5 services)

### HVAC & Mechanical
- HVAC Technicians (6 services)
- Refrigeration Technicians (4 services)

### Landscaping & Outdoor
- Landscapers (7 services)
- Paving Specialists (6 services)
- Fence Installers (6 services)
- Swimming Pool Contractors (5 services)

### Security & Safety
- Security System Installers (7 services)
- Fire Safety Specialists (5 services)

### Specialized Services
- Waterproofing Specialists (6 services)
- Insulation Specialists (5 services)
- Glass & Glazing (6 services)
- Demolition Specialists (4 services)
- Renovation Specialists (5 services)
- Prefab & Modular Construction (5 services)

### Consultation & Inspection
- Building Inspectors (5 services)
- Project Managers (5 services)
- Construction Consultants (5 services)

---

## 🧱 Popular Building Materials

### Structural
- Cement (42.5, 32.5)
- Ready-Mix Concrete
- Concrete Blocks
- Reinforcement Steel (Y8, Y10, Y12, Y16, Y20, Y24)
- Binding Wire
- Cypress Timber
- Plywood

### Roofing
- Mabati (Iron Sheets)
- Box Profile Roofing
- Roofing Tiles
- Roof Trusses
- Gutters

### Finishing
- Emulsion Paint
- Gloss Paint
- Floor Tiles (Ceramic, Porcelain)
- Wall Tiles
- Vinyl Flooring
- Gypsum Boards

### Plumbing
- PVC Pipes
- PPR Pipes
- Toilets (Water Closets)
- Sinks
- Taps & Faucets
- Water Tanks

### Electrical
- Electrical Cables (1.5mm, 2.5mm, 4mm, 6mm)
- Circuit Breakers
- LED Bulbs
- Sockets

### Hardware
- Wire Nails
- Wood Screws
- Tile Adhesive
- Silicone Sealant

---

## 💻 Common Usage Patterns

### 1. Simple Category Select
```javascript
<RFQCategorySelect
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  required={true}
/>
```

### 2. Vendor Category with Multiple Selection
```javascript
<VendorCategorySelect
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  multiple={false}
/>
```

### 3. Visual Category Cards
```javascript
<CategoryCards
  selectedCategory={selectedCategory}
  onCategorySelect={setSelectedCategory}
/>
```

### 4. Browse Page Filter
```javascript
<CategoryFilter
  value={filter}
  onChange={(e) => setFilter(e.target.value)}
  includeAllOption={true}
/>
```

### 5. Grouped Services Dropdown
```javascript
<ProfessionalServicesSelect
  value={service}
  onChange={(e) => setService(e.target.value)}
/>
```

### 6. Grouped Materials Dropdown
```javascript
<MaterialsSelect
  value={material}
  onChange={(e) => setMaterial(e.target.value)}
/>
```

---

## 🔍 Search Functions

```javascript
// Search for services
import { searchServices } from '@/lib/constructionCategories';
const results = searchServices('painting');

// Search for materials
import { searchMaterials } from '@/lib/constructionCategories';
const materials = searchMaterials('cement');

// Get services by category
import { getServicesByCategory } from '@/lib/constructionCategories';
const services = getServicesByCategory('Electrical');

// Get materials by category
import { getMaterialsByCategory } from '@/lib/constructionCategories';
const items = getMaterialsByCategory('Structural Materials');
```

---

## 🌍 Regional Variations

### Kenya 🇰🇪
**Top 5 Materials**:
1. Cement (42.5)
2. Mabati (Iron Sheets)
3. Reinforcement Steel
4. Concrete Blocks
5. Cabro Blocks

**Top 5 Services**:
1. Masonry/Bricklaying
2. Electrical Wiring
3. Plumbing Installation
4. Roofing
5. Painting

### South Africa 🇿🇦
**Top 5 Materials**:
1. Steel Frame
2. Concrete
3. Tiles
4. Insulation
5. Glass & Glazing

**Top 5 Services**:
1. General Contracting
2. HVAC Installation
3. Solar Installation
4. Security Systems
5. Electrical Work

### Zimbabwe 🇿🇼
**Top 5 Materials**:
1. Cement
2. Roofing Materials
3. Timber
4. Bricks
5. Paint

**Top 5 Services**:
1. Building/Construction
2. Welding
3. Carpentry
4. Electrical
5. Plumbing

---

## 📊 Quick Stats

| Metric | Count |
|--------|-------|
| RFQ Categories | 15 |
| Vendor Categories | 22 |
| Professional Service Categories | 10 |
| Professional Subcategories | 40+ |
| Individual Services | 200+ |
| Materials Categories | 13 |
| Individual Materials | 300+ |
| Equipment Categories | 5 |
| Individual Equipment Items | 50+ |
| **TOTAL ITEMS** | **550+** |

---

## 🎯 Where to Use Each Component

### RFQCategorySelect
**Use in**:
- Post RFQ Wizard
- Direct RFQ Popup
- Public RFQ Form
- Quick Quote Form

### VendorCategorySelect
**Use in**:
- Vendor Registration
- Vendor Profile Edit
- Vendor Settings
- Admin Vendor Management

### CategoryCards
**Use in**:
- Home Page (Browse by Category)
- Browse RFQs Page
- Browse Vendors Page
- Landing Pages

### CategoryFilter
**Use in**:
- Browse RFQs (filter sidebar)
- Browse Vendors (filter sidebar)
- Search Results Page
- Dashboard Analytics

### ProfessionalServicesSelect
**Use in**:
- Vendor Service Management
- RFQ Service Requirements
- Vendor Profile Details
- Service Provider Forms

### MaterialsSelect
**Use in**:
- Product Management
- RFQ Material Requirements
- Inventory Management
- Catalog Creation

---

## 🔗 Related Files

| File | Purpose | Size |
|------|---------|------|
| `lib/constructionCategories.js` | Category data source | ~35KB |
| `components/CategorySelector.js` | UI components | ~15KB |
| `CONSTRUCTION_CATEGORIES_SUMMARY.md` | Full documentation | ~20KB |
| `CATEGORIES_QUICK_REFERENCE.md` | This file | ~5KB |

---

## ✅ Implementation Checklist

### Phase 1: RFQ Forms
- [ ] Update `app/post-rfq/wizard/page.js`
- [ ] Update `app/post-rfq/public/page.js`
- [ ] Update `app/post-rfq/direct/page.js`
- [ ] Update `components/DirectRFQPopup.js`

### Phase 2: Vendor Forms
- [ ] Update `app/vendor-registration/page.js`
- [ ] Update `app/vendor-profile/[id]/page.js`

### Phase 3: Browse Pages
- [ ] Update `app/browse/page.js`
- [ ] Update `app/browse-rfqs/page.js`
- [ ] Add category filters

### Phase 4: Database
- [ ] Run SQL migrations
- [ ] Add category columns
- [ ] Create indexes
- [ ] Backfill existing data

### Phase 5: Testing
- [ ] Test all dropdowns
- [ ] Test search functionality
- [ ] Test filters
- [ ] Verify mobile responsiveness

---

**Last Updated**: December 17, 2025
**Status**: Ready for implementation
