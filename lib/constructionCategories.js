/**
 * ============================================================================
 * CONSTRUCTION INDUSTRY CATEGORIES - COMPLETE TAXONOMY
 * ============================================================================
 * Comprehensive list of construction professionals, materials, services,
 * and equipment for Kenya, South Africa, and Zimbabwe markets.
 *
 * Usage:
 *   import { CONSTRUCTION_CATEGORIES, MATERIALS_CATEGORIES } from '@/lib/constructionCategories';
 *
 * Version: 1.0
 * Last Updated: December 17, 2025
 * ============================================================================
 */

// ============================================================================
// 1. CONSTRUCTION PROFESSIONALS & SERVICES
// ============================================================================

export const CONSTRUCTION_PROFESSIONALS = [
  // ============================================================================
  // DESIGN & PLANNING PROFESSIONALS
  // ============================================================================
  {
    category: 'Design & Planning',
    subcategories: [
      {
        name: 'Architects',
        services: [
          'Architectural Design',
          'Building Plans & Drawings',
          'Residential Architecture',
          'Commercial Architecture',
          'Interior Architecture',
          '3D Visualization & Rendering',
          'Renovation Design',
          'Landscape Architecture',
          'Sustainable Building Design',
          'Building Regulations Compliance',
        ],
      },
      {
        name: 'Structural Engineers',
        services: [
          'Structural Design',
          'Foundation Design',
          'Structural Analysis',
          'Building Inspection',
          'Load Calculations',
          'Reinforcement Design',
          'Structural Drawings',
          'Building Certification',
        ],
      },
      {
        name: 'Quantity Surveyors',
        services: [
          'Bill of Quantities (BOQ)',
          'Cost Estimation',
          'Project Budgeting',
          'Tender Documentation',
          'Cost Management',
          'Contract Administration',
          'Valuation Services',
          'Feasibility Studies',
        ],
      },
      {
        name: 'Interior Designers',
        services: [
          'Interior Design',
          'Space Planning',
          'Furniture Selection',
          'Color Consultation',
          'Lighting Design',
          '3D Interior Rendering',
          'Kitchen Design',
          'Bathroom Design',
          'Office Interior Design',
        ],
      },
      {
        name: 'Urban Planners',
        services: [
          'Urban Planning',
          'Site Planning',
          'Zoning Consultation',
          'Environmental Impact Assessment',
          'Land Use Planning',
        ],
      },
    ],
  },

  // ============================================================================
  // BUILDING & CONSTRUCTION PROFESSIONALS
  // ============================================================================
  {
    category: 'Building & Construction',
    subcategories: [
      {
        name: 'General Contractors',
        services: [
          'General Contracting',
          'Project Management',
          'New Construction',
          'Building Renovation',
          'Commercial Construction',
          'Residential Construction',
          'Turnkey Projects',
        ],
      },
      {
        name: 'Masons & Bricklayers',
        services: [
          'Bricklaying',
          'Blockwork',
          'Stone Masonry',
          'Foundation Work',
          'Wall Construction',
          'Retaining Walls',
          'Chimney Construction',
        ],
      },
      {
        name: 'Concrete Specialists',
        services: [
          'Concrete Pouring',
          'Slab Construction',
          'Foundation Laying',
          'Reinforced Concrete',
          'Concrete Finishing',
          'Stamped Concrete',
          'Concrete Repair',
        ],
      },
      {
        name: 'Carpenters',
        services: [
          'Carpentry',
          'Roofing Carpentry',
          'Door Installation',
          'Window Installation',
          'Custom Furniture',
          'Decking',
          'Trusses & Framework',
          'Kitchen Cabinets',
          'Built-in Wardrobes',
        ],
      },
      {
        name: 'Welders & Metal Fabricators',
        services: [
          'Welding Services',
          'Metal Fabrication',
          'Steel Frame Construction',
          'Gate Fabrication',
          'Window Grills',
          'Staircases',
          'Metal Roofing',
        ],
      },
      {
        name: 'Roofers',
        services: [
          'Roof Installation',
          'Roof Repair',
          'Mabati Roofing',
          'Tile Roofing',
          'Flat Roof Waterproofing',
          'Gutter Installation',
          'Roof Inspection',
          'Thatch Roofing',
        ],
      },
    ],
  },

  // ============================================================================
  // FINISHING & INTERIOR PROFESSIONALS
  // ============================================================================
  {
    category: 'Finishing & Interior',
    subcategories: [
      {
        name: 'Painters & Decorators',
        services: [
          'Interior Painting',
          'Exterior Painting',
          'Spray Painting',
          'Texture Painting',
          'Wallpaper Installation',
          'Wood Staining',
          'Commercial Painting',
          'Waterproofing Paint',
        ],
      },
      {
        name: 'Tilers',
        services: [
          'Floor Tiling',
          'Wall Tiling',
          'Bathroom Tiling',
          'Kitchen Tiling',
          'Outdoor Tiling',
          'Mosaic Work',
          'Tile Repair',
        ],
      },
      {
        name: 'Flooring Specialists',
        services: [
          'Hardwood Flooring',
          'Laminate Installation',
          'Vinyl Flooring',
          'Carpet Installation',
          'Floor Polishing',
          'Epoxy Flooring',
          'Terrazzo Flooring',
          'Floor Screeding',
        ],
      },
      {
        name: 'Ceiling Installers',
        services: [
          'Gypsum Ceiling',
          'POP Ceiling',
          'Suspended Ceiling',
          'PVC Ceiling',
          'Wood Ceiling',
          'Ceiling Repair',
        ],
      },
      {
        name: 'Plasterers',
        services: [
          'Wall Plastering',
          'Ceiling Plastering',
          'Skim Coating',
          'Rendering',
          'Decorative Plaster',
          'Plaster Repair',
        ],
      },
      {
        name: 'Cabinet Makers',
        services: [
          'Kitchen Cabinets',
          'Bathroom Cabinets',
          'Wardrobes',
          'Custom Cabinetry',
          'Countertop Installation',
        ],
      },
    ],
  },

  // ============================================================================
  // ELECTRICAL PROFESSIONALS
  // ============================================================================
  {
    category: 'Electrical',
    subcategories: [
      {
        name: 'Electricians',
        services: [
          'Electrical Wiring',
          'Electrical Installation',
          'Rewiring',
          'Distribution Board Installation',
          'Light Fixtures Installation',
          'Socket Installation',
          'Electrical Repairs',
          'Emergency Electrical Services',
          'Electrical Inspection',
        ],
      },
      {
        name: 'Solar Installers',
        services: [
          'Solar Panel Installation',
          'Solar Water Heaters',
          'Solar Battery Storage',
          'Solar System Design',
          'Off-Grid Solar Systems',
          'Solar Maintenance',
        ],
      },
      {
        name: 'Lighting Specialists',
        services: [
          'LED Lighting Installation',
          'Outdoor Lighting',
          'Security Lighting',
          'Landscape Lighting',
          'Smart Lighting Systems',
        ],
      },
      {
        name: 'Generator Installers',
        services: [
          'Generator Installation',
          'Backup Power Systems',
          'Generator Maintenance',
          'Automatic Transfer Switch Installation',
        ],
      },
    ],
  },

  // ============================================================================
  // PLUMBING PROFESSIONALS
  // ============================================================================
  {
    category: 'Plumbing',
    subcategories: [
      {
        name: 'Plumbers',
        services: [
          'Plumbing Installation',
          'Pipe Installation',
          'Drainage Systems',
          'Water Supply Systems',
          'Bathroom Plumbing',
          'Kitchen Plumbing',
          'Leak Repair',
          'Toilet Installation',
          'Sink Installation',
          'Water Heater Installation',
          'Emergency Plumbing',
        ],
      },
      {
        name: 'Drainage Specialists',
        services: [
          'Septic Tank Installation',
          'Sewer Line Installation',
          'Drainage System Design',
          'Drain Unblocking',
          'Soak Pit Construction',
          'Storm Water Drainage',
        ],
      },
      {
        name: 'Water Treatment Specialists',
        services: [
          'Water Filtration Systems',
          'Borehole Drilling',
          'Water Tank Installation',
          'Water Purification',
          'Rainwater Harvesting',
        ],
      },
    ],
  },

  // ============================================================================
  // HVAC & MECHANICAL
  // ============================================================================
  {
    category: 'HVAC & Mechanical',
    subcategories: [
      {
        name: 'HVAC Technicians',
        services: [
          'Air Conditioning Installation',
          'AC Repair & Maintenance',
          'Ventilation Systems',
          'Central AC Systems',
          'Ductwork Installation',
          'Heating Systems',
        ],
      },
      {
        name: 'Refrigeration Technicians',
        services: [
          'Cold Room Installation',
          'Refrigeration Repair',
          'Commercial Refrigeration',
          'Freezer Installation',
        ],
      },
    ],
  },

  // ============================================================================
  // LANDSCAPING & OUTDOOR
  // ============================================================================
  {
    category: 'Landscaping & Outdoor',
    subcategories: [
      {
        name: 'Landscapers',
        services: [
          'Landscape Design',
          'Garden Installation',
          'Lawn Installation',
          'Tree Planting',
          'Irrigation Systems',
          'Garden Maintenance',
          'Landscape Lighting',
        ],
      },
      {
        name: 'Paving Specialists',
        services: [
          'Driveway Paving',
          'Patio Construction',
          'Cabro Paving',
          'Interlocking Pavers',
          'Concrete Paving',
          'Walkway Construction',
        ],
      },
      {
        name: 'Fence Installers',
        services: [
          'Fence Installation',
          'Gate Installation',
          'Chain Link Fencing',
          'Electric Fence',
          'Wooden Fence',
          'Perimeter Wall Construction',
        ],
      },
      {
        name: 'Swimming Pool Contractors',
        services: [
          'Pool Construction',
          'Pool Maintenance',
          'Pool Repair',
          'Pool Tiling',
          'Pool Equipment Installation',
        ],
      },
    ],
  },

  // ============================================================================
  // SECURITY & SAFETY
  // ============================================================================
  {
    category: 'Security & Safety',
    subcategories: [
      {
        name: 'Security System Installers',
        services: [
          'CCTV Installation',
          'Alarm System Installation',
          'Access Control Systems',
          'Intercom Systems',
          'Smart Home Security',
          'Security Lighting',
        ],
      },
      {
        name: 'Fire Safety Specialists',
        services: [
          'Fire Alarm Installation',
          'Fire Extinguisher Supply',
          'Fire Suppression Systems',
          'Emergency Exit Installation',
          'Fire Safety Inspection',
        ],
      },
    ],
  },

  // ============================================================================
  // SPECIALIZED SERVICES
  // ============================================================================
  {
    category: 'Specialized Services',
    subcategories: [
      {
        name: 'Waterproofing Specialists',
        services: [
          'Roof Waterproofing',
          'Basement Waterproofing',
          'Bathroom Waterproofing',
          'Foundation Waterproofing',
          'Tank Waterproofing',
          'Damp Proofing',
        ],
      },
      {
        name: 'Insulation Specialists',
        services: [
          'Thermal Insulation',
          'Roof Insulation',
          'Wall Insulation',
          'Soundproofing',
          'Cold Room Insulation',
        ],
      },
      {
        name: 'Glass & Glazing',
        services: [
          'Window Installation',
          'Glass Door Installation',
          'Shower Enclosures',
          'Glass Partitions',
          'Curtain Wall Installation',
          'Mirror Installation',
        ],
      },
      {
        name: 'Demolition Specialists',
        services: [
          'Building Demolition',
          'Selective Demolition',
          'Site Clearance',
          'Waste Removal',
        ],
      },
      {
        name: 'Renovation Specialists',
        services: [
          'Home Renovation',
          'Office Renovation',
          'Kitchen Remodeling',
          'Bathroom Remodeling',
          'Building Restoration',
        ],
      },
      {
        name: 'Prefab & Modular Construction',
        services: [
          'Prefab Homes',
          'Container Homes',
          'Portable Cabins',
          'Mabati Houses',
          'Steel Frame Buildings',
        ],
      },
    ],
  },

  // ============================================================================
  // CONSULTATION & INSPECTION
  // ============================================================================
  {
    category: 'Consultation & Inspection',
    subcategories: [
      {
        name: 'Building Inspectors',
        services: [
          'Pre-Purchase Inspection',
          'Building Compliance Inspection',
          'Structural Assessment',
          'Quality Assurance',
          'Defect Inspection',
        ],
      },
      {
        name: 'Project Managers',
        services: [
          'Construction Project Management',
          'Site Supervision',
          'Progress Monitoring',
          'Quality Control',
          'Contract Management',
        ],
      },
      {
        name: 'Construction Consultants',
        services: [
          'Feasibility Studies',
          'Technical Consultation',
          'Value Engineering',
          'Construction Planning',
          'Risk Assessment',
        ],
      },
    ],
  },
];

// ============================================================================
// 2. BUILDING MATERIALS & SUPPLIES
// ============================================================================

export const MATERIALS_CATEGORIES = [
  // ============================================================================
  // STRUCTURAL MATERIALS
  // ============================================================================
  {
    category: 'Structural Materials',
    items: [
      // Cement & Concrete
      'Cement (42.5, 32.5)',
      'Ready-Mix Concrete',
      'Concrete Blocks',
      'Hollow Blocks',
      'Solid Blocks',
      'Interlocking Blocks',
      'Precast Concrete',
      'Concrete Additives',

      // Bricks & Blocks
      'Clay Bricks',
      'Machine-Cut Stones',
      'Rough Stones',
      'Ballast',
      'Sand (River Sand, Masonry Sand)',
      'Murram',
      'Hardcore',

      // Steel & Reinforcement
      'Reinforcement Steel (Y8, Y10, Y12, Y16, Y20, Y24)',
      'Binding Wire',
      'Steel Mesh',
      'Mild Steel',
      'Structural Steel',
      'Steel Plates',
      'Steel Beams (I-Beams, H-Beams)',
      'Steel Channels',
      'Angle Iron',

      // Timber & Wood
      'Cypress Timber',
      'Pine Timber',
      'Mahogany',
      'Mvule',
      'Treated Timber',
      'Roofing Timber',
      'Plywood',
      'Chipboard',
      'MDF (Medium Density Fiberboard)',
      'Hardboard',
      'Timber Offcuts',
    ],
  },

  // ============================================================================
  // ROOFING MATERIALS
  // ============================================================================
  {
    category: 'Roofing Materials',
    items: [
      // Metal Roofing
      'Mabati (Iron Sheets)',
      'Box Profile Roofing',
      'Corrugated Iron Sheets',
      'Stone-Coated Roofing',
      'Aluminum Roofing',
      'Galvanized Iron Sheets',
      'Color-Coated Roofing',

      // Tiles & Shingles
      'Roofing Tiles (Clay, Concrete)',
      'Ridge Tiles',
      'Valley Tiles',
      'Shingles',

      // Roofing Accessories
      'Roof Trusses',
      'Purlins',
      'Fascia Boards',
      'Soffit Boards',
      'Gutters (PVC, Aluminum)',
      'Downpipes',
      'Ridges',
      'Flashing',
      'Roofing Nails',
      'Roofing Screws',
      'Roof Insulation',
      'Waterproofing Membrane',
    ],
  },

  // ============================================================================
  // FINISHING MATERIALS
  // ============================================================================
  {
    category: 'Finishing Materials',
    items: [
      // Paints & Coatings
      'Emulsion Paint (Interior)',
      'Gloss Paint (Exterior)',
      'Primers',
      'Undercoats',
      'Wood Stain',
      'Varnish',
      'Lacquer',
      'Texture Paint',
      'Waterproofing Paint',
      'Floor Paint',
      'Anti-Rust Paint',
      'Spray Paint',

      // Tiles
      'Floor Tiles (Ceramic, Porcelain)',
      'Wall Tiles',
      'Bathroom Tiles',
      'Kitchen Tiles',
      'Outdoor Tiles',
      'Granite Tiles',
      'Marble Tiles',
      'Mosaic Tiles',
      'Tile Adhesive',
      'Tile Grout',

      // Flooring
      'Vinyl Flooring',
      'Laminate Flooring',
      'Hardwood Flooring',
      'Engineered Wood',
      'Carpet',
      'Carpet Tiles',
      'Floor Skirting',
      'Floor Leveling Compound',

      // Wall Finishing
      'Plaster (Cement, Gypsum)',
      'Wall Putty',
      'Skim Coat',
      'Wallpaper',
      'Wall Paneling',
      'Cladding',

      // Ceiling Materials
      'Gypsum Boards',
      'POP (Plaster of Paris)',
      'PVC Ceiling Panels',
      'Ceiling Tiles',
      'Suspended Ceiling Grids',
      'Ceiling Insulation',
    ],
  },

  // ============================================================================
  // DOORS & WINDOWS
  // ============================================================================
  {
    category: 'Doors & Windows',
    items: [
      // Doors
      'Wooden Doors (Flush, Panel)',
      'Steel Doors',
      'Aluminum Doors',
      'UPVC Doors',
      'Glass Doors',
      'Security Doors',
      'Sliding Doors',
      'Folding Doors',
      'Main Entrance Doors',
      'Interior Doors',
      'Fire-Rated Doors',

      // Windows
      'Wooden Windows',
      'Aluminum Windows',
      'UPVC Windows',
      'Sliding Windows',
      'Casement Windows',
      'Louvre Windows',
      'Fixed Windows',

      // Accessories
      'Door Frames',
      'Window Frames',
      'Door Handles',
      'Door Locks',
      'Hinges',
      'Window Grills',
      'Burglar Proofing',
      'Mosquito Nets',
      'Curtain Rails',
    ],
  },

  // ============================================================================
  // PLUMBING MATERIALS
  // ============================================================================
  {
    category: 'Plumbing Materials',
    items: [
      // Pipes
      'PVC Pipes',
      'PPR Pipes',
      'GI Pipes (Galvanized Iron)',
      'HDPE Pipes',
      'Copper Pipes',
      'Drainage Pipes',
      'Sewer Pipes',

      // Fittings
      'PVC Fittings (Elbows, Tees, Couplings)',
      'PPR Fittings',
      'Valves (Gate, Ball, Check)',
      'Taps & Faucets',
      'Showerheads',
      'Mixers',

      // Fixtures
      'Toilets (Water Closets)',
      'Sinks',
      'Washbasins',
      'Bathtubs',
      'Shower Trays',
      'Bidets',
      'Urinals',

      // Accessories
      'Water Tanks (Plastic, Steel)',
      'Septic Tanks',
      'Manholes',
      'Water Meters',
      'Pressure Pumps',
      'Water Heaters (Electric, Solar)',
      'Pipe Insulation',
      'Plumbing Adhesive',
      'PTFE Tape',
    ],
  },

  // ============================================================================
  // ELECTRICAL MATERIALS
  // ============================================================================
  {
    category: 'Electrical Materials',
    items: [
      // Cables & Wires
      'Electrical Cables (1.5mm, 2.5mm, 4mm, 6mm)',
      'Armored Cables',
      'Flexible Cables',
      'Speaker Wire',
      'Coaxial Cable',
      'Ethernet Cable (Cat5e, Cat6)',

      // Switches & Sockets
      'Light Switches',
      'Sockets (13A, 15A)',
      'Switch Plates',
      'Dimmer Switches',
      'Timer Switches',

      // Distribution & Protection
      'Distribution Boards',
      'Circuit Breakers (MCBs)',
      'RCDs (Residual Current Devices)',
      'Fuses',
      'Change-Over Switches',

      // Lighting
      'LED Bulbs',
      'Fluorescent Tubes',
      'Downlights',
      'Ceiling Lights',
      'Wall Lights',
      'Outdoor Lights',
      'Security Lights',
      'Emergency Lights',

      // Accessories
      'Conduits (PVC, Metal)',
      'Junction Boxes',
      'Cable Trays',
      'Cable Clips',
      'Electrical Tape',
      'Insulation Tape',
    ],
  },

  // ============================================================================
  // HARDWARE & FASTENERS
  // ============================================================================
  {
    category: 'Hardware & Fasteners',
    items: [
      // Nails & Screws
      'Wire Nails',
      'Concrete Nails',
      'Roofing Nails',
      'Wood Screws',
      'Drywall Screws',
      'Self-Tapping Screws',
      'Bolts & Nuts',
      'Washers',

      // Adhesives & Sealants
      'Tile Adhesive',
      'Wood Glue',
      'Super Glue',
      'Epoxy Resin',
      'Silicone Sealant',
      'Acrylic Sealant',
      'Polyurethane Foam',
      'Cement Mortar',

      // Tools Accessories
      'Hinges',
      'Padlocks',
      'Door Bolts',
      'Window Latches',
      'Chain Links',
      'Wire Mesh',
    ],
  },

  // ============================================================================
  // KITCHEN & BATHROOM
  // ============================================================================
  {
    category: 'Kitchen & Bathroom',
    items: [
      // Kitchen
      'Kitchen Cabinets',
      'Kitchen Sinks (Stainless Steel, Granite)',
      'Kitchen Taps',
      'Countertops (Granite, Marble, Quartz)',
      'Backsplash Tiles',
      'Kitchen Hoods',
      'Gas Cookers',
      'Built-in Ovens',
      'Hobs',

      // Bathroom
      'Bathroom Vanities',
      'Bathroom Mirrors',
      'Shower Cubicles',
      'Shower Screens',
      'Towel Rails',
      'Soap Dispensers',
      'Toilet Paper Holders',
      'Bathroom Accessories',
    ],
  },

  // ============================================================================
  // WATERPROOFING & INSULATION
  // ============================================================================
  {
    category: 'Waterproofing & Insulation',
    items: [
      // Waterproofing
      'Waterproofing Membrane',
      'Liquid Waterproofing',
      'Bitumen',
      'Damp Proof Course (DPC)',
      'Waterproofing Paint',
      'Sealants',

      // Insulation
      'Fiberglass Insulation',
      'Foam Insulation',
      'Reflective Insulation',
      'Acoustic Insulation',
      'Pipe Insulation',
    ],
  },

  // ============================================================================
  // GLASS & GLAZING
  // ============================================================================
  {
    category: 'Glass & Glazing',
    items: [
      'Clear Glass',
      'Tinted Glass',
      'Frosted Glass',
      'Tempered Glass',
      'Laminated Glass',
      'Double Glazing',
      'Glass Blocks',
      'Mirrors',
      'Shower Glass',
      'Glass Partitions',
    ],
  },

  // ============================================================================
  // LANDSCAPING MATERIALS
  // ============================================================================
  {
    category: 'Landscaping Materials',
    items: [
      // Paving
      'Cabro Blocks',
      'Interlocking Pavers',
      'Concrete Pavers',
      'Natural Stone Pavers',
      'Gravel',
      'Decorative Stones',

      // Garden
      'Topsoil',
      'Compost',
      'Mulch',
      'Garden Edging',
      'Artificial Grass',
      'Irrigation Pipes',
      'Sprinklers',
      'Garden Lights',
    ],
  },

  // ============================================================================
  // SAFETY & SECURITY MATERIALS
  // ============================================================================
  {
    category: 'Safety & Security',
    items: [
      // Security
      'CCTV Cameras',
      'DVR/NVR Systems',
      'Alarm Systems',
      'Electric Fence',
      'Barbed Wire',
      'Razor Wire',
      'Security Lights',
      'Motion Sensors',
      'Intercom Systems',

      // Safety
      'Fire Extinguishers',
      'Fire Alarms',
      'Smoke Detectors',
      'Emergency Lights',
      'Safety Signs',
      'First Aid Kits',
    ],
  },

  // ============================================================================
  // RENEWABLE ENERGY
  // ============================================================================
  {
    category: 'Renewable Energy',
    items: [
      'Solar Panels',
      'Solar Batteries',
      'Solar Inverters',
      'Solar Charge Controllers',
      'Solar Water Heaters',
      'Solar Mounting Structures',
      'Solar Cables',
      'Wind Turbines',
      'Biogas Digesters',
    ],
  },
];

// ============================================================================
// 3. CONSTRUCTION EQUIPMENT & TOOLS
// ============================================================================

export const EQUIPMENT_CATEGORIES = [
  {
    category: 'Heavy Equipment',
    items: [
      'Excavators',
      'Bulldozers',
      'Backhoe Loaders',
      'Wheel Loaders',
      'Graders',
      'Rollers (Compactors)',
      'Dump Trucks',
      'Cranes (Mobile, Tower)',
      'Forklifts',
      'Concrete Mixers (Truck-Mounted)',
      'Concrete Pumps',
    ],
  },
  {
    category: 'Power Tools',
    items: [
      'Drills (Cordless, Corded)',
      'Angle Grinders',
      'Circular Saws',
      'Jigsaws',
      'Reciprocating Saws',
      'Sanders (Orbital, Belt)',
      'Impact Drivers',
      'Rotary Hammers',
      'Welding Machines',
      'Generators',
      'Compressors',
      'Concrete Vibrators',
      'Plate Compactors',
    ],
  },
  {
    category: 'Hand Tools',
    items: [
      'Hammers',
      'Screwdrivers',
      'Pliers',
      'Wrenches',
      'Spanners',
      'Chisels',
      'Hand Saws',
      'Measuring Tapes',
      'Spirit Levels',
      'Trowels',
      'Spades',
      'Wheelbarrows',
      'Ladders',
      'Scaffolding',
    ],
  },
  {
    category: 'Safety Equipment',
    items: [
      'Hard Hats',
      'Safety Boots',
      'Safety Gloves',
      'Safety Goggles',
      'Ear Protection',
      'Dust Masks',
      'Safety Harnesses',
      'High-Visibility Vests',
      'Barricade Tape',
      'Safety Cones',
    ],
  },
  {
    category: 'Measuring & Testing',
    items: [
      'Laser Distance Meters',
      'Theodolites',
      'Total Stations',
      'GPS Survey Equipment',
      'Moisture Meters',
      'Concrete Test Hammers',
      'Multimeters',
      'Voltage Testers',
    ],
  },
];

// ============================================================================
// 4. FLAT LIST FOR DROPDOWNS
// ============================================================================

export const ALL_PROFESSIONAL_SERVICES = CONSTRUCTION_PROFESSIONALS.flatMap(
  (cat) =>
    cat.subcategories.flatMap((sub) =>
      sub.services.map((service) => ({
        category: cat.category,
        subcategory: sub.name,
        service: service,
        label: service,
        value: service.toLowerCase().replace(/\s+/g, '_'),
      }))
    )
);

export const ALL_MATERIALS = MATERIALS_CATEGORIES.flatMap((cat) =>
  cat.items.map((item) => ({
    category: cat.category,
    material: item,
    label: item,
    value: item.toLowerCase().replace(/\s+/g, '_'),
  }))
);

export const ALL_EQUIPMENT = EQUIPMENT_CATEGORIES.flatMap((cat) =>
  cat.items.map((item) => ({
    category: cat.category,
    equipment: item,
    label: item,
    value: item.toLowerCase().replace(/\s+/g, '_'),
  }))
);

// ============================================================================
// 5. SIMPLIFIED CATEGORY LISTS (For RFQ Forms)
// ============================================================================

export const RFQ_CATEGORIES = [
  { value: 'building_materials', label: 'Building Materials', icon: '🧱' },
  { value: 'finishing_interior', label: 'Finishing & Interior', icon: '🎨' },
  { value: 'electrical_lighting', label: 'Electrical & Lighting', icon: '💡' },
  { value: 'plumbing_sanitation', label: 'Plumbing & Sanitation', icon: '🚿' },
  { value: 'roofing', label: 'Roofing Materials', icon: '🏠' },
  { value: 'doors_windows', label: 'Doors & Windows', icon: '🚪' },
  { value: 'hardware_tools', label: 'Hardware & Tools', icon: '🔧' },
  { value: 'landscaping', label: 'Landscaping & Outdoor', icon: '🌳' },
  { value: 'security_safety', label: 'Security & Safety', icon: '🔒' },
  { value: 'hvac', label: 'HVAC & Cooling', icon: '❄️' },
  { value: 'renewable_energy', label: 'Renewable Energy', icon: '☀️' },
  { value: 'kitchen_bathroom', label: 'Kitchen & Bathroom', icon: '🍳' },
  { value: 'equipment_hire', label: 'Equipment Hire', icon: '🚜' },
  { value: 'professional_services', label: 'Professional Services', icon: '👷' },
  { value: 'other', label: 'Other', icon: '📦' },
];

export const VENDOR_CATEGORIES = [
  { value: 'general_contractor', label: 'General Contractor' },
  { value: 'architect', label: 'Architect' },
  { value: 'engineer', label: 'Structural Engineer' },
  { value: 'quantity_surveyor', label: 'Quantity Surveyor' },
  { value: 'interior_designer', label: 'Interior Designer' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'mason', label: 'Mason/Bricklayer' },
  { value: 'painter', label: 'Painter & Decorator' },
  { value: 'tiler', label: 'Tiler' },
  { value: 'roofer', label: 'Roofer' },
  { value: 'welder', label: 'Welder/Metal Fabricator' },
  { value: 'landscaper', label: 'Landscaper' },
  { value: 'solar_installer', label: 'Solar Installer' },
  { value: 'hvac_technician', label: 'HVAC Technician' },
  { value: 'waterproofing', label: 'Waterproofing Specialist' },
  { value: 'security_installer', label: 'Security System Installer' },
  { value: 'materials_supplier', label: 'Building Materials Supplier' },
  { value: 'equipment_rental', label: 'Equipment Rental' },
  { value: 'hardware_store', label: 'Hardware Store' },
  { value: 'other', label: 'Other' },
];

// ============================================================================
// 5. COMPREHENSIVE CATEGORY LISTS FOR FILTERING & SELECTION
// ============================================================================

/**
 * All professional service categories (main)
 * Used for vendor category filtering and RFQ category selection
 */
export const ALL_PROFESSIONAL_CATEGORIES = CONSTRUCTION_PROFESSIONALS.map((cat) => ({
  value: cat.category.toLowerCase().replace(/\s+/g, '_'),
  label: cat.category,
}));

/**
 * All materials categories (main)
 * Used for material supplier filtering
 */
export const ALL_MATERIALS_CATEGORIES_LIST = MATERIALS_CATEGORIES.map((cat) => ({
  value: cat.category.toLowerCase().replace(/\s+/g, '_'),
  label: cat.category,
}));

/**
 * All equipment categories (main)
 * Used for equipment rental filtering
 */
export const ALL_EQUIPMENT_CATEGORIES_LIST = EQUIPMENT_CATEGORIES.map((cat) => ({
  value: cat.category.toLowerCase().replace(/\s+/g, '_'),
  label: cat.category,
}));

/**
 * Combined comprehensive category list for universal selection
 * Includes professionals, materials, and equipment
 */
export const ALL_CONSTRUCTION_CATEGORIES = [
  {
    group: 'Professional Services',
    categories: ALL_PROFESSIONAL_CATEGORIES,
  },
  {
    group: 'Materials & Supplies',
    categories: ALL_MATERIALS_CATEGORIES_LIST,
  },
  {
    group: 'Equipment & Tools',
    categories: ALL_EQUIPMENT_CATEGORIES_LIST,
  },
];

/**
 * Flat list of all categories for simple dropdown selections
 * Use this for simple category selects without grouping
 */
export const ALL_CATEGORIES_FLAT = [
  ...ALL_PROFESSIONAL_CATEGORIES,
  ...ALL_MATERIALS_CATEGORIES_LIST,
  ...ALL_EQUIPMENT_CATEGORIES_LIST,
].sort((a, b) => a.label.localeCompare(b.label));

// ============================================================================
// 6. HELPER FUNCTIONS
// ============================================================================

/**
 * Get all services by category
 */
export function getServicesByCategory(categoryName) {
  const category = CONSTRUCTION_PROFESSIONALS.find(
    (cat) => cat.category === categoryName
  );
  return category
    ? category.subcategories.flatMap((sub) => sub.services)
    : [];
}

/**
 * Get all materials by category
 */
export function getMaterialsByCategory(categoryName) {
  const category = MATERIALS_CATEGORIES.find(
    (cat) => cat.category === categoryName
  );
  return category ? category.items : [];
}

/**
 * Search services
 */
export function searchServices(query) {
  const lowerQuery = query.toLowerCase();
  return ALL_PROFESSIONAL_SERVICES.filter(
    (service) =>
      service.label.toLowerCase().includes(lowerQuery) ||
      service.subcategory.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search materials
 */
export function searchMaterials(query) {
  const lowerQuery = query.toLowerCase();
  return ALL_MATERIALS.filter((material) =>
    material.label.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get category by RFQ value
 */
export function getRFQCategoryLabel(value) {
  const category = RFQ_CATEGORIES.find((cat) => cat.value === value);
  return category ? category.label : value;
}

/**
 * Get vendor category label
 */
export function getVendorCategoryLabel(value) {
  const category = VENDOR_CATEGORIES.find((cat) => cat.value === value);
  return category ? category.label : value;
}
