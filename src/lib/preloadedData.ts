import { MachineBrand, SpareItem } from '../types';

export const INITIAL_BRANDS: Array<Omit<MachineBrand, 'id' | 'createdAt'>> = [
  { name: 'Ador', status: 'active', isDefault: true },
  { name: 'ESAB', status: 'active', isDefault: true },
  { name: 'JK ARC', status: 'active', isDefault: true },
  { name: 'Neom', status: 'active', isDefault: true },
  { name: 'JK Weld', status: 'active', isDefault: true },
  { name: 'JK Smart', status: 'active', isDefault: true },
  { name: 'Niko', status: 'active', isDefault: true },
  { name: 'Newteck', status: 'active', isDefault: true },
  { name: 'Tornado', status: 'active', isDefault: true },
  { name: 'GB', status: 'active', isDefault: true },
  { name: 'Indian Weld', status: 'active', isDefault: true },
  { name: 'EZ Weld', status: 'active', isDefault: true },
  { name: 'Virgo Plus', status: 'active', isDefault: true },
];

export const INITIAL_SPARE_CATEGORIES: string[] = [
  'IGBT PCB',
  'Diode Card',
  'IGBT',
  'MOSFET',
  'Diodes',
  'Capacitors',
  'Connectors & Lugs',
  'Display PCB',
  'Control PCB',
  'SMPS',
  'IGBT Modules',
  'Drive PCB',
  'Other Welding Machine Components',
];

interface RawSpareDef {
  name: string;
  category: string;
  defaultStock?: number;
  minAlert?: number;
  unit?: string;
}

export const INITIAL_SPARE_ITEMS: RawSpareDef[] = [
  // IGBT PCB
  { name: '25N120 IGBT PCB', category: 'IGBT PCB', defaultStock: 12, minAlert: 3 },
  { name: '40N120 IGBT PCB', category: 'IGBT PCB', defaultStock: 10, minAlert: 3 },
  { name: 'Virgo 40T120', category: 'IGBT PCB', defaultStock: 8, minAlert: 2 },
  { name: '18:18', category: 'IGBT PCB', defaultStock: 15, minAlert: 4 },
  { name: '15:15', category: 'IGBT PCB', defaultStock: 15, minAlert: 4 },
  { name: 'Great Yuva PCB', category: 'IGBT PCB', defaultStock: 6, minAlert: 2 },
  { name: 'X Bravo Card PCB', category: 'IGBT PCB', defaultStock: 8, minAlert: 2 },

  // Diode Card
  { name: '3 Diodes PCB', category: 'Diode Card', defaultStock: 14, minAlert: 3 },
  { name: '4 Diodes PCB', category: 'Diode Card', defaultStock: 12, minAlert: 3 },
  { name: 'Diode PCB', category: 'Diode Card', defaultStock: 18, minAlert: 4 },

  // IGBT
  { name: '25N120', category: 'IGBT', defaultStock: 45, minAlert: 10 },
  { name: '40N120', category: 'IGBT', defaultStock: 40, minAlert: 10 },
  { name: '25T120', category: 'IGBT', defaultStock: 35, minAlert: 8 },
  { name: '40T120', category: 'IGBT', defaultStock: 30, minAlert: 8 },
  { name: '60T65', category: 'IGBT', defaultStock: 25, minAlert: 6 },
  { name: '50T65', category: 'IGBT', defaultStock: 20, minAlert: 5 },

  // MOSFET
  { name: '18N50', category: 'MOSFET', defaultStock: 30, minAlert: 8 },
  { name: '3878', category: 'MOSFET', defaultStock: 25, minAlert: 6 },

  // Diodes
  { name: '9202', category: 'Diodes', defaultStock: 50, minAlert: 15 },
  { name: '60U30', category: 'Diodes', defaultStock: 40, minAlert: 10 },
  { name: 'D4007', category: 'Diodes', defaultStock: 60, minAlert: 15 },
  { name: '5819', category: 'Diodes', defaultStock: 50, minAlert: 15 },
  { name: '107', category: 'Diodes', defaultStock: 45, minAlert: 10 },
  { name: '106', category: 'Diodes', defaultStock: 45, minAlert: 10 },
  { name: 'BY226 BGP', category: 'Diodes', defaultStock: 30, minAlert: 8 },
  { name: 'US2M', category: 'Diodes', defaultStock: 40, minAlert: 10 },
  { name: 'SS16', category: 'Diodes', defaultStock: 35, minAlert: 10 },
  { name: 'ER205', category: 'Diodes', defaultStock: 30, minAlert: 8 },
  { name: 'M7', category: 'Diodes', defaultStock: 80, minAlert: 20 },
  { name: '1007', category: 'Diodes', defaultStock: 40, minAlert: 10 },

  // Capacitors
  { name: '470UF', category: 'Capacitors', defaultStock: 35, minAlert: 8 },
  { name: '560UF', category: 'Capacitors', defaultStock: 30, minAlert: 8 },
  { name: '680UF', category: 'Capacitors', defaultStock: 25, minAlert: 6 },
  { name: '820UF', category: 'Capacitors', defaultStock: 20, minAlert: 5 },
  { name: 'CBB 800V 50UF', category: 'Capacitors', defaultStock: 15, minAlert: 4 },

  // Connectors & Lugs
  { name: '35×50 Patti Lugs', category: 'Connectors & Lugs', defaultStock: 50, minAlert: 15 },
  { name: '35×50 Female Lugs', category: 'Connectors & Lugs', defaultStock: 45, minAlert: 15 },
  { name: '35×50 Male Connector', category: 'Connectors & Lugs', defaultStock: 40, minAlert: 12 },
  { name: '50×75 Female Connector', category: 'Connectors & Lugs', defaultStock: 35, minAlert: 10 },
  { name: '50×75 Male Connector', category: 'Connectors & Lugs', defaultStock: 35, minAlert: 10 },
  { name: '25×50 Connector', category: 'Connectors & Lugs', defaultStock: 40, minAlert: 10 },
  { name: 'TR Patti Lugs Big', category: 'Connectors & Lugs', defaultStock: 30, minAlert: 8 },
  { name: 'Male Connector', category: 'Connectors & Lugs', defaultStock: 45, minAlert: 12 },
  { name: 'Female Connector', category: 'Connectors & Lugs', defaultStock: 45, minAlert: 12 },
  { name: 'Patti Connector', category: 'Connectors & Lugs', defaultStock: 35, minAlert: 10 },

  // Display PCB
  { name: '1+2 250A Display PCB', category: 'Display PCB', defaultStock: 8, minAlert: 2 },
  { name: '1+2+3 300A Display PCB', category: 'Display PCB', defaultStock: 8, minAlert: 2 },
  { name: '400i Display', category: 'Display PCB', defaultStock: 6, minAlert: 2 },
  { name: 'X Machine Display PCB', category: 'Display PCB', defaultStock: 6, minAlert: 2 },
  { name: 'Virgo Display PCB', category: 'Display PCB', defaultStock: 7, minAlert: 2 },
  { name: 'Yuva Display PCB', category: 'Display PCB', defaultStock: 7, minAlert: 2 },
  { name: 'CO2 Display PCB', category: 'Display PCB', defaultStock: 5, minAlert: 2 },

  // Control PCB
  { name: '3PH CO2 Control PCB', category: 'Control PCB', defaultStock: 5, minAlert: 2 },
  { name: '1+2 CO2 Control PCB', category: 'Control PCB', defaultStock: 6, minAlert: 2 },
  { name: '1PH CO2 Control PCB', category: 'Control PCB', defaultStock: 6, minAlert: 2 },
  { name: '400i Control PCB', category: 'Control PCB', defaultStock: 5, minAlert: 2 },

  // SMPS
  { name: '1+2 PCB', category: 'SMPS', defaultStock: 10, minAlert: 3 },
  { name: '1+2+3 PCB', category: 'SMPS', defaultStock: 10, minAlert: 3 },
  { name: '3PH SMPS PCB', category: 'SMPS', defaultStock: 7, minAlert: 2 },
  { name: 'JK Weld 300 PCB', category: 'SMPS', defaultStock: 8, minAlert: 2 },
  { name: 'Virgo Plus PCB', category: 'SMPS', defaultStock: 8, minAlert: 2 },

  // IGBT Modules
  { name: '50 Amp Module', category: 'IGBT Modules', defaultStock: 12, minAlert: 3 },
  { name: '75 Amp Module', category: 'IGBT Modules', defaultStock: 10, minAlert: 3 },
  { name: '100 Amp Module', category: 'IGBT Modules', defaultStock: 8, minAlert: 2 },
  { name: '150 Amp Module', category: 'IGBT Modules', defaultStock: 6, minAlert: 2 },

  // Drive PCB
  { name: 'Huntong Drive PCB', category: 'Drive PCB', defaultStock: 8, minAlert: 2 },
  { name: '2 LED PCB', category: 'Drive PCB', defaultStock: 10, minAlert: 3 },
  { name: 'Ador PCB', category: 'Drive PCB', defaultStock: 6, minAlert: 2 },
  { name: 'ESAB PCB', category: 'Drive PCB', defaultStock: 6, minAlert: 2 },

  // Other Welding Machine Components
  { name: 'Switch', category: 'Other Welding Machine Components', defaultStock: 40, minAlert: 10 },
  { name: 'MCB', category: 'Other Welding Machine Components', defaultStock: 20, minAlert: 5 },
  { name: 'Holder', category: 'Other Welding Machine Components', defaultStock: 25, minAlert: 6 },
  { name: 'Earthing Holder', category: 'Other Welding Machine Components', defaultStock: 25, minAlert: 6 },
  { name: 'Knob', category: 'Other Welding Machine Components', defaultStock: 50, minAlert: 15 },
  { name: 'Adaptor', category: 'Other Welding Machine Components', defaultStock: 20, minAlert: 5 },
  { name: 'TR 21.04', category: 'Other Welding Machine Components', defaultStock: 15, minAlert: 4 },
  { name: '30 Pin Control PCB', category: 'Other Welding Machine Components', defaultStock: 8, minAlert: 2 },
  { name: 'Bridge Rectifier', category: 'Other Welding Machine Components', defaultStock: 30, minAlert: 8 },
  { name: 'Zener Diodes', category: 'Other Welding Machine Components', defaultStock: 75, minAlert: 20 },
  { name: 'Transistors', category: 'Other Welding Machine Components', defaultStock: 80, minAlert: 20 },
  { name: 'IRF Components', category: 'Other Welding Machine Components', defaultStock: 40, minAlert: 10 },
  { name: 'MOV', category: 'Other Welding Machine Components', defaultStock: 45, minAlert: 12 },
  { name: 'Bearings', category: 'Other Welding Machine Components', defaultStock: 20, minAlert: 5 },
  { name: 'Carbon Brushes', category: 'Other Welding Machine Components', defaultStock: 35, minAlert: 10 },
  { name: 'Fans', category: 'Other Welding Machine Components', defaultStock: 18, minAlert: 5 },
  { name: 'Cooling Components', category: 'Other Welding Machine Components', defaultStock: 15, minAlert: 4 },
  { name: 'Wires', category: 'Other Welding Machine Components', defaultStock: 30, minAlert: 8 },
  { name: 'Cables', category: 'Other Welding Machine Components', defaultStock: 25, minAlert: 6 },
  { name: 'Fuses', category: 'Other Welding Machine Components', defaultStock: 100, minAlert: 25 },
  { name: 'Relays', category: 'Other Welding Machine Components', defaultStock: 35, minAlert: 10 },
  { name: 'Other Electronic Components', category: 'Other Welding Machine Components', defaultStock: 50, minAlert: 15 },
];
