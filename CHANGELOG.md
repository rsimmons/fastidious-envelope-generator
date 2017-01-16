# Fastidious-envelope-generator changelog

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
