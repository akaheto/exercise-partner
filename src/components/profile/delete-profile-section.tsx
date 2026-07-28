"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteProfile } from "@/app/(app)/profile/actions";

interface DeleteProfileSectionProps {
  profileId: string;
  profileName: string;
}

export function DeleteProfileSection({ profileId, profileName }: DeleteProfileSectionProps) {
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
      const result = await deleteProfile(profileId);

      if (result.success) {
        // Redirect to home page after successful deletion
        router.push("/");
      } else {
        setError(result.error || "Failed to delete profile");
      }
    } catch {
      setError("An error occurred while deleting the profile");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setIsConfirming(false);
    setError("");
  };

  return (
    <Card className="border-red-200 dark:border-red-800">
      <CardHeader>
        <CardTitle className="text-red-600 dark:text-red-400">Delete Profile</CardTitle>
        <CardDescription>
          This action cannot be undone. All workouts, sessions, and data for this profile will be permanently deleted.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}

        {isConfirming && (
          <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
            <p className="font-semibold text-red-900 dark:text-red-100">
              Are you sure you want to delete &quot;{profileName}&quot;?
            </p>
            <p className="mt-2 text-sm text-red-800 dark:text-red-200">
              This will delete the profile and all associated workouts, sessions, and performance data. This action cannot be
              undone.
            </p>

            <div className="mt-4 flex gap-3">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader className="size-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    Delete Profile
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isDeleting}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!isConfirming && (
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2"
          >
            <Trash2 className="size-4" />
            Delete This Profile
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
