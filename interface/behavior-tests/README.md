The files in this directory scaffold the adapter behavior test suite described
in `interface/SPEC.md`.

Every chain adapter should implement these cases against its own contract
surface and prove that its observable behavior matches the Stellar reference.

The current files use `it.todo(...)` placeholders so new adapters can fill in
chain-specific setup while keeping the required assertions explicit.
