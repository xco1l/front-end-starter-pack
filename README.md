# Front-end starter-pack
[![Pug](http://www.picshare.ru/uploads/191018/m8zNVlSH8J.gif)](https://pugjs.org) [![Webpack](http://www.picshare.ru/uploads/191018/5FP60nEM2F.gif)](https://webpack.js.org/) [![Sass](http://www.picshare.ru/uploads/191018/N0ov4WIH30.gif)](https://sass-lang.com/) [![Sass](http://www.picshare.ru/uploads/191018/iGJ33pUBpv.gif)](https://gulpjs.com/) 
###### Based on [BEM](bem.info) methodology

## Inspired by [NTH-start-project](https://github.com/nicothin/NTH-start-project)

## Installation
```sh
$ git clone "https://github.com/Saniyook/front-end-starter-pack"
$ cd front-end-starter-pack
$ npm i
```

## How to use
| Dev | Prod |
|-----|------|
|```$ npm start```| ```$ npm run build ```|

`$ npm start` will start dev-server on localhost:8081 and `external-ip`:8081 and `gulp.watch`

`$ npm run build` will build your project to `dist/`

## How it works
1) Deleting all file from `dist/`
2) Writen `src/pug/mixins.pug` with imports of all `.pug` files of `src/blocks`
3) Compile `src/pages/*/**.pug` to `dist/*.html` with `gulp`
4) Copying `assets(such as img, fonst, static)` to `dist/`
5) Extracting all `classes` from `.htpp` files, it will show what blocks from `src/blocks` we used.
6) Writing `src/scss/style.scss` file with all needed imports from step 5.
7) Writing `src/js/entry.js` file with all needed imports from step 5.
8) Compiling `src/scss/style.scss` with `gulp`
9) Compiling `src/js/entry.js`with `webpack`
10) ...
11) Profit!