const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  mode: 'production',
  optimization: {
    minimizer: [new UglifyJsPlugin()],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: [
          /node_modules/,
          /build/,
        ],
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
    alias: {
      'pako': 'pako/dist/pako_deflate.min.js',
      'zlib': path.join(__dirname, './src/lib/zlib')
    }
  },
  output: {
    filename: 'browser.js',
    library: 'PartialZip',
    path: path.resolve(__dirname, 'build'),
  },
  plugins: [
    new BundleAnalyzerPlugin(),
  ],
};