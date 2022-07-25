// package.json과 readme를 생성하기 위한 기능


/**
 * 인덱스0에는 node가 오며,
 * 인덱스1에는 현재 파일 명이 나온다.
 * 인덱스2에는 명령행 옵션 인수가 온다.
 * 
 * node bootstrap.js 
 */
const args = require('minimist')(process.argv.slice(2))

// 파일 시스템 관련 모듈
const fs = require('fs')

// 디렉토리 패스 관련 모듈
const path = require('path')

// package json 에 선언된 버전 속성을 가져온다.
const version = require('../package.json').version

// packages 폴더의 경로를 가져온다
const packagesDir = path.resolve(__dirname, '../packages')

// packages 폴더의 파일들을 배열로 가져온다
const files = fs.readdirSync(packagesDir)

// files 배열을 순회한다
files.forEach(shortName => {
  // 유효하지 않은 경우의 처리
  if (!fs.statSync(path.join(packagesDir, shortName)).isDirectory()) {
    return
  }

  const name = shortName === `vue` ? shortName : `@vue/${shortName}`

  // 패키지 json 의 경로를 가져옴
  const pkgPath = path.join(packagesDir, shortName, `package.json`)
  const pkgExists = fs.existsSync(pkgPath)

  // 패키지 가져옴
  if (pkgExists) {
    const pkg = require(pkgPath)
    if (pkg.private) {
      return
    }
  }

  if (args.force || !pkgExists) {
    const json = {
      name,
      version,
      description: name,
      main: 'index.js',
      module: `dist/${shortName}.esm-bundler.js`,
      files: [`index.js`, `dist`],
      types: `dist/${shortName}.d.ts`,
      repository: {
        type: 'git',
        url: 'git+https://github.com/vuejs/vue.git'
      },
      keywords: ['vue'],
      author: 'Evan You',
      license: 'MIT',
      bugs: {
        url: 'https://github.com/vuejs/vue/issues'
      },
      homepage: `https://github.com/vuejs/vue/tree/dev/packages/${shortName}#readme`
    }
    fs.writeFileSync(pkgPath, JSON.stringify(json, null, 2))
  }

  const readmePath = path.join(packagesDir, shortName, `README.md`)
  if (args.force || !fs.existsSync(readmePath)) {
    fs.writeFileSync(readmePath, `# ${name}`)
  }

  const apiExtractorConfigPath = path.join(
    packagesDir,
    shortName,
    `api-extractor.json`
  )
  if (args.force || !fs.existsSync(apiExtractorConfigPath)) {
    fs.writeFileSync(
      apiExtractorConfigPath,
      `
{
  "extends": "../../api-extractor.json",
  "mainEntryPointFilePath": "./dist/packages/<unscopedPackageName>/src/index.d.ts",
  "dtsRollup": {
    "publicTrimmedFilePath": "./dist/<unscopedPackageName>.d.ts"
  }
}
`.trim()
    )
  }

  const srcDir = path.join(packagesDir, shortName, `src`)
  const indexPath = path.join(packagesDir, shortName, `src/index.ts`)
  if (args.force || !fs.existsSync(indexPath)) {
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir)
    }
    fs.writeFileSync(indexPath, ``)
  }

  const nodeIndexPath = path.join(packagesDir, shortName, 'index.js')
  if (args.force || !fs.existsSync(nodeIndexPath)) {
    fs.writeFileSync(
      nodeIndexPath,
      `
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/${shortName}.cjs.prod.js')
} else {
  module.exports = require('./dist/${shortName}.cjs.js')
}
    `.trim() + '\n'
    )
  }
})
