---
description: Zasady zapisu stanu gry do bazy danych - KRYTYCZNE
---

# Złote zasady persystencji stanu gry

## 1. KAŻDA operacja musi mieć error handling

```typescript
// ✅ DOBRZE:
const { error } = await supabase.from('profiles').update(data);
if (error) {
    console.error('Error:', error);
    // Revert lokalnie
    setGameState(prev => ({ ...prev, /* cofnij zmiany */ }));
}

// ❌ ŹLE:
await supabase.from('profiles').update(data); // Brak sprawdzenia błędu!
```

## 2. NIGDY nie używać refreshProfile() w error handlerach

`refreshProfile()` może załadować cache'owane/stare dane i nadpisać nowsze lokalne zmiany!

```typescript
// ❌ ŹLE:
if (error) {
    refreshProfile(); // NIEBEZPIECZNE - może załadować stare dane!
}

// ✅ DOBRZE:
if (error) {
    setGameState(prev => ({ ...prev, ...originalValues })); // Cofnij lokalnie
}
```

## 3. Przy błędzie ZAWSZE cofać zmiany LOKALNIE

## 4. KAŻDA zmiana stanu MUSI być zapisana do DB

## 5. beforeunload MUSI używać synchronicznego localStorage

```typescript
// ✅ DOBRZE:
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameStateRef.current));
    save(); // Async - best effort
};
```

## 6. Na kolonii ZAWSZE synchronizuj profile (Level16, Research, Points)

## 7. Dodaj NaN protection do wszystkich obliczeń UI z czasem

```typescript
if (isNaN(value) || !isFinite(value)) value = 0;
```

---

# Lista funkcji z poprawną obsługą ✅

| Funkcja | Status | 
|---------|--------|
| upgradeBuilding | ✅ |
| upgradeResearch | ✅ |
| buildShip | ✅ |
| buildDefense | ✅ |
| cancelConstruction | ✅ |
| sendExpedition | ✅ |
| sendAttack | ✅ |
| sendSpyProbe | ✅ |
| sendTransport | ✅ |
| sendColonize | ✅ |
| cancelMission | ✅ |
| buyPremium | ✅ (async+DB) |
| processMissionReturn | ✅ |
| beforeunload | ✅ (localStorage) |
| colony tick save | ✅ (always sync profile) |
| Fleet timer | ✅ (NaN protected) |

---

# Struktura plików

```
GameContext.tsx (2740+ lines) - główna logika gry
├── saveGame() - centralny zapis
├── refreshProfile() - użyj TYLKO na initial load
├── tick() - główna pętla (1s)
├── checkMissions() - co 1s
├── processMissionArrival() - dotarcie misji
├── processMissionReturn() - powrót floty
├── upgradeBuilding/Research/Ship/Defense
├── send*(Expedition/Attack/SpyProbe/Transport/Colonize)
└── switchPlanet() - przełączanie planet

views/Fleet.tsx - wyświetlanie misji (z NaN protection)
views/Overview.tsx - przegląd planety
```

---

# Najczęstsze błędy do unikania

1. **refreshProfile w error handler** → ZAWSZE lokalne revert
2. **Brak await** przy supabase → Dodaj error handling
3. **beforeunload bez localStorage** → ZAWSZE sync backup
4. **Tick save na kolonii bez profile sync** → ALWAYS sync profile
5. **UI bez NaN protection** → Dodaj isNaN() check
