const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const config = require("./config.json");
const { splitText } = require("./textSplitter");
const text = fs.readFileSync(config.inputFile, "utf8");
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

async function replaceDraftEditorContent(page, selector, text) {
    await page.evaluate(
        ({ selector, text }) => {
            const editor = document.querySelector(selector);

            if (!editor) throw new Error("Không tìm thấy editor");

            editor.click();
            editor.focus();

            document.execCommand("selectAll");

            const emptyData = new DataTransfer();

            emptyData.setData("text/plain", "");

            editor.dispatchEvent(
                new ClipboardEvent("paste", {
                    clipboardData: emptyData,
                    bubbles: true,
                    cancelable: true,
                }),
            );

            const data = new DataTransfer();

            data.setData("text/plain", text);

            editor.dispatchEvent(
                new ClipboardEvent("paste", {
                    clipboardData: data,
                    bubbles: true,
                    cancelable: true,
                }),
            );
            const range = document.createRange();

            range.selectNodeContents(editor);

            const selection = window.getSelection();

            selection.removeAllRanges();

            selection.addRange(range);

            editor.focus();
        },
        {
            selector,
            text,
        },
    );
}

async function clickPreviewButton(page, selector) {
    await page.locator(selector).click();
}

async function waitForAudioSrcUpdated(page, oldSrc, timeout = 90000) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
        const src = await page.evaluate(() => {
            const audio = document.querySelector("audio");

            if (!audio) return "";

            return audio.currentSrc || audio.src;
        });

        if (src && src !== oldSrc && !src.includes("/audios/silence.mp3")) {
            return src;
        }

        await sleep(1000);
    }

    throw new Error("Timeout waiting audio");
}

async function saveAudio(page, src, filePath) {
    const bytes = await page.evaluate(async (src) => {
        const response = await fetch(src);

        const blob = await response.blob();

        const buffer = await blob.arrayBuffer();

        return Array.from(new Uint8Array(buffer));
    }, src);

    await fs.promises.writeFile(filePath, Buffer.from(bytes));
}

async function processChunk(page, text, index) {
    console.log(`Processing ${index + 1}`);

    await replaceDraftEditorContent(page, config.inputSelector, text);

    await sleep(1000);

    const oldSrc = await page.evaluate(() => {
        const audio = document.querySelector("audio");

        if (!audio) return "";

        return audio.currentSrc || audio.src;
    });

    await clickPreviewButton(page, config.buttonSelector);

    await sleep(config.delayMs);

    const newSrc = await waitForAudioSrcUpdated(page, oldSrc);

    console.log("Audio:", newSrc);

    await saveAudio(
        page,
        newSrc,
        path.join(
            config.downloadPath,
            `audio_${String(index + 1).padStart(3, "0")}.mp3`,
        ),
    );
}

async function main() {
    const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
    if (!fs.existsSync(config.downloadPath)) {
        fs.mkdirSync(config.downloadPath, {
            recursive: true,
        });
    }

    const context = browser.contexts()[0];

    const page = context.pages()[0];

    await page.goto("https://studio.vbee.vn/studio/text-to-speech");

    await sleep(2000);


    const closeIcon = page.locator(
        '.close-button svg[data-testid="CloseIcon"]',
    );

    if (await closeIcon.count()) {
        await closeIcon.click();
    }

    const restoreSessionBtn = page.locator(
        'button[data-id="not-reload-prev-session"]',
    );

    if (await restoreSessionBtn.count()) {
        await restoreSessionBtn.click();
    }

    const chunks = splitText(text, config.chunkSize);

    console.log("Total chunks:", chunks.length);

    for (let i = 0; i < chunks.length; i++) {
        while (true) {
            try {
                await processChunk(page, chunks[i], i);

                break;
            } catch (err) {
                console.log(`Chunk ${i + 1} lỗi:`, err.message);

                console.log("Reload page...");

                await page.reload();

                await page.waitForLoadState();

                await sleep(2000);

                const closeIcon = page.locator(
                    '.close-button svg[data-testid="CloseIcon"]',
                );

                if (await closeIcon.count()) {
                    await closeIcon.click();
                }

                const restoreSessionBtn = page.locator(
                    'button[data-id="not-reload-prev-session"]',
                );

                if (await restoreSessionBtn.count()) {
                    await restoreSessionBtn.click();
                }

                await sleep(3000);
            }
        }

        await sleep(config.delayBetweenChunks);
    }

    console.log("DONE");

    await browser.close();
}

main();
