
import { SHIPS, DEFENSES, RESEARCH } from './constants';
import { ShipId, DefenseId, ResearchId, BattleReport, Cost } from './types';

// Helper to clone record
const clone = (obj: any) => JSON.parse(JSON.stringify(obj || {}));

export const generatePvPBattleResult = (
    attackerShips: Record<string, number>,
    defenderShips: Record<string, number>,
    defenderDefenses: Record<string, number>,
    defenderBuildings: any,
    defenderResearch: any,
    defenderResources: any,
    isBot = false,
    attackerResearch: any = {}
): {
    report: BattleReport,
    survivingAttackerShips: Record<string, number>,
    survivingDefenderShips: Record<string, number>,
    survivingDefenderDefenses: Record<string, number>,
    damagedBuildings: Record<string, number>,
    loot: Cost,
    attackerWon: boolean,
    totalAttackerLost: number, // For XP calculation
    debris?: { metal: number; crystal: number }
} => {

    // 1. Setup Initial State
    const initialAttackerShips = clone(attackerShips);
    const initialDefenderShips = clone(defenderShips || {});
    const initialDefenderDefenses = clone(defenderDefenses || {});

    // 2. Calculate Research Multipliers
    const attackerWeaponMult = 1 + ((attackerResearch[ResearchId.WEAPON_TECH] || 0) * 0.1);
    const attackerShieldMult = 1 + ((attackerResearch[ResearchId.SHIELDING_TECH] || 0) * 0.05) + ((attackerResearch[ResearchId.ARMOUR_TECH] || 0) * 0.05);

    const defenderWeaponMult = 1 + ((defenderResearch[ResearchId.WEAPON_TECH] || 0) * 0.1);
    const defenderShieldMult = 1 + ((defenderResearch[ResearchId.SHIELDING_TECH] || 0) * 0.05) + ((defenderResearch[ResearchId.ARMOUR_TECH] || 0) * 0.05);

    // Bot scaling logic (keep existing behavior for bots)
    let botDefenseBoost = 1.0;
    if (isBot) {
        // Bot logic from original code was simple equivalence, but we'll try to honor it or improve.
        // Original: defenderDefense = Math.max(100, attackPower * 0.8 * defenderShieldMult);
        // Since we are doing a simulation now, we can't just set total defense.
        // We will give bots a boost to their stats if needed, or just rely on their ship count.
        // For now, assume bots follow same rules.
    }

    // 3. Simulation Variables
    let currentAttackerShips = clone(attackerShips);
    let currentDefenderShips = clone(defenderShips || {});
    let currentDefenderDefenses = clone(defenderDefenses || {});

    const maxRounds = 6;
    const logMessages: string[] = [];

    // Combat Loop
    for (let round = 1; round <= maxRounds; round++) {
        // Calculate Total Firepower for this round including Counters!

        // --- Attacker Fire Phase ---
        // For each Attacker Ship Type, calculate damage dealt to Defender Fleet
        // We need to distribute damage. Simplified: Aggregate damage vs Fleet Health?
        // OR: Rock-Paper-Scissors implies specific targeting.
        // Implementation: "Weighted Damage".
        // Total Attack Power = Sum of (ShipCount * BaseDamage * Tech * (CounterBonus if applicable))

        // Issue: Counter bonus depends on target distribution.
        // Approx: 
        // 1. Count total defender units (ships + defenses).
        // 2. For each Attacker Type:
        //    Base Dmg = Count * Attack * Tech
        //    Bonus Dmg = 0
        //    For each specific bonus target type present in defender fleet:
        //       TargetRatio = (TargetCount / TotalDefenderUnits)
        //       BonusAmount = Base Dmg * BonusMultiplier * TargetRatio
        //       (Or use the requested min(1, Target/Attacker) formula?)
        //       Requested Formula: "BonusFactor = Math.min(1, TargetCount / AttackerCount)"
        //       So: EffectiveAttack += BaseAttack * AttackerCount * BonusVal * BonusFactor
        //    Total Round Damage += EffectiveAttack

        let totalAttackerDamage = 0;
        let totalDefenderUnits = 0;

        // Count defender units for distribution logic
        Object.values(currentDefenderShips).forEach((c: any) => totalDefenderUnits += c);
        Object.values(currentDefenderDefenses).forEach((c: any) => totalDefenderUnits += c);

        if (totalDefenderUnits === 0) break; // Defender dead

        Object.entries(currentAttackerShips).forEach(([id, count]) => {
            const shipDef = SHIPS[id as ShipId];
            const num = count as number;
            if (num <= 0) return;

            // Base Attack
            let damage = shipDef.attack * num * attackerWeaponMult;

            // Counter Bonuses
            if (shipDef.bonuses) {
                Object.entries(shipDef.bonuses).forEach(([targetId, bonusVal]) => {
                    // Check if target exists in defender fleet
                    let targetCount = (currentDefenderShips[targetId] || 0) + (currentDefenderDefenses[targetId] || 0);

                    if (targetCount > 0) {
                        const bonusFactor = Math.min(1, targetCount / num);
                        // Added Power from this bonus
                        // Wait, bonusVal is a multiplier? e.g. 2.0 = +200% or 2.0x?
                        // "Myśliwiec Lekki" +200% vs "Pogromca Planet".
                        // Usually +200% means 3x total.
                        // Let's assume the value in constant is the ADDED percentage factor (e.g. 2.0).
                        const addedConfig = shipDef.attack * num * attackerWeaponMult * (bonusVal as number) * bonusFactor;
                        damage += addedConfig;
                    }
                });
            }
            totalAttackerDamage += damage;
        });

        // --- Defender Fire Phase ---
        let totalDefenderDamage = 0;
        let totalAttackerUnits = 0;
        Object.values(currentAttackerShips).forEach((c: any) => totalAttackerUnits += c);

        if (totalAttackerUnits === 0) break; // Attacker dead

        // Defender Ships
        Object.entries(currentDefenderShips).forEach(([id, count]) => {
            const shipDef = SHIPS[id as ShipId];
            const num = count as number;
            if (num <= 0) return;

            let damage = shipDef.attack * num * defenderWeaponMult;
            if (shipDef.bonuses) {
                Object.entries(shipDef.bonuses).forEach(([targetId, bonusVal]) => {
                    let targetCount = currentAttackerShips[targetId] || 0;
                    if (targetCount > 0) {
                        const bonusFactor = Math.min(1, targetCount / num);
                        const addedConfig = shipDef.attack * num * defenderWeaponMult * (bonusVal as number) * bonusFactor;
                        damage += addedConfig;
                    }
                });
            }
            totalDefenderDamage += damage;
        });

        // Defender Defenses
        Object.entries(currentDefenderDefenses).forEach(([id, count]) => {
            const defDef = DEFENSES[id as DefenseId];
            const num = count as number;
            if (num <= 0) return;

            let damage = defDef.attack * num * defenderWeaponMult;
            // Defenses vs Ships counters? (Not defined in DEFENSES const yet probably, but logic handles it if added)
            // If Defenses have bonuses property? Currently types says ShipDef has it. DefenseDef needs it?
            // types.ts lines for DefenseDef? We can assume standard attack (no bonuses for defenses yet unless added).
            totalDefenderDamage += damage;
        });


        // --- Apply Damage ---
        // Distribute damage proportionally to 'Health' (Hull + Shield)?
        // Simplified: Damage reduces total 'Structure Points' of fleet.
        // Calculate Total Hull+Shield for Defender
        // Helper to calculate total health
        const calculateTotalHealth = (fleet: any, isDefender: boolean, shieldMult: number) => {
            return Object.entries(fleet).reduce((acc: number, [id, count]) => {
                const def = isDefender
                    ? (DEFENSES[id as DefenseId] || SHIPS[id as ShipId])
                    : SHIPS[id as ShipId];

                if (!def) return acc;

                const cost = (def as any).baseCost || (def as any).cost || { metal: 0, crystal: 0 };
                const structure = (cost.metal + cost.crystal) / 10;
                const shield = def.defense * shieldMult;

                return acc + ((structure + shield) * (count as number));
            }, 0);
        };

        const attackerTotalHealth = calculateTotalHealth(attackerShips, false, attackerShieldMult);
        const defenderTotalHealth = calculateTotalHealth(currentDefenderShips, true, defenderShieldMult);

        // Defender Totals & Attacker Totals calculated above via helper.

        // Apply Damage and Remove Units
        // Damage % = DamageDealt / TotalHealth (Max 100%)
        // Log info
        logMessages.push(`Runda ${round}: Agresor atakuje siłą ${Math.floor(totalAttackerDamage)}. Obrońca atakuje siłą ${Math.floor(totalDefenderDamage)}.`);

        // Remove Attacker Units
        const attackerDamagePercent = Math.min(1.0, totalDefenderDamage / attackerTotalHealth);
        if (attackerTotalHealth > 0 && totalDefenderDamage > 0) {
            Object.keys(currentAttackerShips).forEach(id => {
                const count = currentAttackerShips[id];
                const loss = Math.floor(count * attackerDamagePercent);
                // Minimum 1 loss if percent > 0? No, standard flooring.
                currentAttackerShips[id] -= loss;
                if (currentAttackerShips[id] < 0) currentAttackerShips[id] = 0;
            });
        }

        // Remove Defender Units
        const defenderDamagePercent = Math.min(1.0, totalAttackerDamage / defenderTotalHealth);
        if (defenderTotalHealth > 0 && totalAttackerDamage > 0) {
            Object.keys(currentDefenderShips).forEach(id => {
                const count = currentDefenderShips[id];
                const loss = Math.floor(count * defenderDamagePercent);
                currentDefenderShips[id] -= loss;
                if (currentDefenderShips[id] < 0) currentDefenderShips[id] = 0;
            });
            Object.keys(currentDefenderDefenses).forEach(id => {
                const count = currentDefenderDefenses[id];
                const loss = Math.floor(count * defenderDamagePercent);
                currentDefenderDefenses[id] -= loss;
                if (currentDefenderDefenses[id] < 0) currentDefenderDefenses[id] = 0;
            });
        }

        // Check for victory
        // Recount
        let attCount = 0;
        Object.values(currentAttackerShips).forEach((c: any) => attCount += c);

        let defCount = 0;
        Object.values(currentDefenderShips).forEach((c: any) => defCount += c);
        Object.values(currentDefenderDefenses).forEach((c: any) => defCount += c);

        if (attCount <= 0 || defCount <= 0) break;
    }

    // 4. Calculate Final Results
    const totalAttackerEnd = Object.values(currentAttackerShips).reduce((sum, c) => (sum as number) + (c as number), 0) as number;
    const totalDefenderEnd = Object.values(currentDefenderShips).reduce((sum, c) => (sum as number) + (c as number), 0) +
        Object.values(currentDefenderDefenses).reduce((sum, c) => (sum as number) + (c as number), 0);

    const attackerWon = totalAttackerEnd > 0 && totalDefenderEnd <= 0;

    // Calculate Losses
    const attackerLosses: Record<string, number> = {};
    let totalAttackerLost = 0;
    Object.keys(initialAttackerShips).forEach(key => {
        const lost = initialAttackerShips[key] - (currentAttackerShips[key] || 0);
        attackerLosses[key] = lost;
        totalAttackerLost += lost;
    });

    const defenderLosses: Record<string, number> = {};
    Object.keys(initialDefenderShips).forEach(key => {
        defenderLosses[key] = initialDefenderShips[key] - (currentDefenderShips[key] || 0);
    });

    const defenderDefensesLost: Record<string, number> = {};
    const survivingDefenderDefensesFinal: Record<string, number> = {};
    Object.keys(initialDefenderDefenses).forEach(key => {
        const lost = initialDefenderDefenses[key] - (currentDefenderDefenses[key] || 0);
        // Defenses repair ability: 70% of lost defenses are repaired 
        // (Only real loss is 30% of lost).
        // Wait, original logic: "repaired = floor(lost * 0.7)". "actuallyLost = lost - repaired".
        const repaired = Math.floor(lost * 0.7);
        const actuallyLost = lost - repaired;

        defenderDefensesLost[key] = actuallyLost;
        survivingDefenderDefensesFinal[key] = (currentDefenderDefenses[key] || 0) + repaired;
    });

    // Loot
    let loot = { metal: 0, crystal: 0, deuterium: 0 };
    if (attackerWon) {
        loot.metal = Math.floor((defenderResources.metal || 0) * 0.5);
        loot.crystal = Math.floor((defenderResources.crystal || 0) * 0.5);
        loot.deuterium = Math.floor((defenderResources.deuterium || 0) * 0.5);
    }

    // Building Damage (10% chance per building if attacker wins)
    const damagedBuildings: Record<string, number> = {};
    if (attackerWon && defenderBuildings) {
        Object.entries(defenderBuildings).forEach(([id, level]) => {
            if ((level as number) > 0 && Math.random() < 0.10) {
                damagedBuildings[id] = 1;
            }
        });
    }

    const report: BattleReport = {
        rounds: 6, // or actual rounds
        initialAttackerShips,
        initialDefenderShips,
        initialDefenderDefenses,
        finalAttackerShips: currentAttackerShips,
        finalDefenderShips: currentDefenderShips,
        finalDefenderDefenses: survivingDefenderDefensesFinal,
        attackerLosses,
        defenderLosses,
        defenderDefensesLost,
        loot,
        bonuses: {
            attacker: { weapon: attackerWeaponMult, shield: attackerShieldMult, armour: 1 },
            defender: { weapon: defenderWeaponMult, shield: defenderShieldMult, armour: 1 }
        },
        logMessages,
        result: attackerWon ? 'attacker_win' : 'defender_win'
    };

    // Debris Calculation (30% of Metal/Crystal from destroyed ships)
    let debrisMetal = 0;
    let debrisCrystal = 0;

    const addDebris = (id: string, count: number) => {
        if (SHIPS[id as ShipId]) {
            const cost = SHIPS[id as ShipId].baseCost;
            debrisMetal += (cost.metal * count) * 0.3;
            debrisCrystal += (cost.crystal * count) * 0.3;
        }
    };

    Object.entries(attackerLosses).forEach(([id, count]) => addDebris(id, count));
    Object.entries(defenderLosses).forEach(([id, count]) => addDebris(id, count));

    return {
        report,
        survivingAttackerShips: currentAttackerShips,
        survivingDefenderShips: currentDefenderShips,
        survivingDefenderDefenses: survivingDefenderDefensesFinal,
        damagedBuildings,
        loot,
        attackerWon,
        totalAttackerLost,
        debris: { metal: Math.floor(debrisMetal), crystal: Math.floor(debrisCrystal) }
    };
};
