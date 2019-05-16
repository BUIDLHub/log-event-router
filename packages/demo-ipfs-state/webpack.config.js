const config = {
    entry: ['./src/client.js'],
    output: {
      path: __dirname + '/build',
      filename: 'client.js'
    },
    module: {
      rules: [
        {
          loader:'babel-loader',
          test: /\.js$/,
          exclude:  /node_modules/,
          query: {
             presets: ['env']
          }
        }
      ]
    },
    resolve: {
      extensions: ['.js']
    },
    devServer:{
      port: 3000,
      contentBase: __dirname + '/build',
      inline: true
    }
}
module.exports = config;
