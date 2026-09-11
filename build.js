const esbuild = require('esbuild');

async function build() {
    try {
        console.log('Building Phaser bundle...');
        const start = Date.now();
        await esbuild.build({
            entryPoints: ['src/main.ts'],
            bundle: true,
            minify: true,
            sourcemap: false,
            target: 'es2020',
            outfile: 'public/dist/game.bundle.js'
        });
        console.log(`Build complete in ${Date.now() - start}ms`);
    } catch (err) {
        console.error('Build failed:', err);
        process.exit(1);
    }
}

build();
