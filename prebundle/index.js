const fs = require('fs');
const browserify = require('browserify');

browserify('../index.browser.js')
    // .transform('unassertify', { global: true })
    // .transform('envify', { global: true })
    .transform('uglifyify', { global: true })
    // .plugin('common-shakeify')
    .plugin('browser-pack-flat/plugin')
    .bundle()
    .pipe(require('minify-stream')({ sourceMap: false }))
    .pipe(fs.createWriteStream('../browser.js'))