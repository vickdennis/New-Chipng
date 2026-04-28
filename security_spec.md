# Security Spec: Chip NG

## 1. Data Invariants
- A `User` must have a unique `username`.
- A `Link` must belong to a valid `User` and `userId` must match the authenticated user for creation.
- Only users with the `admin` role (in the `admins` collection) can modify `blogs` or access `backups`.
- `backups` are read-only for regular users and only appendable by the system (or authenticated users during mutation).

## 2. The Dirty Dozen Payloads (Hardened Rule Tests)

1. **Identity Spoofing (User)**: Attempt to create a user profile with a different UID than the authenticated user.
2. **Identity Spoofing (Link)**: Attempt to create a link for another user's profile.
3. **Ghost Field Injection**: Attempt to update a user profile with an unauthorized field like `role: "admin"`.
4. **Privilege Escalation**: Attempt to update another user's profile as a non-admin.
5. **PII Leak**: Attempt to list all users to harvest emails.
6. **Orphaned Link**: Attempt to create a link without a matching user document (if enforcement is active).
7. **Bypassing Terminal Logic**: Attempt to modify a transaction once it's marked as `completed`.
8. **Malicious ID**: Attempt to create a document with a 1MB string as the ID.
9. **Fake Backup**: Attempt to manually overwrite a backup entry to hide malicious changes.
10. **Plan Bypass**: Attempt to set `isPremium: true` in the user profile directly from the client.
11. **Soft-Delete Bypass**: Attempt to hard-delete a document that should only be soft-deleted.
12. **Timestamp Fraud**: Attempt to set `updatedAt` to a future date instead of `request.time`.

## 3. Test Runner Concept
The tests will be executed against the `firestore.rules` using the emulator or production-ready security rules logic.
