var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');


module.exports = {
  entry: {
    javascript: './httpdocs/assets/scripts/main.js',
    html: './httpdocs/',
  },
  entry: './httpdocs/assets/scripts/main.js',
  output: { path: __dirname, filename: './httpdocs/assets/scripts/built/bundle.js' },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loaders: ["react-hot", "babel-loader"],
      },
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react']
        }
      },
      {
        test: /\.scss$/,
        loaders: ["style", "css", "sass"]
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract('css!sass')
      }
    ]
  },
  sassLoader: {
    includePaths: [path.resolve(__dirname, "./node_modules/compass-mixins/lib")]
  },
  plugins: [
      new ExtractTextPlugin('./httpdocs/assets/styles/css/app.css', {
          allChunks: true
      })
  ]
};