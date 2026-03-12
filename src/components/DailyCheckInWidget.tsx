import { useState, useEffect } from "react";
import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";

const levels = ['', 'Very low', 'Low', 'Moderate', 'High', 'Very high'];
const moodLevels = ['', 'Very low', 'Low', 'Okay', 'Good', 'Great'];

function LevelSlider({ label, value, onChange, labels = levels }: { label: string; value: number; onChange: (v: number) => void; labels?: string[] }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-xs text-muted-foreground" aria-live="polite">{labels[value]}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={1}
        max={5}
        step={1}
        className="w-full"
        aria-label={`${label}: ${labels[value]}`}
      />
    </div>
  );
}

export function DailyCheckInWidget() {
  const { checkIn, updateCheckIn } = useSystem();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Show save indicator when check-in changes
  const handleChange = (field: string, value: number) => {
    updateCheckIn({ [field]: value } as any);
    setSaveStatus('saving');
  };

  useEffect(() => {
    if (saveStatus === 'saving') {
      const timer = setTimeout(() => setSaveStatus('saved'), 1200);
      return () => clearTimeout(timer);
    }
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Show a starter widget if no check-in exists yet
  const currentCheckIn = checkIn || { mood: 3, stress: 3, pain: 1, fatigue: 3, dissociation: 1 };

  return (
    <Card aria-label="Daily check-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading">Daily check-in</CardTitle>
          {saveStatus === 'saving' && (
            <span className="text-xs text-muted-foreground" aria-live="polite">Saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-primary" aria-live="polite">Saved ✓</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <LevelSlider label="Mood" value={currentCheckIn.mood} onChange={v => handleChange('mood', v)} labels={moodLevels} />
        <LevelSlider label="Stress" value={currentCheckIn.stress} onChange={v => handleChange('stress', v)} />
        <LevelSlider label="Pain" value={currentCheckIn.pain} onChange={v => handleChange('pain', v)} />
        <LevelSlider label="Fatigue" value={currentCheckIn.fatigue} onChange={v => handleChange('fatigue', v)} />
        <LevelSlider label="Dissociation" value={currentCheckIn.dissociation} onChange={v => handleChange('dissociation', v)} />
      </CardContent>
    </Card>
  );
}
