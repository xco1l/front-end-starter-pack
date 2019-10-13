module.exports = {
    paths: {
        src: 'src/',
        dist: 'dist/',
        blocks: 'src/blocks/'
    },
    alwaysImportStyles: [ // [ [name].scss || [name] ]
        'vars.scss',
        'fonts.scss'
    ],
    alwaysImportjs: [
        'add' // [ [name].js || [name] ]
    ],
}