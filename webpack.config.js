//@ts-check

'use strict';

const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type {import('webpack').Configuration[]} */
const config = [
  // Extension Host
  {
    target: 'node',
    mode: 'none',
    entry: './src/extension.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'extension.js',
      libraryTarget: 'commonjs2'
    },
    externals: {
      vscode: 'commonjs vscode'
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader'
            }
          ]
        }
      ]
    },
    devtool: 'source-map'
  },
  // Post Content Webview
  {
    target: 'web',
    mode: 'none',
    entry: './src/webview/postContent.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'postContent.js'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.less']
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader'
            }
          ]
        },
        {
          test: /\.less$/,
          use: ['style-loader', 'css-loader', 'less-loader']
        }
      ]
    },
    devtool: 'source-map'
  }
];

module.exports = config;
