"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteProfileAsAdmin } from "@/app/(app)/profile/actions";

interface ProfileDeleteButtonProps {
  profileId: string;
  profileName: string;
}

export function ProfileDeleteButton({ profileId, profileName }: ProfileDeleteButtonProps) {
  const router = useRouter();

  return (
    <ConfirmDialog
      tone="danger"
      title={`Delete ${profileName}?`}
      description="Every workout, session and performance record for this profile is deleted with it. Admin deletion does not ask for the profile's PIN. This cannot be undone."
      confirmLabel="Delete profile"
      trigger={
        <Button size="sm" variant="destructive-quiet">
          <Trash2 data-icon="inline-start" />
          Delete
        </Button>
      }
      onConfirm={async () => {
        const result = await deleteProfileAsAdmin(profileId);
        if (!result.success) {
          return { error: result.error || "Failed to delete profile" };
        }
        router.refresh();
      }}
    />
  );
}
