# Delete Error Fix - Foreign Key Constraint Handling

## Problem

When trying to delete records from collections like `Scopes`, `Companies`, `Brands`, or `Manufacturers`, users were getting "an unknown error has occurred" because these records had foreign key relationships with other collections.

## Root Cause

The error occurred due to foreign key constraints in the database. When a record is referenced by other collections, the database prevents deletion to maintain data integrity.

## Solution Implemented

### 1. Added Delete Protection Hooks

Added `beforeDelete` hooks to collections that are referenced by other collections:

- **Scopes**: Protected from deletion if referenced by `Evaluation`, `Quotation`, `Invoices`, or `Repairs`
- **Companies**: Protected from deletion if referenced by `Scopes`
- **Brands**: Protected from deletion if referenced by `Scopes`
- **Manufacturers**: Protected from deletion if referenced by `Scopes` or `Inventory`

### 2. Created Cascade Delete Utility

Created `src/lib/cascade-delete.ts` with utilities for:

- Checking related records before deletion
- Creating user-friendly error messages
- Handling cascade deletion (if needed in the future)

### 3. User-Friendly Error Messages

Instead of generic "unknown error", users now see specific messages like:

```
Cannot delete scope because it has related records in: evaluation (2), quotation (1). Please delete the related records first.
```

## How It Works

### Before Delete Hook Example

```typescript
beforeDelete: [
  async ({ req, id }: { req: any; id: string | number }) => {
    try {
      // Check for related records before deletion
      const relationships = [
        { collection: 'evaluation', field: 'scope' },
        { collection: 'quotation', field: 'scope' },
        { collection: 'invoices', field: 'scope' },
        { collection: 'repairs', field: 'scope' },
      ];

      const relatedRecords = await checkRelatedRecords(
        req,
        'scope',
        id,
        relationships
      );

      if (relatedRecords.length > 0) {
        throw new Error(createDeletionError('scope', relatedRecords));
      }
    } catch (error) {
      throw error;
    }
  },
],
```

### Cascade Delete Utility Functions

- `checkRelatedRecords()`: Checks if a record is referenced by other collections
- `createDeletionError()`: Creates user-friendly error messages
- `cascadeDeleteRelatedRecords()`: Deletes related records (for future use)
- `safeDelete()`: Safe deletion with optional cascade

## Collections with Delete Protection

| Collection    | Protected From Deletion If Referenced By |
| ------------- | ---------------------------------------- |
| Scopes        | Evaluation, Quotation, Invoices, Repairs |
| Companies     | Scopes                                   |
| Brands        | Scopes                                   |
| Manufacturers | Scopes, Inventory                        |

## User Experience

### Before Fix

- ❌ Generic "an unknown error has occurred" message
- ❌ No indication of what's preventing deletion
- ❌ Confusing user experience

### After Fix

- ✅ Clear error message explaining why deletion failed
- ✅ Lists specific collections and record counts
- ✅ Provides guidance on what to delete first
- ✅ Maintains data integrity

## Example Error Messages

```
Cannot delete scope because it has related records in: evaluation (2), quotation (1). Please delete the related records first.

Cannot delete company because it has 3 related scope(s). Please delete the related scopes first.

Cannot delete manufacturer because it has related records in: scopes (1), inventory (5). Please delete the related records first.
```

## Future Enhancements

### Cascade Delete Option

The utility includes a `cascadeDelete` function that can be used to automatically delete related records when deleting a parent record. This could be implemented as an admin option.

### Bulk Delete Protection

The same protection can be extended to bulk delete operations.

### Soft Delete

Consider implementing soft delete (marking records as deleted instead of actually deleting them) for better data recovery options.

## Testing

To test the delete protection:

1. Create a scope with related records (evaluation, quotation, etc.)
2. Try to delete the scope
3. Verify you get a clear error message
4. Delete the related records first
5. Verify you can then delete the scope

## Production Benefits

- **Data Integrity**: Prevents accidental deletion of referenced records
- **User Experience**: Clear error messages instead of generic errors
- **Maintainability**: Centralized delete protection logic
- **Scalability**: Easy to add protection to new collections
