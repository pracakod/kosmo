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

Zapamiętaj wartości PRZED zmianą i przywróć je przy błędzie:

```typescript
const oldResources = { ...gameState.resources };
setGameState(prev => ({ ...prev, resources: newResources }));

const { error } = await supabase.update(...);
if (error) {
    setGameState(prev => ({ ...prev, resources: oldResources }));
}
```

## 4. KAŻDA zmiana stanu MUSI być zapisana do DB

```typescript
// ❌ ŹLE - tylko lokalnie:
setGameState(prev => ({ ...prev, resources: newResources }));
return 'success';

// ✅ DOBRZE - z zapisem do DB:
setGameState(prev => ({ ...prev, resources: newResources }));
await supabase.from('profiles').update({ resources: newResources });
```

## 5. Wzorzec bezpiecznej operacji

```typescript
const safeOperation = async () => {
    // 1. Walidacja
    if (!canDoOperation()) return;
    
    // 2. Zapisz oryginalne wartości
    const originalState = { ...gameState.relevantField };
    
    // 3. Optimistic update (lokalna zmiana)
    setGameState(prev => ({ ...prev, relevantField: newValue }));
    
    // 4. Zapis do DB
    const { error } = await supabase.from('profiles').update({ ... });
    
    // 5. Obsługa błędu z lokalnym cofnięciem
    if (error) {
        console.error('Operation failed:', error);
        setGameState(prev => ({ ...prev, relevantField: originalState }));
        return false;
    }
    
    return true;
};
```

## Lista funkcji z poprawną obsługą

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
| buyPremium | ✅ |
| processMissionReturn | ✅ |
