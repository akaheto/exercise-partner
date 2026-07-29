"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { deleteProfile } from "@/app/(app)/profile/actions";

interface DeleteProfileSectionProps {
  profileId: string;
  profileName: string;
}

export function DeleteProfileSection({ profileId, profileName }: DeleteProfileSectionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");

  return (
    <Card className="border-destructive-border">
      <CardHeader>
        <CardTitle className="text-destructive-text">Delete profile</CardTitle>
        <CardDescription>
          Permanently removes this profile and every workout, session and record belonging to it.
          This cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConfirmDialog
          tone="danger"
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setPin("");
          }}
          title={`Delete "${profileName}"?`}
          description="Every workout, session and performance record for this profile goes with it."
          confirmLabel="Delete profile"
          trigger={
            <Button variant="destructive-quiet">
              <Trash2 data-icon="inline-start" />
              Delete this profile
            </Button>
          }
          onConfirm={async () => {
            if (!/^\d{4,6}$/.test(pin)) {
              return { error: "Enter your 4-6 digit PIN" };
            }

            const result = await deleteProfile(profileId, pin);
            if (!result.success) {
              return { error: result.error || "Failed to delete profile" };
            }
            router.push("/");
          }}
        >
          <Field
            label="Enter your PIN to confirm"
            description="The 4-6 digit PIN you chose when creating this profile."
          >
            <Input
              id="delete-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </Field>
        </ConfirmDialog>
      </CardContent>
    </Card>
  );
}
