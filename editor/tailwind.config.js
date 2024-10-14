import fireCMSConfig from "@firecms/ui/tailwind.config.js";

export default {
    presets: [fireCMSConfig],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "../../packages/**/src/**/*.{js,ts,jsx,tsx}",
        "../node_modules/firecms/src/**/*.{js,ts,jsx,tsx}",
        "../node_modules/@firecms/**/src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    "Sofia Sans",
                    "Roboto",
                    "Helvetica",
                    "Arial",
                    "sans-serif"
                ],
                headers: [
                    "Sofia Sans",
                    "Roboto",
                    "Helvetica",
                    "Arial",
                    "sans-serif"
                ],
                mono: [
                    "JetBrains Mono",
                    "Space Mono",
                    "Lucida Console",
                    "monospace"
                ],
                'roboto': ['Roboto', 'sans-serif'],
                'pt-sans': ['PT Sans', 'sans-serif'],
                'londrina': ['Londrina Shadow', 'sans-serif'],
                'vt323': ['VT323', 'monospace'],
                'fredoka': ['Fredoka One', 'cursive'],
                'rubik': ['Rubik', 'sans-serif'],
                'merriweather': ['Merriweather', 'serif'],
                'lobster': ['Lobster', 'cursive'],
                'quicksand': ['Quicksand', 'sans-serif'],
                'inconsolata': ['Inconsolata', 'monospace'],
                'oswald': ['Oswald', 'sans-serif'],
                'alegreya': ['Alegreya', 'serif'],
                'nunito-sans': ['Nunito Sans', 'sans-serif'],
                'concert-one': ['Concert One', 'cursive'],
                'pacifico': ['Pacifico', 'cursive'],
                'poppins': ['Poppins', 'sans-serif'],
                'libre-baskerville': ['Libre Baskerville', 'serif'],
                'source-serif-pro': ['Source Serif Pro', 'serif'],
            },
        }
    }
};
