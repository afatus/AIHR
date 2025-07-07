import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AuthService } from '../lib/auth';
import type { AuthState } from '../lib/auth';

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    console.group('🔐 useAuth Effect');
    console.log('Starting authentication check');
    console.time('useAuth-initialization');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.time('getInitialSession');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('✅ User session found:', session.user.id);
          console.time('profile-load');
          const profile = await AuthService.getProfile(session.user.id);
          console.timeEnd('profile-load');
          
          if (!profile) {
            console.warn('⚠️ Profile not found for user:', session.user.id);
            setState({
              user: session.user,
              profile: null,
              loading: false,
              error: 'Profile not found. Please contact administrator.',
            });
            return;
          }
          
          console.log('✅ Profile loaded successfully:', {
            id: profile.id,
            email: profile.email,
            tenant_id: profile.tenant_id,
            is_super_admin: profile.is_super_admin,
          });
          setState({
            user: session.user,
            profile,
            loading: false,
            error: null,
          });
        } else {
          console.log('ℹ️ No user session found');
          setState({
            user: null,
            profile: null,
            loading: false,
            error: null,
          });
        }
        console.timeEnd('useAuth-initialization');
        console.groupEnd();
      } catch (error) {
        console.group('❌ useAuth Error');
        console.error('Error during initial session check:', error);
        console.trace('Error stack trace');
        console.groupEnd();
        setState({
          user: null,
          profile: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Authentication error',
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.group('🔄 Auth State Change');
        console.log('Event:', event);
        console.log('Session exists:', !!session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, loading profile...');
          console.time('signin-profile-load');
          const profile = await AuthService.getProfile(session.user.id);
          console.timeEnd('signin-profile-load');
          
          if (!profile) {
            console.warn('Profile not found after sign in');
            setState({
              user: session.user,
              profile: null,
              loading: false,
              error: 'Profile not found. Please contact administrator.',
            });
            return;
          }
          
          setState({
            user: session.user,
            profile,
            loading: false,
            error: null,
          });
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setState({
            user: null,
            profile: null,
            loading: false,
            error: null,
          });
        }
        console.groupEnd();
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.group('🔑 Sign In Attempt');
      console.log('Email:', email);
      console.time('signin-process');
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { user, profile } = await AuthService.signIn(email, password);
      console.timeEnd('signin-process');
      
      if (!profile) {
        throw new Error('Profile not found after sign in');
      }
      
      setState({
        user,
        profile,
        loading: false,
        error: null,
      });
      console.log('✅ Sign in successful');
      console.groupEnd();
    } catch (error) {
      console.group('❌ Sign In Error');
      console.error('Error:', error);
      console.trace('Error stack trace');
      console.groupEnd();
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      }));
    }
  };

  const signOut = async () => {
    try {
      console.group('🚪 Sign Out');
      console.time('signout-process');
      setState(prev => ({ ...prev, loading: true, error: null }));
      await AuthService.signOut();
      console.timeEnd('signout-process');
      setState({
        user: null,
        profile: null,
        loading: false,
        error: null,
      });
      console.log('✅ Sign out successful');
      console.groupEnd();
    } catch (error) {
      console.group('❌ Sign Out Error');
      console.error('Error:', error);
      console.groupEnd();
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      }));
    }
  };

  const impersonateTenant = async (tenantId: string) => {
    try {
      console.group('👤 Tenant Impersonation');
      console.log('Target tenant ID:', tenantId);
      console.time('impersonation-process');
      setState(prev => ({ ...prev, loading: true, error: null }));
      const profile = await AuthService.impersonateTenant(tenantId);
      console.timeEnd('impersonation-process');
      setState(prev => ({
        ...prev,
        profile,
        loading: false,
        error: null,
      }));
      console.log('✅ Tenant impersonation successful');
      console.groupEnd();
    } catch (error) {
      console.group('❌ Impersonation Error');
      console.error('Error:', error);
      console.groupEnd();
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Impersonation failed',
      }));
    }
  };

  const stopImpersonation = async () => {
    try {
      console.group('🛑 Stop Impersonation');
      console.time('stop-impersonation-process');
      setState(prev => ({ ...prev, loading: true, error: null }));
      const profile = await AuthService.stopImpersonation();
      console.timeEnd('stop-impersonation-process');
      setState(prev => ({
        ...prev,
        profile,
        loading: false,
        error: null,
      }));
      console.log('✅ Stop impersonation successful');
      console.groupEnd();
    } catch (error) {
      console.group('❌ Stop Impersonation Error');
      console.error('Error:', error);
      console.groupEnd();
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Stop impersonation failed',
      }));
    }
  };

  return {
    ...state,
    signIn,
    signOut,
    impersonateTenant,
    stopImpersonation,
  };
};