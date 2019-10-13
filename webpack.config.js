module.exports = function (entry) {
  return {
    mode: 'production',
    entry,
    output: {
      filename: '[name].[chunkhash].js'
    },
    module: {
      rules: [{
        test: /\.(js)$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
      }]
    }
  }
}