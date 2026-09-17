export default {
	darkMode: ["class"],
	content: [
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: '1rem',
				sm: '1.5rem',
				lg: '2.5rem',
				xl: '3.5rem',
				'2xl': '4rem',
			},
			screens: {
				sm: '640px',
				md: '768px',
				lg: '1024px',
				xl: '1280px',
				'2xl': '1920px',
			}
		},
		extend: {
			fontFamily: {
				sans: ['Geist Variable', 'system-ui', 'sans-serif'],
				display: ['Geist Variable', 'system-ui', 'sans-serif'],
				mono: ['Geist Mono Variable', 'ui-monospace', 'SFMono-Regular', 'monospace'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				confirmed: {
					DEFAULT: 'hsl(var(--confirmed))',
					foreground: 'hsl(var(--confirmed-foreground))'
				},
				pending: {
					DEFAULT: 'hsl(var(--pending))',
					foreground: 'hsl(var(--pending-foreground))'
				},
				hold: {
					DEFAULT: 'hsl(var(--hold))',
					foreground: 'hsl(var(--hold-foreground))'
				},
				stale: {
					DEFAULT: 'hsl(var(--stale))',
					foreground: 'hsl(var(--stale-foreground))'
				},
				surface: {
					DEFAULT: 'hsl(var(--surface))',
					hover: 'hsl(var(--surface-hover))'
				},
				canvas: 'hsl(var(--canvas))',
				chrome: {
					DEFAULT: 'hsl(var(--chrome))',
					foreground: 'hsl(var(--chrome-foreground))'
				}
			},
			/* Radius ladder (decision §9.1). `rounded-lg` and `rounded-xl` both map to
			   the card radius so legacy call sites collapse onto the ladder without a
			   rewrite; `rounded-sm`/`rounded-md` are the input radius; `rounded-2xl`
			   is for sheets. */
			borderRadius: {
				DEFAULT: 'var(--radius-sm)',
				sm: 'var(--radius-sm)',
				md: 'var(--radius-sm)',
				lg: 'var(--radius-md)',
				xl: 'var(--radius-md)',
				'2xl': 'var(--radius-lg)',
				chrome: 'var(--radius-chrome)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'fade-up': {
					'0%': { opacity: '0', transform: 'translateY(24px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'slide-in-right': {
					'0%': { opacity: '0', transform: 'translateX(20px)' },
					'100%': { opacity: '1', transform: 'translateX(0)' }
				},
				/* Magic UI */
				'shining': {
					'0%': { 'background-position': '0 0' },
					'100%': { 'background-position': '-200% 0' },
				},
				'shimmer-spin': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' },
				},
				'border-beam': {
					'100%': { 'offset-distance': '100%' },
				},
				'marquee': {
					from: { transform: 'translateX(0)' },
					to: { transform: 'translateX(calc(-100% - var(--gap)))' },
				},
				'marquee-vertical': {
					from: { transform: 'translateY(0)' },
					to: { transform: 'translateY(calc(-100% - var(--gap)))' },
				},
				'gradient-move': {
					'0%, 100%': { backgroundPosition: '0% 50%' },
					'50%': { backgroundPosition: '100% 50%' },
				},
				'ripple': {
					'0%, 100%': { transform: 'translate(-50%, -50%) scale(1)' },
					'50%': { transform: 'translate(-50%, -50%) scale(0.9)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 6s ease-in-out infinite',
				'fade-up': 'fade-up 0.5s ease-out forwards',
				'fade-in': 'fade-in 0.3s ease-out forwards',
				'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
				/* Magic UI */
				'shining': 'shining 8s linear infinite',
				'shimmer-spin': 'shimmer-spin 2.5s linear infinite',
				'border-beam': 'border-beam calc(var(--duration)*1s) infinite linear',
				'marquee': 'marquee var(--duration) infinite linear',
				'marquee-vertical': 'marquee-vertical var(--duration) linear infinite',
				'gradient-move': 'gradient-move 4s ease infinite',
				'ripple': 'ripple 3.5s ease infinite',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}
