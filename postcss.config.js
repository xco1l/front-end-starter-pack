/* eslint-disable */
module.exports = {
  syntax: 'postcss-scss',
  plugins: [
    require('postcss-easy-import')({
      extensions: '.scss'
    }),
    require('autoprefixer')({
      cascade: false
    }),
    require('@lipemat/css-mqpacker')({
      sort: true
    }),
    require('postcss-nested'),
    require('cssnano'),
  ]
}