"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProfileAsAdmin } from "@/app/(app)/profile/actions";

interface ProfileDeleteButtonProps {
  profileId: string;
  profileName: string;
}

export function ProfileDeleteButton({ profileId, profileName }: ProfileDeleteButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const result = await deleteProfileAsAdmin(profileId);

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "Failed to delete profile");
      }
    } catch {
      setError("An error occurred while deleting the profile");
    } finally {
      setIsDeleting(false);
      setIsConfirming(false);
    }
  };

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2">
        <div className="rounded bg-red-50 p-2 dark:bg-red-950/30">
          <p className="text-xs font-semibold text-red-900 dark:text-red-100">Delete {profileName}?</p>
          {error && <p className="mt-1 text-xs text-red-800 dark:text-red-200">{error}</p>}
        </div>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
          className="gap-1"
        >
          {isDeleting ? (
            <>
              <Loader className="size-3 animate-spin" />
              Deleting...
            </>
          ) : (
            "Confirm"
          )}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setIsConfirming(false)} disabled={isDeleting}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleDelete}
      className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
    >
      <Trash2 className="size-4" />
      Delete
    </Button>
  );
}
