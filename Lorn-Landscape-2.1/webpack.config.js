var PUBLIC = __dirname + "/public";

var ExtractTextPlugin = require("extract-text-webpack-plugin");
var bourbon = require('node-bourbon').includePaths;
module.exports = {
    entry: "./src/app.js",
    output: {
        path: PUBLIC,
        filename: "bundle.js"
    },
    devtool: "#inline-source-map",
    devServer: {
        contentBase: PUBLIC,
    },
    module: {
        loaders: [
            { test: /\.js$/, exclude: /(node_modules|bower_components|lib)/, loader: "babel-loader", query: { presets: ['es2015'] }  },
            { test: /\.(glsl|vs|fs)$/, loader: 'shader' },
            { test: /\.png$/, loader: "url-loader?limit=100000" },
            { test: /\.jpg$/, loader: "file-loader" },
            { test: /\.css$/, loader: ExtractTextPlugin.extract("style", "!css") },
            { test: /\.scss$/, loader: ExtractTextPlugin.extract("style", "css!sass?includePaths[]=" + bourbon) },
        ]
    },
    glsl: {
        // chunks folder, chunkpath by default is "" 
        //chunkPath: __dirname+"/shaders/"
    },
    plugins: [
        new ExtractTextPlugin("bundle.css", {
            allChunks: true
        })
    ]
};
