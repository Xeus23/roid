const {Command, flags} = require('@oclif/command')
const inquirer = require('inquirer')
const glob = require("glob")
const fs = require('fs')
const _ = require('underscore')

class InstallCommand extends Command {
  static args = [
    {name: 'module'},
  ]

  async run() {
    const {args} = this.parse(InstallCommand)
    let module = args.library
    if (!module) {
      let modules = glob.sync("**/build.gradle").map((file) => {
        console.log(`file: ${file}`)
        let fileArr = file.split("/")
        console.log(`split ${fileArr}`)
        let moduleString = null
        fileArr.splice(-1, 1)
        if (fileArr.length > 0) {
          console.log(`spliced ${fileArr}`)
          moduleString = fileArr.join("")
        }
        return moduleString
      }).filter((element) => {return element != null})

      if (modules.length === 1) {
        module = modules[0]
      } else {
        let modulesResponse = await inquirer.prompt([{
          name: 'module',
          message: 'select the module you\'d like to install to',
          type: 'list',
          choices: modules.map((module) => {return {name: module}}),
        }])
        module = modulesResponse.module
      }

      let responses = await inquirer.prompt([{
        name: 'library',
        message: 'select the library you\'d like to install',
        type: 'list',
        choices: [
          {name: 'viewmodel'},
          {name: 'livedata'},
          {name: 'retrofit'},
          {name: 'rxjava'},
          {name: 'room'},
          {name: 'picasso'},
          {name: 'mockk'},
          {name: 'robolectric'}
        ],
      }])
      let library = responses.library
      editBuildGradle(module, (buildGradle) => {
        switch(library) {
          case 'viewmodel':
            installViewModels(buildGradle)
            break;
          case 'livedata':
            installLiveData(buildGradle)
            break;
          case 'retrofit':
            installRetrofit(buildGradle)
            break;
          case 'rxjava':
            installRxJava(buildGradle)
            break;
          case 'room':
            installRoom(buildGradle)
            break;
          case 'picasso':
            installPicasso(buildGradle)
            break;
          case 'mockk':
            installMockk(buildGradle)
            break;
          case 'robolectric':
            installRobolectric(buildGradle)
            break;
        }
        return buildGradle
      })
    }
  }
}

function editBuildGradle(module, installFunc) {
  let files = glob.sync("**/build.gradle")

  // files is an array of filenames.
  // If the `nonull` option is set, and nothing
  // was found, then files is ["**/*.js"]
  // er is an error object or null.
  let buildGradlePath
  if (module === "base") {
    buildGradlePath = files.filter((file) => {return 'build.gradle' === file})
  } else {
    buildGradlePath = files.filter((file) => {return file.includes(module)})
  }

  console.log(`Gradle path: ${buildGradlePath}`)

  let buildGradle = fs.readFileSync("./" + buildGradlePath, 'utf8').split(/\r?\n/);
  let newBuildGradle = installFunc(buildGradle).join("\n")
  fs.writeFile("./" + buildGradlePath, newBuildGradle, function (err) {
    if (err) return console.log(err);
    console.log("Build gradle updated.")
  });
}

function installKaptPlugin(buildGradle) {
  installPlugin(buildGradle, "kotlin-kapt")
}

function installKtxPlugin(buildGradle) {
  installPlugin(buildGradle, "kotlin-android-extensions")
}

function installRobolectric(buildGradle) {
  installDependency(buildGradle, "org.robolectric:robolectric:4.3")
}

function installMockk(buildGradle) {
  installDependency(buildGradle, "io.mockk:mockk:1.9.3")
}

function installPicasso(buildGradle) {
  installDependency(buildGradle, "com.squareup.picasso:picasso:2.71828")
}

function installRoom(buildGradle) {
  installKaptPlugin(buildGradle)
  installDependency(buildGradle, "androidx.room:room-testing:2.2.4", "testImplementation")
  installDependency(buildGradle, "androidx.room:room-compiler:2.2.4", "kapt")
  installDependency(buildGradle, "androidx.room:room-runtime:2.2.4")
  installDependency(buildGradle, "androidx.room:room-rxjava2:2.2.4")
}

function installKtxCore(buildGradle) {
  installDependency(buildGradle, "androidx.arch.core:core-testing:2.1.0", "testImplementation")
  installDependency(buildGradle, "androidx.core:core-ktx:1.2.0")
  installDependency(buildGradle, "androidx.test:core-ktx:1.2.0")
  installDependency(buildGradle, "androidx.test.ext:junit-ktx:1.1.1")
  installDependency(buildGradle, "androidx.fragment:fragment-ktx:1.2.2")
  installDependency(buildGradle, "androidx.activity:activity-ktx:1.1.0")
}

function installViewModels(buildGradle) {
  installKtxPlugin(buildGradle)
  installKtxCore(buildGradle)
  installDependency(buildGradle, "androidx.lifecycle:lifecycle-viewmodel-ktx:2.2.0")
}

function installLiveData(buildGradle) {
  installKtxPlugin(buildGradle)
  installKtxCore(buildGradle)
  installDependency(buildGradle, "androidx.lifecycle:lifecycle-livedata-ktx:2.2.0")
}

function installRetrofit(buildGradle) {
  installDependency(buildGradle, "com.squareup.retrofit2:retrofit:2.7.1")
  installDependency(buildGradle, "com.google.code.gson:gson:2.8.6")
  installDependency(buildGradle, "com.squareup.retrofit2:converter-gson:2.7.1")
  installDependency(buildGradle, "com.squareup.retrofit2:adapter-rxjava2:2.7.1")
}

function installRxJava(buildGradle) {
  installDependency(buildGradle, "io.reactivex.rxjava2:rxandroid:2.1.1")
  installDependency(buildGradle, "io.reactivex.rxjava2:rxjava:2.2.17")
}

function installPlugin(buildGradle, plugin) {
  let pluginLine = `apply plugin: '${plugin}'`
  let existingIndex = _.findIndex(buildGradle, (line) => line.includes(pluginLine))
  if (existingIndex === -1) {
    let endOfPlugins = _.findLastIndex(buildGradle, (line) => line.includes("apply plugin:"))
    buildGradle.splice(endOfPlugins + 1, 0, pluginLine)
  }
}

function installDependency(buildGradle, dependency, type = "implementation") {
  let depArr = dependency.split(":")
  depArr.splice(-1, 1)
  let withoutVersion = depArr.join(":")
  console.log("Installing: " + dependency)
  let dependencyString = `\t${type} '${dependency}'`
  let existingIndex = _.findIndex(buildGradle, (line) => line.includes(withoutVersion))
  if (existingIndex === -1) {
    let dependenciesIndex = findDependenciesIndex(buildGradle)
    buildGradle.splice(dependenciesIndex + 1, 0, dependencyString)
  } else {
    buildGradle.splice(existingIndex, 1, dependencyString)
  }
}

function findDependenciesIndex(buildGradle) {
  return _.findIndex(buildGradle, (line) => line.includes("dependencies {"))
}

InstallCommand.description = `Include gradle dependencies to common android libraries
...
Extra documentation goes here
`

InstallCommand.flags = {
  name: flags.string({char: 'n', description: 'name to print'}),
}

module.exports = InstallCommand
