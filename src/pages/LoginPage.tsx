import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useInviteCode } from '@/hooks/useInviteCode';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Key } from 'lucide-react';

export default function LoginPage() {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReset, setShowReset] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground font-heading">Loading...</p>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    if (showReset) {
      const result = await resetPassword(email);
      if (result.error) setError(result.error);
      else setMessage('Check your email for a password reset link.');
      setSubmitting(false);
      return;
    }

    if (tab === 'login') {
      const result = await signIn(email, password);
      if (result.error) setError(result.error);
    } else {
      const result = await signUp(email, password, displayName);
      if (result.error) setError(result.error);
      else setMessage('Account created. Please check your email to confirm, then sign in.');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-heading font-bold text-foreground">Mosaic</h1>
          <p className="text-muted-foreground">Your private system management space</p>
        </header>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-lg">
              {showReset ? 'Reset password' : 'Welcome'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showReset ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="tap-target"
                  />
                </div>
                {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                {message && <p className="text-sm text-primary" role="status">{message}</p>}
                <Button type="submit" className="w-full tap-target" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send reset link'}
                </Button>
                <Button type="button" variant="ghost" className="w-full tap-target" onClick={() => { setShowReset(false); setError(''); setMessage(''); }}>
                  Back to sign in
                </Button>
              </form>
            ) : (
              <Tabs value={tab} onValueChange={v => { setTab(v as 'login' | 'signup'); setError(''); setMessage(''); }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login" className="tap-target">Sign in</TabsTrigger>
                  <TabsTrigger value="signup" className="tap-target">Create account</TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <TabsContent value="signup" className="mt-0 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="display-name">Display name (optional)</Label>
                      <Input
                        id="display-name"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        autoComplete="name"
                        className="tap-target"
                      />
                    </div>
                  </TabsContent>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="tap-target"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                        className="tap-target pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                  {message && <p className="text-sm text-primary" role="status">{message}</p>}

                  <Button type="submit" className="w-full tap-target" disabled={submitting}>
                    {submitting ? 'Please wait...' : tab === 'login' ? 'Sign in' : 'Create account'}
                  </Button>

                  {tab === 'login' && (
                    <Button type="button" variant="link" className="w-full tap-target text-muted-foreground" onClick={() => { setShowReset(true); setError(''); setMessage(''); }}>
                      Forgot password?
                    </Button>
                  )}
                </form>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Your data is private and encrypted in transit. Only you can access your system.
        </p>
      </div>
    </div>
  );
}
