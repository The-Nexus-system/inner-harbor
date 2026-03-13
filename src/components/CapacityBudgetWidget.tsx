import { useState } from "react";
import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Battery, BatteryLow, BatteryMedium, BatteryFull, Plus, X, Minus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const QUICK_COSTS = [
  { label: "Appointment", cost: 3, icon: "📋" },
  { label: "Social event", cost: 4, icon: "👥" },
  { label: "Errand", cost: 2, icon: "🏃" },
  { label: "Hygiene", cost: 1, icon: "🚿" },
  { label: "Cooking", cost: 2, icon: "🍳" },
  { label: "Travel", cost: 2, icon: "🚌" },
  { label: "Work block", cost: 3, icon: "💼" },
  { label: "Therapy", cost: 4, icon: "💜" },
];

export function CapacityBudgetWidget() {
  const { capacityBudget, updateCapacityBudget, addCapacityEntry, removeCapacityEntry } = useSystem();
  const [customLabel, setCustomLabel] = useState("");
  const [customCost, setCustomCost] = useState(1);
  const [addOpen, setAddOpen] = useState(false);

  const totalSpoons = capacityBudget?.totalSpoons ?? 12;
  const usedSpoons = (capacityBudget?.entries ?? []).reduce((sum, e) => sum + e.cost, 0);
  const remaining = Math.max(0, totalSpoons - usedSpoons);
  const percentage = totalSpoons > 0 ? Math.min(100, (remaining / totalSpoons) * 100) : 0;

  const BatteryIcon = percentage > 60 ? BatteryFull : percentage > 25 ? BatteryMedium : BatteryLow;
  const statusColor = percentage > 60 ? "text-safe" : percentage > 25 ? "text-warning" : "text-destructive";
  const statusLabel = percentage > 60 ? "Doing okay" : percentage > 25 ? "Getting low" : "Running on empty";

  const handleQuickAdd = async (label: string, cost: number) => {
    await addCapacityEntry(label, cost);
  };

  const handleCustomAdd = async () => {
    if (!customLabel.trim()) return;
    await addCapacityEntry(customLabel.trim(), customCost);
    setCustomLabel("");
    setCustomCost(1);
    setAddOpen(false);
  };

  const adjustTotal = async (delta: number) => {
    const newTotal = Math.max(1, Math.min(30, totalSpoons + delta));
    await updateCapacityBudget(newTotal);
  };

  return (
    <Card aria-label="Energy and capacity budget">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <BatteryIcon className={cn("h-5 w-5", statusColor)} aria-hidden="true" />
          Energy Budget
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className={cn("font-medium", statusColor)}>{statusLabel}</span>
            <span className="text-muted-foreground">{remaining} / {totalSpoons} remaining</span>
          </div>
          <Progress
            value={percentage}
            className="h-3"
            aria-label={`${remaining} of ${totalSpoons} energy remaining`}
          />
        </div>

        {/* Adjust total */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Daily budget</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => adjustTotal(-1)} aria-label="Decrease budget">
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-medium w-8 text-center">{totalSpoons}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => adjustTotal(1)} aria-label="Increase budget">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Quick add buttons */}
        <div className="flex flex-wrap gap-1.5">
          {QUICK_COSTS.map(item => (
            <button
              key={item.label}
              onClick={() => handleQuickAdd(item.label, item.cost)}
              className="px-2.5 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-xs font-medium transition-colors tap-target"
              aria-label={`Log ${item.label} (${item.cost} energy)`}
            >
              {item.icon} {item.label} <span className="text-muted-foreground ml-0.5">−{item.cost}</span>
            </button>
          ))}

          <Popover open={addOpen} onOpenChange={setAddOpen}>
            <PopoverTrigger asChild>
              <button className="px-2.5 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-xs font-medium text-primary transition-colors tap-target">
                <Plus className="h-3 w-3 inline mr-0.5" /> Custom
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 space-y-3" align="start">
              <div className="space-y-1.5">
                <Label htmlFor="custom-label" className="text-xs">What took energy?</Label>
                <Input
                  id="custom-label"
                  value={customLabel}
                  onChange={e => setCustomLabel(e.target.value)}
                  placeholder="e.g. Phone call"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custom-cost" className="text-xs">Energy cost (1-10)</Label>
                <Input
                  id="custom-cost"
                  type="number"
                  min={1}
                  max={10}
                  value={customCost}
                  onChange={e => setCustomCost(Number(e.target.value))}
                  className="h-8 text-sm w-20"
                />
              </div>
              <Button size="sm" onClick={handleCustomAdd} disabled={!customLabel.trim()} className="w-full">
                Log it
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        {/* Logged entries */}
        {(capacityBudget?.entries ?? []).length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-border">
            <p className="text-xs text-muted-foreground font-medium">Today's expenditures</p>
            <ul className="space-y-1" role="list">
              {(capacityBudget?.entries ?? []).map(entry => (
                <li key={entry.id} className="flex items-center justify-between text-sm group">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-muted-foreground text-xs">
                      {new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="truncate">{entry.label}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">−{entry.cost}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeCapacityEntry(entry.id)}
                      aria-label={`Remove ${entry.label}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-muted-foreground italic">
          🌿 This is a gentle guide, not a rule. Some days need more rest and that is okay.
        </p>
      </CardContent>
    </Card>
  );
}
