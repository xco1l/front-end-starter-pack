'use strict'

const browserSync = require('browser-sync').create();
const cpy = require('cpy');
const csso = require('gulp-csso');
const del = require('del');
const fs = require('fs')
const getClassesFromHtml = require('get-classes-from-html')
const gulp = require('gulp')
const plumber = require('gulp-plumber')
const postcss = require('gulp-postcss')
const pug = require('gulp-pug')
const sass = require('gulp-sass')
const through2 = require('through2')
const webpackConfig = require('./webpack.config')
const webpackStream = require('webpack-stream')
const context = {}
context.config = require('./config')
context.htmlBlocks = []
const dir = context.config.paths

// Компиляция .pug файлов
function compilePug() {
  const pagesList = [
    `${dir.src}/pages/**/*.pug`
  ]
  return gulp.src(pagesList, {
      since: gulp.lastRun(compilePug)
    })
    .pipe(plumber({
      errorHandler: function (err) {
        console.log(err.message);
        this.emit('end');
      }
    }))
    .pipe(pug({
      pretty: true
    }))
    .pipe(through2.obj(addClassesToBlocksList))
    .pipe(gulp.dest(dir.dist));
}

exports.compilePug = compilePug

//Компиляция mixins.pug
function writePugMixinsFile(cb) {
  let msg = '// Файл создан автоматически смотри gulpfile.js (function writePugMixinsFile) \n\n'
  let allBlocksWithPugFiles = getDirectories('pug');
  allBlocksWithPugFiles.forEach(blockName => {
    msg += `include ${dir.blocks.replace(dir.src,'../')}${blockName}/${blockName}.pug\n`;
  });
  fs.writeFileSync(`${dir.src}pug/mixins.pug`, msg);
  cb();
}

exports.writePugMixinsFile = writePugMixinsFile;

//Генерация styles.scss
function writeStylesDotScss(cb) {
  let msg = '// Файл создан автоматичекси смотри gulpfile.js (function writeStylesDotScss)\n\n'
  if (context.config.alwaysImportStyles !== undefined) // Проверка на наличие свойства в массиве
    if (context.config.alwaysImportStyles.length) { // Проверка на наличие хотя бы 1 файла
      context.config.alwaysImportStyles.forEach(fileName => {

        msg += `@import "${dir.src}/scss/${fileName.split('.')[0]}.scss";\n`
      })
    }
  const allBlocksWithScssFiles = getDirectories('scss');

  allBlocksWithScssFiles.forEach(blockWithScssFile => {
    if (context.htmlBlocks.indexOf(blockWithScssFile) === -1) return
    msg += `@import '${dir.blocks}${blockWithScssFile}/${blockWithScssFile}.scss';\n`
  })

  fs.writeFileSync(`${dir.src}scss/style.scss`, msg);
  cb()
}

exports.writeSassImportsFile = writeStylesDotScss;

//Компиляция style.scss
function compileSass() {
  const sassFile = `${dir.src}scss/style.scss`
  return gulp.src(sassFile, {
      sourcemaps: true
    })
    .pipe(plumber({
      errorHandler: function (err) {
        console.log(err.message);
        this.emit('end');
      }
    }))
    .pipe(sass({
      includePaths: [__dirname + '/', 'node_modules']
    }))
    .pipe(postcss())
    .pipe(csso({
      restructure: false,
    }))
    .pipe(gulp.dest(`${dir.dist}/css`, {
      sourcemaps: '.'
    }))
    .pipe(browserSync.stream());
}

exports.compileSass = compileSass;

//Генерация entry.js
function writeEntryJs(cb) {
  const allBlocksWithJsFiles = getDirectories('js')
  let msg = '// Файл создан автоматически смотри gulpfile.js (function writeEntryJs) \n\n'

  if (context.config.alwaysImportjs)
    if (context.config.alwaysImportjs.length)
      context.config.alwaysImportjs.forEach(fileName => {
        msg += `import './${fileName.split('.')[0]}.js'`
      })
  allBlocksWithJsFiles.forEach(blockName => {
    if (context.htmlBlocks.indexOf(blockName) == -1) return
    msg += `import '../blocks/${blockName}/${blockName}.js'\n`
  })

  fs.writeFileSync(`${dir.src}js/entry.js`, msg);
  cb()
}

exports.writeEntryJs = writeEntryJs

// Компиляция entry.js
function buildJs() {
  const entry = {
    bundle: `./${dir.src}js/entry.js`
  }

  return gulp.src(`${dir.src}js/entry.js`)
    .pipe(plumber())
    .pipe(webpackStream(webpackConfig(entry)))
    .pipe(gulp.dest(`${dir.dist}js`))
}

exports.buildJs = buildJs

// Копирование шрифтов, картинок, статики
function copyAssets(cb) {

  let srcs = [{
      from: [`${dir.src}fonts`],
      to: `${dir.dist}fonts`
    },
    {
      from: [`${dir.src}img`],
      to: `${dir.dist}img`
    },
    {
      from: [`${dir.src}static`],
      to: `${dir.dist}`
    }
  ]
  srcs.forEach(src => {
    (async () => {
      await cpy(src.from, src.to)
      cb()
    })()
  })
}

exports.copyAssets = copyAssets

//Очистить папку, в которую собирается проект
function clearDistDir() {
  return del([
    `${dir.dist}**/*`,
    `!${dir.dist}readme.md`,
  ]);
}

exports.clearBuildDir = clearDistDir;

function serve() {
  browserSync.init({
    server: dir.dist,
    port: 8081,
    startPath: 'index.html',
    open: false,
    notify: false,
  })
}

function reload(done) {
  browserSync.reload();
  done();
}
// Страницы: изменение, добавление
gulp.watch([`${dir.src}pages/**/*.pug`], {
  events: ['change', 'add'],
  delay: 100
}, gulp.series(
  compilePug,
  gulp.parallel(writeStylesDotScss, writeEntryJs),
  gulp.parallel(compileSass, buildJs),
  reload
));

// Страницы: удаление
gulp.watch([`${dir.src}pages/**/*.pug`], {
    delay: 100
  })
  .on('unlink', function (path) {
    let filePathInBuildDir = path.replace(`${dir.src}pages/`, dir.dist).replace('.pug', '.html');
    fs.unlink(filePathInBuildDir, (err) => {
      if (err) throw err;
    });
  });

// Разметка Блоков: изменение
gulp.watch([`${dir.blocks}**/*.pug`], {
  events: ['change'],
  delay: 100
}, gulp.series(
  compilePug,
  reload
))

// Разметка Блоков: добавление / удаление
gulp.watch([`${dir.blocks}**/*.pug`], {
  events: ['add', 'unlink'],
  delay: 100
}, gulp.series(
  writePugMixinsFile,
  compilePug,
  reload
))

// Шаблоны pug: все события
gulp.watch([`${dir.src}pug/**/*.pug`, `!${dir.src}pug/mixins.pug`], {
  delay: 100
}, gulp.series(
  compilePug,
  gulp.parallel(writeStylesDotScss, writeEntryJs),
  gulp.parallel(compileSass, buildJs),
  reload,
));

// Стили Блоков: изменение
gulp.watch([`${dir.blocks}**/*.scss`], { events: ['change'], delay: 100 }, 
  compileSass
)

// Стили Блоков: добавление
gulp.watch([`${dir.blocks}**/*.scss`], { events: ['add'], delay: 100 }, gulp.series(
  writeStylesDotScss,
  compileSass
))

// Стилевые глобальные файлы: все события
gulp.watch([`${dir.src}scss/**/*.scss`, `!${dir.src}scss/style.scss`], { events: ['all'], delay: 100 },
  compileSass,
)

gulp.watch([`${dir.src}js/**/*.js`, `!${dir.src}js/entry.js`, `${dir.blocks}**/*.js`], { events: ['all'], delay: 100 }, gulp.series(
  writeEntryJs,
  buildJs,
  reload
));

// Картинки: все события
gulp.watch([`${dir.src}img/*.{jpg,jpeg,png,gif,svg,webp}`], { events: ['all'], delay: 100 }, gulp.series(copyAssets, reload));

// Шрифты: все события
gulp.watch([`${dir.src}fonts/*.{woff,woff2,ttf,eot,svg}`], { events: ['all'], delay: 100 }, gulp.series(copyAssets, reload));

// Статика: все события
gulp.watch([`${dir.src}static`], { events: ['all'], delay: 100 }, gulp.series(copyAssets, reload));

// Функции хэлперы

/**
 * Получение списка классов из HTML и запись его в глоб. переменную context.htmlBlocks.
 * @param  {object}   file Обрабатываемый файл
 * @param  {string}   enc  Кодировка
 * @param  {Function} cb   Коллбэк
 */
function addClassesToBlocksList(file, enc, cb) {
  const fileContent = file.contents.toString() // HTML файл
  let classesFromHtml = getClassesFromHtml(fileContent) //Получили все классы из файла в виде массива
  for (let _class of classesFromHtml) {
    // Не Блок или этот Блок уже присутствует?
    if (_class.indexOf('__') !== -1 || _class.indexOf('--') !== -1 || context.htmlBlocks.indexOf(_class) !== -1)
      continue
    context.htmlBlocks.push(_class) // Добавили блок
  }
  file.contents = new Buffer.from(fileContent);
  this.push(file);
  cb()
}

/**
 * Получение всех названий поддиректорий, содержащих файл указанного расширения, совпадающий по имени с поддиректорией
 * @param  {string} ext    Расширение файлов, которое проверяется
 * @return {array}         Массив из имён блоков
 */
function getDirectories(ext) {
  let source = dir.blocks;
  let res = fs.readdirSync(source)
    .filter(item => fs.lstatSync(source + item).isDirectory())
    .filter(item => fileExist(source + item + '/' + item + '.' + ext));
  return res;
}

/**
 * Проверка существования файла или папки
 * @param  {string} path      Путь до файла или папки
 * @return {boolean}
 */
function fileExist(filepath) {
  let flag = true;
  try {
    fs.accessSync(filepath, fs.F_OK);
  } catch (e) {
    flag = false;
  }
  return flag;
}

exports.build = gulp.series(
  gulp.parallel(clearDistDir, writePugMixinsFile),
  gulp.parallel(compilePug, copyAssets),
  gulp.parallel(writeStylesDotScss, writeEntryJs),
  gulp.parallel(compileSass, buildJs),
)

exports.default = gulp.series(
  gulp.parallel(clearDistDir, writePugMixinsFile),
  gulp.parallel(compilePug, copyAssets),
  gulp.parallel(writeStylesDotScss, writeEntryJs),
  gulp.parallel(compileSass, buildJs),
  serve,
)