# Firestore Security Specification - Chip NG

## Data Invariants
1. A user profile MUST NOT leak PII (email, phone, address) to the public.
2. Every mutation MUST be backed up to a dedicated backup collection.
3. Every document ID MUST be a valid slug-like string.
4. Timestamps MUST be server-validated where possible.
5. Users MUST be email-verified to perform most write operations.

## The Dirty Dozen Payloads (Attack Vectors)

1. **PII Scraping**: Attempt to `get` user document to read `email` and `phone`.
2. **Identity Spoofing**: Attempt to `create` link with `userId` of another user.
3. **Privilege Escalation**: Attempt to `update` own user document with `role: 'admin'`.
4. **Subscription Bypass**: Attempt to `update` own user document with `plan: 'pro'` or `isPremium: true`.
5. **Shadow Fields**: Attempt to `update` a link with a ghost field `isVerifiedByStaff: true`.
6. **Large Payload Attack**: Attempt to `create` a shout with 1MB of junk text.
7. **Resource Poisoning**: Attempt to use `.../../` or junk chars in document IDs.
8. **Soft-Delete Bypass**: Attempt to `list` documents that are marked `isDeleted: true`.
9. **Unverified Write**: Attempt to `create` a blog post without a verified email.
10. **Orphaned Writes**: Attempt to `create` a link for a user that doesn't exist.
11. **Update Gap**: Attempt to update a link and change its `userId` to a new owner.
12. **Recursive Cost Attack**: Attempt a list query with no limits to force O(n) scan.

## Security Rules Implementation Strategy

1. **Split Collection**: Move PII to `users/{userId}/private/settings`.
2. **Global Deny**: match /{document=**} { allow read, write: if false; }
3. **Strict Validation Helpers**: `isValidUser`, `isValidLink`, etc.
4. **Affected Keys**: High-precision `hasOnly` on all updates.
