# Security Specification - Portfolio 3D

## Data Invariants
1. A Project must have a unique ID, title, and category.
2. Projects can have optional `stlUrl` for 3D viewing.
3. Only the verified owner (`ema.uleckaite@gmail.com`) can modify data.
4. Settings (`ownerName`) is a singleton document.

## The "Dirty Dozen" Payloads

1. **Unauthenticated Write**: Attempt to create a project without being logged in. (Expected: DENIED)
2. **Invalid ID**: Attempt to create a project with an ID containing special characters like `$$$`. (Expected: DENIED)
3. **Identity Spoofing**: Regular user trying to update `ownerName` in settings. (Expected: DENIED)
4. **Massive Payload**: Attempt to save a description $>10,000$ characters. (Expected: DENIED)
5. **Shadow Field Injection**: Adding an `isAdmin: true` field to a project document. (Expected: DENIED)
6. **State Shortcut**: Trying to update `createdAt` timestamp (Expected: DENIED - immutable).
7. **Type Mismatch**: Sending `year` as a number instead of a string. (Expected: DENIED)
8. **Orphaned project**: Creating a project with missing required fields (e.g. no title). (Expected: DENIED)
9. **Email Spoofing**: Authenticated user with unverified email trying to write. (Expected: DENIED)
10. **Malicious Link**: Injecting a script tag into the `title`. (Expected: DENIED via regex/size)
11. **Settings Hijack**: Deleting the settings document. (Expected: DENIED)
12. **Collection Crawl**: Attempting to read a non-existent private collection. (Expected: DENIED)

## Test Runner (Logic Check)
The `firestore.rules` will be verified against these invariants.
