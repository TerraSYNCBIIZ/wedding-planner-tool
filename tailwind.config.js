/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  safelist: [
    'bg-primary',
    'text-primary',
    'bg-secondary',
    'text-secondary',
    'bg-accent',
    'text-accent',
    'bg-muted',
    'text-muted',
    'bg-background',
    'text-foreground',
    'bg-card',
    'text-card-foreground',
    'border-primary',
    'border-border',
    'border-input',
    'border-t-primary',
    'border-t-green-500',
    'border-t-amber-500',
    'border-b',
    'border-t',
    'border-r',
    'border-l',
    'border',
    'text-green-600',
    'text-amber-600',
    'text-destructive',
    'text-muted-foreground',
    'bg-primary/10',
    'bg-primary/5',
    'bg-accent/50',
    'bg-muted/50',
    'bg-card/50',
    'bg-amber-100',
    'bg-amber-400',
    'bg-green-500',
    'text-amber-500',
    'btn',
    'btn-primary',
    'btn-secondary',
    'btn-outline',
    'btn-sm',
    'btn-lg',
    'card',
    'card-hover',
    'stat-card',
    'stat-title', 
    'stat-value',
    'stat-description',
    'dashboard-grid',
    'section-title',
    'feature-link',
    'feature-icon',
    'feature-text'
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    ({ addComponents }) => {
      addComponents({
        '.card': {
          backgroundColor: 'hsl(var(--card))',
          borderRadius: 'var(--radius)',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          overflow: 'hidden',
        },
        '.card-hover': {
          transition: 'all 200ms',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            borderColor: 'hsl(var(--primary) / 0.2)',
          },
        },
        '.btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius)',
          fontSize: '0.875rem',
          fontWeight: '500',
          transition: 'color 150ms, background-color 150ms',
          '&:focus-visible': {
            outline: 'none',
            ringOffset: '2px',
            ring: '2px solid hsl(var(--ring))',
          },
          '&:disabled': {
            opacity: '0.5',
            pointerEvents: 'none',
          },
        },
        '.btn-primary': {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          height: '2.5rem',
          padding: '0.5rem 1rem',
          '&:hover': {
            backgroundColor: 'hsl(var(--primary) / 0.9)',
          },
        },
        '.btn-secondary': {
          backgroundColor: 'hsl(var(--secondary))',
          color: 'hsl(var(--secondary-foreground))',
          height: '2.5rem',
          padding: '0.5rem 1rem',
          '&:hover': {
            backgroundColor: 'hsl(var(--secondary) / 0.8)',
          },
        },
        '.btn-outline': {
          border: '1px solid hsl(var(--input))',
          height: '2.5rem',
          padding: '0.5rem 1rem',
          '&:hover': {
            backgroundColor: 'hsl(var(--accent))', 
            color: 'hsl(var(--accent-foreground))',
          },
        },
        '.btn-sm': {
          height: '2.25rem',
          padding: '0 0.75rem',
          borderRadius: 'var(--radius)',
        },
        '.btn-lg': {
          height: '2.75rem',
          padding: '0 2rem',
          borderRadius: 'var(--radius)',
        },
      })
    },
    // Dashboard-specific components
    ({ addComponents }) => {
      addComponents({
        '.stat-card': {
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        },
        '.stat-title': {
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'hsl(var(--muted-foreground))',
        },
        '.stat-value': {
          fontSize: '1.875rem',
          lineHeight: '2.25rem',
          fontWeight: '700',
        },
        '.stat-description': {
          fontSize: '0.75rem',
          color: 'hsl(var(--muted-foreground))',
        },
        '.dashboard-grid': {
          display: 'grid',
          gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
          gap: '1.5rem',
          '@screen md': {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          },
          '@screen lg': {
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          },
        },
        '.section-title': {
          fontSize: '1.25rem',
          lineHeight: '1.75rem',
          fontWeight: '600',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          '&::before': {
            content: '""',
            width: '1rem',
            height: '1rem',
            borderRadius: '9999px',
            backgroundColor: 'hsl(var(--primary) / 0.7)',
            marginRight: '0.5rem',
            display: 'inline-block',
          }
        },
        '.feature-link': {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          borderRadius: 'var(--radius)',
          border: '1px solid hsl(var(--border))',
          height: '8rem',
          transition: 'all 200ms',
          '&:hover': {
            borderColor: 'hsl(var(--primary))',
            backgroundColor: 'hsl(var(--primary) / 0.05)',
          },
        },
        '.feature-icon': {
          marginBottom: '0.75rem',
          fontSize: '1.5rem',
          lineHeight: '2rem',
          color: 'hsl(var(--primary))',
        },
        '.feature-text': {
          fontSize: '0.875rem',
          fontWeight: '500',
          textAlign: 'center',
        },
      })
    }
  ],
} 