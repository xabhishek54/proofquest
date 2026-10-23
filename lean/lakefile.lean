import Lake
open Lake DSL

package "ProofQuest" where
  version := v!"0.1.0"

@[default_target]
lean_lib «ProofQuest» where
  -- pure core Lean, no external dependencies
