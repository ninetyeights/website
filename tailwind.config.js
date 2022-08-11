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
                    primary: withOpacityValue('--600'),
                }
            },
            backgroundColor: {
                color: {
                    primary: withOpacityValue('--200'),
                    active: withOpacityValue('--300'),
                    'primary-reverse': withOpacityValue('--600'),
                }
            },
            accentColor: {
                primary: withOpacityValue('--700')
            },
            colors: {
                primary: withOpacityValue('--600'),
                second: withOpacityValue('--200'),
                '900': withOpacityValue('--900'),
                '800': withOpacityValue('--800'),
                '700': withOpacityValue('--700'),
                '600': withOpacityValue('--600'),
                '500': withOpacityValue('--500'),
                '400': withOpacityValue('--400'),
                '300': withOpacityValue('--300'),
                '200': withOpacityValue('--200'),
                '100': withOpacityValue('--100'),
                '50': withOpacityValue('--50'),
            }
        },
    },
    plugins: [
        // ...
        require('@tailwindcss/line-clamp'),
    ],
}
