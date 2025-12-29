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
    const baseChance = hasPioneer ? 0.9 : 0.65;

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

    // 50% Resources
    // 30% Ships
    // 18% Artifacts (Common flavor)
    // 2% Dark Matter (Very Rare)

    if (eventRoll < 0.50) {
        // RESOURCES
        const metal = Math.floor(Math.random() * Math.min(50000, fleetCapacity * 0.6)) + 2000;
        const crystal = Math.floor(Math.random() * Math.min(30000, fleetCapacity * 0.4)) + 1000;
        const deuterium = Math.floor(Math.random() * Math.min(10000, fleetCapacity * 0.2)) + 500;

        // Sometimes only one resource
        const typeRoll = Math.random();
        let rewards: MissionRewards = {};
        let msg = "";

        if (typeRoll < 0.5) {
            rewards = { metal, crystal };
            msg = `Odkryto pole asteroid bogate w minerały. Pozyskano Metal: ${metal}, Kryształ: ${crystal}.`;
        } else if (typeRoll < 0.8) {
            rewards = { deuterium, crystal };
            msg = `Znaleziono obłok gazowy zawierający deuter. Skondensowano Deuter: ${deuterium} i zebrano Kryształ: ${crystal}.`;
        } else {
            rewards = { metal, crystal, deuterium };
            msg = `Trafiono na opuszczony magazyn piratów! Zrabowano Metal: ${metal}, Kryształ: ${crystal}, Deuter: ${deuterium}.`;
        }

        return {
            log: { ...logBase, title: "Pozyskano Zasoby", message: msg, outcome: 'success', rewards },
            rewards
        };

    } else if (eventRoll < 0.80) {
        // SHIPS (Derelicts)
        // Can find small ships usually.
        // Weighted probability for ship types
        const shipRoll = Math.random();
        let possibleShips: ShipId[];
        let amountMultiplier = 1;

        if (shipRoll < 0.70) {
            // Common (70%)
            possibleShips = [ShipId.LIGHT_FIGHTER, ShipId.HEAVY_FIGHTER, ShipId.SMALL_CARGO, ShipId.ESPIONAGE_PROBE];
            amountMultiplier = 5; // Can find up to 5+1
        } else if (shipRoll < 0.95) {
            // Rare (25%)
            possibleShips = [ShipId.MEDIUM_CARGO, ShipId.PIONEER, ShipId.CRUISER];
            amountMultiplier = 3; // Can find up to 3+1
        } else {
            // Epic (5%) - Very rare
            possibleShips = [ShipId.BATTLESHIP, ShipId.DESTROYER, ShipId.HUGE_CARGO];
            amountMultiplier = 1; // Can find usually 1, rarely 2
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

    } else if (eventRoll < 0.98) {
        // Flavor / Artifacts (Common bonus)
        const metal = Math.floor(Math.random() * 5000) + 500;
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
        // DARK MATTER (Very Rare)
        const dm = Math.floor(Math.random() * 50) + 10;
        return {
            log: {
                ...logBase,
                title: "Czarna Materia",
                message: `Eksperymentalne skanery chwyciły ślad rzadkiej anomalii. Skondensowano ${dm} jednostek Czarnej Materii!`,
                outcome: 'success'
            },
            rewards: { darkMatter: dm }
        };
    }
};
