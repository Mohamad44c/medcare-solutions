/**
 * Cascade delete utilities for handling foreign key constraints
 */

interface RelatedRecord {
  collection: string;
  count: number;
}

/**
 * Check for related records before deletion
 */
export async function checkRelatedRecords(
  req: any,
  collectionName: string,
  recordId: string | number,
  relationships: Array<{ collection: string; field: string }>
): Promise<RelatedRecord[]> {
  const relatedRecords: RelatedRecord[] = [];

  for (const relationship of relationships) {
    try {
      const result = await req.payload.find({
        collection: relationship.collection,
        where: {
          [relationship.field]: {
            equals: recordId,
          },
        },
        limit: 1,
      });

      if (result.docs.length > 0) {
        relatedRecords.push({
          collection: relationship.collection,
          count: result.totalDocs,
        });
      }
    } catch (error) {
      console.warn(`Error checking ${relationship.collection}:`, error);
    }
  }

  return relatedRecords;
}

/**
 * Create a user-friendly error message for deletion constraints
 */
export function createDeletionError(
  recordType: string,
  relatedRecords: RelatedRecord[]
): string {
  const collectionNames = relatedRecords
    .map(r => `${r.collection} (${r.count})`)
    .join(', ');

  return `Cannot delete ${recordType} because it has related records in: ${collectionNames}. Please delete the related records first.`;
}

/**
 * Cascade delete related records
 */
export async function cascadeDeleteRelatedRecords(
  req: any,
  relationships: Array<{ collection: string; field: string }>,
  recordId: string | number
): Promise<void> {
  for (const relationship of relationships) {
    try {
      // Find all related records
      const result = await req.payload.find({
        collection: relationship.collection,
        where: {
          [relationship.field]: {
            equals: recordId,
          },
        },
        limit: 1000,
      });

      // Delete each related record
      for (const doc of result.docs) {
        await req.payload.delete({
          collection: relationship.collection,
          id: doc.id,
        });
      }

      console.log(
        `Deleted ${result.docs.length} records from ${relationship.collection}`
      );
    } catch (error) {
      console.error(`Error deleting from ${relationship.collection}:`, error);
      throw error;
    }
  }
}

/**
 * Safe delete with cascade option
 */
export async function safeDelete(
  req: any,
  collectionName: string,
  recordId: string | number,
  relationships: Array<{ collection: string; field: string }>,
  cascade: boolean = false
): Promise<void> {
  if (cascade) {
    // Delete related records first
    await cascadeDeleteRelatedRecords(req, relationships, recordId);
  } else {
    // Check for related records and prevent deletion if any exist
    const relatedRecords = await checkRelatedRecords(
      req,
      collectionName,
      recordId,
      relationships
    );

    if (relatedRecords.length > 0) {
      throw new Error(createDeletionError(collectionName, relatedRecords));
    }
  }
}
