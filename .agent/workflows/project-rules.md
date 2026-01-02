---
description: Zasady architektury i rozwoju projektu Kosmo 2.0 (KRYTYCZNE)
---

# ZASADY PROJEKTOWE KOSMO 2.0 🚀

Ten dokument definiuje złote zasady, których należy przestrzegać przy każdej zmianie w kodzie. Ignorowanie ich grozi błędami krytycznymi.

---

## 1. Supabase & Baza Danych 🗄️

### 1.1 Atomic Updates (RPC)
Wszelkie operacje zmieniające stan gry (budowa, misje, walka) MUSZĄ być atomowe.
- ❌ **NIE UŻYWAJ**: `update()` na tabeli `profiles` lub `planets` gdy nadpisujesz stan gry zależny od poprzedniego.
- ✅ **UŻYWAJ**: `save_game_atomic` (RPC) lub Optimistic Locking z polem `version`.

### 1.2 Error Handling
- ✅ **Zawsze sprawdzaj `error`**:
```typescript
const { data, error } = await supabase...;
if (error) {
    console.error("Supabase Error:", error);
    // REVERT local state!
    setGameState(prev => ({ ...prev, ...backup }));
}
```
- ❌ **Refresh Profile w Error**: NIGDY nie wywołuj `refreshProfile()` w bloku catch/error. To nadpisze lokalne zmiany starymi danymi z serwera.

### 1.3 Fetching
- Unikaj `select('*')` jeśli nie potrzebujesz wszystkich pól (zwłaszcza przy `profiles`).
- Pamiętaj o RLS! Jeśli admin nie widzi danych, sprawdź `Policies`.

---

## 2. TypeScript & Typowanie 🛡️

### 2.1 Strict Mode
Projekt dąży do `strict: true`.
- ❌ **Unikaj `any`**: Używaj typów `ShipId`, `BuildingId`, `Wrapper<T>`.
- ✅ **Argumenty**: Zawsze typuj argumenty funkcji (np. `(ships: ShipDefinitions)`).

### 2.2 Znane problemy (Lint/TSC)
- `AdminPanel.tsx`: `select()` w v2 API nie przyjmuje argumentów `{ count: 'exact' }` w łańcuchu po `delete()`.
- `combatUtils.ts`: `reduce` wymaga zainicjowanego akumulatora (`, 0`).

---

## 3. Logika Gry & Misje ⚔️

### 3.1 Misje i Pętle
- **Anti-Loop**: Przy procesowaniu misji (np. `processMissionReturn`), upewnij się, że nie tworzysz nieskończonej pętli aktualizacji.
- **Deduplikacja**: Misje ratunkowe („Rescue”) muszą sprawdzać, czy dana flota nie została już uratowana w tej sekundzie.

### 3.2 Raporty Walki
- **Obrońca**: Raport musi być zagnieżdżony w logu: `report: battle.report`.
- **Agresor**: Raport musi być przekazany z wyniku misji do logu: `outcome.report`.

---

## 4. UI & UX 🎨

### 4.1 Rejestracja
- Wybór pozycji startowej musi sprawdzać tabelę `planets` (kolonie) ORAZ `profiles` (główne planety).

### 4.2 Zabezpieczenia
- Przedział czasowy (timers) musi mieć `isNaN` protection.
- Wartości ujemne surowców muszą być zerowane (`Math.max(0, val)`).

---

## 5. Workflow Pracy 📝

1. **Analiza**: Sprawdź `task.md` i `implementation_plan.md`.
2. **TSC Check**: Uruchom `npx tsc --noEmit --skipLibCheck` przed commitem.
3. **Commit**: Używaj konwencji `feat:`, `fix:`, `docs:`.
4. **Dokumentacja**: Aktualizuj ten plik, gdy odkryjesz nową "złotą zasadę".
