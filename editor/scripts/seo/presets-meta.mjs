// Editorial metadata for each built-in preset.
//
// The generator pairs this with the real config from src/components/presets.ts,
// so a preset page always shows the gradient it actually describes. Keep a
// description honest about what the config does — these pages exist to help
// someone pick a starting point, not to pad the sitemap.

export const PRESET_META = {
    "Neat": {
        tagline: "The signature six-colour blend",
        description:
            "The default Neat gradient, and the one most people recognise. Six colours — coral, teal, gold, violet, deep indigo and blush — folded together at a moderate wave speed so no single hue dominates for long. It is a good neutral starting point: bright enough for a landing page hero, busy enough to hide a logo lockup without fighting it.",
        useCase: "Hero sections, product launch pages, anything that needs colour without a theme.",
    },
    "Time": {
        tagline: "Desaturated editorial blues",
        description:
            "Steel blue, sand, orchid and ruby, pulled down with a negative saturation offset. The result reads closer to a printed page than a screen — muted, slightly dusty, and easy to lay type over. Use it when a full-saturation gradient would look like a crypto landing page.",
        useCase: "Editorial layouts, long-form pages, documentation headers.",
    },
    "Fluid": {
        tagline: "Flat, slow, frosted",
        description:
            "Wave amplitude is set to zero, so there is no 3D displacement at all — just colour drifting slowly across a flat plane, with a light grain pass on top. Sage, rust and slate keep it quiet. The closest thing in the set to frosted glass.",
        useCase: "Backgrounds behind dense UI, dashboards, anything where motion should not compete.",
    },
    "Flame": {
        tagline: "Fast, loud, maximum displacement",
        description:
            "Speed 4 against the maximum wave amplitude, with magenta, cyan, amber and violet. This is the most aggressive preset in the set and it does not sit quietly behind content. Turn the speed down to around 1.5 if you want the palette without the churn.",
        useCase: "Splash screens, event pages, video backdrops.",
    },
    "Funky": {
        tagline: "Slow motion, full amplitude",
        description:
            "The same maximum wave amplitude as Flame but at a quarter of the speed, which turns frantic into languid. The pop palette — watermelon, turquoise, gold, violet — stays legible because the shapes hold still long enough to read.",
        useCase: "Playful product pages, app onboarding, marketing sites with personality.",
    },
    "Alejandra": {
        tagline: "Earth tones, almost still",
        description:
            "Speed 0.15 — effectively a still image that changes if you leave the tab open. Bronze, khaki, clay and olive with a grain pass give it a canvas texture. Worth using when you want the depth of a gradient without any perceived animation cost.",
        useCase: "Portfolios, photography sites, anywhere motion would feel cheap.",
    },
    "Monterey": {
        tagline: "Deep violet aurora with heavy grain",
        description:
            "A flat plane at high brightness with deep indigo and violet, then a heavy grain pass over the top. The grain is doing most of the work here — it breaks up the colour banding you would otherwise get across a large dark area.",
        useCase: "Dark-theme hero sections, developer tool landing pages.",
    },
    "Virus": {
        tagline: "Acid palette on near-black",
        description:
            "Hot pink and cyan against a near-black base, with sulphur yellow cutting through. Grain is turned well up. Low amplitude keeps the shapes tight rather than sweeping, which suits the high-contrast palette.",
        useCase: "Music, gaming, nightlife, anything that wants to look slightly toxic.",
    },
    "Blob": {
        tagline: "Fast, high-contrast, white-flecked",
        description:
            "One of the fastest presets, mixing rust, cyan, gold and violet with a pure white in the palette. That white is what gives it the liquid-metal highlight as shapes pass over each other.",
        useCase: "Attention-grabbing headers, short-lived campaign pages.",
    },
    "Sands": {
        tagline: "Desert ochres at full saturation",
        description:
            "Ochre, teal, gold, taupe and olive at high saturation with a soft grain. Reads as warm and geological rather than digital. The teal keeps it from going entirely monochrome.",
        useCase: "Travel, food, hospitality, warm-toned brands.",
    },
    "Nighttime": {
        tagline: "Neon on plum",
        description:
            "Magenta, deep blue, cyan and violet over a muted plum, at moderate speed and amplitude. A conventional neon-night palette done without letting any one colour blow out.",
        useCase: "Events, nightlife, entertainment.",
    },
    "Prussian": {
        tagline: "Flat navy and coral",
        description:
            "A flat plane — no wave displacement — running navy, teal and pale blue against coral and crimson at high saturation. The absence of displacement makes it feel like a printed colour field rather than a 3D surface.",
        useCase: "Editorial covers, publications, poster-style layouts.",
    },
    "Clouds": {
        tagline: "Near-white, extreme grain",
        description:
            "Whites, creams and pale blues with the grain scale pushed far past every other preset. The colour differences are almost imperceptible; what you actually see is texture. The closest thing to paper in the set, and the only preset that works with dark body text out of the box.",
        useCase: "Light-theme sites, documentation, print-inspired layouts.",
    },
    "Lemon": {
        tagline: "Electric yellow against violet",
        description:
            "Essentially a two-colour gradient — electric yellow and deep violet, with pale mint as a hinge — at maximum wave amplitude. Very high contrast, and the least subtle palette here after Flame.",
        useCase: "Bold brand statements, product launches, high-energy pages.",
    },
    "Dark Mode": {
        tagline: "Near-black with a colour cast",
        description:
            "Blacks with navy and purple undertones and very low amplitude. From a distance it reads as a flat dark background; up close there is just enough movement and colour variance to stop it feeling like a dead `#000`.",
        useCase: "Dark UI shells, developer tools, dashboards, app backgrounds.",
    },
    "FireCMS": {
        tagline: "Maximum saturation brand colours",
        description:
            "The FireCMS palette — coral, amber, cyan and violet — with colour saturation at the top of its range. A useful reference for what the saturation control actually does when you push it all the way.",
        useCase: "Brand pages, SaaS marketing sites.",
    },
    "Stripe": {
        tagline: "The fintech gradient",
        description:
            "Red, sky blue, amber and violet at full wave amplitude — the sweeping multi-hue look that a generation of payment and infrastructure companies made standard. Slightly brightened so it stays clean behind white type.",
        useCase: "SaaS, fintech, B2B landing pages.",
    },
    "Pastel": {
        tagline: "Desaturated lilac and blush",
        description:
            "Lilac, pink and pale blue with saturation pulled well down and low amplitude. Quiet enough to sit behind a full page of content without needing an overlay.",
        useCase: "Wellness, beauty, lifestyle, soft-brand sites.",
    },
    "Cosmic Vortex": {
        tagline: "Magenta and cyan in deep space",
        description:
            "Magenta and cyan against deep indigo, brightened, at high speed and amplitude. The dark base colour appears twice in the palette, which is what keeps the bright hues reading as light sources rather than flat fills.",
        useCase: "Space, sci-fi, gaming, crypto.",
    },
    "Bloom": {
        tagline: "Electric blue and amber, flat",
        description:
            "Electric blue, amber and cyan on a flat plane at raised brightness. No displacement, so the colour transitions stay broad and smooth instead of folding into ridges.",
        useCase: "Clean product pages, app store screenshots, feature sections.",
    },
    "Night Dunes": {
        tagline: "Bronze on near-black",
        description:
            "Almost entirely dark — near-black navies with a single bronze in the mix — at high wave amplitude. The displacement is what makes it readable; on a flat plane this palette would be indistinguishable from black.",
        useCase: "Luxury brands, dark hero sections, premium product pages.",
    },
    "Bubble Gum": {
        tagline: "The Neat palette, sweetened",
        description:
            "The signature palette with the teal swapped for a bright sky blue, which shifts the whole thing from balanced to candy. Same speed and amplitude as Neat, so it is a drop-in alternative if the default reads too serious.",
        useCase: "Consumer apps, playful brands, youth-facing products.",
    },
    "Oceans Eleven": {
        tagline: "Fast blue water",
        description:
            "Blues, cyan, white and mint at high speed with low amplitude. The white in the palette behaves like foam where shapes overlap. Fast but not chaotic, because the displacement stays shallow.",
        useCase: "Travel, marine, sport, anything cool-toned and energetic.",
    },
    "Coral": {
        tagline: "Aqua, cream and blush",
        description:
            "Aqua, cream, periwinkle and blush at high saturation with gentle displacement. Light overall, and one of the few presets that stays legible with dark text on top without an overlay.",
        useCase: "Light-theme sites, beauty, hospitality.",
    },
    "Oil Slick": {
        tagline: "Iridescent, slow, subtle",
        description:
            "Silver, lilac, blush and yellow drifting slowly with a light grain — the petrol-on-water look. Low contrast by design; it is meant to be noticed second, after the content.",
        useCase: "Premium packaging-inspired sites, fashion, understated brand pages.",
    },
};
