/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DepartmentId } from './types';

export interface SpecializationPreset {
  name: string;
  description: string;
  workflowSteps: string[];
  specs: Record<string, string>;
}

export const DEPARTMENT_PRESETS: Record<Exclude<DepartmentId, 'closed'>, SpecializationPreset[]> = {
  secretarial: [
    {
      name: 'Standard Commercial Intake',
      description: 'Standard client proposal ingestion, registration vetting, and legal checklist review.',
      workflowSteps: [
        'Establish initial client proposal project dossier and registry code.',
        'Audit company registration, VAT verification, and service legal agreements.',
        'Formulate baseline milestone scopes of work and partial budgets.',
        'Obtain management executive authorization & route to target divisions.'
      ],
      specs: {
        'Onboarding Type': 'Standard Commercial Intake',
        'Invoicing Threshold': 'Standard Split Terms',
        'Registry Officer': 'Senior Registrar Amina',
        'Legal Agreement': 'Approved standard SLA'
      }
    },
    {
      name: 'Express JV Partnership Fast-Track',
      description: 'Fast-tracked joint venture registration for municipal consortia with priority routing.',
      workflowSteps: [
        'Review joint venture bylaws and bypass standard queue delays.',
        'Verify joint liability legal seals and assign express priority code.',
        'Configure dual-channel active directories for concurrent planning.',
        'Register urgent executive clearance certificates for fast-track dispatch.'
      ],
      specs: {
        'Onboarding Type': 'Consortium & JV Fast-Track',
        'Invoicing Threshold': 'Prioritized Milestones',
        'Registry Officer': 'Chief Registrar El Fatih',
        'Legal Agreement': 'Consortium Agreement Seal-902'
      }
    }
  ],
  operation: [
    {
      name: 'Standard Field Run',
      description: 'Standard field planning, routing, and normal resource allocation.',
      workflowSteps: [
        'Register assigned scope of work and list required field tests.',
        'Acquire excavation permits and local municipal road access clearances.',
        'Mobilize transport vehicles, baseline equipment, and fieldwork crews.',
        'Complete pre-site safety checklists & transmit raw data to HQ.'
      ],
      specs: {
        'Planning Type': 'Standard Field Run',
        'Primary Coordinator': 'Eng. Robert Jenkins',
        'Equipment Allocated': 'Transport SUV & Base Hand Tools',
        'Priority Level': 'Routine / Normal'
      }
    },
    {
      name: 'Urgent Dual Rig Mobilization',
      description: 'Expedited fast-track logistics utilizing heavy dual drilling rigs & high priority team.',
      workflowSteps: [
        'Bypass routine queues to secure heavy machinery permits.',
        'Dispatch dual heavy rotary drilling rigs to site coordinates.',
        'Execute immediate soil/rock core retrieval safely with 24h shifts.',
        'Deliver raw drilling logs and samples to labs via courier.'
      ],
      specs: {
        'Planning Type': 'Urgent Field Logistics',
        'Primary Coordinator': 'Eng. Omar Radwan',
        'Equipment Allocated': 'Heavy Dual Rotary Rigs + Auxiliary Trailer',
        'Priority Level': 'Express Critical / Urgent'
      }
    }
  ],
  survey: [
    {
      name: 'RTK Differential GPS Survey',
      description: 'High-precision satellite positioning for control points and site coordinates.',
      workflowSteps: [
        'Establish control benchmarks via real-time diff RTK dual-frequency GPS.',
        'Trace topography contours and boundary reference points layout.',
        'Raw survey points data transfer and download into Autodesk CAD grid.',
        'Triangulation mapping draft review & final topographic report signing.'
      ],
      specs: {
        'Method': 'RTK Differential GPS',
        'Accuracy Requirement': '±10mm Horizontal, ±15mm Vertical',
        'Bench Marks Needed': '3 Benchmarks min.',
        'Coordinate System': 'WGS 84 / UTM Zone 39N'
      }
    },
    {
      name: 'Total Station Boundary Mapping',
      description: 'Optical total station traversing for dense urban areas with overhead GPS blockages.',
      workflowSteps: [
        'Establish dense optical total station closed traverse loops.',
        'Reflector-less laser sighting of property lines and building boundaries.',
        'Conduct topographic terrain elevation contour calculations on-site.',
        'Export AutoCAD overlay blueprints and finalize surveyor contour sign-off.'
      ],
      specs: {
        'Method': 'Total Station Traversing',
        'Accuracy Requirement': 'Class A Closed Loop Traversing',
        'Bench Marks Needed': '2 existing monuments',
        'Coordinate System': 'Local Site Construction Grid'
      }
    }
  ],
  gpr: [
    {
      name: 'Deep Cavity & Void Mapping',
      description: 'Subsurface sounding for structural integrity assessment using low-frequency signal depth penetration.',
      workflowSteps: [
        'Calibrate low-frequency GPR antenna (200 MHz) and ground coupling.',
        'Conduct orthogonal scan lines of designated deep grid coordinates.',
        'Execute RADAN background deconvolution and amplitude slice wave analyses.',
        'Identify hazardous subterranean voids, cavern anomalies, and log GPR profiles.'
      ],
      specs: {
        'Antenna Frequency': '200 MHz Low Frequency',
        'Depth Target': '8.0 Meters Max Depth',
        'Grid Density': '1.0 meter intervals',
        'Processing Standard': 'RADAN Deconvolution Filter'
      }
    },
    {
      name: 'Shallow Utility Utility Run',
      description: 'High-resolution GPR mapping of shallow utilities, metallic pipelines, and fiber cables.',
      workflowSteps: [
        'Deploy high-resolution 400 MHz double-wavelength antenna scanning cart.',
        'Trace close-density cross scans of gas, cable, water, and sewage conduits.',
        'Isolate parabolic utility wave signatures and depth coordinates.',
        'Draft final 3D GPR utility layout and deliver GPR clearance certificate.'
      ],
      specs: {
        'Antenna Frequency': '400 MHz High Resolution',
        'Depth Target': '3.0 Meters Max Depth',
        'Grid Density': '0.5 meter cross-grid spacing',
        'Processing Standard': 'Migration and Hyperbola Fitting filter'
      }
    }
  ],
  geotechnical: [
    {
      name: 'Standard SPT Soil Boring',
      description: 'Subsurface soil evaluation via wash boring and split-spoon SPT testing.',
      workflowSteps: [
        'Drill deep field boreholes and record SPT blow counts (N-values).',
        'Register geotechnical sample receipt and log labels at the field warehouse.',
        'Authorize sample delivery and register transfer to materials testing laboratory.',
        'Formulate subsurface layer charts, profiles, and final geotechnical reports.'
      ],
      specs: {
        'Borehole Drilling Type': 'Wash Boring & Tri-cone Bit',
        'Target Boreholes': '5 Boreholes total',
        'Investigation Depth': '15.0 Meters each',
        'SPT sampling interval': 'Every 1.50 meters'
      }
    },
    {
      name: 'Deep Rock Coring Investigation',
      description: 'Rotary drilling of bedrock strata to recover high-quality rock core for structural foundation design.',
      workflowSteps: [
        'Utilize diamond core drilling rig to recover premium rock core specimens.',
        'Recover bedrock cores, catalog indices, and calculate RQD % on site.',
        'Register bedrock sample delivery and transfer tracking to the lab registry.',
        'Perform compressive rock strength tests and draft deep foundation designs.'
      ],
      specs: {
        'Borehole Drilling Type': 'Rotary Diamond Core Drilling',
        'Target Boreholes': '2 Boreholes total',
        'Investigation Depth': '30.0 Meters (into bedrock)',
        'Core Barrel Class': 'HQ Double Tube Swivel Barrel'
      }
    }
  ],
  materials: [
    {
      name: 'Standard Soil Classification Suite',
      description: 'Physical testing of dry and wet soil parameters including moisture limits and gradations.',
      workflowSteps: [
        'Receive and ledger incoming geotechnical soil specimens at lab.',
        'Execute dry-oven baking of soil to compute baseline water content.',
        'Conduct liquid limit, plastic limit, and plasticity index tests.',
        'Perform ASTM mechanical sieve gradation and compile classification certificate.'
      ],
      specs: {
        'Lab Tests Required': 'Atterberg Limits, Soil Classification & Particle Size',
        'Soil Compaction Method': 'Standard Proctor ASTM D698',
        'Sieve Standards': 'ASTM D422 Serial Mesh',
        'Standard Reference': 'USCS (Unified Soil Classification System)'
      }
    },
    {
      name: 'Compressive Concrete Test',
      description: 'Determining the compressive crushing strength of site-poured concrete samples.',
      workflowSteps: [
        'Intake poured concrete test cylinders and archive casting dates.',
        'Place concrete cylinders in climate-controlled water curing baths.',
        'Perform compression test on crushing rigs at specified days (7, 14, 28).',
        'Generate certified engineering compressive strength report logs.'
      ],
      specs: {
        'Lab Tests Required': 'Compressive Cylinder Crushing & Moisture Density',
        'Cylinder Specs': '150mm Diameter x 300mm Height Cylinders',
        'Curing Standard': 'ASTM C39 Standards',
        'Cure Age Cycles': '7-Days, 14-Days & 28-Days Cycles'
      }
    }
  ],
  pile: [
    {
      name: 'Bored Cast-in-Place Pile Construction',
      description: 'Drilling circular shafts, placing rebar cages, and concrete pouring verification.',
      workflowSteps: [
        'Supervise drilling of bored pile shaft to structural designs.',
        'Inspect reinforcement cage verticality, spacing, and slurry cleanses.',
        'Calibrate tremie-concrete flow measurements and verify casing elevations.',
        'Coordinate static load test setup and assemble structural pile files.'
      ],
      specs: {
        'Pile Construction Type': 'Bored Cast-in-Place Concrete Pile',
        'Target Depth': '12.0 Meters continuous depth',
        'Testing Standard': 'ASTM D1143 (Static Axials Compressive)',
        'Pile Design Diameter': '600mm Shaft'
      }
    },
    {
      name: 'Low Strain Dynamic Integrity Testing',
      description: 'Rapid acoustic dynamic hammer testing for physical pile shaft sound integrity check.',
      workflowSteps: [
        'Prepare pile head by grinding surface down to rigid monolithic concrete.',
        'Mount low-strain PIT accelerometer sensors onto structural pile head.',
        'Apply impact hammer blows and record wave trace data graphs.',
        'Conduct reflectograms modeling to catalog internal pile shafts integrity.'
      ],
      specs: {
        'Pile Construction Type': 'Precast Reinforced Driven Piles',
        'Target Depth': '18.0 Meters depth',
        'Testing Standard': 'ASTM D5882 (Low Strain Dynamic Testing)',
        'Survey Scope': '48 Piles total coverage'
      }
    }
  ],
  account: [
    {
      name: 'Standard Milestone billing',
      description: 'Standard ledger invoice split across mobilization, draft completion, and project final handover.',
      workflowSteps: [
        'Aggregate progress certificates and milestones from preceding divisions.',
        'Formulate progress-payment invoice drafts and dispatch to client.',
        'Register bank clearance notifications and record VAT reference numbers.',
        'Disburse final project commercial releases to prompt structural file closure.'
      ],
      specs: {
        'Bookkeeping Type': 'Standard Milestone billing',
        'Accounting Package': 'Standard Accounts Ledger Pro',
        'Ledger Controller': 'Senior Accountant Yasir',
        'Payment Terms': 'Net 30 calendar days'
      }
    },
    {
      name: 'Full Advance Deposit Clearing',
      description: '100% upfront billing and ledger processing for expedited client fast-tracks.',
      workflowSteps: [
        'Compile single comprehensive 100% upfront pre-paid invoice.',
        'Log immediate wire transfer reference, bank stamp, and VAT log.',
        'Post transaction details to ledgers and clear outstanding debt.',
        'Acknowledge official financial bypass to expedite operations.'
      ],
      specs: {
        'Bookkeeping Type': 'Full Upfront Pre-paid',
        'Accounting Package': 'VIP Immediate Premium Settlement',
        'Ledger Controller': 'Director of Finance Yasir El Fatih',
        'Payment Terms': 'Due upon receipt immediately'
      }
    }
  ]
};
