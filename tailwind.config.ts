import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A2B4C', // Deep Navy Blue
          light: '#2A3D5E',
          dark: '#0F1A2E',
        },
        secondary: {
          DEFAULT: '#D4AF37', // Rich Gold
          light: '#EACD6E',
          dark: '#B89B2E',
        },
        accent: {
          DEFAULT: '#4A6B5B', // Deep Muted Green
          light: '#6B8C7C',
          dark: '#3A5A4B',
        },
        neutral: {
          cream: '#FDFBF5',
          50: '#F5F5F5',
          100: '#E5E5E5',
          200: '#D4D4D4',
          300: '#B3B3B3',
          400: '#A1A1A1',
          500: '#808080',
          600: '#666666',
          700: '#4D4D4D',
          800: '#333333',
          900: '#1A1A1A',
        },
      },
      fontFamily: {
        sans: ['Cormorant Garamond', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      typography: ({ theme }: { theme: (path: string) => string }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.neutral.800'),
            '--tw-prose-headings': theme('colors.primary.dark'),
            '--tw-prose-lead': theme('colors.neutral.700'),
            '--tw-prose-links': theme('colors.secondary.dark'),
            '--tw-prose-bold': theme('colors.neutral.900'),
            '--tw-prose-counters': theme('colors.secondary.dark'),
            '--tw-prose-bullets': theme('colors.secondary.DEFAULT'),
            '--tw-prose-hr': theme('colors.neutral.200'),
            '--tw-prose-quotes': theme('colors.neutral.600'),
            '--tw-prose-quote-borders': theme('colors.secondary.DEFAULT'),
            '--tw-prose-captions': theme('colors.neutral.500'),
            '--tw-prose-code': theme('colors.accent.dark'),
            '--tw-prose-pre-code': theme('colors.neutral.100'),
            '--tw-prose-pre-bg': theme('colors.neutral.800'),
            '--tw-prose-th-borders': theme('colors.neutral.300'),
            '--tw-prose-td-borders': theme('colors.neutral.200'),

            h1: {
              fontFamily: (theme('fontFamily.serif') as unknown as string[]).join(', '),
              fontWeight: '700',
            },
            h2: {
              fontFamily: (theme('fontFamily.serif') as unknown as string[]).join(', '),
              fontWeight: '700',
              marginTop: '2em',
              marginBottom: '1em',
            },
            h3: {
              fontFamily: (theme('fontFamily.serif') as unknown as string[]).join(', '),
              fontWeight: '600',
              marginTop: '1.8em',
              marginBottom: '0.8em',
            },
            h4: {
              fontFamily: (theme('fontFamily.serif') as unknown as string[]).join(', '),
              fontWeight: '600',
            },
            p: {
              fontFamily: (theme('fontFamily.sans') as unknown as string[]).join(', '),
              lineHeight: '1.85',
              marginBottom: '1.5em',
            },
            'p:first-of-type::first-letter': {
              fontSize: '4.5rem',
              fontFamily: (theme('fontFamily.serif') as unknown as string[]).join(', '),
              fontWeight: '700',
              color: theme('colors.primary.dark'),
              float: 'left',
              paddingRight: '0.5rem',
              paddingTop: '0.25rem',
              lineHeight: '0.8',
            },
            a: {
              fontWeight: '500',
              textDecoration: 'none',
              transition: 'color 0.3s',
              '&:hover': {
                color: theme('colors.secondary.DEFAULT'),
                textDecoration: 'underline',
              },
            },
            ul: {
              listStyleType: 'none',
              paddingLeft: '0',
            },
            'ul > li': {
              position: 'relative',
              paddingLeft: '1.75rem',
              marginBottom: '0.5rem',
            },
            'ul > li::before': {
              content: '"\\2022"',
              position: 'absolute',
              left: '0px',
              color: 'var(--tw-prose-bullets)',
              fontSize: '1.5rem',
              lineHeight: '1.75rem',
            },
            ol: {
              listStyleType: 'none',
              paddingLeft: '0',
            },
            'ol > li': {
              position: 'relative',
              paddingLeft: '1.75rem',
              marginBottom: '0.5rem',
            },
            'ol > li::before': {
              content: 'counter(list-item) "."',
              counterIncrement: 'list-item',
              position: 'absolute',
              left: '0px',
              fontFamily: (theme('fontFamily.serif') as unknown as string[]).join(', '),
              fontWeight: '700',
              color: 'var(--tw-prose-counters)',
            },
            blockquote: {
              fontStyle: 'italic',
              borderLeftWidth: '0.25rem',
              backgroundColor: theme('colors.neutral.50'),
              padding: '1.5rem',
              marginTop: '2rem',
              marginBottom: '2rem',
            },
            'blockquote p': {
              fontSize: '1.25rem',
              lineHeight: '1.75rem',
            },
            strong: {
              color: 'var(--tw-prose-bold)',
            },
            code: {
              backgroundColor: theme('colors.neutral.100'),
              padding: '0.2em 0.4em',
              borderRadius: '0.25em',
            },
            pre: {
              backgroundColor: theme('colors.neutral.800'),
            },
          },
        },
      }),
    },
  },
  plugins: [typography],
};
export default config;
