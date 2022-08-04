function withOpacityValue(variable) {
    return ({opacityValue}) => {
        if (opacityValue === undefined) {
            return `rgb(var(${variable}))`
        }
        return `rgb(var(${variable}) / ${opacityValue})`
    }
}

module.exports = {
    // mode: 'jit',
    content: [
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        minWidth: {
            12: '3rem',
            28: '5rem'
        },
        container: {
            screens: {
                'sm': '640px',
                'md': '768px',
                'lg': '1024px',
                'xl': '1280px',
            }
        },
        extend: {
            maxWidth: {
                28: '7rem'
            },
            height: {
                '60': '60vh'
            },
            textColor: {
                color: {
                    primary: withOpacityValue('--text-primary'),
                }
            },
            backgroundColor: {
                color: {
                    primary: withOpacityValue('--bg-primary'),
                    active: withOpacityValue('--300'),
                    'primary-reverse': withOpacityValue('--text-primary'),
                }
            },
            accentColor: {
                primary: withOpacityValue('--accent-primary')
            },
            colors: {
                primary: withOpacityValue('--text-primary'),
                second: withOpacityValue('--bg-primary'),
                '900': withOpacityValue('--900'),
                '800': withOpacityValue('--800'),
                '700': withOpacityValue('--accent-primary'),
                '600': withOpacityValue('--text-primary'),
                '500': withOpacityValue('--500'),
                '400': withOpacityValue('--400'),
                '300': withOpacityValue('--300'),
                '200': withOpacityValue('--bg-primary'),
            }
        },
    },
    plugins: [
        // ...
        require('@tailwindcss/line-clamp'),
    ],
}
