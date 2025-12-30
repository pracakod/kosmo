
import { BuildingDef, BuildingId, ResearchDef, ResearchId, ShipDef, ShipId } from './types';

export const formatTime = (seconds: number): string => {
  if (seconds < 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Centralized image store with working, reliable links
export const IMAGES = {
  avatar: "/kosmo/avatars/avatar_default.png",
  planet: "https://lh3.googleusercontent.com/aida-public/AB6AXuBSLdQjiDuWVTAfBaEU-HCuYBah9ZQiEwQ-pDEofrc4cE_VxNy9QrAshJikmgoDRsSiufik3xpY-aK01ZyAD-oMT7oiGEoiGMpFWgFdZ7P3A8bg6_W71He4ede4ePe-0BNBFOYzd9apqH_IBj5ZXTOU7lbf7qfnmAK01iO7b2ckjVagWx4YlZdAbeOGA1_vJMuSCRVCtupT_RNvx19THDplwxx3PvEcIgc4g0ljwPyZlPI8DaYq7UaMbOiwXHxzgV-oCUQBi8YwaGc",

  // Buildings
  metalMine: "/kosmo/budowle/kopalniametalu.png",
  crystalMine: "/kosmo/budowle/kopalnia krysztalu.png",
  deuteriumSynth: "/kosmo/budowle/synterzator deuter.png",
  solarPlant: "/kosmo/budowle/elektrownia sloneczna.png",
  fusionReactor: "/kosmo/budowle/Reaktor Fuzyjny.png",
  robotFactory: "/kosmo/budowle/Fabryka Robotów.png",
  shipyard: "/kosmo/budowle/stocznia.png",
  researchLab: "/kosmo/budowle/Laboratorium Badawcz.png",
  metalStorage: "/kosmo/budowle/Magazyn MetaluKryształu.png",
  crystalStorage: "/kosmo/budowle/Magazyn MetaluKryształu.png",
  deuteriumTank: "/kosmo/budowle/zbiornik deuter.png",

  // Tech Images - Distinct & Fixed
  techEnergy: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUsk_veHUVdI7Xyyen3wE1Sor8I2WXguf2jjbakOFbdtRfW9EJruiDvsIgX5IEW3yt01vrIYq_I5G3cqefGk7O7w9BvvVsHpHioXTKjEfTwaHGv1fWwoc4_coc6yXGitNBGAa3URR7KjlKaomN_pmSPD9Jalb9rxdmt1NRlt2b98OZQVQqii0zOOVaBBsICIos_bTfcnyMBW_tecAFg3TP9zzNghDVuvahMe87fSHyj_9wuv1y3NXeDTDGk2w8iBPZsl8B6D58Jhg",
  techLaser: "https://lh3.googleusercontent.com/aida-public/AB6AXuCttLEph3WsOd3HRlZC0zxgyo5HtGQLhoc_Nr46u_bMbqY6nTEQYuIV_gyR_hpfVBS-J_jj5GGZynbPPZti1oj5iZ3eOY_YBYNi3q8nw6c4ebgmqCgJnaJhFtJwFfpNu4nYT65VMgmQkWQU-ek95Y5Ue6RnI9LCcYQpDhod0Y_eUiJYtnqiu9_aD-u_ukPsujkP5hgKqFchbR8vhUje3E-LrA80lMR4QTQEfNKXUDobsJRFGe11_CQSYumUsrXBnYunhGfRGvl2epw", // Laser beam
  techIon: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUsk_veHUVdI7Xyyen3wE1Sor8I2WXguf2jjbakOFbdtRfW9EJruiDvsIgX5IEW3yt01vrIYq_I5G3cqefGk7O7w9BvvVsHpHioXTKjEfTwaHGv1fWwoc4_coc6yXGitNBGAa3URR7KjlKaomN_pmSPD9Jalb9rxdmt1NRlt2b98OZQVQqii0zOOVaBBsICIos_bTfcnyMBW_tecAFg3TP9zzNghDVuvahMe87fSHyj_9wuv1y3NXeDTDGk2w8iBPZsl8B6D58Jhg",
  techHyper: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_5G35L8rN6N_8x173o5o3z6c0K8P5w2Z4s7Y8l9X0M2b5Q3v6R4t8J9L1K5N7P4Q2M6v8L3z9J0x5N2k8R7w9M4P1L6O3v8K5N7Q2M6v8L3z9J0x5N2k8R7w9M4P1L6O3v8K5N7Q2", // Purple vortex
  techCombustion: "https://lh3.googleusercontent.com/aida-public/AB6AXuDbgGTOOmYRO8Cx2O9AikzppzN9zC4-i7_FrPEcct-2C21HpEJmdGGu5Za7crC8JzzPSg7_h9whOWZrcV1uaeGNi-PRI2xgDrhQfv1_Lby8fBTWyDZhQ06O3AM6n76j_-cHlHjJLahmP4ygvJ-iwGSSXwntVJtmV76vprhB_mPDHFsOxjwoWadVZ5tBOQifnLzeGQYMb6Q00oYkbFwAD8554XNTDT0nmK16jTdF17V-MgWnK8RmGNBFkySydK0sEWwjYVjCScUCM6I", // Thruster
  techImpulse: "https://lh3.googleusercontent.com/aida-public/AB6AXuCd2dUTqjUsAcUPQOTk2ukYe3jO6XM4-sDHF10X83-XP8vidQdYFHgCjpeNNuxHLjWuIETBVc4-tF48QBg635FXHK3OHl3XJtyBIkYhbuNKjm1gi-w5E5JBsKMfFkYYudLiRVf917sQBCIkRdhPmSnjKNUpHDiqn1OUmKVHK1oFpUAXDHKoc7NOKDMZCKLxm4p1GZhpnvu-GP9sZFnbzedCWMEBtk7KlYd6EiN0uuYs9gi5y-_MDWTKKT4NE1bSe52hWWJuZidIru8",
  techHyperDrive: "https://lh3.googleusercontent.com/aida-public/AB6AXuDbgGTOOmYRO8Cx2O9AikzppzN9zC4-i7_FrPEcct-2C21HpEJmdGGu5Za7crC8JzzPSg7_h9whOWZrcV1uaeGNi-PRI2xgDrhQfv1_Lby8fBTWyDZhQ06O3AM6n76j_-cHlHjJLahmP4ygvJ-iwGSSXwntVJtmV76vprhB_mPDHFsOxjwoWadVZ5tBOQifnLzeGQYMb6Q00oYkbFwAD8554XNTDT0nmK16jTdF17V-MgWnK8RmGNBFkySydK0sEWwjYVjCScUCM6I", // Advanced Engine
  techPlasma: "https://lh3.googleusercontent.com/aida-public/AB6AXuA5zJhoBmc9B_7K3kdzmS0jRGQ4TxTF1sKrsA0-Zxnv4gQMVzgicY3JzPKK5mAwCC1iuh4xUjsQTCiOr1frnHwM2FNQ59ZbM8gyFwJvf5kgN1Np1dDGsQP7vua8fW77DzSNOmAX7frp_E13Rt22KjtAxy61zJl5Drp2C1v4LUF1HPLKJqcHTdEO6D_s3q5ujXDXOR8tV0yHYqfY4Gjc1egtpZyY1hbpRfwcedU-Fd728-EDyp_LSAz12VFwRRaLGqsOpgXayb0dFUU",
  techEspionage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAuzcKCcqW_Uwb_MHjDE4UnIS9iufqeQRG-ox9HOxWuvVuHaPFUOrPzlXsVC7PfwZ7MI1K-xoYXSIRYGuCSJskYUnvKDvMxqvSe3Gia4Hb2MB3OLyt_tMwvU9qvxgjTrPmM6wQypgXYMFoiUUJMXWeDDfXxHDYHBm1mxGIFog5PovvrH7Zb2U4gFbh_HAslZUcihLWiSiQi2WAG8mGqDZzKh4eaLLLitm105RayEmmJXCGVObylA3o_oKyx4bVz44Os-zM8jsZ59ng",
  techComputer: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWhn2HXSCm5RHKMuQUw21Hw6EWLXbJVTX6WMPGH0zSgbJ5FrOtwFl3GoA7TburBE1sfekcUVJknBOryC06NelUAT8HKLx_GxRk7p7zy_6yTCsUIteUJ1P-m68zJ-LqyQZ_hz53P1KnKtNVNIoJZvor1YyzW2ZN49ItxXjuLoIAl6Run1afN28jy6tc9scmfRtvAzO2Ixv0SIek4-r4SWglDDGR-aZYAweEP3K9zyWk8ez2EY6n6s7_UCU10S04j1dHEXCQ6GDjpDc",
  techAstro: "https://lh3.googleusercontent.com/aida-public/AB6AXuBSOTflDav4MFvu_Yvg-9qCDKqpS6BwAJDvSFmXbaK1M4mBatMw8wpRPT_bROfe2lelYtoxtN-ew041hcpd7KHjnZTbZ7Ov1q8gvcDdQ-zV7WCHlysly8ohvQJqhXRh1J3QUSfnu95xoFJX3O50BjiNefxhrFKws1eSBVnIPiB0iOWl_S8NDWo5mwLU-rA0pT6VOakhtRCgKUZrJmDumK6NIAyB0H60AK5EdDlixy4qsNd1SagA7z0AUEAqWHF43uun44RCqVq1hOY",

  // Specific Visuals for Techs
  techWeapon: "https://lh3.googleusercontent.com/aida-public/AB6AXuCd2dUTqjUsAcUPQOTk2ukYe3jO6XM4-sDHF10X83-XP8vidQdYFHgCjpeNNuxHLjWuIETBVc4-tF48QBg635FXHK3OHl3XJtyBIkYhbuNKjm1gi-w5E5JBsKMfFkYYudLiRVf917sQBCIkRdhPmSnjKNUpHDiqn1OUmKVHK1oFpUAXDHKoc7NOKDMZCKLxm4p1GZhpnvu-GP9sZFnbzedCWMEBtk7KlYd6EiN0uuYs9gi5y-_MDWTKKT4NE1bSe52hWWJuZidIru8", // Aggressive red ship
  techShield: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUSEKlHxUvCzxVOgj1Y6MtxX1VhQuac5X-CQBCwdETPQW0ynuAd-uEVEWMCGnx7FyX7vOxy4epq_CKJImgHYAUcz04j5B4DL1cjdUqVefFWq4dFoTwzLUivuBxpd4Q1i7dnsLEZAlkOwXPiYSMTau5dTr7XWhZMcXfDAG4bloSSPGJYItXueBQ_uivo-IdPPh5ad4npHg32fLsQj__8JNmEc7rzx0kjjz3wz_upv0MPt66tV9BzNqd29cwpdNqoUhnRVHjteACKYU", // Blue shield/aura
  techArmour: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKFYodx8aYkS3L0_aZKv8NQVKCFFLEp_aIojke7fVSBUGfftz5yRPvF1fuXX4vvvHwtId36V6DzP398lKo5i9fDlbC3dgYH7qP5VhLyKyyn_n9D4fSyvnoiPHulQLtl5Do1YYRpVvhVcfGOS4IyPuY7dVya1qor3vSjhE-KsxkO9Nr0rKccvd0lp1OQYWa4fOwAJKWnx24KLrcu70jfMTpcUW-Fb5dXiBJkD9UFjV4B07Jr5EhFLNsjASa8zQIzRaxg3XKdJnmvFs", // Industrial structure

  // Ships
  lightFighter: "/kosmo/ships/light_fighter.png",
  heavyFighter: "/kosmo/ships/heavy_fighter.png",
  cruiser: "/kosmo/ships/cruiser.png",
  battleship: "/kosmo/ships/battleship.png",

  // New/Fixed Ship Images
  destroyer: "/kosmo/ships/destroyer.png", // Heavy dark ship
  deathStar: "/kosmo/ships/death_star.png", // Planet-like
  smallCargo: "/kosmo/ships/small_cargo.png",
  mediumCargo: "/kosmo/ships/medium_cargo.png",
  hugeCargo: "/kosmo/ships/huge_cargo.png",
  colonyShip: "/kosmo/ships/colony_ship.png",
  espionageProbe: "/kosmo/ships/espionage_probe.png",
  pioneer: "/kosmo/ships/pioneer.png" // Research ship look
};

export const BUILDINGS: Record<BuildingId, BuildingDef> = {
  [BuildingId.METAL_MINE]: {
    id: BuildingId.METAL_MINE,
    name: "Kopalnia Metalu",
    description: "Pozyskuje rudę metalu z głębi planety.",
    baseCost: { metal: 60, crystal: 15, deuterium: 0 },
    baseProduction: { metal: 30, crystal: 0, deuterium: 0, energy: -20 }, // Increased energy cost
    image: IMAGES.metalMine,
    buildTimeBase: 10
  },
  [BuildingId.CRYSTAL_MINE]: {
    id: BuildingId.CRYSTAL_MINE,
    name: "Kopalnia Kryształu",
    description: "Wydobywa kryształ niezbędny do elektroniki.",
    baseCost: { metal: 48, crystal: 24, deuterium: 0 },
    baseProduction: { metal: 0, crystal: 20, deuterium: 0, energy: -15 }, // Reduced energy cost
    image: IMAGES.crystalMine,
    buildTimeBase: 15
  },
  [BuildingId.DEUTERIUM_SYNTH]: {
    id: BuildingId.DEUTERIUM_SYNTH,
    name: "Syntezator Deuteru",
    description: "Przetwarza ciężki wodór na paliwo.",
    baseCost: { metal: 225, crystal: 75, deuterium: 0 },
    baseProduction: { metal: 0, crystal: 0, deuterium: 10, energy: -30 }, // Reduced energy cost
    image: IMAGES.deuteriumSynth,
    buildTimeBase: 20
  },
  [BuildingId.SOLAR_PLANT]: {
    id: BuildingId.SOLAR_PLANT,
    name: "Elektrownia Słoneczna",
    description: "Wytwarza energię z promieniowania gwiazdy.",
    baseCost: { metal: 75, crystal: 30, deuterium: 0 },
    baseProduction: { metal: 0, crystal: 0, deuterium: 0, energy: 30 },
    image: IMAGES.solarPlant,
    buildTimeBase: 12
  },
  [BuildingId.FUSION_REACTOR]: {
    id: BuildingId.FUSION_REACTOR,
    name: "Elektrownia Fuzyjna",
    description: "Wydajna elektrownia zużywająca deuter.",
    baseCost: { metal: 900, crystal: 360, deuterium: 180 },
    baseProduction: { metal: 0, crystal: 0, deuterium: -5, energy: 60 },
    image: IMAGES.fusionReactor,
    buildTimeBase: 40,
    requirements: [{ type: 'research', id: ResearchId.ENERGY_TECH, level: 3 }]
  },
  [BuildingId.METAL_STORAGE]: {
    id: BuildingId.METAL_STORAGE,
    name: "Magazyn Metalu",
    description: "Zwiększa limit przechowywania metalu.",
    baseCost: { metal: 1000, crystal: 0, deuterium: 0 },
    image: IMAGES.metalStorage,
    buildTimeBase: 25
  },
  [BuildingId.CRYSTAL_STORAGE]: {
    id: BuildingId.CRYSTAL_STORAGE,
    name: "Magazyn Kryształu",
    description: "Zwiększa limit przechowywania kryształu.",
    baseCost: { metal: 1000, crystal: 500, deuterium: 0 },
    image: IMAGES.crystalStorage,
    buildTimeBase: 25
  },
  [BuildingId.DEUTERIUM_TANK]: {
    id: BuildingId.DEUTERIUM_TANK,
    name: "Zbiornik Deuteru",
    description: "Zwiększa limit przechowywania deuteru.",
    baseCost: { metal: 1000, crystal: 1000, deuterium: 0 },
    image: IMAGES.deuteriumTank,
    buildTimeBase: 25
  },
  [BuildingId.ROBOT_FACTORY]: {
    id: BuildingId.ROBOT_FACTORY,
    name: "Fabryka Robotów",
    description: "Skraca czas budowy budynków.",
    baseCost: { metal: 400, crystal: 120, deuterium: 200 },
    image: IMAGES.robotFactory,
    buildTimeBase: 30
  },
  [BuildingId.SHIPYARD]: {
    id: BuildingId.SHIPYARD,
    name: "Stocznia",
    description: "Umożliwia budowę statków.",
    baseCost: { metal: 800, crystal: 400, deuterium: 200 },
    image: IMAGES.shipyard,
    buildTimeBase: 50,
    requirements: [{ type: 'building', id: BuildingId.ROBOT_FACTORY, level: 2 }]
  },
  [BuildingId.RESEARCH_LAB]: {
    id: BuildingId.RESEARCH_LAB,
    name: "Laboratorium Badawcze",
    description: "Niezbędne do odkrywania technologii.",
    baseCost: { metal: 200, crystal: 400, deuterium: 200 },
    image: IMAGES.researchLab,
    buildTimeBase: 60
  }
};

export const RESEARCH: Record<ResearchId, ResearchDef> = {
  [ResearchId.ENERGY_TECH]: {
    id: ResearchId.ENERGY_TECH,
    name: "Technologia Energetyczna",
    description: "Kluczowa do odblokowania zaawansowanych elektrowni i broni.",
    baseCost: { metal: 0, crystal: 800, deuterium: 400 },
    image: IMAGES.techEnergy,
    buildTimeBase: 40,
    requirements: [{ type: 'building', id: BuildingId.RESEARCH_LAB, level: 1 }]
  },
  [ResearchId.LASER_TECH]: {
    id: ResearchId.LASER_TECH,
    name: "Technologia Laserowa",
    description: "Podstawa dla systemów uzbrojenia.",
    baseCost: { metal: 200, crystal: 100, deuterium: 0 },
    image: IMAGES.techLaser,
    buildTimeBase: 20,
    requirements: [{ type: 'building', id: BuildingId.RESEARCH_LAB, level: 1 }, { type: 'research', id: ResearchId.ENERGY_TECH, level: 2 }]
  },
  [ResearchId.ION_TECH]: {
    id: ResearchId.ION_TECH,
    name: "Technologia Jonowa",
    description: "Wymagana dla krążowników i broni jonowej.",
    baseCost: { metal: 1000, crystal: 300, deuterium: 100 },
    image: IMAGES.techIon,
    buildTimeBase: 60,
    requirements: [{ type: 'building', id: BuildingId.RESEARCH_LAB, level: 4 }, { type: 'research', id: ResearchId.LASER_TECH, level: 5 }]
  },
  [ResearchId.HYPERSPACE_TECH]: {
    id: ResearchId.HYPERSPACE_TECH,
    name: "Technologia Nadprzestrzenna",
    description: "Wymagana dla pancerników i zaawansowanych napędów.",
    baseCost: { metal: 0, crystal: 4000, deuterium: 2000 },
    image: IMAGES.techHyper,
    buildTimeBase: 120,
    requirements: [{ type: 'building', id: BuildingId.RESEARCH_LAB, level: 7 }, { type: 'research', id: ResearchId.ENERGY_TECH, level: 5 }]
  },
  [ResearchId.COMBUSTION_DRIVE]: {
    id: ResearchId.COMBUSTION_DRIVE,
    name: "Napęd Spalinowy",
    description: "Podstawowy napęd dla lekkich statków.",
    baseCost: { metal: 400, crystal: 0, deuterium: 600 },
    image: IMAGES.techCombustion,
    buildTimeBase: 30,
    requirements: [{ type: 'building', id: BuildingId.RESEARCH_LAB, level: 1 }, { type: 'research', id: ResearchId.ENERGY_TECH, level: 1 }]
  },
  [ResearchId.IMPULSE_DRIVE]: {
    id: ResearchId.IMPULSE_DRIVE,
    name: "Napęd Impulsowy",
    description: "Dla cięższych myśliwców i krążowników.",
    baseCost: { metal: 2000, crystal: 4000, deuterium: 600 },
    image: IMAGES.techImpulse,
    buildTimeBase: 80,
    requirements: [{ type: 'building', id: BuildingId.RESEARCH_LAB, level: 2 }, { type: 'research', id: ResearchId.ENERGY_TECH, level: 1 }]
  },
  [ResearchId.HYPERSPACE_DRIVE]: {
    id: ResearchId.HYPERSPACE_DRIVE,
    name: "Napęd Nadprzestrzenny",
    description: "Umożliwia podróże międzygalaktyczne pancerników.",
    baseCost: { metal: 10000, crystal: 20000, deuterium: 6000 },
    image: IMAGES.techHyperDrive,
    buildTimeBase: 200,
    requirements: [{ type: 'research', id: ResearchId.HYPERSPACE_TECH, level: 3 }]
  },
  [ResearchId.PLASMA_TECH]: { id: ResearchId.PLASMA_TECH, name: "Technologia Plazmowa", description: "", baseCost: { metal: 2000, crystal: 4000, deuterium: 1000 }, image: IMAGES.techPlasma, buildTimeBase: 100 },
  [ResearchId.ESPIONAGE_TECH]: { id: ResearchId.ESPIONAGE_TECH, name: "Technologia Szpiegowska", description: "", baseCost: { metal: 200, crystal: 1000, deuterium: 200 }, image: IMAGES.techEspionage, buildTimeBase: 40 },
  [ResearchId.COMPUTER_TECH]: { id: ResearchId.COMPUTER_TECH, name: "Technologia Komputerowa", description: "", baseCost: { metal: 0, crystal: 400, deuterium: 600 }, image: IMAGES.techComputer, buildTimeBase: 50 },
  [ResearchId.ASTROPHYSICS]: { id: ResearchId.ASTROPHYSICS, name: "Astrofizyka", description: "", baseCost: { metal: 4000, crystal: 8000, deuterium: 4000 }, image: IMAGES.techAstro, buildTimeBase: 100 },
  [ResearchId.WEAPON_TECH]: { id: ResearchId.WEAPON_TECH, name: "Technologia Bojowa", description: "", baseCost: { metal: 800, crystal: 200, deuterium: 0 }, image: IMAGES.techWeapon, buildTimeBase: 60 },
  [ResearchId.SHIELDING_TECH]: { id: ResearchId.SHIELDING_TECH, name: "Technologia Ochronna", description: "", baseCost: { metal: 200, crystal: 600, deuterium: 0 }, image: IMAGES.techShield, buildTimeBase: 60 },
  [ResearchId.ARMOUR_TECH]: { id: ResearchId.ARMOUR_TECH, name: "Opancerzenie", description: "", baseCost: { metal: 1000, crystal: 0, deuterium: 0 }, image: IMAGES.techArmour, buildTimeBase: 60 },
};

export const SHIPS: Record<ShipId, ShipDef> = {
  [ShipId.LIGHT_FIGHTER]: {
    id: ShipId.LIGHT_FIGHTER,
    name: "Myśliwiec Lekki",
    description: "Szybki i zwrotny statek myśliwski, podstawa każdej floty.",
    baseCost: { metal: 1000, crystal: 300, deuterium: 0 },
    image: IMAGES.lightFighter,
    buildTime: 5,
    attack: 80,
    defense: 10,
    capacity: 50,
    requirements: [{ type: 'building', id: BuildingId.SHIPYARD, level: 1 }, { type: 'research', id: ResearchId.COMBUSTION_DRIVE, level: 1 }]
  },
  [ShipId.HEAVY_FIGHTER]: {
    id: ShipId.HEAVY_FIGHTER,
    name: "Myśliwiec Ciężki",
    description: "Ciężej opancerzona wersja myśliwca z silniejszym uzbrojeniem.",
    baseCost: { metal: 2000, crystal: 1500, deuterium: 0 },
    image: IMAGES.heavyFighter,
    buildTime: 10,
    attack: 150,
    defense: 25,
    capacity: 100,
    requirements: [{ type: 'building', id: BuildingId.SHIPYARD, level: 3 }, { type: 'research', id: ResearchId.IMPULSE_DRIVE, level: 2 }]
  },
  [ShipId.CRUISER]: {
    id: ShipId.CRUISER,
    name: "Krążownik",
    description: "Szybki okręt bojowy skuteczny przeciwko lekkim myśliwcom.",
    baseCost: { metal: 6000, crystal: 2500, deuterium: 500 },
    image: IMAGES.cruiser,
    buildTime: 30,
    attack: 400,
    defense: 50,
    capacity: 800,
    requirements: [{ type: 'building', id: BuildingId.SHIPYARD, level: 5 }, { type: 'research', id: ResearchId.ION_TECH, level: 2 }, { type: 'research', id: ResearchId.IMPULSE_DRIVE, level: 4 }]
  },
  [ShipId.BATTLESHIP]: {
    id: ShipId.BATTLESHIP,
    name: "Okręt Wojenny",
    description: "Potężna jednostka bojowa o ogromnej sile ognia.",
    baseCost: { metal: 15000, crystal: 5000, deuterium: 0 },
    image: IMAGES.battleship,
    buildTime: 60,
    attack: 1000,
    defense: 200,
    capacity: 1500,
    requirements: [{ type: 'building', id: BuildingId.SHIPYARD, level: 7 }, { type: 'research', id: ResearchId.HYPERSPACE_DRIVE, level: 4 }]
  },
  [ShipId.DESTROYER]: {
    id: ShipId.DESTROYER,
    name: "Niszczyciel",
    description: "Król pola bitwy. Niszczy lekkie statki w mgnieniu oka.",
    baseCost: { metal: 20000, crystal: 17000, deuterium: 5000 },
    image: IMAGES.destroyer,
    buildTime: 90,
    attack: 2000,
    defense: 500,
    capacity: 2000,
    requirements: [{ type: 'building', id: BuildingId.SHIPYARD, level: 9 }, { type: 'research', id: ResearchId.HYPERSPACE_DRIVE, level: 6 }, { type: 'research', id: ResearchId.HYPERSPACE_TECH, level: 5 }]
  },
  [ShipId.DEATH_STAR]: {
    id: ShipId.DEATH_STAR,
    name: "Pogromca Planet",
    description: "Ostateczna broń zdolna niszczyć całe księżyce.",
    baseCost: { metal: 5000000, crystal: 4000000, deuterium: 1000000 },
    image: IMAGES.deathStar,
    buildTime: 1000,
    attack: 200000,
    defense: 100000,
    capacity: 1000000,
    requirements: [{ type: 'building', id: BuildingId.SHIPYARD, level: 12 }, { type: 'research', id: ResearchId.HYPERSPACE_DRIVE, level: 7 }, { type: 'research', id: ResearchId.ASTROPHYSICS, level: 5 }]
  },
  [ShipId.SMALL_CARGO]: {
    id: ShipId.SMALL_CARGO,
    name: "Mały Transporter",
    description: "Podstawowa jednostka do transportu surowców na inne planety.",
    baseCost: { metal: 500, crystal: 500, deuterium: 0 },
    image: IMAGES.smallCargo,
    buildTime: 5,
    attack: 5,
    defense: 10,
    capacity: 5000,
    requirements: [{ type: 'building', id: BuildingId.SHIPYARD, level: 2 }, { type: 'research', id: ResearchId.COMBUSTION_DRIVE, level: 2 }]
  },
  [ShipId.MEDIUM_CARGO]: {
    id: ShipId.MEDIUM_CARGO,
    name: "Średni Transporter",
    description: "Zbalansowany statek transportowy o większej pojemności.",
    baseCost: { metal: 1500, crystal: 1500, deuterium: 0 },
    image: IMAGES.mediumCargo,
    buildTime: 10,
    attack: 10,
    defense: 25,
    capacity: 12000,
    requirements: [{ type: 'building', id: BuildingId.SHIPYARD, level: 4 }, { type: 'research', id: ResearchId.COMBUSTION_DRIVE, level: 4 }]
  },
  [ShipId.HUGE_CARGO]: {
    id: ShipId.HUGE_CARGO,
    name: "Ogromny Transporter",
    description: "Kolos transportowy zdolny przewieźć zasoby całej kolonii.",
    baseCost: { metal: 7000, crystal: 7000, deuterium: 500 },
    image: IMAGES.hugeCargo,
    buildTime: 25,
    attack: 25,
    defense: 100,
    capacity: 50000,
    requirements: [{ type: 'building', id: BuildingId.SHIPYARD, level: 8 }, { type: 'research', id: ResearchId.IMPULSE_DRIVE, level: 6 }]
  },
  [ShipId.COLONY_SHIP]: {
    id: ShipId.COLONY_SHIP,
    name: "Statek Kolonizacyjny",
    description: "Umożliwia zasiedlanie nowych planet w niezbadanych układach.",
    baseCost: { metal: 3000, crystal: 6000, deuterium: 3000 },
    image: IMAGES.colonyShip,
    buildTime: 150,
    attack: 50,
    defense: 100,
    capacity: 7500,
    requirements: [{ type: 'building', id: BuildingId.SHIPYARD, level: 4 }, { type: 'research', id: ResearchId.IMPULSE_DRIVE, level: 3 }]
  },
  [ShipId.ESPIONAGE_PROBE]: {
    id: ShipId.ESPIONAGE_PROBE,
    name: "Sonda Szpiegowska",
    description: "Mała sonda do zdobywania informacji o innych planetach.",
    baseCost: { metal: 0, crystal: 1000, deuterium: 0 },
    image: IMAGES.espionageProbe,
    buildTime: 2,
    attack: 0,
    defense: 0,
    capacity: 5,
    requirements: [{ type: 'building', id: BuildingId.SHIPYARD, level: 3 }, { type: 'research', id: ResearchId.COMBUSTION_DRIVE, level: 3 }]
  },
  [ShipId.PIONEER]: {
    id: ShipId.PIONEER,
    name: "Pionier",
    description: "Zaawansowany statek ekspedycyjny. Zwiększa szansę na sukces i chroni flotę przed zagrożeniami.",
    baseCost: { metal: 3000, crystal: 1500, deuterium: 500 },
    image: IMAGES.pioneer,
    buildTime: 45,
    attack: 200,
    defense: 200,
    capacity: 2000,
    requirements: [{ type: 'building', id: BuildingId.SHIPYARD, level: 6 }, { type: 'research', id: ResearchId.ESPIONAGE_TECH, level: 4 }, { type: 'research', id: ResearchId.IMPULSE_DRIVE, level: 4 }]
  }
};

export const PLANET_IMAGES: Record<string, string> = {
  terran: "/kosmo/planets/planet_terran.png",
  desert: "/kosmo/planets/planet_desert.png",
  ice: "/kosmo/planets/planet_ice.png",
  default: IMAGES.planet
};

export const DEFENSES = {
  rocketLauncher: { id: 'rocketLauncher', name: 'Wyrzutnia Rakiet', desc: 'Podstawowa obrona planetarna. Skuteczna przeciwko małym celom.', attack: 40, defense: 10, cost: { metal: 500, crystal: 0, deuterium: 0 }, buildTime: 20, icon: 'rocket_launch' },
  lightLaser: { id: 'lightLaser', name: 'Lekkie Działko Laserowe', desc: 'Szybkostrzelna wieżyczka laserowa. Idealna do zwalczania myśliwców.', attack: 50, defense: 12, cost: { metal: 400, crystal: 100, deuterium: 0 }, buildTime: 30, icon: 'electric_bolt' },
  heavyLaser: { id: 'heavyLaser', name: 'Ciężkie Działko Laserowe', desc: 'Potężny laser zdolny przebić pancerz średnich okrętów.', attack: 125, defense: 50, cost: { metal: 1500, crystal: 500, deuterium: 0 }, buildTime: 60, icon: 'bolt' },
  gaussCannon: { id: 'gaussCannon', name: 'Działo Gaussa', desc: 'Elektromagnetyczne działo wystrzeliwujące pociski z ogromną prędkością.', attack: 550, defense: 100, cost: { metal: 5000, crystal: 3500, deuterium: 500 }, buildTime: 150, icon: 'target' },
  ionCannon: { id: 'ionCannon', name: 'Działo Jonowe', desc: 'Zaawansowana technologia jonowa dezaktywująca systemy wroga.', attack: 75, defense: 250, cost: { metal: 1200, crystal: 700, deuterium: 250 }, buildTime: 120, icon: 'storm' },
  plasmaTurret: { id: 'plasmaTurret', name: 'Wieżyczka Plazmowa', desc: 'Najpotężniejsza broń obronna. Zdolna zniszczyć niszczyciele jednym strzałem.', attack: 1500, defense: 150, cost: { metal: 12000, crystal: 12000, deuterium: 7500 }, buildTime: 300, icon: 'whatshot' },
  smallShield: { id: 'smallShield', name: 'Mała Osłona Tarczowa', desc: 'Kopuła energetyczna chroniąca część planety przed atakami.', attack: 1, defense: 500, cost: { metal: 2500, crystal: 2500, deuterium: 0 }, buildTime: 60, icon: 'shield' },
  largeShield: { id: 'largeShield', name: 'Duża Osłona Tarczowa', desc: 'Masywna tarcza energetyczna obejmująca całą planetę.', attack: 1, defense: 2500, cost: { metal: 12000, crystal: 12000, deuterium: 0 }, buildTime: 300, icon: 'security' }
};