'use client';

/**
 * Login Page
 *
 * Design decisions:
 * - Split-panel layout: branded left panel (desktop), form right panel
 * - Form is clean, labeled, no decoration
 * - No fake "welcome" messages
 * - Error surfaced clearly below the submit button
 * - Keyboard accessible throughout
 * - Responsive: single column on mobile
 */

import React, { useState, FormEvent } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { ApiError } from '@/lib/api/client';
import { colors } from '@/lib/theme/tokens';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isUnauthorized) {
          setError('Invalid email or password. Please try again.');
        } else if (err.isServerError) {
          setError('A server error occurred. Please try again later.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Unable to connect. Check your network and try again.');
      }
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      {/* Left Panel — Brand (desktop only) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          flex: '0 0 420px',
          backgroundColor: colors.primary[600],
          px: 6,
          py: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle geometric background */}
        <Box
          sx={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 240,
            height: 240,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          }}
        />

        <GraduationCap size={40} color="white" strokeWidth={1.5} style={{ marginBottom: 24 }} />

        <Typography
          sx={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#FFFFFF',
            lineHeight: 1.2,
            mb: 2,
            letterSpacing: '-0.01em',
          }}
        >
          Scholentra
        </Typography>

        <Typography
          sx={{
            fontSize: '0.9375rem',
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 1.6,
            maxWidth: 300,
          }}
        >
          A complete school management platform designed for administrators, teachers, and staff.
        </Typography>
      </Box>

      {/* Right Panel — Login Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: { xs: 3, sm: 6, md: 8 },
          py: 6,
        }}
      >
        {/* Mobile brand mark */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            gap: 1.25,
            mb: 5,
          }}
        >
          <GraduationCap size={26} color={colors.primary[500]} strokeWidth={2} />
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: colors.primary[600] }}>
            Scholentra
          </Typography>
        </Box>

        <Box sx={{ width: '100%', maxWidth: 380 }}>
          <Box sx={{ mb: 4 }}>
            <Typography
              component="h1"
              sx={{ fontSize: '1.375rem', fontWeight: 600, color: 'text.primary', mb: 0.5 }}
            >
              Sign in
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              Enter your credentials to access the dashboard.
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            <Box>
              <Typography
                component="label"
                htmlFor="login-email"
                sx={{ fontSize: '0.8125rem', fontWeight: 500, color: 'text.primary', display: 'block', mb: 0.75 }}
              >
                Email address
              </Typography>
              <TextField
                id="login-email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu.gh"
                fullWidth
                autoComplete="email"
                autoFocus
                size="small"
                disabled={isLoading}
                inputProps={{ 'aria-label': 'Email address' }}
              />
            </Box>

            <Box>
              <Typography
                component="label"
                htmlFor="login-password"
                sx={{ fontSize: '0.8125rem', fontWeight: 500, color: 'text.primary', display: 'block', mb: 0.75 }}
              >
                Password
              </Typography>
              <TextField
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                fullWidth
                autoComplete="current-password"
                size="small"
                disabled={isLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {error && (
              <Alert severity="error" sx={{ fontSize: '0.8125rem', py: 0.5 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
              sx={{ mt: 0.5, py: 1 }}
            >
              {isLoading ? (
                <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
              ) : null}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
