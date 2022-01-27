const chalk = require('chalk')
const semver = require('semver')
const { prompt } = require('enquirer')
const execa = require('execa')
const args = require('minimist')(process.argv.slice(2))
const currentVersion = require('../package.json').version

const preId = args.preid
  || (semver.prerelease(currentVersion) && semver.prerelease(currentVersion)[0])
const isDryRun = args.dry
const { skipTests, skipBuild } = args
const versionIncrements = [
  'patch',
  'minor',
  'major',
  ...(preId ? ['prepatch', 'preminor', 'premajor', 'prerelease'] : []),
]

const inc = (i) => semver.inc(currentVersion, i, preId)

const run = (bin, args, opts = {}) => execa(bin, args, { stdio: 'inherit', ...opts })

const dryRun = (bin, args, opts = {}) => console.log(chalk.blue(`[dryrun] ${bin} ${args.join(' ')}`), opts)

const runIfNotDry = isDryRun ? dryRun : run

const step = (msg) => console.log(chalk.cyan(msg))

async function main() {
  let targetVersion = args._[0]

  // 选择版本
  if (!targetVersion) {
    // no explicit version, offer suggestions
    const { release } = await prompt({
      type: 'select',
      name: 'release',
      message: 'Select release type',
      choices: versionIncrements.map((i) => `${i} (${inc(i)})`).concat(['custom']),
    })

    if (release === 'custom') {
      targetVersion = (
        await prompt({
          type: 'input',
          name: 'version',
          message: 'Input custom version',
          initial: currentVersion,
        })
      ).version
    } else {
      targetVersion = release.match(/\((.*)\)/)[1]
    }
  }

  if (!semver.valid(targetVersion)) {
    throw new Error(`invalid target version: ${targetVersion}`)
  }

  const { yes } = await prompt({
    type: 'confirm',
    name: 'yes',
    message: `Releasing v${targetVersion}. Confirm?`,
  })

  if (!yes) {
    return
  }

  // run tests before release
  //   step('\nRunning tests...')
  //   if (!skipTests && !isDryRun) {
  //     await run(bin('jest'), ['--clearCache'])
  //     await run('npm', ['test', '--', '--bail'])
  //   } else {
  //     console.log('(skipped)')
  //   }

  // @todo 暂时用不上
  // update all package versions and inter-dependencies
  //   step('\nUpdating cross dependencies...')
  //   updateVersions(targetVersion)

  // build all packages with types
  step('\nBuilding all packages...')
  if (!skipBuild && !isDryRun) {
    await run('npm', ['run', 'build', '--', '--release'])
    // test generated dts files
    // step('\nVerifying type declarations...')
    // await run('npm', ['run', 'test-dts-only'])
  } else {
    console.log('(skipped)')
  }

  // generate changelog
  step('\nGenerating changelog...')
  await run('npm', ['run', 'changelog'])

  const { stdout } = await run('git', ['diff'], { stdio: 'pipe' })
  if (stdout) {
    step('\nCommitting changes...')
    await runIfNotDry('git', ['add', '-A'])
    await runIfNotDry('git', ['commit', '-m', `release: v${targetVersion}`])
  } else {
    console.log('No changes to commit.')
  }

  // push to GitHub
  step('\nPushing to GitHub...')
  await runIfNotDry('git', ['tag', `v${targetVersion}`])
  await runIfNotDry('git', ['push', 'origin', `refs/tags/v${targetVersion}`])
  await runIfNotDry('git', ['push'])

  if (isDryRun) {
    console.log('\nDry run finished - run git diff to see package changes.')
  }
}

main().catch((err) => {
  console.error(err)
})
