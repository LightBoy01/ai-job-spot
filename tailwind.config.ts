import type { Config } from 'tailwindcss'

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
          DEFAULT: '#C8A25C', // Muted Gold
          light: '#D4B87E',
          dark: '#A17B45',
        },
        accent: {
          DEFAULT: '#4A6B5B', // Deep Muted Green
          light: '#6B8C7C',
          dark: '#3A5A4B',
        },
        neutral: {
          ivory: '#FFFAF0',
          50: '#FDFDFD',
          100: '#F5F5F5',
          200: '#E0E0E0',
          300: '#C0C0C0',
          400: '#A0A0A0',
          500: '#808080',
          600: '#606060',
          700: '#404040',
          800: '#282828',
          900: '#1A1A1A',
        },
      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      typography: ({ theme }: { theme: any }) => ({
        DEFAULT: {
          css: {
            color: theme('colors.neutral.800'),
            h1: {
              color: theme('colors.primary.dark'),
              fontFamily: theme('fontFamily.serif').join(', '),
              fontWeight: '700',
            },
            h2: {
              color: theme('colors.primary.dark'),
              fontFamily: theme('fontFamily.serif').join(', '),
              fontWeight: '600',
            },
            h3: {
              color: theme('colors.primary.dark'),
              fontFamily: theme('fontFamily.serif').join(', '),
              fontWeight: '600',
            },
            h4: {
              color: theme('colors.primary.dark'),
              fontFamily: theme('fontFamily.serif').join(', '),
              fontWeight: '600',
            },
            a: {
              color: theme('colors.secondary.dark'),
              fontWeight: '500',
              textDecoration: 'none',
              '&:hover': {
                color: theme('colors.secondary.DEFAULT'),
                textDecoration: 'underline',
              },
            },
            p: {
              fontFamily: theme('fontFamily.sans').join(', '),
              lineHeight: '1.75',
              marginBottom: '1em',
            },
            ul: {
              listStyleType: 'disc',
              paddingLeft: '1.5em',
              li: {
                marginBottom: '0.5em',
              },
            },
            ol: {
              listStyleType: 'decimal',
              paddingLeft: '1.5em',
              li: {
                marginBottom: '0.5em',
              },
            },
            strong: {
              color: theme('colors.neutral.900'),
            },
            blockquote: {
              borderLeftColor: theme('colors.secondary.DEFAULT'),
              color: theme('colors.neutral.600'),
              fontStyle: 'italic',
            },
            code: {
              backgroundColor: theme('colors.neutral.100'),
              color: theme('colors.accent.dark'),
              padding: '0.2em 0.4em',
              borderRadius: '0.25em',
            },
            pre: {
              backgroundColor: theme('colors.neutral.800'),
              color: theme('colors.neutral.100'),
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
export default config