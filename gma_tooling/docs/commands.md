# Commands

Commands can be run from the root of a GMA project.

## bootstrap (bsi)

Bootstraps the project by installing and linking project dependencies and install vscode extensions.

```bash
gmat bootstrap
gmat bs
```
A `gma.yaml` file and empty `packages/` directory will be generated.

Packages defined in the `gma.yaml` `packages` field will be locally linked whilst other dependencies
will be automatically resolved.
## flavor

Flavor allows change flavor of a selected app which must be defined in `gma.yaml`.

#### app_name
> Note: `app_name` is dynamic value taken from your `gma.yaml` configuration

**--choose** - available flavors per application
```bash
gmat flavor self_care --choose fakein
```
> Note: `gmat flavor self_care -h` for available flovers

## pub
Manipulation with package versions cross all packages in GMA project

#### clean
Clean selected packages
```bash
gmat pub clean
```

#### get
Iterete all selected packages and run pub get on the package
```bash
gmat pub get
```
#### refresh
Clean all packages and re-run pub get in all project
```bash
gmat pub refresh
```

## quality
Manipulation with package versions cross all packages in GMA project

#### analyze
```bash
gmat quality analyze
```

#### cyclic
```bash
gmat quality cyclic
```

#### dcm
```bash
gmat quality dcm
```

#### format
```bash
gmat quality format
```

## translate

Select all translatable packages (depends on `gen_lang`) and run translation command

```bash
gmat translate 
```

## version

Manipulation with package versions cross all packages in GMA project

```bash
gmat version
```

### --search (-s)

Manipulation with package versions cross all packages in GMA project

```bash
gmat version --search dartz
```

### update

Change version of package in all packages with this dependency to same version

```bash
gmat version update --package my_package --version ^2.0.0
```

## Global options

Each GMA command can be used with these global commands:

### --help (-h)

Prints usage information about a command.

```bash
gmat --help
gmat pub -h
```

### --[no-]example
Global filter for package examplaes operations
Defaults to `false`.
```bash
# filter even example
gmat pub get --example
```

### concurrency (-c)

Defines the max concurrency value of how many packages will execute the command in at any one time. Defaults to `6`.

```bash
# Set a 12 concurrency
gmat pub get -c 12
```

### --fail-fast

fails on first exception. all other operations are skiped.
Defaults to `false`.

```bash
# Fail fast
gmat pub get --fail-fast
```

### --dry-run

Will run placeholder command on every selected package.  
Defaults to `false`.

```bash
# Check your command filters
gmat pub get -f '**wrong**,**bad?idea**' --dry-run

# Run your command filters
gmat pub get -f '**wrong**' --fail-fast --no-dry-run
```

### --verbose (-v)

Enable verbose logging with showing a time.
Defaults to `false`.

```bash
gmat pub get -v
```

### --depends-on

Include only packages that depend on specific dependencies.

```bash
gmat pub get --depends-on="capp_auth"
```

### ---dev-depends-on

Include only packages that depend on specific devDependencies.

```bash
gmat pub get --dev-depends-on="capp_auth"
```