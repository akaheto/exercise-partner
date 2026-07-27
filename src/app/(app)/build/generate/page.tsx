import { notFound } from "next/navigation";
import { listEquipment, listHaveEquipmentIds } from "@/db/queries/equipment";
import { getActiveProfileId } from "@/lib/active-profile";
import { GeneratorWizard } from "@/components/generator/generator-wizard";

export default async function GenerateWorkoutPage() {
  const profileId = await getActiveProfileId();
  if (!profileId) notFound();

  const [equipment, haveIds] = await Promise.all([listEquipment(), listHaveEquipmentIds(profileId)]);

  return (
    <div className="mx-auto max-w-xl px-4 py-8 md:px-6">
      <GeneratorWizard equipmentOptions={equipment} initialHaveIds={[...haveIds]} />
    </div>
  );
}
