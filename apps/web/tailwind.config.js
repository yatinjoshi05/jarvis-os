/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        voltage: '#5A5670',
        'voltage-yellow': '#5A5670',
        'nebula-blue': '#00DFFF',
        'nebula-purple': '#8800FF',
        'nebula-magenta': '#FF00FF',
        'nebula-pink': '#FF0055',
        'nebula-red': '#FF5500',
        'nebula-orange': '#FF8800',
        'nebula-cyan': '#00FFCC',
        'nebula-neutral': '#5A5670',
      },
    },
  },
  plugins: [],
}
