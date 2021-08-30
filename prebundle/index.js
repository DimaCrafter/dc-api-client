const fs = require('fs');
const browserify = require('browserify');

browserify('../index.browser.js')
    .transform('uglifyify', { global: true })
    .plugin('browser-pack-flat/plugin')
    .bundle()
    .pipe(require('minify-stream')({ sourceMap: false }))
    .pipe(fs.createWriteStream('../browser.js'))