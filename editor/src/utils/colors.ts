export function isDarkColor(color: string) {
    const c = color.substring(1);      // strip #
    const rgb = parseInt(c, 16);   // convert rrggbb to decimal
    const r = (rgb >> 16) & 0xff;  // extract red
    const g = (rgb >> 8) & 0xff;  // extract green
    const b = (rgb >> 0) & 0xff;  // extract blue

    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

    return luma < 128;
}

export function getComplementaryColor(color: string) {
    const c = color.substring(1); // strip #
    const rgb = parseInt(c, 16); // convert rrggbb to decimal
    const r = (rgb >> 16) & 0xff; // extract red
    const g = (rgb >> 8) & 0xff;  // extract green
    const b = (rgb >> 0) & 0xff;  // extract blue

    // Calculate the complementary color
    const compR = 255 - r;
    const compG = 255 - g;
    const compB = 255 - b;

    // Convert back to hex and return
    const compColor = ((1 << 24) + (compR << 16) + (compG << 8) + compB).toString(16).slice(1);
    return `#${compColor}`;
}
