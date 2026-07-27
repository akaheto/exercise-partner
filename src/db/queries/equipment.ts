import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { equipmentInventory, sourceEquipment } from "@/db/schema";

export function listEquipment() {
  return db
    .select({ equipmentId: sourceEquipment.equipmentId, name: sourceEquipment.canonicalName })
    .from(sourceEquipment)
    .orderBy(asc(sourceEquipment.canonicalName));
}

/** Equipment ids the profile currently has marked "have". Used to pre-fill
 * the generator questionnaire's equipment step. */
export async function listHaveEquipmentIds(profileId: string): Promise<Set<string>> {
  const rows = await db
    .select({ equipmentId: equipmentInventory.equipmentId })
    .from(equipmentInventory)
    .where(and(eq(equipmentInventory.profileId, profileId), eq(equipmentInventory.status, "have")));
  return new Set(rows.map((r) => r.equipmentId));
}
