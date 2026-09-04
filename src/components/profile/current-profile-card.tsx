import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initials } from "@/lib/utils";
import { updatePreferredWeightUnit } from "@/app/(app)/profile/actions";

/** Shared by /profile (the admin-facing all-profiles view) and /my-profile
 * (the single-profile view) — same card, same action, two different pages
 * around it. */
export function CurrentProfileCard({
  profile,
}: {
  profile: { id: string; displayName: string; preferredWeightUnit: string };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>{initials(profile.displayName)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{profile.displayName}</span>
        </div>

        <form action={updatePreferredWeightUnit} className="flex items-center gap-3">
          <input type="hidden" name="profileId" value={profile.id} />
          <span className="text-small text-muted-foreground">Weight unit</span>
          <div className="flex gap-1">
            {(["kg", "lb"] as const).map((unit) => (
              <Button
                key={unit}
                type="submit"
                name="unit"
                value={unit}
                variant={profile.preferredWeightUnit === unit ? "default" : "outline"}
              >
                {unit}
              </Button>
            ))}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
