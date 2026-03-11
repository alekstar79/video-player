const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const FileManagerPlugin = require('filemanager-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const path = require('path')

const { HOST, PORT } = process.env

const root = path.resolve(__dirname)
const host = String(HOST || '127.0.0.1')
const port = Number(PORT || 8081)

function filename({ contentHashType, chunk: { contentHash } })
{
  return `css/style.${contentHash[contentHashType].slice(0, 8)}.css`
}

module.exports = ({ /* WEBPACK_BUNDLE, WEBPACK_SERVE */ }, { mode }) => {
  mode = (mode || 'development').trim().toLowerCase()

  const DEV = 'development'

  return {
    mode,

    ...(mode === 'development' && { devtool: 'eval-source-map' }),

    entry: {
      main: './src/app.js'
    },
    output: {
      path: path.resolve(root, 'dist'),
      filename: 'js/[name].[contenthash:8].js',
      assetModuleFilename: path.join('img', '[name].[contenthash:8][ext]')
    },
    resolve: {
      extensions: ['.pug', '.scss', '.js']
    },
    module: {
      rules: [
        {
          test: /\.js$/i,
          exclude: /node_modules/,
          use: 'babel-loader'
        },
        {
          test: /\.(sa|sc|c)ss$/i,
          use: [
            DEV ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'sass-loader'
          ]
        },
        {
          test: /\.(jpe?g|png|gif|svg|ico)$/i,
          type: 'asset/resource',
          generator: {
            filename: path.join('img', '[name].[contenthash:8][ext]')
          }
        },
        {
          test: /\.(woff2?|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: path.join('fonts', '[name].[contenthash:8][ext]')
          }
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(root, 'src', 'index.html'),
        filename: 'index.html',
      }),

      new MiniCssExtractPlugin({
        filename
      }),

      new FileManagerPlugin({
        events: {
          onStart: {
            delete: [path.resolve(root, 'dist')]
          },
          onEnd: {
            copy: [
              {
                source: path.resolve(root, 'src/favicon.png'),
                destination: path.resolve(root, 'dist/favicon.png')
              },
              {
                source: path.resolve(root, 'src/video.mp4'),
                destination: path.resolve(root, 'dist/video.mp4')
              }
            ]
          }
        }
      })
    ],
    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    },
    devServer: {
      liveReload: true,
      hot: true,

      host,
      port,

      static: {
        directory: path.resolve(root, 'dist'),
        publicPath: '/'
      },
      watchFiles: [
        path.resolve(root, 'src')
      ],
      open: {
        target: [`http://${host}:${port}`],
        app: {
          name: 'firefox',
          arguments: []
        }
      }
    }
  }
}
