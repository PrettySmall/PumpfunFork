module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // './node_modules/flowbite-react/lib/esm/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#02fafa',
        secondary: '#03c403',
        third: '#0dc0c034'
      },
      
      screens: {

        'xs': '400px', // Custom breakpoint at 400px

        'sm': '640px',
        // => @media (min-width: 640px) { ... }
  
        'md': '768px',
        // => @media (min-width: 768px) { ... }
  
        'lg': '1024px',
        // => @media (min-width: 1024px) { ... }

        '2lg': '1160px',
        // => @media (min-width: 1160px) { ... }

        'xl': '1280px',
        // => @media (min-width: 1280px) { ... }
  
        '2xl': '1536px',
        // => @media (min-width: 1536px) { ... }
  
        '3xl': '1740px',
        // => @media (min-width: 1536px) { ... }
      },

      animation: {
        shake: 'shake 0.7s ease-in-out'
      },
      keyframes: {
        shake: {
          '0%': {
            transform: 'translateX(0)',
          },
          '10%': {
            transform: 'translateX(-25px)',
          },
          '20%': {
            transform: 'translateX(25px)',
          },
          '30%': {
            transform: 'translateX(-25px)',
          },
          '40%': {
            transform: 'translateX(25px)',
          },
          '50%': {
            transform: 'translateX(-25px)',
          },
          '60%': {
            transform: 'translateX(25px)',
          },
          '70%': {
            transform: 'translateX(-25px)',
          },
          '80%': {
            transform: 'translateX(25px)',
          },
          '90%': {
            transform: 'translateX(-25px)',
          },
          '100%': {
            transform: 'translateX(0)',
          },
        }
      }
    },
  },
  plugins: [
    // require('flowbite/plugin')
  ],
};
