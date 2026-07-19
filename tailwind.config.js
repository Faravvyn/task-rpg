/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: { 50:'#FFF9E6',100:'#FFF0BF',200:'#FFE699',300:'#FFDB6F',400:'#FFD040',500:'#D4A017',600:'#B8860B',700:'#8B6914',800:'#5E4B1E',900:'#3A2E12' },
        dark: { 50:'#2A2D35',100:'#23262E',200:'#1E2028',300:'#1A1C24',400:'#15171E',500:'#10121A',600:'#0C0E15',700:'#080A10',800:'#050608',900:'#020304' }
      },
      fontFamily: { title: ['Cinzel','serif'], body: ['Nunito','sans-serif'] },
      animation: {
        'xp-fill':'xpFill 1s ease-out forwards','pulse-gold':'pulseGold 2s infinite',
        'float':'float 3s ease-in-out infinite','slide-up':'slideUp 0.3s ease-out',
        'fade-in':'fadeIn 0.5s ease-out','bounce-in':'bounceIn 0.6s cubic-bezier(0.68,-0.55,0.265,1.55)',
        'glow':'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        xpFill:{'0%':{width:'0%'},'100%':{width:'var(--xp-percent)'}},
        pulseGold:{'0%,100%':{boxShadow:'0 0 5px rgba(212,160,23,0.3)'},'50%':{boxShadow:'0 0 20px rgba(212,160,23,0.6)'}},
        float:{'0%,100%':{transform:'translateY(0px)'},'50%':{transform:'translateY(-10px)'}},
        slideUp:{'0%':{transform:'translateY(20px)',opacity:'0'},'100%':{transform:'translateY(0)',opacity:'1'}},
        fadeIn:{'0%':{opacity:'0'},'100%':{opacity:'1'}},
        bounceIn:{'0%':{transform:'scale(0.3)',opacity:'0'},'50%':{transform:'scale(1.05)'},'70%':{transform:'scale(0.9)'},'100%':{transform:'scale(1)',opacity:'1'}},
        glow:{'0%':{textShadow:'0 0 5px rgba(212,160,23,0.5)'},'100%':{textShadow:'0 0 20px rgba(212,160,23,0.8),0 0 40px rgba(212,160,23,0.4)'}}
      }
    }
  },
  plugins: []
}
