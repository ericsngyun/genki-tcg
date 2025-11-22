/**
 * Discord OAuth Authentication Helpers for Expo
 *
 * Uses expo-auth-session for the OAuth flow with the backend handling
 * the actual token exchange (keeping secrets secure on server).
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { api } from './api';

// Complete the auth session on web
WebBrowser.maybeCompleteAuthSession();

// Discord OAuth configuration
const DISCORD_CLIENT_ID = process.env.EXPO_PUBLIC_DISCORD_CLIENT_ID || '';

// Create the redirect URI for the current platform
export function makeRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'genki-tcg',
    path: 'auth/discord/callback',
  });
}

// Discovery document for Discord OAuth
const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://discord.com/api/oauth2/authorize',
  tokenEndpoint: 'https://discord.com/api/oauth2/token',
  revocationEndpoint: 'https://discord.com/api/oauth2/token/revoke',
};

/**
 * Initiates Discord OAuth flow
 * Returns an auth request that can be used with promptAsync
 */
export function useDiscordAuth() {
  const redirectUri = makeRedirectUri();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: DISCORD_CLIENT_ID,
      scopes: ['identify', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery
  );

  return {
    request,
    response,
    promptAsync,
    redirectUri,
  };
}

/**
 * Exchange the authorization code for tokens via backend
 * The backend handles the client secret securely
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{
  user: any;
  accessToken: string;
  refreshToken: string;
  orgMembership: any;
}> {
  try {
    const result = await api.discordCallback(code, redirectUri);
    return result;
  } catch (error: any) {
    console.error('Discord token exchange failed:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to complete Discord sign in'
    );
  }
}

/**
 * Link existing account to Discord
 */
export async function linkDiscordAccount(
  code: string,
  redirectUri: string
): Promise<{ message: string; user: any }> {
  try {
    const result = await api.linkDiscord(code, redirectUri);
    return result;
  } catch (error: any) {
    console.error('Discord account linking failed:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to link Discord account'
    );
  }
}

/**
 * Unlink Discord from account
 */
export async function unlinkDiscordAccount(): Promise<{ message: string }> {
  try {
    const result = await api.unlinkDiscord();
    return result;
  } catch (error: any) {
    console.error('Discord account unlinking failed:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to unlink Discord account'
    );
  }
}
