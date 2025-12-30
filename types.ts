
export enum ResourceType {
  METAL = 'metal',
  CRYSTAL = 'crystal',
  DEUTERIUM = 'deuterium',
  ENERGY = 'energy'
}

export enum BuildingId {
  METAL_MINE = 'metalMine',
  CRYSTAL_MINE = 'crystalMine',
  DEUTERIUM_SYNTH = 'deuteriumSynth',
  SOLAR_PLANT = 'solarPlant',
  FUSION_REACTOR = 'fusionReactor',
  ROBOT_FACTORY = 'robotFactory',
  SHIPYARD = 'shipyard',
  RESEARCH_LAB = 'researchLab',
  METAL_STORAGE = 'metalStorage',
  CRYSTAL_STORAGE = 'crystalStorage',
  DEUTERIUM_TANK = 'deuteriumTank'
}

export enum ResearchId {
  ENERGY_TECH = 'energyTech',
  LASER_TECH = 'laserTech',
  ION_TECH = 'ionTech',
  HYPERSPACE_TECH = 'hyperspaceTech',
  PLASMA_TECH = 'plasmaTech',
  COMBUSTION_DRIVE = 'combustionDrive',
  IMPULSE_DRIVE = 'impulseDrive',
  HYPERSPACE_DRIVE = 'hyperspaceDrive',
  ESPIONAGE_TECH = 'espionageTech',
  COMPUTER_TECH = 'computerTech',
  ASTROPHYSICS = 'astrophysics',
  WEAPON_TECH = 'weaponTech',
  SHIELDING_TECH = 'shieldingTech',
  ARMOUR_TECH = 'armourTech'
}

export enum ShipId {
  LIGHT_FIGHTER = 'lightFighter',
  HEAVY_FIGHTER = 'heavyFighter',
  CRUISER = 'cruiser',
  BATTLESHIP = 'battleship',
  DESTROYER = 'destroyer',
  DEATH_STAR = 'deathStar',
  SMALL_CARGO = 'smallCargo',
  MEDIUM_CARGO = 'mediumCargo',
  HUGE_CARGO = 'hugeCargo',
  COLONY_SHIP = 'colonyShip',
  ESPIONAGE_PROBE = 'espionageProbe',
  PIONEER = 'pioneer'
}

export enum DefenseId {
  ROCKET_LAUNCHER = 'rocketLauncher',
  LIGHT_LASER = 'lightLaser',
  HEAVY_LASER = 'heavyLaser',
  GAUSS_CANNON = 'gaussCannon',
  ION_CANNON = 'ionCannon',
  PLASMA_TURRET = 'plasmaTurret',
  SMALL_SHIELD = 'smallShield',
  LARGE_SHIELD = 'largeShield'
}

export interface Cost {
  metal: number;
  crystal: number;
  deuterium: number;
  energy?: number;
}

export interface Requirement {
  type: 'building' | 'research';
  id: BuildingId | ResearchId;
  level: number;
}

export interface BuildingDef {
  id: BuildingId;
  name: string;
  description: string;
  baseCost: Cost;
  baseProduction?: Cost;
  image: string;
  buildTimeBase: number;
  requirements?: Requirement[];
}

export interface ResearchDef {
  id: ResearchId;
  name: string;
  description: string;
  baseCost: Cost;
  image: string;
  buildTimeBase: number; // in seconds
  requirements?: Requirement[];
}

export interface ShipDef {
  id: ShipId;
  name: string;
  description: string;
  baseCost: Cost;
  image: string;
  buildTime: number;
  attack: number;
  defense: number;
  capacity: number;
  requirements?: Requirement[];
}

export interface ConstructionItem {
  id: string;
  type: 'building' | 'research' | 'ship' | 'defense';
  itemId: BuildingId | ResearchId | ShipId | DefenseId;
  targetLevel?: number; // For buildings/research
  quantity?: number; // For ships
  startTime: number;
  endTime: number;
}

export enum MissionType {
  EXPEDITION = 'expedition',
  ATTACK = 'attack',
  TRANSPORT = 'transport',
  SPY = 'spy'
}

export interface MissionRewards {
  metal?: number;
  crystal?: number;
  deuterium?: number;
  darkMatter?: number;
  ships?: Record<string, number>;
  items?: string[]; // Names of rare items found
}

export interface FleetMission {
  id: string;
  ownerId?: string; // Who sent it
  attackerName?: string; // Resolved nickname of the attacker
  targetUserId?: string | null; // Who is being attacked
  type: MissionType;
  ships: Record<ShipId, number>;
  targetCoords: { galaxy: number; system: number; position: number };
  originCoords?: { galaxy: number; system: number; position: number };
  startTime: number;
  arrivalTime: number; // Time when it reaches target (Event happens here)
  returnTime: number; // Time when it returns home (Resources added here)
  eventProcessed: boolean; // Has the expedition event happened yet?
  status?: 'flying' | 'processing' | 'returning' | 'completed';
  pendingRewards?: MissionRewards; // Rewards carrying back home
  resources?: MissionRewards; // Resources carried
  result?: any; // Battle logs etc
}

export interface MissionLog {
  id: string;
  timestamp: number;
  title: string;
  message: string;
  outcome: 'success' | 'neutral' | 'failure' | 'danger';
  rewards?: MissionRewards;
}

export interface GameState {
  userId?: string; // Supabase User ID
  nickname?: string; // Player display name
  avatarUrl?: string; // Current Avatar Image
  planetType?: 'terran' | 'desert' | 'ice';
  planetName: string;
  resources: {
    metal: number;
    crystal: number;
    deuterium: number;
    darkMatter: number;
    energy: number;
    maxEnergy: number;
    storage: {
      metal: number;
      crystal: number;
      deuterium: number;
    }
  };
  productionSettings: Record<string, any>;
  productionRates: {
    metal: number;
    crystal: number;
    deuterium: number;
  };
  buildings: Record<BuildingId, number>;
  research: Record<ResearchId, number>;
  ships: Record<ShipId, number>;
  defenses: Record<DefenseId, number>;
  constructionQueue: ConstructionItem[];
  shipyardQueue: ConstructionItem[];
  activeMissions: FleetMission[];
  incomingMissions: FleetMission[]; // Attacks coming towards me
  missionLogs: MissionLog[];
  galaxyCoords?: { galaxy: number; system: number; position: number };
  lastTick: number;
}
