import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity, ArrowRightLeft, CalendarPlus, ShieldAlert, TreePalm, BookOpen, Zap, Camera, HandHeart
} from "lucide-react";
import { ContextSnapshotButton } from "@/components/ContextSnapshotButton";
import { HandoffNoteForm } from "@/components/HandoffNoteForm";

const quickActions = [
  { label: "Start check-in", description: "Log how you're feeling right now", icon: Activity, path: "/?action=checkin" },
  { label: "Log quick switch", description: "Record a front change quickly", icon: ArrowRightLeft, path: "/front?action=quick-switch" },
  { label: "Add appointment", description: "Create a new calendar event", icon: CalendarPlus, path: "/calendar?action=new" },
  { label: "Open safety plan", description: "Access your crisis or grounding plans", icon: ShieldAlert, path: "/safety" },
  { label: "Open grounding", description: "Start a grounding exercise", icon: TreePalm, path: "/grounding" },
  { label: "Quick journal note", description: "Jot something down fast", icon: BookOpen, path: "/journal?action=quick" },
] as const;

export default function QuickActionsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <header>
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" aria-hidden="true" />
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Quick Actions</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          One-tap actions for common tasks. These can be triggered from iOS Shortcuts in the future.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {quickActions.map((action) => (
          <Card
            key={action.path}
            className="cursor-pointer hover:border-primary/50 transition-colors group"
            role="button"
            tabIndex={0}
            aria-label={action.label}
            onClick={() => navigate(action.path)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(action.path); } }}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-primary/10 p-2.5 group-hover:bg-primary/20 transition-colors">
                <action.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-sm">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed opacity-75">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-heading text-muted-foreground">Future: Siri & iOS Shortcuts</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            These actions are designed as deep links so a future iOS companion app can trigger them via Siri voice commands or the Shortcuts app. For example: "Hey Siri, start my check-in."
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
