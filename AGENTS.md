# Contribution rules

- Create a feature branch and pull request for every change. Do not push directly to `main`.
- Before merging, verify that `Data and loading resilience` and `Browser smoke` both completed successfully on the exact current PR head commit. Missing, pending, skipped, cancelled or failing checks are not passing checks.
- Refresh the PR state before merging and supply its expected head SHA. Preserve concurrent contributions. Verify the merged commit's checks on `main` before reporting it green.
- Fix the cause of failed checks; do not disable them or weaken their guarantees to merge a change.
- Keep Work, Culture, Adventures and Life Map independently maintained. Connect them with public links and the existing map embed rather than duplicating their canonical datasets.
- All files in this public repository must be safe for public access, including fields hidden by the UI. Preserve documented uncertainty, source attribution and distinctions between personal memories and independent evidence.

These are contributor instructions. They do not replace GitHub-enforced branch protection.
