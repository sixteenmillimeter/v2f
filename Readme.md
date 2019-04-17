v2f
========

Convert video to 16mm-sized strips of frames. For transferring to acetate and other experimental needs.

Use the distributed binary

    ./v2f ./path_to_video.mov ./path_to_output_directory

or from source

	node v2f.js ./path_to_video.mov ./path_to_output_directory

This will turn "path_to_video.mov" into strips of film frames that will printing at 300dpi. They are broken up into 8.5x11in pages.

Options
-------

```
  Usage: v2f [options] <input> <output>


  Options:

    -V, --version          output the version number
    -i, --input <path>     Video source to print to film strip, anything that avconv can read
    -o, --output <path>    Output directory, will render images on specified page size
    -d, --dpi <dpi>        DPI output pages
    -f, --film <gauge>     Choose film gauge: 16mm, super16, 35mm
    -w, --width <inches>   Output page width, in inches. Default 8.5
    -l, --length <inches>  Output page length, in inches. Default 11
    -v, --verbose          Run in verbose mode
    -h, --help             output usage information
```

Releases
--------

* [1.1.1](https://github.com/sixteenmillimeter/v2f/releases/tag/1.1.1)
* [1.0.0](https://github.com/sixteenmillimeter/v2f/releases/tag/1.0.0)


Dependencies
------------

- node.js (or use a [released version](https://github.com/sixteenmillimeter/v2f/releases/))
- libav
- ImageMagick

Install Dependencies
--------------------

OSX

	brew install libav imagemagick

Ubuntu

	apt-get install libav imagemagick



Contribute
----------

- Issue Tracker: https://github.com/sixteenmillimeter/v2f/issues
- Source Code: https://github.com/sixteenmillimeter/v2f
- Home Page: https://sixteenmillimeter.com/projects/v2f

Support
-------

If you are having problems with this application, please create an issue.

License
-------

The project is licensed under the MIT license.
