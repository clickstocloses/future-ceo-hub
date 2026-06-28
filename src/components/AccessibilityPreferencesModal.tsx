import { useState } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useUserStore } from "@/stores/userStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Eye, Ear } from "lucide-react";

export const AccessibilityPreferencesModal = () => {
  const { preferences, updatePreferences, loading } = useAccessibility();
  const user = useUserStore((s) => s.user);
  const authLoading = useUserStore((s) => s.loading);
  const [visual, setVisual] = useState(false);
  const [auditory, setAuditory] = useState(false);

  // Show only once per account, only for signed-in users
  const open = !!user && !authLoading && !loading && !preferences.hasSetPreferences;

  const save = async (v: boolean, a: boolean) => {
    await updatePreferences({
      visuallyImpaired: v,
      auditoryImpaired: a,
      hasSetPreferences: true,
    });
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Accessibility Preferences</DialogTitle>
          <DialogDescription>
            Help us tailor your learning experience. You can change these anytime in Settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="a11y-visual"
                  checked={visual}
                  onCheckedChange={(c) => setVisual(c === true)}
                />
                <Label htmlFor="a11y-visual" className="font-medium cursor-pointer">
                  I am visually impaired
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Enables a screen reader that voices text aloud when you hover or focus on it.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Ear className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="a11y-auditory"
                  checked={auditory}
                  onCheckedChange={(c) => setAuditory(c === true)}
                />
                <Label htmlFor="a11y-auditory" className="font-medium cursor-pointer">
                  I am hearing impaired
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically shows captions on videos and audio throughout the site.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => save(false, false)}>
            Skip / Neither
          </Button>
          <Button onClick={() => save(visual, auditory)}>
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
