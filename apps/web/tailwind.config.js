/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary:         { DEFAULT: '#2E7D32', light: '#4CAF50' },
                accent:          { DEFAULT: '#F57F17', light: '#FFB300' },
                surface:         { DEFAULT: '#FAFAF5', dark: '#1A2E1A' },
                'text-base':     '#1B2B1B',
                'text-muted':    '#5A6E5A',
            },
        },
    },
    plugins: [],
}
