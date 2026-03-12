import { useState, useEffect, useCallback } from 'react';
import { useSystem } from '@/contexts/SystemContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wind, Eye, Ear, Hand, Sparkles, RotateCcw, ChevronRight } from 'lucide-react';

const senses = [
  { icon: Eye, label: '5 things you can SEE', count: 5, color: 'text-primary' },
  { icon: Hand, label: '4 things you can TOUCH', count: 4, color: 'text-safe' },
  { icon: Ear, label: '3 things you can HEAR', count: 3, color: 'text-accent-foreground' },
  { icon: Sparkles, label: '2 things you can SMELL', count: 2, color: 'text-warning' },
  { icon: Sparkles, label: '1 thing you can TASTE', count: 1, color: 'text-destructive' },
];

function BreathingTimer() {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [seconds, setSeconds] = useState(0);
  const [cycles, setCycles] = useState(0);

  const phaseDurations = { inhale: 4, hold: 4, exhale: 6 };
  const phaseLabels = { inhale: 'Breathe in…', hold: 'Hold…', exhale: 'Breathe out…' };

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setSeconds(prev => {
        const next = prev + 1;
        if (next >= phaseDurations[phase]) {
          if (phase === 'inhale') setPhase('hold');
          else if (phase === 'hold') setPhase('exhale');
          else {
            setPhase('inhale');
            setCycles(c => c + 1);
          }
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [active, phase]);

  const progress = seconds / phaseDurations[phase];
  const circumference = 2 * Math.PI * 45;

  const reset = () => { setActive(false); setPhase('inhale'); setSeconds(0); setCycles(0); };

  return (
    <Card aria-label="Breathing exercise">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <Wind className="h-5 w-5" aria-hidden="true" /> Breathing exercise
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-medium">{active ? phaseLabels[phase] : 'Ready'}</span>
            {active && <span className="text-2xl font-bold text-primary">{phaseDurations[phase] - seconds}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setActive(!active)} variant={active ? 'outline' : 'default'}>
            {active ? 'Pause' : 'Start breathing'}
          </Button>
          {cycles > 0 && (
            <Button variant="ghost" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
          )}
        </div>
        {cycles > 0 && <p className="text-xs text-muted-foreground">{cycles} cycle{cycles !== 1 ? 's' : ''} completed</p>}
      </CardContent>
    </Card>
  );
}

function FiveForThreeExercise() {
  const [currentSense, setCurrentSense] = useState(0);
  const [items, setItems] = useState<string[][]>(senses.map(s => Array(s.count).fill('')));
  const [completed, setCompleted] = useState(false);

  const sense = senses[currentSense];
  const currentItems = items[currentSense];
  const filledCount = currentItems.filter(i => i.trim()).length;

  const handleNext = () => {
    if (currentSense < senses.length - 1) {
      setCurrentSense(prev => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const resetExercise = () => {
    setCurrentSense(0);
    setItems(senses.map(s => Array(s.count).fill('')));
    setCompleted(false);
  };

  if (completed) {
    return (
      <Card aria-label="5-4-3-2-1 exercise complete">
        <CardContent className="py-8 text-center space-y-3">
          <p className="text-xl font-heading font-bold">Well done 💜</p>
          <p className="text-muted-foreground">You completed the grounding exercise. Take a moment to notice how you feel now.</p>
          <Button variant="outline" onClick={resetExercise} className="gap-1">
            <RotateCcw className="h-4 w-4" /> Do it again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card aria-label="5-4-3-2-1 grounding exercise">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading">5-4-3-2-1 Grounding</CardTitle>
          <Badge variant="outline" className="text-xs">Step {currentSense + 1} of 5</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <sense.icon className={`h-6 w-6 ${sense.color}`} aria-hidden="true" />
          <p className="font-medium">{sense.label}</p>
        </div>
        <div className="space-y-2">
          {currentItems.map((item, i) => (
            <input
              key={i}
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder={`${i + 1}…`}
              value={item}
              onChange={e => {
                const next = [...items];
                next[currentSense] = [...currentItems];
                next[currentSense][i] = e.target.value;
                setItems(next);
              }}
            />
          ))}
        </div>
        <div className="flex justify-between">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentSense === 0}
            onClick={() => setCurrentSense(prev => prev - 1)}
          >
            Back
          </Button>
          <Button size="sm" onClick={handleNext} className="gap-1" disabled={filledCount === 0}>
            {currentSense < senses.length - 1 ? 'Next' : 'Finish'} <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GroundingPage() {
  const { currentFront, getAlter } = useSystem();
  const currentAlters = currentFront?.alterIds.map(id => getAlter(id)).filter(Boolean) || [];
  const groundingPrefs = currentAlters.map(a => a?.groundingPreferences).filter(Boolean);

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <header>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Grounding toolbox</h1>
        <p className="text-muted-foreground mt-1">Interactive exercises to help you feel present and safe right now.</p>
      </header>

      {groundingPrefs.length > 0 && (
        <Card aria-label="Personal grounding preferences">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading">Your grounding preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {currentAlters.map(alter => alter?.groundingPreferences && (
              <div key={alter.id} className="flex items-start gap-2 text-sm">
                <span className="font-medium" style={{ color: alter.color }}>{alter.emoji} {alter.name}:</span>
                <span className="text-muted-foreground">{alter.groundingPreferences}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BreathingTimer />
        <FiveForThreeExercise />
      </div>

      {/* Quick prompts */}
      <Card aria-label="Sensory prompts">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-heading">Quick sensory prompts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { emoji: '🧊', title: 'Cold water', desc: 'Hold an ice cube or run cold water on your wrists for 30 seconds.' },
              { emoji: '🧶', title: 'Texture focus', desc: 'Find something soft, rough, or textured. Focus on how it feels.' },
              { emoji: '🦶', title: 'Feet on ground', desc: 'Press your feet firmly into the floor. Notice the pressure.' },
              { emoji: '🫧', title: 'Blow bubbles', desc: 'Slow, controlled exhales. Watch each bubble float away.' },
              { emoji: '🍋', title: 'Sour taste', desc: 'Suck on something sour. Let the taste pull you into the present.' },
              { emoji: '🎵', title: 'Hum a tune', desc: 'Hum your favourite song. Feel the vibration in your chest.' },
            ].map((prompt, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-1">
                <p className="font-medium text-sm">{prompt.emoji} {prompt.title}</p>
                <p className="text-xs text-muted-foreground">{prompt.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
