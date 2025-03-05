URSYS MIN (`ursys-min`) is a minimal version of [URSYS](https://github.com/dsriseah/ursys), a javascript framework for developing learning sciences web applications. It mirrors the file structure of its parent to make it easy to copy selected modules.

This package is designed to interoperate with legacy apps that do not support ESM or Typescript. The `@build-ursys-min.sh` shell script basically runs `esbuild` to transpile CJS and ESM versions of browser and server modules. The parent URSYS framework's extra services (e.g. addons, SNA, dev servers) are not included, but can be copy-pasted 

## Tested Requirements

- MacOS with XCode Command Line Tools installed
- Linux Ubuntu
- NodeJS version 18 and above

## Installation

#### 1. Clone the Repo to Legacy Project
```
cd <root_directory_of_legacy_>
git clone https://github.com/dsriseah/ursys-min.git _mur
```

#### 2. Configure Legacy Project

If you are using `ursys-min` as-is:

1. Copy the `_install/@build-ursys-min.sh` shell script to project root
2. To your build scripts, add the call to `@build-ursys-min.sh` shell script (copied in previous step)
3. Add `_mur` to your project's `.gitignore`

However, if you are extending `ursys-min`, make a **fork** and use that:

1. first **fork** this repo on Github
2. then `git clone <your_fork.git> _mur`
3. add `_mur` to your project `.gitignore`

You may find it useful to not add `_mur` if you want to commit the subsystem as part of your main project repo.

- If you don't care about updates to `ursys-min`, then delete the `_mur/.git` with `rm -fr _mur/.git` and add the files to your repo. Don't add `_mur` to your project `.gitignore`
- If you want to manage the changes in `_mur` independently, you should add `_mur` to your `.gitignore`, and make a note that **ursys-min is a subrepo dependency** in your project installation, perhaps providing your own installer script.

Another option is to also let your main project git repo manage the `_mur` subrepo, comitting its changes twice. In this case, don't do anything with your project's `.gitignore` and don't delete the `_mur/.git` directory.

#### (Optional) Typescript Intellisense for Visual Studio Code

For reliable live linting of Typescript in VSCODE, your project workspace needs a `tsconfig.json` in the project workpace root. 

- If you **don't** have a `tsconfig.json` in your project root, you can copy the `tsconfig` and `tsconfig-mur` files there. 
- If you **already have** a `tsconfig.json` in the project root, you can just copy the `tsconfig-mur.json` file (assuming there is no existing project)

