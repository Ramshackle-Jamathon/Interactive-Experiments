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
            { test: /\.css$/, loader: "style!css" },
            { test: /\.scss$/, loader: "style!css!sass?outputStyle=expanded" }
        ]
    },
    glsl: {
        // chunks folder, chunkpath by default is "" 
        //chunkPath: __dirname+"/shaders/"
    }
};
