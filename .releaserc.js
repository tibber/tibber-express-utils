module.exports = {
    branches: [
        /**
         * Support releases allowing for fixes and features to non-latest versions.
         * 
         * To support a previous verison, create a branch from the previous version tag
         * and name it M.x or M.x.x or M.N.x where M and N are major and minor versions you are
         * supporting, respectively. 
         * 
         * E.g. If you are supporting version 1.2 specifically, then name the branch '1.2.x' 
         * (literally, with the x).
         */
        '+([0-9])?(.{+([0-9]),x}).x', 
        /**
         * Regular releases to default @latest channel ('yarn add package' will install it)
         */
        'master', 
        /**
         * Early releases to a @next channel, meant as release candidates or optional upgrades.
         * 
         * Early releases won't be installed with `yarn add <pkg>`, unless the version or tag is
         * explicitly specified. So, `yarn add <pkg>:next` will.
         * 
         * These are versions ready to be consumed, but are held back from being the default (@latest) 
         * version. This might be used when there is an adoption timeline for the new version, 
         * during which using the new version is optional, or in an RFC (Request for Comments).
         */
        'next',
        /**
         * Pre-releases are published for testing and preview purposes. Any branch that doesn't match
         * a support, master or next branch will be released as a pre-release branch.
         * 
         * Pre-release versions take the form M.N.P-<branch>.X where 
         *  - M, N and P are the major, minor and patch number of the semver that will be published 
         *    upon on completion, 
         *  - <branch> is the name of the branch on which development is taking place, and 
         *  - X is the revision number.
         * 
         * Pre-releases won't be installed with `yarn add <pkg>`, unless the version or tag is
         * explicitly specified. So, `yarn add <pkg>:v3.2.1-branch.1` will.
         */
        {
            /**
             * pre-release as vX.X.X-beta.N from the last version tag in branch's commit history
             */
            name: '*', 
            prerelease: true
        }],
    plugins: [
        /**
         * Reads and inspects commits since the last released version for conventional commit messages.
         */
        "@semantic-release/commit-analyzer",
        /**
         * Interprets and assembles the conventional commit messages for use in later steps, and determines
         * the next semver for release.
         */
        "@semantic-release/release-notes-generator",
        /**
         * Patches package.json with the new semver, and publishes the package to NPM.
         */
        "@semantic-release/npm",
        /**
         * Pushes the release and its release notes to its GitHub repository. 
         */
        "@semantic-release/github",
        /**
         * Inserts the latest release notes into CHANGELOG.md
         */
        "@semantic-release/changelog",
        /**
         * Commits and pushes the updated package.json and CHANGELOG.md to origin.
         */
        ["@semantic-release/git", {
            "assets": ["package.json", "CHANGELOG.md"],
            "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
        }],
    ]
};
