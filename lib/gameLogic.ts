import { FleetMission, MissionLog, MissionRewards, ShipId } from '../types';
import { SHIPS } from '../constants';

export type ExpeditionOutcome = 'success' | 'neutral' | 'danger' | 'failure';

export interface ExpeditionResult {
    log: MissionLog;
    rewards: MissionRewards;
    lostShips?: Record<string, number>; // For potential danger events
}

export const calculateExpeditionOutcome = (mission: FleetMission): ExpeditionResult => {
    const hasPioneer = (mission.ships[ShipId.PIONEER] || 0) > 0;
    const hasSpy = (mission.ships[ShipId.ESPIONAGE_PROBE] || 0) > 0;

    // Calculate Fleet Capacity
    let fleetCapacity = 0;
    let fleetStrength = 0;
    Object.entries(mission.ships).forEach(([id, count]) => {
        const ship = SHIPS[id as ShipId];
        if (ship) {
            fleetCapacity += (ship.capacity * (count as number));
            fleetStrength += (ship.attack * (count as number)) + (ship.defense * (count as number));
        }
    });

    const roll = Math.random();

    // Base chance depends on Pioneer (Pathfinder)
    // Pioneer increases chance of finding SOMETHING (Good or Bad)
    // Spy probe slightly increases chance of avoiding total emptiness
    const baseChance = hasPioneer ? 0.98 : 0.85; // BUFFED: 85% base success, 98% with Pioneer

    // Timestamp for log ID
    const timestamp = Date.now();
    const logBase = {
        id: `exp-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp
    };

    if (roll > baseChance) {
        // Nothing found (Empty Space)
        const messages = [
            "Sensory nie wykryły żadnych anomalii w sektorze.",
            "Pusta przestrzeń. Załoga spędziła czas na kalibracji systemów.",
            "Wyprawa dotarła do koordynatów, ale znaleziono jedynie kosmiczny pył.",
            "Sektor wydaje się opuszczony od tysiącleci.",
            "Brak znaczących odkryć. Morale załogi stabilne."
        ];
        return {
            log: {
                ...logBase,
                title: "Pusta Przestrzeń",
                message: messages[Math.floor(Math.random() * messages.length)],
                outcome: 'neutral'
            },
            rewards: {}
        };
    }

    // Determine Event Type
    const eventRoll = Math.random();

    // 40% Resources
    // 35% Ships
    // 15% Artifacts
    // 10% Dark Matter (BUFFED from 2%)

    if (eventRoll < 0.40) {
        // RESOURCES
        // Calculate potential find amount (independent of capacity first)
        let metal = Math.floor(Math.random() * 50000) + 12000; // Buffed min
        let crystal = Math.floor(Math.random() * 30000) + 6000;
        let deuterium = Math.floor(Math.random() * 10000) + 2000;

        // Determine type variation
        const typeRoll = Math.random();
        let rewards: MissionRewards = {};
        let msg = "";

        if (typeRoll < 0.5) {
            // Metal + Crystal
            deuterium = 0;
            msg = `Odkryto pole asteroid bogate w minerały.`;
        } else if (typeRoll < 0.8) {
            // Deuterium + Crystal
            metal = 0;
            msg = `Znaleziono obłok gazowy zawierający deuter.`;
        } else {
            // All three
            msg = `Trafiono na opuszczony magazyn piratów!`;
        }

        // CLAMP TO FLEET CAPACITY
        const total = metal + crystal + deuterium;
        if (total > fleetCapacity) {
            const ratio = fleetCapacity / total;
            metal = Math.floor(metal * ratio);
            crystal = Math.floor(crystal * ratio);
            deuterium = Math.floor(deuterium * ratio);
            msg += ` (Ładownie pełne: ${fleetCapacity})`;
        }

        if (metal > 0) rewards.metal = metal;
        if (crystal > 0) rewards.crystal = crystal;
        if (deuterium > 0) rewards.deuterium = deuterium;

        msg += ` Pozyskano:`;
        if (metal > 0) msg += ` Metal: ${metal}`;
        if (crystal > 0) msg += ` Kryształ: ${crystal}`;
        if (deuterium > 0) msg += ` Deuter: ${deuterium}.`;

        return {
            log: { ...logBase, title: "Pozyskano Zasoby", message: msg, outcome: 'success', rewards },
            rewards
        };

    } else if (eventRoll < 0.75) {
        // SHIPS (Derelicts)
        // Can find small ships usually.
        // Weighted probability for ship types
        const shipRoll = Math.random();
        let possibleShips: ShipId[];
        let amountMultiplier = 1;

        if (shipRoll < 0.60) {
            // Common
            possibleShips = [ShipId.LIGHT_FIGHTER, ShipId.HEAVY_FIGHTER, ShipId.SMALL_CARGO, ShipId.ESPIONAGE_PROBE];
            amountMultiplier = 8; // Buffed: up to 8+1
        } else if (shipRoll < 0.90) {
            // Rare
            possibleShips = [ShipId.MEDIUM_CARGO, ShipId.PIONEER, ShipId.CRUISER];
            amountMultiplier = 4; // Buffed: up to 4+1
        } else {
            // Epic (10%)
            possibleShips = [ShipId.BATTLESHIP, ShipId.DESTROYER, ShipId.HUGE_CARGO];
            amountMultiplier = 2; // Buffed: up to 2+1
        }

        const foundShip = possibleShips[Math.floor(Math.random() * possibleShips.length)];
        // Amount depends on fleet strength but capped by multiplier
        const amount = Math.floor(Math.random() * amountMultiplier) + 1;

        const shipName = SHIPS[foundShip]?.name || foundShip;

        return {
            log: {
                ...logBase,
                title: "Odnaleziono Statki",
                message: `Flota napotkała dryfujące wraki, które udało się przywrócić do działania. Dołączono do floty: ${amount}x ${shipName}.`,
                outcome: 'success'
            },
            rewards: { ships: { [foundShip]: amount } }
        };

    } else if (eventRoll < 0.90) {
        // Flavor / Artifacts (Common bonus)
        const metal = Math.floor(Math.random() * 10000) + 2000;
        return {
            log: {
                ...logBase,
                title: "Antyczny Artefakt",
                message: `Znaleziono dziwny artefakt obcych. Po jego analizie uzyskano technologię wartą ${metal} Metalu.`,
                outcome: 'success',
                rewards: { metal }
            },
            rewards: { metal }
        };

    } else {
        // DARK MATTER (10% Chance now!)
        const dm = Math.floor(Math.random() * 150) + 50; // Buffed: 50-200
        return {
            log: {
                ...logBase,
                title: "Czarna Materia (Rzadkie!)",
                message: `Eksperymentalne skanery wykryły anomalię czasoprzestrzenną. Skondensowano aż ${dm} jednostek Czarnej Materii!`,
                outcome: 'success'
            },
            rewards: { darkMatter: dm }
        };
    }
};
