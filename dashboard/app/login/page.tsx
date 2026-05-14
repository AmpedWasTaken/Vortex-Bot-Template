import Link from 'next/link';
import type { ReactElement } from 'react';
import { LoginForm } from '@/components/login-form';
import {
  getDashboardAuthModes,
  isDiscordAuthEnabled,
  isDiscordLoginOperational,
  isPasswordAuthEnabled,
} from '@/lib/auth-modes';
import { isDashboardPasswordConfigured } from '@/lib/dashboard-password';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage(props: LoginPageProps): Promise<ReactElement> {
  const searchParams = await props.searchParams;
  const next = searchParams.next ?? '/dashboard';
  const oauthError = searchParams.error;

  const passwordConfigured = isDashboardPasswordConfigured();
  const passwordOn = isPasswordAuthEnabled();
  const discordOn = isDiscordAuthEnabled();
  const discordReady = isDiscordLoginOperational();

  const canUsePassword = passwordOn && passwordConfigured;
  const canUseDiscord = discordOn && discordReady;
  const canSignIn = canUsePassword || canUseDiscord;

  const modes = getDashboardAuthModes().join(' + ');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-muted/30 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <Badge variant="outline" className="mx-auto">
            Vortex Control Plane
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Auth modes: <span className="font-mono text-foreground">{modes}</span>. Use Discord OAuth for
            production-style access, or keep the shared password for local demos.
          </p>
        </div>

        {oauthError ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
            {oauthError}
          </p>
        ) : null}

        <Card className="border-border/80 shadow-xl shadow-primary/5">
          <CardHeader>
            <CardTitle>Dashboard access</CardTitle>
            <CardDescription>
              {canSignIn
                ? 'Choose a sign-in method below.'
                : 'Configure authentication in dashboard/.env.local (see README).'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canSignIn ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                {passwordOn && !passwordConfigured ? (
                  <p>
                    Password mode requires <span className="font-mono">DASHBOARD_PASSWORD</span> (8+ chars) and{' '}
                    <span className="font-mono">DASHBOARD_SESSION_SECRET</span> (32+ chars).
                  </p>
                ) : null}
                {discordOn && !discordReady ? (
                  <p>
                    Discord mode requires <span className="font-mono">DISCORD_CLIENT_ID</span>,{' '}
                    <span className="font-mono">DISCORD_CLIENT_SECRET</span>,{' '}
                    <span className="font-mono">DISCORD_OAUTH_REDIRECT_URI</span>, and a 32+ char{' '}
                    <span className="font-mono">DASHBOARD_SESSION_SECRET</span>.
                  </p>
                ) : null}
              </div>
            ) : null}

            {discordOn ? (
              <div className="space-y-2">
                {canUseDiscord ? (
                  <Button asChild className="w-full" variant="default">
                    <a href={`/api/auth/discord?next=${encodeURIComponent(next)}`}>Continue with Discord</a>
                  </Button>
                ) : (
                  <p className="text-sm text-destructive">
                    Discord sign-in is enabled but OAuth or session signing is not fully configured.
                  </p>
                )}
              </div>
            ) : null}

            {passwordOn && discordOn && canUsePassword && canUseDiscord ? (
              <div className="relative py-2 text-center text-xs uppercase tracking-wide text-muted-foreground">
                <span className="bg-card px-2">or</span>
              </div>
            ) : null}

            {passwordOn ? (
              <LoginForm nextPath={next} disabled={!canUsePassword} />
            ) : null}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="underline-offset-4 hover:underline">
            Back to marketing page
          </Link>
        </p>
      </div>
    </div>
  );
}
