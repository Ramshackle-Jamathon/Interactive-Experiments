var PUBLIC = __dirname + "/public";

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
            { test: /\.(glsl|vs|fs)$/, loader: 'shader' },
            { test: /\.scss$/,  loaders: ["style", "css", "sass"] },
            { test: /\.css$/, loader: "style-loader!css-loader" },
            { test: /\.png$/, loader: "url-loader?limit=100000" },
            { test: /\.jpg$/, loader: "file-loader" }
        ]
    },
    glsl: {
        // chunks folder, chunkpath by default is "" 
        //chunkPath: __dirname+"/shaders/"
    }
};
