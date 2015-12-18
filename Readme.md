v2f
========

Convert video to 16mm-sized strips of frames. For transferring to acetate and other experimental needs.

Look how easy it is to use:

    v2f ./path_to_video.mov 300 -v

This will turn "path_to_video.mov" into strips of 16mm-sized frames that will printing at 300dpi. They are broken up into 8.5x11in pages.


Dependencies
------------

- node.js (or use a compiled version)
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

- Issue Tracker: github.com/sixteenmillimeter/v2f/issues
- Source Code: github.com/sixteenmillimeter/v2f

Support
-------

If you are having issues, please log it with the project.

License
-------

The project is licensed under the MIT license.
