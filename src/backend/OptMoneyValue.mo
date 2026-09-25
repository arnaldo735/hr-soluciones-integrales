/// Optional money amounts (`?Nat`) reuse the `OptIdValue` instance: both
/// flatten an absent option to the `0` sentinel. This module exists only to
/// document that decision and deliberately declares no `_toRow`, so it never
/// competes with `OptIdValue` for the same implicit instance.

module {};
