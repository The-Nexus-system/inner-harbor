import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

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

  if (!checkIn) return null;

  return (
    <Card aria-label="Daily check-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-heading">Daily check-in</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LevelSlider label="Mood" value={checkIn.mood} onChange={v => updateCheckIn({ mood: v as any })} labels={moodLevels} />
        <LevelSlider label="Stress" value={checkIn.stress} onChange={v => updateCheckIn({ stress: v as any })} />
        <LevelSlider label="Pain" value={checkIn.pain} onChange={v => updateCheckIn({ pain: v as any })} />
        <LevelSlider label="Fatigue" value={checkIn.fatigue} onChange={v => updateCheckIn({ fatigue: v as any })} />
        <LevelSlider label="Dissociation" value={checkIn.dissociation} onChange={v => updateCheckIn({ dissociation: v as any })} />
      </CardContent>
    </Card>
  );
}
