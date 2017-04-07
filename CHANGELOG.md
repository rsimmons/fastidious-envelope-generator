# Fastidious-envelope-generator changelog

## [2.0.0] - 2017-04-06
Major update to internals and API, to be simpler and more robust with different browser implementations of the Web Audio API.

### Changed
- (internally) Use the Web Audio API automation methods in a manner that is less likely to have cross-platform issues (the previous version did not always behave well in Firefox and Safari)
- Change all rate parameters to be time parameters (the reciprocal, effectively), since that is how people tend to think of the parameters

### Removed
- Remove all shape parameters (each envelope phase now has a fixed shape)
- Remove the attackLevel parameter, which seemed not very useful
- Remove the dependency on math-float64-nextafter which was no longer needed

## [1.0.2] - 2017-01-15
### Fixed
- Fixed issue that made rapid attacks starting from 0 not be as rapid as they were supposed to be.

## [1.0.1] - 2017-01-15
### Added
- Provide NPM install instructions in README
- Specify setting defaults in README

### Changed
- Include library to get next-float64 functionality, which is better than our next-float32 impl
- Use simpler Infinity instead of Number.POSITIVE_INFINITY

### Fixed
- Fix major bug where linear ramps were being truncated incorrectly (due to my misunderstanding of the semantics of cancelScheduledValues())
- Fix mistaken assert when a segment was scheduled to start at exactly the end time of another

## [1.0.0] - 2017-01-12
First public release.
