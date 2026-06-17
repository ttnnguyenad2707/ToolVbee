function splitText(text, maxLength = 1000) {
    const chunks = [];
    const paragraphs = text
        .replace(/\r\n/g, "\n")
        .split(/\n+/)
        .map(p => p.trim())
        .filter(Boolean);

    let current = "";

    for (const paragraph of paragraphs) {

        if (paragraph.length > maxLength) {

            if (current) {
                chunks.push(current);
                current = "";
            }

            for (let i = 0; i < paragraph.length; i += maxLength) {
                chunks.push(
                    paragraph.slice(i, i + maxLength)
                );
            }

            continue;
        }

        const next = current
            ? `${current}\n${paragraph}`
            : paragraph;

        if (next.length <= maxLength) {
            current = next;
        }
        else {
            chunks.push(current);
            current = paragraph;
        }
    }

    if (current)
        chunks.push(current);

    return chunks;
}

module.exports = {
    splitText
};