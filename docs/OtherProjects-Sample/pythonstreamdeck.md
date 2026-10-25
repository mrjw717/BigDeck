https://github.com/abcminiuser/python-elgato-streamdeck

Directory structure:
└── abcminiuser-python-elgato-streamdeck/
    ├── README.md
    ├── CHANGELOG
    ├── LICENSE
    ├── MANIFEST.in
    ├── requirements.txt
    ├── setup.py
    ├── VERSION
    ├── .bandit
    ├── .drone.yml
    ├── .flake8
    ├── .readthedocs.yaml
    ├── doc/
    │   ├── make.bat
    │   ├── Makefile
    │   ├── requirements.txt
    │   └── source/
    │       ├── conf.py
    │       ├── index.rst
    │       ├── examples/
    │       │   ├── animated.rst
    │       │   ├── basic.rst
    │       │   ├── deckinfo.rst
    │       │   ├── neo.rst
    │       │   ├── pedal.rst
    │       │   ├── plus.rst
    │       │   ├── studio.rst
    │       │   └── tiled.rst
    │       ├── modules/
    │       │   ├── devices.rst
    │       │   ├── discovery.rst
    │       │   ├── imagehelpers.rst
    │       │   └── transports.rst
    │       └── pages/
    │           ├── backend_libusb_hidapi.rst
    │           ├── changelog.rst
    │           ├── installation.rst
    │           ├── license.rst
    │           └── source.rst
    ├── src/
    │   ├── example_animated.py
    │   ├── example_basic.py
    │   ├── example_deckinfo.py
    │   ├── example_neo.py
    │   ├── example_pedal.py
    │   ├── example_plus.py
    │   ├── example_studio.py
    │   ├── example_tileimage.py
    │   ├── Assets/
    │   │   ├── Apache License 2.0.txt
    │   │   ├── Attribution.txt
    │   │   ├── CC BY-SA 3.0 License.txt
    │   │   └── CC0 License.txt
    │   └── StreamDeck/
    │       ├── __init__.py
    │       ├── DeviceManager.py
    │       ├── ProductIDs.py
    │       ├── Devices/
    │       │   ├── __init__.py
    │       │   ├── StreamDeck.py
    │       │   ├── StreamDeckMini.py
    │       │   ├── StreamDeckNeo.py
    │       │   ├── StreamDeckOriginal.py
    │       │   ├── StreamDeckOriginalV2.py
    │       │   ├── StreamDeckPedal.py
    │       │   ├── StreamDeckPlus.py
    │       │   ├── StreamDeckStudio.py
    │       │   └── StreamDeckXL.py
    │       ├── ImageHelpers/
    │       │   ├── __init__.py
    │       │   └── PILHelper.py
    │       └── Transport/
    │           ├── __init__.py
    │           ├── Dummy.py
    │           ├── LibUSBHIDAPI.py
    │           └── Transport.py
    ├── test/
    │   └── test.py
    └── .github/
        └── ISSUE_TEMPLATE/
            ├── bug_report.md
            └── feature_request.md


Files Content:

================================================
FILE: README.md
================================================
# Python Elgato Stream Deck Library

![Example Deck](ExampleDeck.jpg)

This is an open source Python 3 library to control an
[Elgato Stream Deck](https://www.elgato.com/en/gaming/stream-deck) directly,
without the official software. This can allow you to create your own custom
front-ends, such as a custom control front-end for home automation software.

Protocol documentation for various StreamDeck products are
[published the Elgato website](https://docs.elgato.com/streamdeck/hid/).

_________________

[PyPi Project Entry](https://pypi.org/project/streamdeck/) - [Online Documentation](https://python-elgato-streamdeck.readthedocs.io) - [Source Code](https://github.com/abcminiuser/python-elgato-streamdeck)


## Project Status:

Working - you can enumerate devices, set the brightness of the panel(s), set
the images shown on each button, and read the current button states.

Currently the following StreamDeck products are supported in multiple hardware
variants:

* StreamDeck 6 Key, 15 Key and 32 Key Modules
* StreamDeck Mini
* StreamDeck Neo
* StreamDeck Original
* StreamDeck Pedal
* StreamDeck Plus
* StreamDeck Studio
* StreamDeck XL

## Package Installation:

Install the library via pip:

```
pip install streamdeck
```

Alternatively, manually clone the project repository:

```
git clone https://github.com/abcminiuser/python-elgato-streamdeck.git
```

For detailed installation instructions, refer to the prebuilt
[online documentation](https://python-elgato-streamdeck.readthedocs.io), or
build the documentation yourself locally by running `make html` from the `docs`
directory.


## Credits:

Thank you to the following contributors, large and small, for helping with the
development and maintenance of this library:

- [admiral0](https://github.com/admiral0)
- [Aetherdyne](https://github.com/Aetherdyne)
- [Benargee](https://github.com/Benargee)
- [benedikt-bartscher](https://github.com/benedikt-bartscher)
- [brimston3](https://github.com/brimston3)
- [BS-Tek](https://github.com/BS-Tek)
- [Core447](https://github.com/Core447)
- [dirkk0](https://github.com/dirkk0)
- [dnahmanpix](https://github.com/dnahmanpix)
- [dodgyrabbit](https://github.com/dodgyrabbit)
- [dubstech](https://github.com/dubstech)
- [Giraut](https://github.com/Giraut)
- [impala454](https://github.com/impala454)
- [iPhoneAddict](https://github.com/iPhoneAddict)
- [itsusony](https://github.com/itsusony)
- [jakobbuis](https://github.com/jakobbuis)
- [jmudge14](https://github.com/jmudge14)
- [jonbloom](https://github.com/jonbloom)
- [Kalle-Wirsch](https://github.com/Kalle-Wirsch)
- [karstlok](https://github.com/karstlok)
- [Lewiscowles1986](https://github.com/Lewiscowles1986)
- [Luminger](https://github.com/Luminger)
- [m-weigand](https://github.com/m-weigand)
- [mathben](https://github.com/mathben)
- [matrixinius](https://github.com/matrixinius)
- [phillco](https://github.com/phillco)
- [pointshader](https://github.com/pointshader)
- [pylogger-html](https://github.com/pylogger-html)
- [shanna](https://github.com/shanna)
- [spidererrol](https://github.com/Spidererrol)
- [spyoungtech](https://github.com/spyoungtech)
- [Subsentient](https://github.com/Subsentient)
- [swedishmike](https://github.com/swedishmike)
- [TheSchmidt](https://github.com/TheSchmidt)
- [theslimshaney](https://github.com/theslimshaney)
- [tjemg](https://github.com/tjemg)
- [VladFlorinIlie](https://github.com/VladFlorinIlie)

If you've contributed in some manner, but I've accidentally missed you in the
list above, please let me know.


## License:

Released under the [MIT license](LICENSE).



================================================
FILE: CHANGELOG
================================================
Version 0.10.0:
	- Fix Dummy Streamdeck backend when calling `read_feature()`.
	- Add support for the StreamDeck Studio.
	- Minimum Python version bumped to 3.10, as 3.9 is now EOL.

Version 0.9.8:
	- Documentation fixes (StreamDeck 6 key module is also supported since 0.9.7).

Version 0.9.7:
	- Added type hints to public APIs.
	- Fixed leading whitespace in StreamDeck Plus serial number strings.
	- Added support for new PID variant of the StreamDeck MK2.
	- Added support for new StreamDeck 16-key, 32-key and scissor modules.

Version 0.9.6:
	- Fixed StreamDeck+ returning 10 key states instead of the expected 8.
	- Fixed StreamDeck+ dial push event not being detected correctly.
	- Fixed old key states and dial states returned if requested from inside a key or dial callback function.
	- Added support for FreeBSD platforms.
	- Added support for the StreamDeck Neo.

Version 0.9.5:
	- Added support for the StreamDeck Plus.

Version 0.9.4:
	- Updated Windows HIDAPI backend to attempt to load from the local working directory.
	- Added detection for MacOS Homebrew installations of the libhidapi back-end library.

Version 0.9.3:
	- Added support for a new sub-variant of the StreamDeck XL.

Version 0.9.2:
	- Added support for a new sub-variant of the StreamDeck Mini.

Version 0.9.1:
	- Transport errors now trigger a closing of the underlying StreamDeck device, so further API calls will throw correctly (and ``is_open()`` will return ``False``).
	- Updated animated example script to use separate cycle generators for each key, so the animations play at the correct rate regardless of key count.
	- Added support for the StreamDeck pedal.
	- Added new `is_visual()` function.

Version 0.9.0:
	- Added new `set_poll_frequency()` function.
	- Added new `is_open()` function.
	- Fixed a possible internal thread join error when a deck object was closed.

Version 0.8.5:
	- Add support for the new StreamDeck MK2.

Version 0.8.4:
	- Updated animated example script to attempt to maintain a constant FPS, regardless of rendering time.
	- Fixed a race condition in the LibUSB HIDAPI transport backend that could cause crashes when a device was closed.

Version 0.8.3:
	- Altered LibUSB transport workaround to only apply on Mac.
	- Fixed internal _extract_string() method to discard all data after the first NUL byte, fixing corrupt serial number strings being returned in some cases.
	- Set minimum Python version to 3.8, as some of the library uses newer syntax/core library features.

Version 0.8.2:
	- Added new ``PILHelper.create_scaled_image()`` function to easily generate scaled/padded key images for a given deck.
	- Updated LibUSB transport backend so that device paths are returned as UTF-8 strings, not raw bytes.
	- Updated version/serial number string extraction from StreamDecks so that invalid characters are substituted, rather than raising a ``UnicodeDecodeError`` error.
	- Added LibUSB transport workaround for a bug on Mac platforms when using older versions of the library.

Version 0.8.1:
	- Fixed memory leak in LibUSB HIDAPI transport backend.

Version 0.8.0:
	- Fix random crashes in LibUSB HIDAPI transport backend on Windows, as the API is not thread safe.
	- Added support for atomic updates of StreamDeck instances via the Python ``with`` scope syntax.

Version 0.7.3:
	- Fix crash in new LibUSB HIDAPI transport backend on systems with multiple connected StreamDeck devices.
	- Fix crash in new LibUSB HIDAPI transport backend when ``connected()`` was called on a StreamDeck instance.

Version 0.7.2:
	- Documentation restructuring to move installation out of the readme and into the library documentation.

Version 0.7.1:
	- Cleaned up new LibUSB HIDAPI transport backend, so that it only searches for OS-specific library files.
	- Fixed minor typo in the libUSB HIDAPI transport backend probe failure message.

Version 0.7.0:
	- Removed old HID and HIDAPI backends, added new ``ctypes`` based LibUSB-HIDAPI backend replacement.

Version 0.6.3:
	- Added support for the new V2 hardware revision of the StreamDeck Original.

Version 0.6.2:
	- Fixed broken StreamDeck XL communications on Linux.
	- Added blacklist for the ``libhidapi-hidraw`` system library which breaks StreamDeck Original communications.

Version 0.6.1:
	- Fixed broken HIDAPI backend probing.
	- Fixed double-open of HID backend devices causing connection issues on some platforms.

Version 0.6.0:
	- Added support for the ``HID`` Python package. This new HID backend is strongly recommended over the old HIDAPI backend.
	- Added auto-probing of installed backends, if no specific transport is supplied when constructing a DeviceManager instance.

Version 0.5.1:
	- Fixed StreamDeck XL reporting swapped rows/columns count.
	- Fixed StreamDeck XL failing to report correct serial number and firmware version.

Version 0.5.0:
	- Fixed StreamDeck devices occasionally showing partial old frames on initial connection.
	- Removed support for RAW pixel images, StreamDeck Mini and Original take BMP images.
	- Removed ``width`` and ``height`` information from Deck key image dict, now returned as ``size`` tuple entry.

Version 0.4.0:
	- Added StreamDeck XL support.

Version 0.3.2:
	- Fixed StreamDeck Mini key images not updating under some circumstances.

Version 0.3.1:
	- Added animated image example script.

Version 0.3:
	- Remapped StreamDeck key indexes so that key 0 is located on the physical
	  top-left of all supported devices.

Version 0.2.4:
	- Added new ``StreamDeck.get_serial_number()`` function.
	- Added new ``StreamDeck.get_firmware_version()`` function.

Version 0.2.3:
	- Added new ``StreamDeck.ImageHelpers modules`` for easier key image generation.



================================================
FILE: LICENSE
================================================
Permission to use, copy, modify, and distribute this software
and its documentation for any purpose is hereby granted without
fee, provided that the above copyright notice appear in all
copies and that both that the copyright notice and this
permission notice and warranty disclaimer appear in supporting
documentation, and that the name of the author not be used in
advertising or publicity pertaining to distribution of the
software without specific, written prior permission.

The author disclaims all warranties with regard to this
software, including all implied warranties of merchantability
and fitness.  In no event shall the author be liable for any
special, indirect or consequential damages or any damages
whatsoever resulting from loss of use, data or profits, whether
in an action of contract, negligence or other tortious action,
arising out of or in connection with the use or performance of
this software.



================================================
FILE: MANIFEST.in
================================================
graft src/StreamDeck
graft src/Assets
include src/example*.py
include *.md
include *.jpg
include VERSION
include CHANGELOG
include LICENSE



================================================
FILE: requirements.txt
================================================
Pillow>=9.0.0



================================================
FILE: setup.py
================================================
import setuptools

with open("VERSION", 'r') as f:
    version = f.read().strip()

with open("README.md", 'r') as f:
    long_description = f.read()

setuptools.setup(
   name='streamdeck',
   version=version,
   description='Library to control Elgato StreamDeck devices.',
   author='Dean Camera',
   author_email='dean@fourwalledcubicle.com',
   url='https://github.com/abcminiuser/python-elgato-streamdeck',
   package_dir={'': 'src'},
   packages=setuptools.find_packages(where='src'),
   install_requires=[],
   license="MIT",
   long_description=long_description,
   long_description_content_type="text/markdown",
   include_package_data=True,
   python_requires='>=3.10',
)



================================================
FILE: VERSION
================================================
0.10.0



================================================
FILE: .bandit
================================================
[bandit]
skips = B311



================================================
FILE: .drone.yml
================================================
kind: pipeline
type: docker
name: Build Tests

platform:
  os: linux
  arch: amd64

steps:
- name: Flake8
  image: abcminiuser/docker-ci-python:latest
  pull: always
  commands:
  - flake8 --config .flake8 src/

- name: Bandit
  image: abcminiuser/docker-ci-python:latest
  pull: always
  commands:
  - bandit --ini .bandit -r src/

- name: MyPy
  image: abcminiuser/docker-ci-python:latest
  pull: always
  commands:
  - mypy --ignore-missing-imports src/

- name: Tests
  image: abcminiuser/docker-ci-python:latest
  pull: always
  commands:
  - apk add jpeg-dev zlib-dev
  - pip install Pillow
  - python test/test.py

- name: Documentation
  image: abcminiuser/docker-ci-python:latest
  pull: always
  commands:
  - make -C doc html

- name: Packaging
  image: abcminiuser/docker-ci-python:latest
  pull: always
  commands:
  - python -m build
  - twine check dist/*
  depends_on:
  - Flake8
  - Bandit
  - MyPy
  - Tests
  - Documentation



================================================
FILE: .flake8
================================================
[flake8]
ignore = E501,E261,E722



================================================
FILE: .readthedocs.yaml
================================================
# .readthedocs.yaml
# Read the Docs configuration file
# See https://docs.readthedocs.io/en/stable/config-file/v2.html for details
# See for https://github.com/readthedocs/readthedocs.org/issues/6324 and https://github.com/readthedocs/readthedocs.org/issues/7554 for details

version: 2

build:
  os: ubuntu-22.04
  tools:
    python: "3.11"

sphinx:
   configuration: doc/source/conf.py

formats: all

python:
   install:
   - requirements: doc/requirements.txt



================================================
FILE: doc/make.bat
================================================
@ECHO OFF

pushd %~dp0

REM Command file for Sphinx documentation

if "%SPHINXBUILD%" == "" (
	set SPHINXBUILD=sphinx-build
)
set SOURCEDIR=source
set BUILDDIR=build
set SPHINXPROJ=python-elgato-streamdeck

if "%1" == "" goto help

%SPHINXBUILD% >NUL 2>NUL
if errorlevel 9009 (
	echo.
	echo.The 'sphinx-build' command was not found. Make sure you have Sphinx
	echo.installed, then set the SPHINXBUILD environment variable to point
	echo.to the full path of the 'sphinx-build' executable. Alternatively you
	echo.may add the Sphinx directory to PATH.
	echo.
	echo.If you don't have Sphinx installed, grab it from
	echo.http://sphinx-doc.org/
	exit /b 1
)

%SPHINXBUILD% -M %1 %SOURCEDIR% %BUILDDIR% %SPHINXOPTS%
goto end

:help
%SPHINXBUILD% -M help %SOURCEDIR% %BUILDDIR% %SPHINXOPTS%

:end
popd



================================================
FILE: doc/Makefile
================================================
# Minimal makefile for Sphinx documentation
#

# You can set these variables from the command line.
SPHINXOPTS    =
SPHINXBUILD   = sphinx-build
SPHINXPROJ    = python-elgato-streamdeck
SOURCEDIR     = source
BUILDDIR      = build

# Put it first so that "make" without argument is like "make help".
help:
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

.PHONY: help Makefile

# Catch-all target: route all unknown targets to Sphinx using the new
# "make mode" option.  $(O) is meant as a shortcut for $(SPHINXOPTS).
%: Makefile
	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)


================================================
FILE: doc/requirements.txt
================================================
Sphinx>=8.2.3
sphinx-rtd-theme>=3.0.2



================================================
FILE: doc/source/conf.py
================================================
# Configuration file for the Sphinx documentation builder.
#
# This file only contains a selection of the most common options. For a full
# list see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Path setup --------------------------------------------------------------

# If extensions (or modules to document with autodoc) are in another directory,
# add these directories to sys.path here. If the directory is relative to the
# documentation root, use os.path.abspath to make it absolute, like shown here.
#
import os
import sys

import sphinx_rtd_theme

ROOT_PATH = os.path.join(os.path.dirname(__file__), "..", "..")

with open(os.path.join(ROOT_PATH, "VERSION"), 'r') as f:
    package_version = f.read().strip()

sys.path.insert(0, os.path.abspath(os.path.join(ROOT_PATH, 'src')))


# -- General configuration ------------------------------------------------

# If your documentation needs a minimal Sphinx version, state it here.
#
needs_sphinx = '3.0'

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
extensions = ['sphinx.ext.autodoc', 'sphinx_rtd_theme']

# Add any paths that contain templates here, relative to this directory.
templates_path = ['_templates']

# The suffix(es) of source filenames.
# You can specify multiple suffix as a list of string:
#
source_suffix = ['.rst']

# The master toctree document.
master_doc = 'index'

# General information about the project.
project = 'python-elgato-streamdeck'
copyright = '2023, Dean Camera'
author = 'Dean Camera'

# The version info for the project you're documenting, acts as replacement for
# |version| and |release|, also used in various other places throughout the
# built documents.
#
# The short X.Y version.
version = package_version
# The full version, including alpha/beta/rc tags.
release = package_version

# The language for content autogenerated by Sphinx. Refer to documentation
# for a list of supported languages.
#
# This is also used if you do content translation via gettext catalogs.
# Usually you set "language" from the command line for these cases.
language = 'en'

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
# This patterns also effect to html_static_path and html_extra_path
exclude_patterns = []

# The name of the Pygments (syntax highlighting) style to use.
pygments_style = 'sphinx'

# If true, `todo` and `todoList` produce output, else they produce nothing.
todo_include_todos = False

autoclass_content = 'both'

# -- Options for HTML output ----------------------------------------------

# The theme to use for HTML and HTML Help pages.  See the documentation for
# a list of builtin themes.
#
html_theme = 'sphinx_rtd_theme'

# Theme options are theme-specific and customize the look and feel of a theme
# further.  For a list of options available for each theme, see the
# documentation.
#
# html_theme_options = {}

# Add any paths that contain custom static files (such as style sheets) here,
# relative to this directory. They are copied after the builtin static files,
# so a file named "default.css" will overwrite the built-in "default.css".
html_static_path = []

# Custom sidebar templates, must be a dictionary that maps document names
# to template names.
#
# This is required for the alabaster theme
# refs: http://alabaster.readthedocs.io/en/latest/installation.html#sidebars
html_sidebars = {
    '**': [
        'relations.html',  # needs 'show_related': True theme option to display
        'searchbox.html',
    ]
}



================================================
FILE: doc/source/index.rst
================================================
#####
About
#####

.. image:: ../../ExampleDeck.jpg
   :alt: Example StreamDeck Device

This is an open source Python 3 library to control an `Elgato Stream Deck
<https://www.elgato.com/en/gaming/stream-deck>`_ directly, without the official
software. This can allow you to create your own custom front-ends, such as a
custom control front-end for home automation software.

#####
Index
#####

.. toctree::
    :caption: Installation and Setup

    pages/installation.rst


.. toctree::
    :caption: Module Documentation
    :numbered:

    modules/discovery.rst
    modules/devices.rst
    modules/transports.rst
    modules/imagehelpers.rst


.. toctree::
    :caption: Library Examples
    :numbered:

    examples/deckinfo.rst
    examples/basic.rst
    examples/pedal.rst
    examples/plus.rst
    examples/neo.rst
    examples/studio.rst
    examples/tiled.rst
    examples/animated.rst


.. toctree::
    :caption: About

    pages/source.rst
    pages/changelog.rst
    pages/license.rst


##################
Indices and tables
##################

* :ref:`genindex`
* :ref:`modindex`



================================================
FILE: doc/source/examples/animated.rst
================================================
*******************************
Example Script: Animated Images
*******************************

The following is a complete example script to connect to attached StreamDeck
devices, and display animated graphics on the keys.

.. literalinclude:: ../../../src/example_animated.py
    :language: python



================================================
FILE: doc/source/examples/basic.rst
================================================
***************************
Example Script: Basic Usage
***************************

The following is a complete example script to connect to attached StreamDeck
devices, display custom image/text graphics on the buttons and respond to press
events.

.. literalinclude:: ../../../src/example_basic.py
    :language: python



================================================
FILE: doc/source/examples/deckinfo.rst
================================================
**********************************
Example Script: Device Information
**********************************

The following is a complete example script to enumerate any available StreamDeck
devices and print out all information on the device's location and image format.

.. literalinclude:: ../../../src/example_deckinfo.py
    :language: python



================================================
FILE: doc/source/examples/neo.rst
================================================
*******************
Example Script: Neo
*******************

The following is an example script to connect to the Stream Deck Neo, and print
whenever its buttons are pushed and released.

.. literalinclude:: ../../../src/example_neo.py
    :language: python



================================================
FILE: doc/source/examples/pedal.rst
================================================
*********************
Example Script: Pedal
*********************

The following is an example script to connect to the Stream Deck Pedal, and
print whenever its buttons are pushed and released.

.. literalinclude:: ../../../src/example_pedal.py
    :language: python



================================================
FILE: doc/source/examples/plus.rst
================================================
****************************
Example Script: StreamDeck +
****************************

The following is a complete example script to display an image on the
touchscreen of the Stream Deck +, and react to dial events.

.. literalinclude:: ../../../src/example_plus.py
    :language: python



================================================
FILE: doc/source/examples/studio.rst
================================================
*********************************
Example Script: StreamDeck Studio
*********************************

The following is a complete example script to display an image on the
buttons of the Stream Deck Studio, and react to dial events.

.. literalinclude:: ../../../src/example_studio.py
    :language: python



================================================
FILE: doc/source/examples/tiled.rst
================================================
***************************
Example Script: Tiled Image
***************************

The following is a complete example script to display a larger image across a
StreamDeck, by sectioning up the image into key-sized tiles, and displaying
them individually onto each key.

.. literalinclude:: ../../../src/example_tileimage.py
    :language: python



================================================
FILE: doc/source/modules/devices.rst
================================================
***************************
Modules: StreamDeck Devices
***************************

==========================
StreamDeck (Abstract Base)
==========================

.. automodule:: StreamDeck.Devices.StreamDeck
   :members:
   :show-inheritance:


===============
StreamDeck Mini
===============

.. automodule:: StreamDeck.Devices.StreamDeckMini
   :members:
   :show-inheritance:


===============
StreamDeck Neo
===============

.. automodule:: StreamDeck.Devices.StreamDeckNeo
   :members:
   :show-inheritance:


===================
StreamDeck Original
===================

.. automodule:: StreamDeck.Devices.StreamDeckOriginal
   :members:
   :show-inheritance:


================
StreamDeck Pedal
================

.. automodule:: StreamDeck.Devices.StreamDeckPedal
   :members:
   :show-inheritance:


================
StreamDeck Plus
================

.. automodule:: StreamDeck.Devices.StreamDeckPlus
   :members:
   :show-inheritance:


=============
StreamDeck XL
=============

.. automodule:: StreamDeck.Devices.StreamDeckXL
   :members:
   :show-inheritance:



================================================
FILE: doc/source/modules/discovery.rst
================================================
*************************
Modules: Device Discovery
*************************

==============
Device Manager
==============

.. automodule:: StreamDeck.DeviceManager
   :members:
   :show-inheritance:



================================================
FILE: doc/source/modules/imagehelpers.rst
================================================
**********************
Modules: Image Helpers
**********************

================
PIL Image Helper
================

.. automodule:: StreamDeck.ImageHelpers.PILHelper
   :members:
   :show-inheritance:



================================================
FILE: doc/source/modules/transports.rst
================================================
*********************************
Modules: Communication Transports
*********************************

=========================
Transport (Abstract Base)
=========================

.. automodule:: StreamDeck.Transport.Transport
   :members:
   :show-inheritance:


=================================
'LibUSB HIDAPI' Library Transport
=================================

.. automodule:: StreamDeck.Transport.LibUSBHIDAPI
   :members:
   :show-inheritance:



================================================
FILE: doc/source/pages/backend_libusb_hidapi.rst
================================================
-----------------------------
Default LibUSB HIDAPI Backend
-----------------------------

This is the default and recommended backend - a cross platform library for
communicating with HID devices. Most systems will have this as a system package
available for easy installation.


^^^^^^^
Windows
^^^^^^^

Windows systems requires additional manual installation of a DLL in order to
function. The latest source for the ``hidapi.dll`` DLL is the `releases page of
the libUSB GitHub project <https://github.com/libusb/hidapi/releases>`_.

Place the DLL into a folder that has been added to your system ``%PATH%``
directory list (typically this includes the ``C:\Windows\System32`` folder but
adding a new path would be recommended instead of modifying your Windows
directory).

Ensure you use the correct DLL version for your installed Python version; i.e.
if you are using 32-bit Python, install the 32-bit ``hidapi.dll``.

^^^^^^^^^^^^^^
MacOS (Darwin)
^^^^^^^^^^^^^^

On MacOS systems, you can choose to either compile the `HIDAPI project
<https://github.com/libusb/hidapi/>`_ yourself, or install it via one of the
multiple third party package managers (e.g. ``brew install hidapi``, when using
Homebrew).


^^^^^^^^^^^^^^^^^^^^^
Linux (Ubuntu/Debian)
^^^^^^^^^^^^^^^^^^^^^

On Linux, the ``libhidapi-libusb0`` package is required can can be installed via
the system's package manager.

The following script has been verified working on a Raspberry Pi (Models 2B and
4B) running a stock Debian Buster image, to install all the required
dependencies needed by this project on a fresh system::

    # Ensure system is up to date, upgrade all out of date packages
    sudo apt update && sudo apt dist-upgrade -y

    # Install the pip Python package manager
    sudo apt install -y python3-pip python3-setuptools

    # Install system packages needed for the default LibUSB HIDAPI backend
    sudo apt install -y libudev-dev libusb-1.0-0-dev libhidapi-libusb0

    # Install system packages needed for the Python Pillow package installation
    sudo apt install -y libjpeg-dev zlib1g-dev libopenjp2-7 libtiff5

    # Install python library dependencies
    pip3 install wheel
    pip3 install pillow

    # Add udev rule to allow all users non-root access to Elgato StreamDeck devices:
    sudo tee /etc/udev/rules.d/10-streamdeck.rules << EOF
    	SUBSYSTEMS=="usb", ATTRS{idVendor}=="0fd9", GROUP="users", TAG+="uaccess"
    	EOF

    # Reload udev rules to ensure the new permissions take effect
	sudo udevadm control --reload-rules

    # Install the latest version of the StreamDeck library via pip
    pip3 install streamdeck

Note that after adding the ``udev`` rules, you will need to remove and
re-attach any existing StreamDeck devices to ensure they adopt the new
permissions. This should allow you to access StreamDeck devices *without*
needing root permissions.



================================================
FILE: doc/source/pages/changelog.rst
================================================
*********
Changelog
*********

.. include:: ../../../CHANGELOG



================================================
FILE: doc/source/pages/installation.rst
================================================
********************
Library Installation
********************

To install this library via the `pip` package manager, simply run
``pip install streamdeck`` from a terminal.

The included examples require the PIL fork `pillow`, although it can be
swapped out if desired by the user application for any other image manipulation
library. This can also be installed with `pip` via ``pip install pillow``.

=================
HID Backend Setup
=================

The library core is structured so that it can use one of (potentially) several
alternative HID backend libraries for the actual low level device
communications. You will need to install the dependencies appropriate to your
chosen backend for the library to work correctly.

**Backends:**

.. toctree::
    :glob:
    :maxdepth: 1

    backend_libusb_hidapi.rst



================================================
FILE: doc/source/pages/license.rst
================================================
*******
License
*******

Released under the MIT license below.

.. literalinclude:: ../../../LICENSE



================================================
FILE: doc/source/pages/source.rst
================================================
***********
Source Code
***********

Source code is `available on Github <https://github.com/abcminiuser/python-elgato-streamdeck/>`_. Bug reports, patches, suggestions and other contributions welcome.



================================================
FILE: src/example_animated.py
================================================
#!/usr/bin/env python3

#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

# Example script showing one way to display animated images using the
# library, by pre-rendering all the animation frames into the StreamDeck
# device's native image format, and displaying them with a periodic
# timer.

import itertools
import os
import threading
import time

from fractions import Fraction
from PIL import Image, ImageSequence
from StreamDeck.DeviceManager import DeviceManager
from StreamDeck.ImageHelpers import PILHelper
from StreamDeck.Transport.Transport import TransportError

# Folder location of image assets used by this example.
ASSETS_PATH = os.path.join(os.path.dirname(__file__), "Assets")

# Animation frames per second to attempt to display on the StreamDeck devices.
FRAMES_PER_SECOND = 30


# Loads in a source image, extracts out the individual animation frames (if
# any) and returns a list of animation frames in the StreamDeck device's
# native image format.
def create_animation_frames(deck, image_filename):
    icon_frames = list()

    # Open the source image asset.
    icon = Image.open(os.path.join(ASSETS_PATH, image_filename))

    # Iterate through each animation frame of the source image
    for frame in ImageSequence.Iterator(icon):
        # Create new key image of the correct dimensions, black background.
        frame_image = PILHelper.create_scaled_key_image(deck, frame)

        # Pre-convert the generated image to the native format of the StreamDeck
        # so we don't need to keep converting it when showing it on the device.
        native_frame_image = PILHelper.to_native_key_format(deck, frame_image)

        # Store the rendered animation frame for later user.
        icon_frames.append(native_frame_image)

    # Return the decoded list of frames - the caller will need to decide how to
    # sequence them for display.
    return icon_frames


# Closes the StreamDeck device on key state change.
def key_change_callback(deck, key, state):
    # Use a scoped-with on the deck to ensure we're the only thread using it
    # right now.
    with deck:
        # Reset deck, clearing all button images.
        deck.reset()

        # Close deck handle, terminating internal worker threads.
        deck.close()


if __name__ == "__main__":
    streamdecks = DeviceManager().enumerate()

    print("Found {} Stream Deck(s).\n".format(len(streamdecks)))

    for index, deck in enumerate(streamdecks):
        # This example only works with devices that have screens.
        if not deck.is_visual():
            continue

        deck.open()
        deck.reset()

        print("Opened '{}' device (serial number: '{}')".format(deck.deck_type(), deck.get_serial_number()))

        # Set initial screen brightness to 30%.
        deck.set_brightness(30)

        # Pre-render a list of animation frames for each source image, in the
        # native display format so that they can be quickly sent to the device.
        print("Loading animations...")
        animations = [
            create_animation_frames(deck, "Elephant_Walking_animated.gif"),
            create_animation_frames(deck, "RGB_color_space_animated_view.gif"),
            create_animation_frames(deck, "Simple_CV_Joint_animated.gif"),
        ]
        print("Ready.")

        # Create a mapping of StreamDeck keys to animation image sets that will
        # be displayed.
        key_images = dict()
        for k in range(deck.key_count()):
            # Each key gets an infinite cycle generator bound to the animation
            # frames, so it will loop the animated sequence forever.
            key_images[k] = itertools.cycle(animations[k % len(animations)])

        # Helper function that will run a periodic loop which updates the
        # images on each key.
        def animate(fps):
            # Convert frames per second to frame time in seconds.
            #
            # Frame time often cannot be fully expressed by a float type,
            # meaning that we have to use fractions.
            frame_time = Fraction(1, fps)

            # Get a starting absolute time reference point.
            #
            # We need to use an absolute time clock, instead of relative sleeps
            # with a constant value, to avoid drifting.
            #
            # Drifting comes from an overhead of scheduling the sleep itself -
            # it takes some small amount of time for `time.sleep()` to execute.
            next_frame = Fraction(time.monotonic())

            # Periodic loop that will render every frame at the set FPS until
            # the StreamDeck device we're using is closed.
            while deck.is_open():
                try:
                    # Use a scoped-with on the deck to ensure we're the only
                    # thread using it right now.
                    with deck:
                        # Update the key images with the next animation frame.
                        for key, frames in key_images.items():
                            deck.set_key_image(key, next(frames))
                except TransportError as err:
                    print("TransportError: {0}".format(err))
                    # Something went wrong while communicating with the device
                    # (closed?) - don't re-schedule the next animation frame.
                    break

                # Set the next frame absolute time reference point.
                #
                # We are running at the fixed `fps`, so this is as simple as
                # adding the frame time we calculated earlier.
                next_frame += frame_time

                # Knowing the start of the next frame, we can calculate how long
                # we have to sleep until its start.
                sleep_interval = float(next_frame) - time.monotonic()

                # Schedule the next periodic frame update.
                #
                # `sleep_interval` can be a negative number when current FPS
                # setting is too high for the combination of host and
                # StreamDeck to handle. If this is the case, we skip sleeping
                # immediately render the next frame to try to catch up.
                if sleep_interval >= 0:
                    time.sleep(sleep_interval)

        # Kick off the key image animating thread.
        threading.Thread(target=animate, args=[FRAMES_PER_SECOND]).start()

        # Register callback function for when a key state changes.
        deck.set_key_callback(key_change_callback)

        # Wait until all application threads have terminated (for this example,
        # this is when all deck handles are closed).
        for t in threading.enumerate():
            try:
                t.join()
            except (TransportError, RuntimeError):
                pass



================================================
FILE: src/example_basic.py
================================================
#!/usr/bin/env python3

#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

# Example script showing basic library usage - updating key images with new
# tiles generated at runtime, and responding to button state change events.

import os
import threading

from PIL import Image, ImageDraw, ImageFont
from StreamDeck.DeviceManager import DeviceManager
from StreamDeck.ImageHelpers import PILHelper
from StreamDeck.Transport.Transport import TransportError

# Folder location of image assets used by this example.
ASSETS_PATH = os.path.join(os.path.dirname(__file__), "Assets")


# Generates a custom tile with run-time generated text and custom image via the
# PIL module.
def render_key_image(deck, icon_filename, font_filename, label_text):
    # Resize the source image asset to best-fit the dimensions of a single key,
    # leaving a margin at the bottom so that we can draw the key title
    # afterwards.
    icon = Image.open(icon_filename)
    image = PILHelper.create_scaled_key_image(deck, icon, margins=[0, 0, 20, 0])

    # Load a custom TrueType font and use it to overlay the key index, draw key
    # label onto the image a few pixels from the bottom of the key.
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype(font_filename, 14)
    draw.text((image.width / 2, image.height - 5), text=label_text, font=font, anchor="ms", fill="white")

    return PILHelper.to_native_key_format(deck, image)


# Returns styling information for a key based on its position and state.
def get_key_style(deck, key, state):
    # Last button in the example application is the exit button.
    exit_key_index = deck.key_count() - 1

    if key == exit_key_index:
        name = "exit"
        icon = "{}.png".format("Exit")
        font = "Roboto-Regular.ttf"
        label = "Bye" if state else "Exit"
    else:
        name = "emoji"
        icon = "{}.png".format("Pressed" if state else "Released")
        font = "Roboto-Regular.ttf"
        label = "Pressed!" if state else "Key {}".format(key)

    return {
        "name": name,
        "icon": os.path.join(ASSETS_PATH, icon),
        "font": os.path.join(ASSETS_PATH, font),
        "label": label
    }


# Creates a new key image based on the key index, style and current key state
# and updates the image on the StreamDeck.
def update_key_image(deck, key, state):
    # Determine what icon and label to use on the generated key.
    key_style = get_key_style(deck, key, state)

    # Generate the custom key with the requested image and label.
    image = render_key_image(deck, key_style["icon"], key_style["font"], key_style["label"])

    # Use a scoped-with on the deck to ensure we're the only thread using it
    # right now.
    with deck:
        # Update requested key with the generated image.
        deck.set_key_image(key, image)


# Prints key state change information, updates rhe key image and performs any
# associated actions when a key is pressed.
def key_change_callback(deck, key, state):
    # Print new key state
    print("Deck {} Key {} = {}".format(deck.id(), key, state), flush=True)

    # Don't try to draw an image on a touch button
    if key >= deck.key_count():
        return

    # Update the key image based on the new key state.
    update_key_image(deck, key, state)

    # Check if the key is changing to the pressed state.
    if state:
        key_style = get_key_style(deck, key, state)

        # When an exit button is pressed, close the application.
        if key_style["name"] == "exit":
            # Use a scoped-with on the deck to ensure we're the only thread
            # using it right now.
            with deck:
                # Reset deck, clearing all button images.
                deck.reset()

                # Close deck handle, terminating internal worker threads.
                deck.close()


if __name__ == "__main__":
    streamdecks = DeviceManager().enumerate()

    print("Found {} Stream Deck(s).\n".format(len(streamdecks)))

    for index, deck in enumerate(streamdecks):
        # This example only works with devices that have screens.
        if not deck.is_visual():
            continue

        deck.open()
        deck.reset()

        print("Opened '{}' device (serial number: '{}', fw: '{}')".format(
            deck.deck_type(), deck.get_serial_number(), deck.get_firmware_version()
        ))

        # Set initial screen brightness to 30%.
        deck.set_brightness(30)

        # Set initial key images.
        for key in range(deck.key_count()):
            update_key_image(deck, key, False)

        # Register callback function for when a key state changes.
        deck.set_key_callback(key_change_callback)

        # Wait until all application threads have terminated (for this example,
        # this is when all deck handles are closed).
        for t in threading.enumerate():
            try:
                t.join()
            except (TransportError, RuntimeError):
                pass



================================================
FILE: src/example_deckinfo.py
================================================
#!/usr/bin/env python3

#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

# Example script that prints out information about any discovered StreamDeck
# devices to the console.

from StreamDeck.DeviceManager import DeviceManager


# Prints diagnostic information about a given StreamDeck.
def print_deck_info(index, deck):
    key_image_format = deck.key_image_format()
    touchscreen_image_format = deck.touchscreen_image_format()

    flip_description = {
        (False, False): "not mirrored",
        (True, False): "mirrored horizontally",
        (False, True): "mirrored vertically",
        (True, True): "mirrored horizontally/vertically",
    }

    print("Deck {} - {}.".format(index, deck.deck_type()))
    print("\t - ID: {}".format(deck.id()))
    print("\t - Serial: '{}'".format(deck.get_serial_number()))
    print("\t - Firmware Version: '{}'".format(deck.get_firmware_version()))
    print("\t - Key Count: {} (in a {}x{} grid)".format(
        deck.key_count(),
        deck.key_layout()[0],
        deck.key_layout()[1]))
    if deck.is_visual():
        print("\t - Key Images: {}x{} pixels, {} format, rotated {} degrees, {}".format(
            key_image_format['size'][0],
            key_image_format['size'][1],
            key_image_format['format'],
            key_image_format['rotation'],
            flip_description[key_image_format['flip']]))

        if deck.is_touch():
            print("\t - Touchscreen: {}x{} pixels, {} format, rotated {} degrees, {}".format(
                touchscreen_image_format['size'][0],
                touchscreen_image_format['size'][1],
                touchscreen_image_format['format'],
                touchscreen_image_format['rotation'],
                flip_description[touchscreen_image_format['flip']]))
    else:
        print("\t - No Visual Output")


if __name__ == "__main__":
    streamdecks = DeviceManager().enumerate()

    print("Found {} Stream Deck(s).\n".format(len(streamdecks)))

    for index, deck in enumerate(streamdecks):
        deck.open()
        deck.reset()

        print_deck_info(index, deck)

        deck.close()



================================================
FILE: src/example_neo.py
================================================
#!/usr/bin/env python3

#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

# Example script showing basic library usage - updating key images with new
# tiles generated at runtime, and responding to button state change events.

import os
import threading
import random

from PIL import Image, ImageDraw, ImageFont
from StreamDeck.DeviceManager import DeviceManager
from StreamDeck.ImageHelpers import PILHelper
from StreamDeck.Transport.Transport import TransportError

# Folder location of image assets used by this example.
ASSETS_PATH = os.path.join(os.path.dirname(__file__), "Assets")


# Generates a custom tile with run-time generated text and custom image via the
# PIL module.
def render_key_image(deck, icon_filename, font_filename, label_text):
    # Resize the source image asset to best-fit the dimensions of a single key,
    # leaving a margin at the bottom so that we can draw the key title
    # afterwards.
    icon = Image.open(icon_filename)
    image = PILHelper.create_scaled_key_image(deck, icon, margins=[0, 0, 20, 0])

    # Load a custom TrueType font and use it to overlay the key index, draw key
    # label onto the image a few pixels from the bottom of the key.
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype(font_filename, 14)
    draw.text((image.width / 2, image.height - 5), text=label_text, font=font, anchor="ms", fill="white")

    return PILHelper.to_native_key_format(deck, image)


# Generate an image for the screen
def render_screen_image(deck, font_filename, text):
    image = PILHelper.create_screen_image(deck)
    # Load a custom TrueType font and use it to create an image
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype(font_filename, 20)
    draw.text((image.width / 2, image.height - 25), text=text, font=font, anchor="ms", fill="white")

    return PILHelper.to_native_screen_format(deck, image)


# Returns styling information for a key based on its position and state.
def get_key_style(deck, key, state):
    # Last button in the example application is the exit button.
    exit_key_index = deck.key_count() - 1

    if key == exit_key_index:
        name = "exit"
        icon = "{}.png".format("Exit")
        font = "Roboto-Regular.ttf"
        label = "Bye" if state else "Exit"
    else:
        name = "emoji"
        icon = "{}.png".format("Pressed" if state else "Released")
        font = "Roboto-Regular.ttf"
        label = "Pressed!" if state else "Key {}".format(key)

    return {
        "name": name,
        "icon": os.path.join(ASSETS_PATH, icon),
        "font": os.path.join(ASSETS_PATH, font),
        "label": label
    }


# Creates a new key image based on the key index, style and current key state
# and updates the image on the StreamDeck.
def update_key_image(deck, key, state):
    # Determine what icon and label to use on the generated key.
    key_style = get_key_style(deck, key, state)

    # Generate the custom key with the requested image and label.
    image = render_key_image(deck, key_style["icon"], key_style["font"], key_style["label"])

    # Use a scoped-with on the deck to ensure we're the only thread using it
    # right now.
    with deck:
        # Update requested key with the generated image.
        deck.set_key_image(key, image)


# Prints key state change information, updates the key image and performs any
# associated actions when a key is pressed.
def key_change_callback(deck, key, state):
    # Print new key state
    print("Deck {} Key {} = {}".format(deck.id(), key, state), flush=True)

    # Don't try to set an image for touch buttons but set a random color
    if key >= deck.key_count():
        set_random_touch_color(deck, key)
        return

    # Update the key image based on the new key state.
    update_key_image(deck, key, state)

    # Check if the key is changing to the pressed state.
    if state:
        key_style = get_key_style(deck, key, state)

        # When an exit button is pressed, close the application.
        if key_style["name"] == "exit":
            # Use a scoped-with on the deck to ensure we're the only thread
            # using it right now.
            with deck:
                # Reset deck, clearing all button images.
                deck.reset()

                # Close deck handle, terminating internal worker threads.
                deck.close()


# Set a random color for the specified key
def set_random_touch_color(deck, key):
    r = random.randint(0, 255)
    g = random.randint(0, 255)
    b = random.randint(0, 255)

    deck.set_key_color(key, r, g, b)


if __name__ == "__main__":
    streamdecks = DeviceManager().enumerate()

    print("Found {} Stream Deck(s).\n".format(len(streamdecks)))

    for index, deck in enumerate(streamdecks):
        # This example only works with devices that have screens.
        if not deck.is_visual():
            continue

        deck.open()
        deck.reset()

        print("Opened '{}' device (serial number: '{}', fw: '{}')".format(
            deck.deck_type(), deck.get_serial_number(), deck.get_firmware_version()
        ))

        # Set initial screen brightness to 30%.
        deck.set_brightness(30)

        # Set initial key images.
        for key in range(deck.key_count()):
            update_key_image(deck, key, False)

        # Register callback function for when a key state changes.
        deck.set_key_callback(key_change_callback)

        # Set a screen image
        image = render_screen_image(deck, os.path.join(ASSETS_PATH, "Roboto-Regular.ttf"), "Python StreamDeck")
        deck.set_screen_image(image)

        # Wait until all application threads have terminated (for this example,
        # this is when all deck handles are closed).
        for t in threading.enumerate():
            try:
                t.join()
            except (TransportError, RuntimeError):
                pass



================================================
FILE: src/example_pedal.py
================================================
#!/usr/bin/env python3

#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

# Example script showing basic library usage, printing button presses. This
# example only shows key events, and is intended to demonstrate how to get
# such events from device that lack screens, i.e. the StreamDeck Pedal.

import threading

from StreamDeck.DeviceManager import DeviceManager
from StreamDeck.Transport.Transport import TransportError


def key_change_callback(deck, key, state):
    print("Deck {} Key {} = {}".format(deck.id(), key, "down" if state else "up"), flush=True)


if __name__ == "__main__":
    streamdecks = DeviceManager().enumerate()

    print("Found {} Stream Deck(s).\n".format(len(streamdecks)))

    for index, deck in enumerate(streamdecks):
        deck.open()

        print("Opened '{}' device (serial number: '{}', fw: '{}')".format(
            deck.deck_type(), deck.get_serial_number(), deck.get_firmware_version()
        ))

        # Register callback function for when a key state changes.
        deck.set_key_callback(key_change_callback)

        # Wait until all application threads have terminated (for this example,
        # this is when all deck handles are closed).
        for t in threading.enumerate():
            try:
                t.join()
            except (TransportError, RuntimeError):
                pass



================================================
FILE: src/example_plus.py
================================================
#!/usr/bin/env python3

#         Python Stream Deck Library
#      Released under the MIT license
#
#

# Example script showing some Stream Deck + specific functions

import os
import threading
import io

from PIL import Image
from StreamDeck.DeviceManager import DeviceManager
from StreamDeck.Devices.StreamDeck import DialEventType, TouchscreenEventType
from StreamDeck.Transport.Transport import TransportError

# Folder location of image assets used by this example.
ASSETS_PATH = os.path.join(os.path.dirname(__file__), "Assets")

# image for idle state
img = Image.new('RGB', (120, 120), color='black')
released_icon = Image.open(os.path.join(ASSETS_PATH, 'Released.png')).resize((80, 80))
img.paste(released_icon, (20, 20), released_icon)

img_byte_arr = io.BytesIO()
img.save(img_byte_arr, format='JPEG')
img_released_bytes = img_byte_arr.getvalue()

# image for pressed state
img = Image.new('RGB', (120, 120), color='black')
pressed_icon = Image.open(os.path.join(ASSETS_PATH, 'Pressed.png')).resize((80, 80))
img.paste(pressed_icon, (20, 20), pressed_icon)

img_byte_arr = io.BytesIO()
img.save(img_byte_arr, format='JPEG')
img_pressed_bytes = img_byte_arr.getvalue()


# callback when buttons are pressed or released
def key_change_callback(deck, key, key_state):
    print("Key: " + str(key) + " state: " + str(key_state))

    deck.set_key_image(key, img_pressed_bytes if key_state else img_released_bytes)


# callback when dials are pressed or released
def dial_change_callback(deck, dial, event, value):
    if event == DialEventType.PUSH:
        print(f"dial pushed: {dial} state: {value}")
        if dial == 3 and value:
            deck.reset()
            deck.close()
        else:
            # build an image for the touch lcd
            img = Image.new('RGB', (800, 100), 'black')
            icon = Image.open(os.path.join(ASSETS_PATH, 'Exit.png')).resize((80, 80))
            img.paste(icon, (690, 10), icon)

            for k in range(0, deck.DIAL_COUNT - 1):
                img.paste(pressed_icon if (dial == k and value) else released_icon, (30 + (k * 220), 10),
                          pressed_icon if (dial == k and value) else released_icon)

            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='JPEG')
            img_byte_arr = img_byte_arr.getvalue()

            deck.set_touchscreen_image(img_byte_arr, 0, 0, 800, 100)
    elif event == DialEventType.TURN:
        print(f"dial {dial} turned: {value}")


# callback when lcd is touched
def touchscreen_event_callback(deck, evt_type, value):
    if evt_type == TouchscreenEventType.SHORT:
        print("Short touch @ " + str(value['x']) + "," + str(value['y']))

    elif evt_type == TouchscreenEventType.LONG:

        print("Long touch @ " + str(value['x']) + "," + str(value['y']))

    elif evt_type == TouchscreenEventType.DRAG:

        print("Drag started @ " + str(value['x']) + "," + str(value['y']) + " ended @ " + str(value['x_out']) + "," + str(value['y_out']))


if __name__ == "__main__":
    streamdecks = DeviceManager().enumerate()

    print("Found {} Stream Deck(s).\n".format(len(streamdecks)))

    for index, deck in enumerate(streamdecks):
        # This example only works with devices that have screens.

        if deck.DECK_TYPE != 'Stream Deck +':
            print(deck.DECK_TYPE)
            print("Sorry, this example only works with Stream Deck +")
            continue

        deck.open()
        deck.reset()

        deck.set_key_callback(key_change_callback)
        deck.set_dial_callback(dial_change_callback)
        deck.set_touchscreen_callback(touchscreen_event_callback)

        print("Opened '{}' device (serial number: '{}')".format(deck.deck_type(), deck.get_serial_number()))

        # Set initial screen brightness to 30%.
        deck.set_brightness(100)

        for key in range(0, deck.KEY_COUNT):
            deck.set_key_image(key, img_released_bytes)

        # build an image for the touch lcd
        img = Image.new('RGB', (800, 100), 'black')
        icon = Image.open(os.path.join(ASSETS_PATH, 'Exit.png')).resize((80, 80))
        img.paste(icon, (690, 10), icon)

        for dial in range(0, deck.DIAL_COUNT - 1):
            img.paste(released_icon, (30 + (dial * 220), 10), released_icon)

        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        touchscreen_image_bytes = img_bytes.getvalue()

        deck.set_touchscreen_image(touchscreen_image_bytes, 0, 0, 800, 100)

        # Wait until all application threads have terminated (for this example,
        # this is when all deck handles are closed).
        for t in threading.enumerate():
            try:
                t.join()
            except (TransportError, RuntimeError):
                pass



================================================
FILE: src/example_studio.py
================================================
#!/usr/bin/env python3

#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

# Example script showing basic library usage - updating key images with new
# tiles generated at runtime, and responding to button state change events.

import os
import threading

from PIL import Image, ImageDraw, ImageFont
from StreamDeck.DeviceManager import DeviceManager
from StreamDeck.ImageHelpers import PILHelper
from StreamDeck.Transport.Transport import TransportError
from StreamDeck.Devices.StreamDeck import DialEventType

# Folder location of image assets used by this example.
ASSETS_PATH = os.path.join(os.path.dirname(__file__), "Assets")

dial_value = 0


# Generates a custom tile with run-time generated text and custom image via the
# PIL module.
def render_key_image(deck, icon_filename, font_filename, label_text):
    # Resize the source image asset to best-fit the dimensions of a single key,
    # leaving a margin at the bottom so that we can draw the key title
    # afterwards.
    icon = Image.open(icon_filename)
    image = PILHelper.create_scaled_key_image(deck, icon, margins=(0, 0, 0, 0))

    # Load a custom TrueType font and use it to overlay the key index, draw key
    # label onto the image a few pixels from the bottom of the key.
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype(font_filename, 14)
    draw.text((image.width / 2, image.height - 5), text=label_text, font=font, anchor="ms", fill="white")

    return PILHelper.to_native_key_format(deck, image)


# Returns styling information for a key based on its position and state.
def get_key_style(deck, key, state):
    # Last button in the example application is the exit button.
    exit_key_index = deck.key_count() - 1

    if key == exit_key_index:
        name = "exit"
        icon = "{}.png".format("Exit")
        font = "Roboto-Regular.ttf"
        label = "Bye" if state else "Exit"
    else:
        name = "emoji"
        icon = "{}.png".format("Pressed" if state else "Released")
        font = "Roboto-Regular.ttf"
        label = "Pressed!" if state else "Key {}".format(key)

    return {
        "name": name,
        "icon": os.path.join(ASSETS_PATH, icon),
        "font": os.path.join(ASSETS_PATH, font),
        "label": label
    }


# Creates a new key image based on the key index, style and current key state
# and updates the image on the StreamDeck.
def update_key_image(deck, key, state):
    # Determine what icon and label to use on the generated key.
    key_style = get_key_style(deck, key, state)

    # Generate the custom key with the requested image and label.
    image = render_key_image(deck, key_style["icon"], key_style["font"], key_style["label"])

    # Use a scoped-with on the deck to ensure we're the only thread using it
    # right now.
    with deck:
        # Update requested key with the generated image.
        deck.set_key_image(key, image)


# Prints key state change information, updates rhe key image and performs any
# associated actions when a key is pressed.
def key_change_callback(deck, key, state):
    # Print new key state
    print("Deck {} Key {} = {}".format(deck.id(), key, state), flush=True)
    rgb = (255 * (key % 3 == 0), 255 * (key % 3 == 1), 255 * (key % 3 == 2))
    deck.set_encoder_knob_color(key, rgb)
    deck.set_encoder_ring_percentage(0, rgb, key * 100 / 31, 24)
    deck.set_encoder_ring_percentage(1, rgb, key * 100 / 31, 24)

    # Don't try to draw an image on a touch button
    if key >= deck.key_count():
        return

    # Update the key image based on the new key state.
    update_key_image(deck, key, state)
    # deck.set_key_image(key, None)

    # Check if the key is changing to the pressed state.
    if state:
        key_style = get_key_style(deck, key, state)

        # When an exit button is pressed, close the application.
        if key_style["name"] == "exit":
            # Use a scoped-with on the deck to ensure we're the only thread
            # using it right now.
            with deck:
                # Reset deck, clearing all button images.
                deck.reset()

                # Close deck handle, terminating internal worker threads.
                deck.close()


def dial_change_callback(deck, dial, event, value):
    global dial_value
    if event == DialEventType.PUSH:
        print(f"dial pushed: {dial} state: {value}")
    elif event == DialEventType.TURN:
        print(f"dial {dial} turned: {value}")
        dial_value += value
        if dial_value < 0:
            dial_value = 0
        elif dial_value > 100:
            dial_value = 100
        deck.set_encoder_ring_value(dial, (0, 255, 0), dial_value, 24)


if __name__ == "__main__":
    streamdecks = DeviceManager().enumerate()

    print("Found {} Stream Deck(s).\n".format(len(streamdecks)))

    for index, deck in enumerate(streamdecks):
        # This example only works with devices that have screens.
        if not deck.is_visual():
            continue

        deck.open()
        deck.reset()

        print("Opened '{}' device (serial number: '{}', fw: '{}')".format(
            deck.deck_type(), deck.get_serial_number(), deck.get_firmware_version()
        ))

        # Set initial screen brightness to 30%.
        deck.set_brightness(30)

        # Set initial key images.
        for key in range(deck.key_count()):
            # deck.set_key_image(key, None)
            update_key_image(deck, key, False)

        # Register callback function for when a key state changes.
        deck.set_key_callback(key_change_callback)
        deck.set_dial_callback(dial_change_callback)

        # Wait until all application threads have terminated (for this example,
        # this is when all deck handles are closed).
        for t in threading.enumerate():
            try:
                t.join()
            except (TransportError, RuntimeError):
                pass



================================================
FILE: src/example_tileimage.py
================================================
#!/usr/bin/env python3

#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

# Example script showing how to tile a larger image across multiple buttons, by
# first generating an image suitable for the entire deck, then cropping out and
# applying key-sized tiles to individual keys of a StreamDeck.

import os
import threading

from PIL import Image, ImageOps
from StreamDeck.DeviceManager import DeviceManager
from StreamDeck.ImageHelpers import PILHelper
from StreamDeck.Transport.Transport import TransportError

# Folder location of image assets used by this example.
ASSETS_PATH = os.path.join(os.path.dirname(__file__), "Assets")


# Generates an image that is correctly sized to fit across all keys of a given
# StreamDeck.
def create_full_deck_sized_image(deck, key_spacing, image_filename):
    key_rows, key_cols = deck.key_layout()
    key_width, key_height = deck.key_image_format()['size']
    spacing_x, spacing_y = key_spacing

    # Compute total size of the full StreamDeck image, based on the number of
    # buttons along each axis. This doesn't take into account the spaces between
    # the buttons that are hidden by the bezel.
    key_width *= key_cols
    key_height *= key_rows

    # Compute the total number of extra non-visible pixels that are obscured by
    # the bezel of the StreamDeck.
    spacing_x *= key_cols - 1
    spacing_y *= key_rows - 1

    # Compute final full deck image size, based on the number of buttons and
    # obscured pixels.
    full_deck_image_size = (key_width + spacing_x, key_height + spacing_y)

    # Resize the image to suit the StreamDeck's full image size. We use the
    # helper function in Pillow's ImageOps module so that the image's aspect
    # ratio is preserved.
    image = Image.open(os.path.join(ASSETS_PATH, image_filename)).convert("RGBA")
    image = ImageOps.fit(image, full_deck_image_size, Image.LANCZOS)
    return image


# Crops out a key-sized image from a larger deck-sized image, at the location
# occupied by the given key index.
def crop_key_image_from_deck_sized_image(deck, image, key_spacing, key):
    key_rows, key_cols = deck.key_layout()
    key_width, key_height = deck.key_image_format()['size']
    spacing_x, spacing_y = key_spacing

    # Determine which row and column the requested key is located on.
    row = key // key_cols
    col = key % key_cols

    # Compute the starting X and Y offsets into the full size image that the
    # requested key should display.
    start_x = col * (key_width + spacing_x)
    start_y = row * (key_height + spacing_y)

    # Compute the region of the larger deck image that is occupied by the given
    # key, and crop out that segment of the full image.
    region = (start_x, start_y, start_x + key_width, start_y + key_height)
    segment = image.crop(region)

    # Create a new key-sized image, and paste in the cropped section of the
    # larger image.
    key_image = PILHelper.create_key_image(deck)
    key_image.paste(segment)

    return PILHelper.to_native_key_format(deck, key_image)


# Closes the StreamDeck device on key state change.
def key_change_callback(deck, key, state):
    # Use a scoped-with on the deck to ensure we're the only thread using it
    # right now.
    with deck:
        # Reset deck, clearing all button images.
        deck.reset()

        # Close deck handle, terminating internal worker threads.
        deck.close()


if __name__ == "__main__":
    streamdecks = DeviceManager().enumerate()

    print("Found {} Stream Deck(s).\n".format(len(streamdecks)))

    for index, deck in enumerate(streamdecks):
        # This example only works with devices that have screens.
        if not deck.is_visual():
            continue

        deck.open()
        deck.reset()

        print("Opened '{}' device (serial number: '{}')".format(deck.deck_type(), deck.get_serial_number()))

        # Set initial screen brightness to 30%.
        deck.set_brightness(30)

        # Approximate number of (non-visible) pixels between each key, so we can
        # take those into account when cutting up the image to show on the keys.
        key_spacing = (36, 36)

        # Load and resize a source image so that it will fill the given
        # StreamDeck.
        image = create_full_deck_sized_image(deck, key_spacing, "Harold.jpg")

        print("Created full deck image size of {}x{} pixels.".format(image.width, image.height))

        # Extract out the section of the image that is occupied by each key.
        key_images = dict()
        for k in range(deck.key_count()):
            key_images[k] = crop_key_image_from_deck_sized_image(deck, image, key_spacing, k)

        # Use a scoped-with on the deck to ensure we're the only thread
        # using it right now.
        with deck:
            # Draw the individual key images to each of the keys.
            for k in range(deck.key_count()):
                key_image = key_images[k]

                # Show the section of the main image onto the key.
                deck.set_key_image(k, key_image)

        # Register callback function for when a key state changes.
        deck.set_key_callback(key_change_callback)

        # Wait until all application threads have terminated (for this example,
        # this is when all deck handles are closed).
        for t in threading.enumerate():
            try:
                t.join()
            except (TransportError, RuntimeError):
                pass



================================================
FILE: src/Assets/Apache License 2.0.txt
================================================
Apache License, Version 2.0 Apache License Version 2.0, January 2004 http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

"License" shall mean the terms and conditions for use, reproduction, and distribution as defined by Sections 1 through 9 of this document.

"Licensor" shall mean the copyright owner or entity authorized by the copyright owner that is granting the License.

"Legal Entity" shall mean the union of the acting entity and all other entities that control, are controlled by, or are under common control with that entity. For the purposes of this definition, "control" means (i) the power, direct or indirect, to cause the direction or management of such entity, whether by contract or otherwise, or (ii) ownership of fifty percent (50%) or more of the outstanding shares, or (iii) beneficial ownership of such entity.

"You" (or "Your") shall mean an individual or Legal Entity exercising permissions granted by this License.

"Source" form shall mean the preferred form for making modifications, including but not limited to software source code, documentation source, and configuration files.

"Object" form shall mean any form resulting from mechanical transformation or translation of a Source form, including but not limited to compiled object code, generated documentation, and conversions to other media types.

"Work" shall mean the work of authorship, whether in Source or Object form, made available under the License, as indicated by a copyright notice that is included in or attached to the work (an example is provided in the Appendix below).

"Derivative Works" shall mean any work, whether in Source or Object form, that is based on (or derived from) the Work and for which the editorial revisions, annotations, elaborations, or other modifications represent, as a whole, an original work of authorship. For the purposes of this License, Derivative Works shall not include works that remain separable from, or merely link (or bind by name) to the interfaces of, the Work and Derivative Works thereof.

"Contribution" shall mean any work of authorship, including the original version of the Work and any modifications or additions to that Work or Derivative Works thereof, that is intentionally submitted to Licensor for inclusion in the Work by the copyright owner or by an individual or Legal Entity authorized to submit on behalf of the copyright owner. For the purposes of this definition, "submitted" means any form of electronic, verbal, or written communication sent to the Licensor or its representatives, including but not limited to communication on electronic mailing lists, source code control systems, and issue tracking systems that are managed by, or on behalf of, the Licensor for the purpose of discussing and improving the Work, but excluding communication that is conspicuously marked or otherwise designated in writing by the copyright owner as "Not a Contribution."

"Contributor" shall mean Licensor and any individual or Legal Entity on behalf of whom a Contribution has been received by Licensor and subsequently incorporated within the Work.

2. Grant of Copyright License.

Subject to the terms and conditions of this License, each Contributor hereby grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to reproduce, prepare Derivative Works of, publicly display, publicly perform, sublicense, and distribute the Work and such Derivative Works in Source or Object form.

3. Grant of Patent License.

Subject to the terms and conditions of this License, each Contributor hereby grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable (except as stated in this section) patent license to make, have made, use, offer to sell, sell, import, and otherwise transfer the Work, where such license applies only to those patent claims licensable by such Contributor that are necessarily infringed by their Contribution(s) alone or by combination of their Contribution(s) with the Work to which such Contribution(s) was submitted. If You institute patent litigation against any entity (including a cross-claim or counterclaim in a lawsuit) alleging that the Work or a Contribution incorporated within the Work constitutes direct or contributory patent infringement, then any patent licenses granted to You under this License for that Work shall terminate as of the date such litigation is filed.

4. Redistribution.

You may reproduce and distribute copies of the Work or Derivative Works thereof in any medium, with or without modifications, and in Source or Object form, provided that You meet the following conditions:

You must give any other recipients of the Work or Derivative Works a copy of this License; and You must cause any modified files to carry prominent notices stating that You changed the files; and You must retain, in the Source form of any Derivative Works that You distribute, all copyright, patent, trademark, and attribution notices from the Source form of the Work, excluding those notices that do not pertain to any part of the Derivative Works; and If the Work includes a "NOTICE" text file as part of its distribution, then any Derivative Works that You distribute must include a readable copy of the attribution notices contained within such NOTICE file, excluding those notices that do not pertain to any part of the Derivative Works, in at least one of the following places: within a NOTICE text file distributed as part of the Derivative Works; within the Source form or documentation, if provided along with the Derivative Works; or, within a display generated by the Derivative Works, if and wherever such third-party notices normally appear. The contents of the NOTICE file are for informational purposes only and do not modify the License. You may add Your own attribution notices within Derivative Works that You distribute, alongside or as an addendum to the NOTICE text from the Work, provided that such additional attribution notices cannot be construed as modifying the License. You may add Your own copyright statement to Your modifications and may provide additional or different license terms and conditions for use, reproduction, or distribution of Your modifications, or for any such Derivative Works as a whole, provided Your use, reproduction, and distribution of the Work otherwise complies with the conditions stated in this License.

5. Submission of Contributions.

Unless You explicitly state otherwise, any Contribution intentionally submitted for inclusion in the Work by You to the Licensor shall be under the terms and conditions of this License, without any additional terms or conditions. Notwithstanding the above, nothing herein shall supersede or modify the terms of any separate license agreement you may have executed with Licensor regarding such Contributions.

6. Trademarks.

This License does not grant permission to use the trade names, trademarks, service marks, or product names of the Licensor, except as required for reasonable and customary use in describing the origin of the Work and reproducing the content of the NOTICE file.

7. Disclaimer of Warranty.

Unless required by applicable law or agreed to in writing, Licensor provides the Work (and each Contributor provides its Contributions) on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied, including, without limitation, any warranties or conditions of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A PARTICULAR PURPOSE. You are solely responsible for determining the appropriateness of using or redistributing the Work and assume any risks associated with Your exercise of permissions under this License.

8. Limitation of Liability.

In no event and under no legal theory, whether in tort (including negligence), contract, or otherwise, unless required by applicable law (such as deliberate and grossly negligent acts) or agreed to in writing, shall any Contributor be liable to You for damages, including any direct, indirect, special, incidental, or consequential damages of any character arising as a result of this License or out of the use or inability to use the Work (including but not limited to damages for loss of goodwill, work stoppage, computer failure or malfunction, or any and all other commercial damages or losses), even if such Contributor has been advised of the possibility of such damages.

9. Accepting Warranty or Additional Liability.

While redistributing the Work or Derivative Works thereof, You may choose to offer, and charge a fee for, acceptance of support, warranty, indemnity, or other liability obligations and/or rights consistent with this License. However, in accepting such obligations, You may act only on Your own behalf and on Your sole responsibility, not on behalf of any other Contributor, and only if You agree to indemnify, defend, and hold each Contributor harmless for any liability incurred by, or claims asserted against, such Contributor by reason of your accepting any such warranty or additional liability.

END OF TERMS AND CONDITIONS

APPENDIX: How to apply the Apache License to your work

To apply the Apache License to your work, attach the following boilerplate notice, with the fields enclosed by brackets "[]" replaced with your own identifying information. (Don't include the brackets!) The text should be enclosed in the appropriate comment syntax for the file format. We also recommend that a file or class name and description of purpose be included on the same "printed page" as the copyright notice for easier identification within third-party archives.

Copyright [yyyy] [name of copyright owner]

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.



================================================
FILE: src/Assets/Attribution.txt
================================================
List of assets and their associated licenses:


- Elephant_Walking_animated.gif

	Source/Author:	Wikimedia Commons
	License:		Public domain
	URL:			https://commons.wikimedia.org/wiki/File:Elephant_walking.jpg

- Exit.png

	Source/Author:	Gradient Icons by Abhishek Pipalva
	License:		CC BY-SA 3.0
	URL:			https://www.iconfinder.com/abhishekpipalva

- Pressed.png

	Source/Author:	Emoji Icons by bukeicon
	License:		CC BY-SA 3.0
	URL:			https://www.iconfinder.com/iconsets/emoji-18

- Harold.jpg

	Source/Author:	Dean Camera
	Licence:		CC0 (Public Domain)
	URL:			https://www.fourwalledcubicle.com

- Released.png

	Source/Author:	Emoji Icons by bukeicon
	License:		CC BY-SA 3.0
	URL:			https://www.iconfinder.com/iconsets/emoji-18

- RGB_color_space_animated_view.gif

	Source/Author:	Wikimedia Commons
	License:		CC0 (Public domain)
	URL:			https://commons.wikimedia.org/wiki/File:RGB_color_space_animated_view.gif

- Roboto-Regular.ttf

	Source/Author:	Roboto Font by Google
	Licence:		Apache License 2.0
	URL:			https://fonts.google.com/specimen/Roboto

- Simple_CV_Joint_animated.gif

	Source/Author:	Wikimedia Commons
	License:		Public domain
	URL:			https://commons.wikimedia.org/wiki/File:Simple_CV_Joint_animated.gif



================================================
FILE: src/Assets/CC BY-SA 3.0 License.txt
================================================
     CREATIVE COMMONS CORPORATION IS NOT A LAW FIRM AND DOES NOT PROVIDE LEGAL SERVICES. DISTRIBUTION OF THIS LICENSE DOES NOT CREATE AN ATTORNEY-CLIENT RELATIONSHIP. CREATIVE COMMONS PROVIDES THIS INFORMATION ON AN "AS-IS" BASIS. CREATIVE COMMONS MAKES NO WARRANTIES REGARDING THE INFORMATION PROVIDED, AND DISCLAIMS LIABILITY FOR DAMAGES RESULTING FROM ITS USE.

License

THE WORK (AS DEFINED BELOW) IS PROVIDED UNDER THE TERMS OF THIS CREATIVE COMMONS PUBLIC LICENSE ("CCPL" OR "LICENSE"). THE WORK IS PROTECTED BY COPYRIGHT AND/OR OTHER APPLICABLE LAW. ANY USE OF THE WORK OTHER THAN AS AUTHORIZED UNDER THIS LICENSE OR COPYRIGHT LAW IS PROHIBITED.

BY EXERCISING ANY RIGHTS TO THE WORK PROVIDED HERE, YOU ACCEPT AND AGREE TO BE BOUND BY THE TERMS OF THIS LICENSE. TO THE EXTENT THIS LICENSE MAY BE CONSIDERED TO BE A CONTRACT, THE LICENSOR GRANTS YOU THE RIGHTS CONTAINED HERE IN CONSIDERATION OF YOUR ACCEPTANCE OF SUCH TERMS AND CONDITIONS.

1. Definitions

    "Adaptation" means a work based upon the Work, or upon the Work and other pre-existing works, such as a translation, adaptation, derivative work, arrangement of music or other alterations of a literary or artistic work, or phonogram or performance and includes cinematographic adaptations or any other form in which the Work may be recast, transformed, or adapted including in any form recognizably derived from the original, except that a work that constitutes a Collection will not be considered an Adaptation for the purpose of this License. For the avoidance of doubt, where the Work is a musical work, performance or phonogram, the synchronization of the Work in timed-relation with a moving image ("synching") will be considered an Adaptation for the purpose of this License.
    "Collection" means a collection of literary or artistic works, such as encyclopedias and anthologies, or performances, phonograms or broadcasts, or other works or subject matter other than works listed in Section 1(f) below, which, by reason of the selection and arrangement of their contents, constitute intellectual creations, in which the Work is included in its entirety in unmodified form along with one or more other contributions, each constituting separate and independent works in themselves, which together are assembled into a collective whole. A work that constitutes a Collection will not be considered an Adaptation (as defined below) for the purposes of this License.
    "Creative Commons Compatible License" means a license that is listed at https://creativecommons.org/compatiblelicenses that has been approved by Creative Commons as being essentially equivalent to this License, including, at a minimum, because that license: (i) contains terms that have the same purpose, meaning and effect as the License Elements of this License; and, (ii) explicitly permits the relicensing of adaptations of works made available under that license under this License or a Creative Commons jurisdiction license with the same License Elements as this License.
    "Distribute" means to make available to the public the original and copies of the Work or Adaptation, as appropriate, through sale or other transfer of ownership.
    "License Elements" means the following high-level license attributes as selected by Licensor and indicated in the title of this License: Attribution, ShareAlike.
    "Licensor" means the individual, individuals, entity or entities that offer(s) the Work under the terms of this License.
    "Original Author" means, in the case of a literary or artistic work, the individual, individuals, entity or entities who created the Work or if no individual or entity can be identified, the publisher; and in addition (i) in the case of a performance the actors, singers, musicians, dancers, and other persons who act, sing, deliver, declaim, play in, interpret or otherwise perform literary or artistic works or expressions of folklore; (ii) in the case of a phonogram the producer being the person or legal entity who first fixes the sounds of a performance or other sounds; and, (iii) in the case of broadcasts, the organization that transmits the broadcast.
    "Work" means the literary and/or artistic work offered under the terms of this License including without limitation any production in the literary, scientific and artistic domain, whatever may be the mode or form of its expression including digital form, such as a book, pamphlet and other writing; a lecture, address, sermon or other work of the same nature; a dramatic or dramatico-musical work; a choreographic work or entertainment in dumb show; a musical composition with or without words; a cinematographic work to which are assimilated works expressed by a process analogous to cinematography; a work of drawing, painting, architecture, sculpture, engraving or lithography; a photographic work to which are assimilated works expressed by a process analogous to photography; a work of applied art; an illustration, map, plan, sketch or three-dimensional work relative to geography, topography, architecture or science; a performance; a broadcast; a phonogram; a compilation of data to the extent it is protected as a copyrightable work; or a work performed by a variety or circus performer to the extent it is not otherwise considered a literary or artistic work.
    "You" means an individual or entity exercising rights under this License who has not previously violated the terms of this License with respect to the Work, or who has received express permission from the Licensor to exercise rights under this License despite a previous violation.
    "Publicly Perform" means to perform public recitations of the Work and to communicate to the public those public recitations, by any means or process, including by wire or wireless means or public digital performances; to make available to the public Works in such a way that members of the public may access these Works from a place and at a place individually chosen by them; to perform the Work to the public by any means or process and the communication to the public of the performances of the Work, including by public digital performance; to broadcast and rebroadcast the Work by any means including signs, sounds or images.
    "Reproduce" means to make copies of the Work by any means including without limitation by sound or visual recordings and the right of fixation and reproducing fixations of the Work, including storage of a protected performance or phonogram in digital form or other electronic medium.

2. Fair Dealing Rights. Nothing in this License is intended to reduce, limit, or restrict any uses free from copyright or rights arising from limitations or exceptions that are provided for in connection with the copyright protection under copyright law or other applicable laws.

3. License Grant. Subject to the terms and conditions of this License, Licensor hereby grants You a worldwide, royalty-free, non-exclusive, perpetual (for the duration of the applicable copyright) license to exercise the rights in the Work as stated below:

    to Reproduce the Work, to incorporate the Work into one or more Collections, and to Reproduce the Work as incorporated in the Collections;
    to create and Reproduce Adaptations provided that any such Adaptation, including any translation in any medium, takes reasonable steps to clearly label, demarcate or otherwise identify that changes were made to the original Work. For example, a translation could be marked "The original work was translated from English to Spanish," or a modification could indicate "The original work has been modified.";
    to Distribute and Publicly Perform the Work including as incorporated in Collections; and,
    to Distribute and Publicly Perform Adaptations.

    For the avoidance of doubt:
        Non-waivable Compulsory License Schemes. In those jurisdictions in which the right to collect royalties through any statutory or compulsory licensing scheme cannot be waived, the Licensor reserves the exclusive right to collect such royalties for any exercise by You of the rights granted under this License;
        Waivable Compulsory License Schemes. In those jurisdictions in which the right to collect royalties through any statutory or compulsory licensing scheme can be waived, the Licensor waives the exclusive right to collect such royalties for any exercise by You of the rights granted under this License; and,
        Voluntary License Schemes. The Licensor waives the right to collect royalties, whether individually or, in the event that the Licensor is a member of a collecting society that administers voluntary licensing schemes, via that society, from any exercise by You of the rights granted under this License.

The above rights may be exercised in all media and formats whether now known or hereafter devised. The above rights include the right to make such modifications as are technically necessary to exercise the rights in other media and formats. Subject to Section 8(f), all rights not expressly granted by Licensor are hereby reserved.

4. Restrictions. The license granted in Section 3 above is expressly made subject to and limited by the following restrictions:

    You may Distribute or Publicly Perform the Work only under the terms of this License. You must include a copy of, or the Uniform Resource Identifier (URI) for, this License with every copy of the Work You Distribute or Publicly Perform. You may not offer or impose any terms on the Work that restrict the terms of this License or the ability of the recipient of the Work to exercise the rights granted to that recipient under the terms of the License. You may not sublicense the Work. You must keep intact all notices that refer to this License and to the disclaimer of warranties with every copy of the Work You Distribute or Publicly Perform. When You Distribute or Publicly Perform the Work, You may not impose any effective technological measures on the Work that restrict the ability of a recipient of the Work from You to exercise the rights granted to that recipient under the terms of the License. This Section 4(a) applies to the Work as incorporated in a Collection, but this does not require the Collection apart from the Work itself to be made subject to the terms of this License. If You create a Collection, upon notice from any Licensor You must, to the extent practicable, remove from the Collection any credit as required by Section 4(c), as requested. If You create an Adaptation, upon notice from any Licensor You must, to the extent practicable, remove from the Adaptation any credit as required by Section 4(c), as requested.
    You may Distribute or Publicly Perform an Adaptation only under the terms of: (i) this License; (ii) a later version of this License with the same License Elements as this License; (iii) a Creative Commons jurisdiction license (either this or a later license version) that contains the same License Elements as this License (e.g., Attribution-ShareAlike 3.0 US)); (iv) a Creative Commons Compatible License. If you license the Adaptation under one of the licenses mentioned in (iv), you must comply with the terms of that license. If you license the Adaptation under the terms of any of the licenses mentioned in (i), (ii) or (iii) (the "Applicable License"), you must comply with the terms of the Applicable License generally and the following provisions: (I) You must include a copy of, or the URI for, the Applicable License with every copy of each Adaptation You Distribute or Publicly Perform; (II) You may not offer or impose any terms on the Adaptation that restrict the terms of the Applicable License or the ability of the recipient of the Adaptation to exercise the rights granted to that recipient under the terms of the Applicable License; (III) You must keep intact all notices that refer to the Applicable License and to the disclaimer of warranties with every copy of the Work as included in the Adaptation You Distribute or Publicly Perform; (IV) when You Distribute or Publicly Perform the Adaptation, You may not impose any effective technological measures on the Adaptation that restrict the ability of a recipient of the Adaptation from You to exercise the rights granted to that recipient under the terms of the Applicable License. This Section 4(b) applies to the Adaptation as incorporated in a Collection, but this does not require the Collection apart from the Adaptation itself to be made subject to the terms of the Applicable License.
    If You Distribute, or Publicly Perform the Work or any Adaptations or Collections, You must, unless a request has been made pursuant to Section 4(a), keep intact all copyright notices for the Work and provide, reasonable to the medium or means You are utilizing: (i) the name of the Original Author (or pseudonym, if applicable) if supplied, and/or if the Original Author and/or Licensor designate another party or parties (e.g., a sponsor institute, publishing entity, journal) for attribution ("Attribution Parties") in Licensor's copyright notice, terms of service or by other reasonable means, the name of such party or parties; (ii) the title of the Work if supplied; (iii) to the extent reasonably practicable, the URI, if any, that Licensor specifies to be associated with the Work, unless such URI does not refer to the copyright notice or licensing information for the Work; and (iv) , consistent with Ssection 3(b), in the case of an Adaptation, a credit identifying the use of the Work in the Adaptation (e.g., "French translation of the Work by Original Author," or "Screenplay based on original Work by Original Author"). The credit required by this Section 4(c) may be implemented in any reasonable manner; provided, however, that in the case of a Adaptation or Collection, at a minimum such credit will appear, if a credit for all contributing authors of the Adaptation or Collection appears, then as part of these credits and in a manner at least as prominent as the credits for the other contributing authors. For the avoidance of doubt, You may only use the credit required by this Section for the purpose of attribution in the manner set out above and, by exercising Your rights under this License, You may not implicitly or explicitly assert or imply any connection with, sponsorship or endorsement by the Original Author, Licensor and/or Attribution Parties, as appropriate, of You or Your use of the Work, without the separate, express prior written permission of the Original Author, Licensor and/or Attribution Parties.
    Except as otherwise agreed in writing by the Licensor or as may be otherwise permitted by applicable law, if You Reproduce, Distribute or Publicly Perform the Work either by itself or as part of any Adaptations or Collections, You must not distort, mutilate, modify or take other derogatory action in relation to the Work which would be prejudicial to the Original Author's honor or reputation. Licensor agrees that in those jurisdictions (e.g. Japan), in which any exercise of the right granted in Section 3(b) of this License (the right to make Adaptations) would be deemed to be a distortion, mutilation, modification or other derogatory action prejudicial to the Original Author's honor and reputation, the Licensor will waive or not assert, as appropriate, this Section, to the fullest extent permitted by the applicable national law, to enable You to reasonably exercise Your right under Section 3(b) of this License (right to make Adaptations) but not otherwise.

5. Representations, Warranties and Disclaimer

UNLESS OTHERWISE MUTUALLY AGREED TO BY THE PARTIES IN WRITING, LICENSOR OFFERS THE WORK AS-IS AND MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND CONCERNING THE WORK, EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING, WITHOUT LIMITATION, WARRANTIES OF TITLE, MERCHANTIBILITY, FITNESS FOR A PARTICULAR PURPOSE, NONINFRINGEMENT, OR THE ABSENCE OF LATENT OR OTHER DEFECTS, ACCURACY, OR THE PRESENCE OF ABSENCE OF ERRORS, WHETHER OR NOT DISCOVERABLE. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES, SO SUCH EXCLUSION MAY NOT APPLY TO YOU.

6. Limitation on Liability. EXCEPT TO THE EXTENT REQUIRED BY APPLICABLE LAW, IN NO EVENT WILL LICENSOR BE LIABLE TO YOU ON ANY LEGAL THEORY FOR ANY SPECIAL, INCIDENTAL, CONSEQUENTIAL, PUNITIVE OR EXEMPLARY DAMAGES ARISING OUT OF THIS LICENSE OR THE USE OF THE WORK, EVEN IF LICENSOR HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

7. Termination

    This License and the rights granted hereunder will terminate automatically upon any breach by You of the terms of this License. Individuals or entities who have received Adaptations or Collections from You under this License, however, will not have their licenses terminated provided such individuals or entities remain in full compliance with those licenses. Sections 1, 2, 5, 6, 7, and 8 will survive any termination of this License.
    Subject to the above terms and conditions, the license granted here is perpetual (for the duration of the applicable copyright in the Work). Notwithstanding the above, Licensor reserves the right to release the Work under different license terms or to stop distributing the Work at any time; provided, however that any such election will not serve to withdraw this License (or any other license that has been, or is required to be, granted under the terms of this License), and this License will continue in full force and effect unless terminated as stated above.

8. Miscellaneous

    Each time You Distribute or Publicly Perform the Work or a Collection, the Licensor offers to the recipient a license to the Work on the same terms and conditions as the license granted to You under this License.
    Each time You Distribute or Publicly Perform an Adaptation, Licensor offers to the recipient a license to the original Work on the same terms and conditions as the license granted to You under this License.
    If any provision of this License is invalid or unenforceable under applicable law, it shall not affect the validity or enforceability of the remainder of the terms of this License, and without further action by the parties to this agreement, such provision shall be reformed to the minimum extent necessary to make such provision valid and enforceable.
    No term or provision of this License shall be deemed waived and no breach consented to unless such waiver or consent shall be in writing and signed by the party to be charged with such waiver or consent.
    This License constitutes the entire agreement between the parties with respect to the Work licensed here. There are no understandings, agreements or representations with respect to the Work not specified here. Licensor shall not be bound by any additional provisions that may appear in any communication from You. This License may not be modified without the mutual written agreement of the Licensor and You.
    The rights granted under, and the subject matter referenced, in this License were drafted utilizing the terminology of the Berne Convention for the Protection of Literary and Artistic Works (as amended on September 28, 1979), the Rome Convention of 1961, the WIPO Copyright Treaty of 1996, the WIPO Performances and Phonograms Treaty of 1996 and the Universal Copyright Convention (as revised on July 24, 1971). These rights and subject matter take effect in the relevant jurisdiction in which the License terms are sought to be enforced according to the corresponding provisions of the implementation of those treaty provisions in the applicable national law. If the standard suite of rights granted under applicable copyright law includes additional rights not granted under this License, such additional rights are deemed to be included in the License; this License is not intended to restrict the license of any rights under applicable law.

    Creative Commons Notice

    Creative Commons is not a party to this License, and makes no warranty whatsoever in connection with the Work. Creative Commons will not be liable to You or any party on any legal theory for any damages whatsoever, including without limitation any general, special, incidental or consequential damages arising in connection to this license. Notwithstanding the foregoing two (2) sentences, if Creative Commons has expressly identified itself as the Licensor hereunder, it shall have all rights and obligations of Licensor.

    Except for the limited purpose of indicating to the public that the Work is licensed under the CCPL, Creative Commons does not authorize the use by either party of the trademark "Creative Commons" or any related trademark or logo of Creative Commons without the prior written consent of Creative Commons. Any permitted use will be in compliance with Creative Commons' then-current trademark usage guidelines, as may be published on its website or otherwise made available upon request from time to time. For the avoidance of doubt, this trademark restriction does not form part of the License.

    Creative Commons may be contacted at https://creativecommons.org/.



================================================
FILE: src/Assets/CC0 License.txt
================================================
Creative Commons Legal Code

CC0 1.0 Universal

    CREATIVE COMMONS CORPORATION IS NOT A LAW FIRM AND DOES NOT PROVIDE
    LEGAL SERVICES. DISTRIBUTION OF THIS DOCUMENT DOES NOT CREATE AN
    ATTORNEY-CLIENT RELATIONSHIP. CREATIVE COMMONS PROVIDES THIS
    INFORMATION ON AN "AS-IS" BASIS. CREATIVE COMMONS MAKES NO WARRANTIES
    REGARDING THE USE OF THIS DOCUMENT OR THE INFORMATION OR WORKS
    PROVIDED HEREUNDER, AND DISCLAIMS LIABILITY FOR DAMAGES RESULTING FROM
    THE USE OF THIS DOCUMENT OR THE INFORMATION OR WORKS PROVIDED
    HEREUNDER.

Statement of Purpose

The laws of most jurisdictions throughout the world automatically confer
exclusive Copyright and Related Rights (defined below) upon the creator
and subsequent owner(s) (each and all, an "owner") of an original work of
authorship and/or a database (each, a "Work").

Certain owners wish to permanently relinquish those rights to a Work for
the purpose of contributing to a commons of creative, cultural and
scientific works ("Commons") that the public can reliably and without fear
of later claims of infringement build upon, modify, incorporate in other
works, reuse and redistribute as freely as possible in any form whatsoever
and for any purposes, including without limitation commercial purposes.
These owners may contribute to the Commons to promote the ideal of a free
culture and the further production of creative, cultural and scientific
works, or to gain reputation or greater distribution for their Work in
part through the use and efforts of others.

For these and/or other purposes and motivations, and without any
expectation of additional consideration or compensation, the person
associating CC0 with a Work (the "Affirmer"), to the extent that he or she
is an owner of Copyright and Related Rights in the Work, voluntarily
elects to apply CC0 to the Work and publicly distribute the Work under its
terms, with knowledge of his or her Copyright and Related Rights in the
Work and the meaning and intended legal effect of CC0 on those rights.

1. Copyright and Related Rights. A Work made available under CC0 may be
protected by copyright and related or neighboring rights ("Copyright and
Related Rights"). Copyright and Related Rights include, but are not
limited to, the following:

  i. the right to reproduce, adapt, distribute, perform, display,
     communicate, and translate a Work;
 ii. moral rights retained by the original author(s) and/or performer(s);
iii. publicity and privacy rights pertaining to a person's image or
     likeness depicted in a Work;
 iv. rights protecting against unfair competition in regards to a Work,
     subject to the limitations in paragraph 4(a), below;
  v. rights protecting the extraction, dissemination, use and reuse of data
     in a Work;
 vi. database rights (such as those arising under Directive 96/9/EC of the
     European Parliament and of the Council of 11 March 1996 on the legal
     protection of databases, and under any national implementation
     thereof, including any amended or successor version of such
     directive); and
vii. other similar, equivalent or corresponding rights throughout the
     world based on applicable law or treaty, and any national
     implementations thereof.

2. Waiver. To the greatest extent permitted by, but not in contravention
of, applicable law, Affirmer hereby overtly, fully, permanently,
irrevocably and unconditionally waives, abandons, and surrenders all of
Affirmer's Copyright and Related Rights and associated claims and causes
of action, whether now known or unknown (including existing as well as
future claims and causes of action), in the Work (i) in all territories
worldwide, (ii) for the maximum duration provided by applicable law or
treaty (including future time extensions), (iii) in any current or future
medium and for any number of copies, and (iv) for any purpose whatsoever,
including without limitation commercial, advertising or promotional
purposes (the "Waiver"). Affirmer makes the Waiver for the benefit of each
member of the public at large and to the detriment of Affirmer's heirs and
successors, fully intending that such Waiver shall not be subject to
revocation, rescission, cancellation, termination, or any other legal or
equitable action to disrupt the quiet enjoyment of the Work by the public
as contemplated by Affirmer's express Statement of Purpose.

3. Public License Fallback. Should any part of the Waiver for any reason
be judged legally invalid or ineffective under applicable law, then the
Waiver shall be preserved to the maximum extent permitted taking into
account Affirmer's express Statement of Purpose. In addition, to the
extent the Waiver is so judged Affirmer hereby grants to each affected
person a royalty-free, non transferable, non sublicensable, non exclusive,
irrevocable and unconditional license to exercise Affirmer's Copyright and
Related Rights in the Work (i) in all territories worldwide, (ii) for the
maximum duration provided by applicable law or treaty (including future
time extensions), (iii) in any current or future medium and for any number
of copies, and (iv) for any purpose whatsoever, including without
limitation commercial, advertising or promotional purposes (the
"License"). The License shall be deemed effective as of the date CC0 was
applied by Affirmer to the Work. Should any part of the License for any
reason be judged legally invalid or ineffective under applicable law, such
partial invalidity or ineffectiveness shall not invalidate the remainder
of the License, and in such case Affirmer hereby affirms that he or she
will not (i) exercise any of his or her remaining Copyright and Related
Rights in the Work or (ii) assert any associated claims and causes of
action with respect to the Work, in either case contrary to Affirmer's
express Statement of Purpose.

4. Limitations and Disclaimers.

 a. No trademark or patent rights held by Affirmer are waived, abandoned,
    surrendered, licensed or otherwise affected by this document.
 b. Affirmer offers the Work as-is and makes no representations or
    warranties of any kind concerning the Work, express, implied,
    statutory or otherwise, including without limitation warranties of
    title, merchantability, fitness for a particular purpose, non
    infringement, or the absence of latent or other defects, accuracy, or
    the present or absence of errors, whether or not discoverable, all to
    the greatest extent permissible under applicable law.
 c. Affirmer disclaims responsibility for clearing rights of other persons
    that may apply to the Work or any use thereof, including without
    limitation any person's Copyright and Related Rights in the Work.
    Further, Affirmer disclaims responsibility for obtaining any necessary
    consents, permissions or other rights required for any use of the
    Work.
 d. Affirmer understands and acknowledges that Creative Commons is not a
    party to this document and has no duty or obligation with respect to
    this CC0 or use of the Work.



================================================
FILE: src/StreamDeck/__init__.py
================================================
[Empty file]


================================================
FILE: src/StreamDeck/DeviceManager.py
================================================
#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

from .Devices.StreamDeck import StreamDeck
from .Devices.StreamDeckMini import StreamDeckMini
from .Devices.StreamDeckNeo import StreamDeckNeo
from .Devices.StreamDeckOriginal import StreamDeckOriginal
from .Devices.StreamDeckOriginalV2 import StreamDeckOriginalV2
from .Devices.StreamDeckXL import StreamDeckXL
from .Devices.StreamDeckPedal import StreamDeckPedal
from .Devices.StreamDeckStudio import StreamDeckStudio
from .Devices.StreamDeckPlus import StreamDeckPlus
from .Transport import Transport
from .Transport.Dummy import Dummy
from .Transport.LibUSBHIDAPI import LibUSBHIDAPI
from .ProductIDs import USBVendorIDs, USBProductIDs


class ProbeError(Exception):
    """
    Exception thrown when attempting to probe for attached StreamDeck devices,
    but no suitable valid transport was found.
    """

    pass


class DeviceManager:
    """
    Central device manager, to enumerate any attached StreamDeck devices. An
    instance of this class must be created in order to detect and use any
    StreamDeck devices.
    """

    @staticmethod
    def _get_transport(transport: str | None):
        """
        Creates a new HID transport instance from the given transport back-end
        name. If no specific transport is supplied, an attempt to find an
        installed backend will be made.

        :param str transport: Name of a supported HID transport back-end to use, None to autoprobe.

        :rtype: Transport.* instance
        :return: Instance of a HID Transport class
        """

        transports = {
            "dummy": Dummy,
            "libusb": LibUSBHIDAPI,
        }

        if transport:
            transport_class = transports.get(transport)

            if transport_class is None:
                raise ProbeError("Unknown HID transport backend \"{}\".".format(transport))

            try:
                transport_class.probe()
                return transport_class()
            except Exception as transport_error:
                raise ProbeError("Probe failed on HID backend \"{}\".".format(transport), transport_error)
        else:
            probe_errors = {}

            for transport_name, transport_class in transports.items():
                if transport_name == "dummy":
                    continue

                try:
                    transport_class.probe()
                    return transport_class()
                except Exception as transport_error:
                    probe_errors[transport_name] = transport_error

            raise ProbeError("Probe failed to find any functional HID backend.", probe_errors)

    def __init__(self, transport: str | None = None):
        """
        Creates a new StreamDeck DeviceManager, used to detect attached StreamDeck devices.

        :param str transport: name of the the specific HID transport back-end to use, None to auto-probe.
        """
        self.transport: Transport.Transport = self._get_transport(transport)

    def enumerate(self) -> list[StreamDeck]:
        """
        Detect attached StreamDeck devices.

        :rtype: list(StreamDeck)
        :return: list of :class:`StreamDeck` instances, one for each detected device.
        """

        products = [
            (USBVendorIDs.USB_VID_ELGATO, USBProductIDs.USB_PID_STREAMDECK_ORIGINAL, StreamDeckOriginal),
            (USBVendorIDs.USB_VID_ELGATO, USBProductIDs.USB_PID_STREAMDECK_ORIGINAL_V2, StreamDeckOriginalV2),
            (USBVendorIDs.USB_VID_ELGATO, USBProductIDs.USB_PID_STREAMDECK_MK2_SCISSOR, StreamDeckOriginalV2),
            (USBVendorIDs.USB_VID_ELGATO, USBProductIDs.USB_PID_STREAMDECK_MK2_MODULE, StreamDeckOriginalV2),
            (USBVendorIDs.USB_VID_ELGATO, USBProductIDs.USB_PID_STREAMDECK_MINI, StreamDeckMini),
            (USBVendorIDs.USB_VID_ELGATO, USBProductIDs.USB_PID_STREAMDECK_NEO, StreamDeckNeo),
            (USBVendorIDs.USB_VID_ELGATO, USBProductIDs.USB_PID_STREAMDECK_XL, StreamDeckXL),
            (USBVendorIDs.USB_VID_ELGATO, USBProductIDs.USB_PID_STREAMDECK_MK2, StreamDeckOriginalV2),
            (USBVendorIDs.USB_VID_ELGATO, USBProductIDs.USB_PID_STREAMDECK_MK2_V2, StreamDeckOriginalV2),
            (USBVendorIDs.USB_VID_ELGATO, USBProductIDs.USB_PID_STREAMDECK_PEDAL, StreamDeckPedal),
            (USBVendorIDs.USB_VID_ELGATO, USBProductIDs.USB_PID_STREAMDECK_MINI_MK2, StreamDeckMini),
            (USBVendorIDs.USB_VID_ELGATO, USBProductIDs.USB_PID_STREAMDECK_MINI_MK2_MODULE, StreamDeckMini),
            (USBVendorIDs.USB_VID_ELGATO, USBProductIDs.USB_PID_STREAMDECK_XL_V2, StreamDeckXL),
            (USBVendorIDs.USB_VID_ELGATO, USBProductIDs.USB_PID_STREAMDECK_XL_V2_MODULE, StreamDeckXL),
            (USBVendorIDs.USB_VID_ELGATO, USBProductIDs.USB_PID_STREAMDECK_STUDIO, StreamDeckStudio),
            (USBVendorIDs.USB_VID_ELGATO, USBProductIDs.USB_PID_STREAMDECK_PLUS, StreamDeckPlus),
        ]

        streamdecks = list()

        for vid, pid, class_type in products:
            found_devices = self.transport.enumerate(vid=vid, pid=pid)
            streamdecks.extend([class_type(d) for d in found_devices])

        return streamdecks



================================================
FILE: src/StreamDeck/ProductIDs.py
================================================
#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#


class USBVendorIDs:
    """
    USB Vendor IDs for known StreamDeck devices.
    """

    USB_VID_ELGATO = 0x0fd9


class USBProductIDs:
    """
    USB Product IDs for known StreamDeck devices.
    """

    USB_PID_STREAMDECK_MINI = 0x0063
    USB_PID_STREAMDECK_MINI_MK2 = 0x0090
    USB_PID_STREAMDECK_MINI_MK2_MODULE = 0x00b8
    USB_PID_STREAMDECK_MK2 = 0x0080
    USB_PID_STREAMDECK_MK2_MODULE = 0x00b9
    USB_PID_STREAMDECK_MK2_SCISSOR = 0x00a5
    USB_PID_STREAMDECK_MK2_V2 = 0x00B9
    USB_PID_STREAMDECK_NEO = 0x009a
    USB_PID_STREAMDECK_ORIGINAL = 0x0060
    USB_PID_STREAMDECK_ORIGINAL_V2 = 0x006d
    USB_PID_STREAMDECK_PEDAL = 0x0086
    USB_PID_STREAMDECK_PLUS = 0x0084
    USB_PID_STREAMDECK_XL = 0x006c
    USB_PID_STREAMDECK_XL_V2 = 0x008f
    USB_PID_STREAMDECK_STUDIO = 0x00aa
    USB_PID_STREAMDECK_XL_V2_MODULE = 0x00ba



================================================
FILE: src/StreamDeck/Devices/__init__.py
================================================
[Empty file]


================================================
FILE: src/StreamDeck/Devices/StreamDeck.py
================================================
#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

import threading
import time
from abc import ABC, abstractmethod
from collections.abc import Callable
from enum import Enum
from typing import Any, Iterable, TypeVar

from ..Transport.Transport import Transport, TransportError


class TouchscreenEventType(Enum):
    """
    Type of event that has occurred for a Touchscreen.
    """

    SHORT = 1
    LONG = 2
    DRAG = 3


class DialEventType(Enum):
    """
    Type of event that has occurred for a Dial.
    """
    TURN = 1
    PUSH = 2


class ControlType(Enum):
    """
    Type of control. This is used when returning internal events from a
    StreamDeck subclass.

    :meta private:
    """
    KEY = 1
    DIAL = 2
    TOUCHSCREEN = 3


class StreamDeck(ABC):
    """
    Represents a physically attached StreamDeck device.
    """

    KEY_COUNT = 0
    KEY_COLS = 0
    KEY_ROWS = 0

    TOUCH_KEY_COUNT = 0

    KEY_PIXEL_WIDTH = 0
    KEY_PIXEL_HEIGHT = 0
    KEY_IMAGE_FORMAT = ""
    KEY_FLIP = (False, False)
    KEY_ROTATION = 0

    TOUCHSCREEN_PIXEL_WIDTH = 0
    TOUCHSCREEN_PIXEL_HEIGHT = 0
    TOUCHSCREEN_IMAGE_FORMAT = ""
    TOUCHSCREEN_FLIP = (False, False)
    TOUCHSCREEN_ROTATION = 0

    SCREEN_PIXEL_WIDTH = 0
    SCREEN_PIXEL_HEIGHT = 0
    SCREEN_IMAGE_FORMAT = ""
    SCREEN_FLIP = (False, False)
    SCREEN_ROTATION = 0

    DIAL_COUNT = 0

    DECK_TYPE = ""
    DECK_VISUAL = False
    DECK_TOUCH = False

    _Self = TypeVar('_Self', bound='StreamDeck')
    KeyCallback = Callable[[_Self, int, bool], None] | None
    DialCallback = Callable[[_Self, int, DialEventType, bool], None] | None
    TouchScreenCallback = Callable[[_Self, TouchscreenEventType, Any], None] | None

    def __init__(self, device: Transport.Device):
        self.device: Transport.Device = device
        self.last_key_states: list[bool] = [False] * (self.KEY_COUNT + self.TOUCH_KEY_COUNT)
        self.last_dial_states: list[bool] = [False] * self.DIAL_COUNT
        self.read_thread: threading.Thread | None = None
        self.run_read_thread: bool = False
        self.read_poll_hz: int = 20

        self.key_callback: StreamDeck.KeyCallback = None
        self.dial_callback: StreamDeck.DialCallback = None
        self.touchscreen_callback: StreamDeck.TouchScreenCallback = None

        self.update_lock: threading.RLock = threading.RLock()

    def __del__(self):
        """
        Delete handler for the StreamDeck, automatically closing the transport
        if it is currently open and terminating the transport reader thread.
        """
        try:
            self._setup_reader(None)
        except (TransportError, ValueError):
            pass

        try:
            self.device.close()
        except (TransportError):
            pass

    def __enter__(self):
        """
        Enter handler for the StreamDeck, taking the exclusive update lock on
        the deck. This can be used in a `with` statement to ensure that only one
        thread is currently updating the deck, even if it is doing multiple
        operations (e.g. setting the image on multiple keys).
        """
        self.update_lock.acquire()

    def __exit__(self, type, value, traceback):
        """
        Exit handler for the StreamDeck, releasing the exclusive update lock on
        the deck.
        """
        self.update_lock.release()

    @abstractmethod
    def _read_control_states(self) -> None:
        """
        Reads the raw key states from an attached StreamDeck.

        :return: dictionary containing states for all controls
        """
        pass

    @abstractmethod
    def _reset_key_stream(self) -> None:
        """
        Sends a blank key report to the StreamDeck, resetting the key image
        streamer in the device. This prevents previously started partial key
        writes that were not completed from corrupting images sent from this
        application.
        """
        pass

    def _extract_string(self, data: Iterable[int]) -> str:
        """
        Extracts out a human-readable string from a collection of raw bytes,
        removing any trailing whitespace or data after and before the first NUL
        byte.
        """

        return str(bytes(data), 'ascii', 'replace').partition('\0')[0].strip()

    def _read(self) -> None:
        """
        Read handler for the underlying transport, listening for control state
        changes on the underlying device, caching the new states and firing off
        any registered callbacks.
        """
        while self.run_read_thread:
            try:
                control_states = self._read_control_states()
                if control_states is None:
                    time.sleep(1.0 / self.read_poll_hz)
                    continue

                if ControlType.KEY in control_states:
                    for k, (old, new) in enumerate(zip(self.last_key_states, control_states[ControlType.KEY])):
                        if old == new:
                            continue

                        self.last_key_states[k] = new

                        if self.key_callback is not None:
                            self.key_callback(self, k, new)

                elif ControlType.DIAL in control_states:
                    if DialEventType.PUSH in control_states[ControlType.DIAL]:
                        for k, (old, new) in enumerate(zip(self.last_dial_states, control_states[ControlType.DIAL][DialEventType.PUSH])):
                            if old == new:
                                continue

                            self.last_dial_states[k] = new

                            if self.dial_callback is not None:
                                self.dial_callback(self, k, DialEventType.PUSH, new)

                    if DialEventType.TURN in control_states[ControlType.DIAL]:
                        for k, amount in enumerate(control_states[ControlType.DIAL][DialEventType.TURN]):
                            if amount == 0:
                                continue

                            if self.dial_callback is not None:
                                self.dial_callback(self, k, DialEventType.TURN, amount)

                elif ControlType.TOUCHSCREEN in control_states:
                    if self.touchscreen_callback is not None:
                        self.touchscreen_callback(self, *control_states[ControlType.TOUCHSCREEN])

            except TransportError:
                self.run_read_thread = False
                self.close()

    def _setup_reader(self, callback: Callable) -> None:
        """
        Sets up the internal transport reader thread with the given callback,
        for asynchronous processing of HID events from the device. If the thread
        already exists, it is terminated and restarted with the new callback
        function.

        :param function callback: Callback to run on the reader thread.
        """
        if self.read_thread is not None:
            self.run_read_thread = False

            try:
                self.read_thread.join()
            except RuntimeError:
                pass

        if callback is not None:
            self.run_read_thread = True
            self.read_thread = threading.Thread(target=callback)
            self.read_thread.daemon = True
            self.read_thread.start()

    def open(self) -> None:
        """
        Opens the device for input/output. This must be called prior to setting
        or retrieving any device state.

        .. seealso:: See :func:`~StreamDeck.close` for the corresponding close method.
        """
        self.device.open()

        self._reset_key_stream()
        self._setup_reader(self._read)

    def close(self) -> None:
        """
        Closes the device for input/output.

        .. seealso:: See :func:`~StreamDeck.open` for the corresponding open method.
        """
        self.device.close()

    def is_open(self) -> bool:
        """
        Indicates if the StreamDeck device is currently open and ready for use.

        :rtype: bool
        :return: `True` if the deck is open, `False` otherwise.
        """
        return self.device.is_open()

    def connected(self) -> bool:
        """
        Indicates if the physical StreamDeck device this instance is attached to
        is still connected to the host.

        :rtype: bool
        :return: `True` if the deck is still connected, `False` otherwise.
        """
        return self.device.connected()

    def vendor_id(self) -> int:
        """
        Retrieves the vendor ID attached StreamDeck. This can be used
        to determine the exact type of attached StreamDeck.

        :rtype: int
        :return: Vendor ID of the attached device.
        """
        return self.device.vendor_id()

    def product_id(self) -> int:
        """
        Retrieves the product ID attached StreamDeck. This can be used
        to determine the exact type of attached StreamDeck.

        :rtype: int
        :return: Product ID of the attached device.
        """
        return self.device.product_id()

    def id(self) -> str:
        """
        Retrieves the physical ID of the attached StreamDeck. This can be used
        to differentiate one StreamDeck from another.

        :rtype: str
        :return: Identifier for the attached device.
        """
        return self.device.path()

    def key_count(self) -> int:
        """
        Retrieves number of physical buttons on the attached StreamDeck device.

        :rtype: int
        :return: Number of physical buttons.
        """
        return self.KEY_COUNT

    def touch_key_count(self) -> int:
        """
        Retrieves number of touch buttons on the attached StreamDeck device.

        :rtype: int
        :return: Number of touch buttons.
        """
        return self.TOUCH_KEY_COUNT

    def dial_count(self) -> int:
        """
        Retrieves number of physical dials on the attached StreamDeck device.

        :rtype: int
        :return: Number of physical dials
        """
        return self.DIAL_COUNT

    def deck_type(self) -> str:
        """
        Retrieves the model of Stream Deck.

        :rtype: str
        :return: String containing the model name of the StreamDeck device.
        """
        return self.DECK_TYPE

    def is_visual(self) -> bool:
        """
        Returns whether the Stream Deck has a visual display output.

        :rtype: bool
        :return: `True` if the deck has a screen, `False` otherwise.
        """
        return self.DECK_VISUAL

    def is_touch(self) -> bool:
        """
        Returns whether the Stream Deck can receive touch events

        :rtype: bool
        :return: `True` if the deck can receive touch events, `False` otherwise
        """
        return self.DECK_TOUCH

    def key_layout(self) -> tuple[int, int]:
        """
        Retrieves the physical button layout on the attached StreamDeck device.

        :rtype: (int, int)
        :return (rows, columns): Number of button rows and columns.
        """
        return self.KEY_ROWS, self.KEY_COLS

    def key_image_format(self):
        """
        Retrieves the image format accepted by the attached StreamDeck device.
        Images should be given in this format when setting an image on a button.

        .. seealso:: See :func:`~StreamDeck.set_key_image` method to update the
                     image displayed on a StreamDeck button.

        :rtype: dict()
        :return: Dictionary describing the various image parameters
                 (size, image format, image mirroring and rotation).
        """
        return {
            'size': (self.KEY_PIXEL_WIDTH, self.KEY_PIXEL_HEIGHT),
            'format': self.KEY_IMAGE_FORMAT,
            'flip': self.KEY_FLIP,
            'rotation': self.KEY_ROTATION,
        }

    def touchscreen_image_format(self):
        """
        Retrieves the image format accepted by the touchscreen of the Stream
        Deck. Images should be given in this format when drawing on
        touchscreen.

        .. seealso:: See :func:`~StreamDeck.set_touchscreen_image` method to
                     draw an image on the StreamDeck touchscreen.

        :rtype: dict()
        :return: Dictionary describing the various image parameters
                 (size, image format).
        """
        return {
            'size': (self.TOUCHSCREEN_PIXEL_WIDTH, self.TOUCHSCREEN_PIXEL_HEIGHT),
            'format': self.TOUCHSCREEN_IMAGE_FORMAT,
            'flip': self.TOUCHSCREEN_FLIP,
            'rotation': self.TOUCHSCREEN_ROTATION,
        }

    def screen_image_format(self):
        """
        Retrieves the image format accepted by the screen of the Stream
        Deck. Images should be given in this format when drawing on
        screen.

        .. seealso:: See :func:`~StreamDeck.set_screen_image` method to
                     draw an image on the StreamDeck screen.

        :rtype: dict()
        :return: Dictionary describing the various image parameters
                 (size, image format).
        """
        return {
            'size': (self.SCREEN_PIXEL_WIDTH, self.SCREEN_PIXEL_HEIGHT),
            'format': self.SCREEN_IMAGE_FORMAT,
            'flip': self.SCREEN_FLIP,
            'rotation': self.SCREEN_ROTATION,
        }

    def set_poll_frequency(self, hz: int) -> None:
        """
        Sets the frequency of the button polling reader thread, determining how
        often the StreamDeck will be polled for button changes.

        A higher frequency will result in a higher CPU usage, but a lower
        latency between a physical button press and a event from the library.

        :param int hz: Reader thread frequency, in Hz (1-1000).
        """
        self.read_poll_hz = min(max(hz, 1), 1000)

    def set_key_callback(self, callback: KeyCallback) -> None:
        """
        Sets the callback function called each time a button on the StreamDeck
        changes state (either pressed, or released).

        .. note:: This callback will be fired from an internal reader thread.
                  Ensure that the given callback function is thread-safe.

        .. note:: Only one callback can be registered at one time.

        .. seealso:: See :func:`~StreamDeck.set_key_callback_async` method for
                     a version compatible with Python 3 `asyncio` asynchronous
                     functions.

        :param function callback: Callback function to fire each time a button
                                state changes.
        """
        self.key_callback = callback

    def set_key_callback_async(self, async_callback: KeyCallback, loop=None):
        """
        Sets the asynchronous callback function called each time a button on the
        StreamDeck changes state (either pressed, or released). The given
        callback should be compatible with Python 3's `asyncio` routines.

        .. note:: The asynchronous callback will be fired in a thread-safe
                  manner.

        .. note:: This will override the callback (if any) set by
                  :func:`~StreamDeck.set_key_callback`.

        :param function async_callback: Asynchronous callback function to fire
                                        each time a button state changes.
        :param asyncio.loop loop: Asyncio loop to dispatch the callback into
        """
        import asyncio

        loop = loop or asyncio.get_event_loop()

        def callback(*args):
            asyncio.run_coroutine_threadsafe(async_callback(*args), loop)

        self.set_key_callback(callback)

    def set_dial_callback(self, callback: DialCallback) -> None:
        """
        Sets the callback function called each time there is an interaction
        with a dial on the StreamDeck.

        .. note:: This callback will be fired from an internal reader thread.
                  Ensure that the given callback function is thread-safe.

        .. note:: Only one callback can be registered at one time.

        .. seealso:: See :func:`~StreamDeck.set_dial_callback_async` method
                     for a version compatible with Python 3 `asyncio`
                     asynchronous functions.

        :param function callback: Callback function to fire each time a button
                                state changes.
        """
        self.dial_callback = callback

    def set_dial_callback_async(self, async_callback: DialCallback, loop=None) -> None:
        """
        Sets the asynchronous callback function called each time there is an
        interaction with a dial on the StreamDeck. The given callback should
        be compatible with Python 3's `asyncio` routines.

        .. note:: The asynchronous callback will be fired in a thread-safe
                  manner.

        .. note:: This will override the callback (if any) set by
                  :func:`~StreamDeck.set_dial_callback`.

        :param function async_callback: Asynchronous callback function to fire
                                        each time a button state changes.
        :param asyncio.loop loop: Asyncio loop to dispatch the callback into
        """
        import asyncio

        loop = loop or asyncio.get_event_loop()

        def callback(*args):
            asyncio.run_coroutine_threadsafe(async_callback(*args), loop)

        self.set_dial_callback(callback)

    def set_touchscreen_callback(self, callback: TouchScreenCallback) -> None:
        """
        Sets the callback function called each time there is an interaction
        with a touchscreen on the StreamDeck.

        .. note:: This callback will be fired from an internal reader thread.
                  Ensure that the given callback function is thread-safe.

        .. note:: Only one callback can be registered at one time.

        .. seealso:: See :func:`~StreamDeck.set_touchscreen_callback_async`
                     method for a version compatible with Python 3 `asyncio`
                     asynchronous functions.

        :param function callback: Callback function to fire each time a button
                                state changes.
        """
        self.touchscreen_callback = callback

    def set_touchscreen_callback_async(self, async_callback: TouchScreenCallback, loop=None) -> None:
        """
        Sets the asynchronous callback function called each time there is an
        interaction with the touchscreen on the StreamDeck. The given callback
        should be compatible with Python 3's `asyncio` routines.

        .. note:: The asynchronous callback will be fired in a thread-safe
                  manner.

        .. note:: This will override the callback (if any) set by
                  :func:`~StreamDeck.set_touchscreen_callback`.

        :param function async_callback: Asynchronous callback function to fire
                                        each time a button state changes.
        :param asyncio.loop loop: Asyncio loop to dispatch the callback into
        """
        import asyncio

        loop = loop or asyncio.get_event_loop()

        def callback(*args):
            asyncio.run_coroutine_threadsafe(async_callback(*args), loop)

        self.set_touchscreen_callback(callback)

    def key_states(self) -> list[bool]:
        """
        Retrieves the current states of the buttons on the StreamDeck.

        :rtype: list(bool)
        :return: List describing the current states of each of the buttons on
                 the device (`True` if the button is being pressed, `False`
                 otherwise).
        """
        return self.last_key_states

    def dial_states(self) -> list[bool]:
        """
        Retrieves the current states of the dials (pressed or not) on the
        Stream Deck

        :rtype: list(bool)
        :return: List describing the current states of each of the dials on
                 the device (`True` if the dial is being pressed, `False`
                 otherwise).
        """
        return self.last_dial_states

    @abstractmethod
    def reset(self) -> None:
        """
        Resets the StreamDeck, clearing all button images and showing the
        standby image.
        """
        pass

    @abstractmethod
    def set_brightness(self, percent: int | float) -> None:
        """
        Sets the global screen brightness of the StreamDeck, across all the
        physical buttons.

        :param int/float percent: brightness percent, from [0-100] as an `int`,
                                  or normalized to [0.0-1.0] as a `float`.
        """
        pass

    @abstractmethod
    def get_serial_number(self) -> str:
        """
        Gets the serial number of the attached StreamDeck.

        :rtype: str
        :return: String containing the serial number of the attached device.
        """
        pass

    @abstractmethod
    def get_firmware_version(self) -> str:
        """
        Gets the firmware version of the attached StreamDeck.

        :rtype: str
        :return: String containing the firmware version of the attached device.
        """
        pass

    @abstractmethod
    def set_key_image(self, key: int, image: bytes) -> None:
        """
        Sets the image of a button on the StreamDeck to the given image. The
        image being set should be in the correct format for the device, as an
        enumerable collection of bytes.

        .. seealso:: See :func:`~StreamDeck.key_image_format` method for
                     information on the image format accepted by the device.

        :param int key: Index of the button whose image is to be updated.
        :param enumerable image: Raw data of the image to set on the button.
                                 If `None`, the key will be cleared to a black
                                 color.
        """
        pass

    @abstractmethod
    def set_touchscreen_image(self, image: bytes, x_pos: int = 0, y_pos: int = 0, width: int = 0, height: int = 0):
        """
        Draws an image on the touchscreen in a certain position. The image
        should be in the correct format for the devices, as an enumerable
        collection of bytes.

        .. seealso:: See :func:`~StreamDeck.touchscreen_image_format` method for
                     information on the image format accepted by the device.

        :param enumerable image: Raw data of the image to set on the button.
                                 If `None`, the touchscreen will be cleared.
        :param int x_pos: Position on x axis of the image to draw
        :param int y_pos: Position on y axis of the image to draw
        :param int width: width of the image
        :param int height: height of the image

        """
        pass

    @abstractmethod
    def set_key_color(self, key: int, r: int, g: int, b: int) -> None:
        """
        Sets the color of the touch buttons. These buttons are indexed
        in order after the standard keys.

        :param int key: Index of the button
        :param int r: Red value
        :param int g: Green value
        :param int b: Blue value

        """
        pass

    @abstractmethod
    def set_screen_image(self, image: bytes) -> None:
        """
        Draws an image on the touchless screen of the StreamDeck.

        .. seealso:: See :func:`~StreamDeck.screen_image_format` method for
                     information on the image format accepted by the device.

        :param enumerable image: Raw data of the image to set on the button.
                                 If `None`, the screen will be cleared.
        """
        pass



================================================
FILE: src/StreamDeck/Devices/StreamDeckMini.py
================================================
#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

from .StreamDeck import StreamDeck, ControlType
from ..ProductIDs import USBProductIDs


class StreamDeckMini(StreamDeck):
    """
    Represents a physically attached StreamDeck Mini device.
    """

    KEY_COUNT = 6
    KEY_COLS = 3
    KEY_ROWS = 2

    KEY_PIXEL_WIDTH = 80
    KEY_PIXEL_HEIGHT = 80
    KEY_IMAGE_FORMAT = "BMP"
    KEY_FLIP = (False, True)
    KEY_ROTATION = 90

    DECK_TYPE = "Stream Deck Mini"
    DECK_VISUAL = True

    IMAGE_REPORT_LENGTH = 1024
    IMAGE_REPORT_HEADER_LENGTH = 16
    IMAGE_REPORT_PAYLOAD_LENGTH = IMAGE_REPORT_LENGTH - IMAGE_REPORT_HEADER_LENGTH

    # 80 x 80 black BMP
    BLANK_KEY_IMAGE = [
        0x42, 0x4d, 0xf6, 0x3c, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x36, 0x00, 0x00, 0x00, 0x28, 0x00,
        0x00, 0x00, 0x48, 0x00, 0x00, 0x00, 0x48, 0x00,
        0x00, 0x00, 0x01, 0x00, 0x18, 0x00, 0x00, 0x00,
        0x00, 0x00, 0xc0, 0x3c, 0x00, 0x00, 0xc4, 0x0e,
        0x00, 0x00, 0xc4, 0x0e, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ] + [0] * (KEY_PIXEL_WIDTH * KEY_PIXEL_HEIGHT * 3)

    def _read_control_states(self):
        states = self.device.read(1 + self.KEY_COUNT)
        if states is None:
            return None

        states = states[1:]
        return {
            ControlType.KEY: [bool(s) for s in states],
        }

    def _reset_key_stream(self):
        payload = bytearray(self.IMAGE_REPORT_LENGTH)
        payload[0] = 0x02
        self.device.write(payload)

    def reset(self):
        payload = bytearray(17)
        payload[0:2] = [0x0B, 0x63]
        self.device.write_feature(payload)

    def set_brightness(self, percent):
        if isinstance(percent, float):
            percent = int(100.0 * percent)

        percent = min(max(percent, 0), 100)

        payload = bytearray(17)
        payload[0:6] = [0x05, 0x55, 0xaa, 0xd1, 0x01, percent]
        self.device.write_feature(payload)

    def get_serial_number(self):
        report_read_length = 17 if self.device.product_id() == USBProductIDs.USB_PID_STREAMDECK_MINI else 32
        serial = self.device.read_feature(0x03, report_read_length)
        return self._extract_string(serial[5:])

    def get_firmware_version(self):
        version = self.device.read_feature(0x04, 17)
        return self._extract_string(version[5:])

    def set_key_image(self, key, image):
        if min(max(key, 0), self.KEY_COUNT) != key:
            raise IndexError("Invalid key index {}.".format(key))

        image = bytes(image or self.BLANK_KEY_IMAGE)

        page_number = 0
        bytes_remaining = len(image)
        while bytes_remaining > 0:
            this_length = min(bytes_remaining, self.IMAGE_REPORT_PAYLOAD_LENGTH)
            bytes_sent = page_number * self.IMAGE_REPORT_PAYLOAD_LENGTH

            header = [
                0x02,
                0x01,
                page_number,
                0,
                1 if this_length == bytes_remaining else 0,
                key + 1,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
            ]

            payload = bytes(header) + image[bytes_sent:bytes_sent + this_length]
            padding = bytearray(self.IMAGE_REPORT_LENGTH - len(payload))
            self.device.write(payload + padding)

            bytes_remaining = bytes_remaining - this_length
            page_number = page_number + 1

    def set_touchscreen_image(self, image, x_pos=0, y_pos=0, width=0, height=0):
        pass

    def set_key_color(self, key, r, g, b):
        pass

    def set_screen_image(self, image):
        pass



================================================
FILE: src/StreamDeck/Devices/StreamDeckNeo.py
================================================
#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

from .StreamDeck import StreamDeck, ControlType


class StreamDeckNeo(StreamDeck):
    """
    Represents a physically attached StreamDeck Neo device.
    """

    KEY_COUNT = 8
    KEY_COLS = 4
    KEY_ROWS = 2

    TOUCH_KEY_COUNT = 2

    KEY_PIXEL_WIDTH = 96
    KEY_PIXEL_HEIGHT = 96
    KEY_IMAGE_FORMAT = "JPEG"
    KEY_FLIP = (True, True)
    KEY_ROTATION = 0

    DECK_TYPE = "Stream Deck Neo"
    DECK_VISUAL = True

    SCREEN_PIXEL_WIDTH = 248
    SCREEN_PIXEL_HEIGHT = 58
    SCREEN_IMAGE_FORMAT = "JPEG"
    SCREEN_FLIP = (True, True)
    SCREEN_ROTATION = 0

    IMAGE_REPORT_LENGTH = 1024
    IMAGE_REPORT_HEADER_LENGTH = 8
    IMAGE_REPORT_PAYLOAD_LENGTH = IMAGE_REPORT_LENGTH - IMAGE_REPORT_HEADER_LENGTH

    # 96 x 96 black JPEG
    BLANK_KEY_IMAGE = [
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08,
        0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a,
        0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34,
        0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xdb, 0x00, 0x43, 0x01, 0x09,
        0x09, 0x09, 0x0c, 0x0b, 0x0c, 0x18, 0x0d, 0x0d, 0x18, 0x32, 0x21, 0x1c, 0x21, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32,
        0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32,
        0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32,
        0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x60, 0x00, 0x60, 0x03, 0x01, 0x22, 0x00,
        0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01,
        0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a,
        0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03, 0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00,
        0x00, 0x01, 0x7d, 0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07,
        0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62,
        0x72, 0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35, 0x36, 0x37,
        0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a,
        0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85,
        0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6,
        0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7,
        0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7,
        0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xc4, 0x00, 0x1f, 0x01, 0x00,
        0x03, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03,
        0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x11, 0x00, 0x02, 0x01, 0x02, 0x04, 0x04,
        0x03, 0x04, 0x07, 0x05, 0x04, 0x04, 0x00, 0x01, 0x02, 0x77, 0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21, 0x31,
        0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71, 0x13, 0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91, 0xa1, 0xb1, 0xc1, 0x09,
        0x23, 0x33, 0x52, 0xf0, 0x15, 0x62, 0x72, 0xd1, 0x0a, 0x16, 0x24, 0x34, 0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a,
        0x26, 0x27, 0x28, 0x29, 0x2a, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a,
        0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
        0x76, 0x77, 0x78, 0x79, 0x7a, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96,
        0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7,
        0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8,
        0xd9, 0xda, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9,
        0xfa, 0xff, 0xda, 0x00, 0x0c, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3f, 0x00, 0xf9, 0xfe, 0x8a, 0x28,
        0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a,
        0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02,
        0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0,
        0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28,
        0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a,
        0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02,
        0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0,
        0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x0f, 0xff, 0xd9
    ]

    # 248 x 58 black JPEG
    BLANK_SCREEN_IMAGE = [
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08,
        0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a,
        0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34,
        0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00,
        0x3a, 0x00, 0xf8, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x15, 0x00, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xff, 0xc4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01,
        0x01, 0x00, 0x00, 0x3f, 0x00, 0x9f, 0xc0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7f, 0xff, 0xd9
    ]

    def _read_control_states(self):
        states = self.device.read(4 + self.KEY_COUNT + self.TOUCH_KEY_COUNT)
        if states is None:
            return None

        states = states[4:]
        return {
            ControlType.KEY: [bool(s) for s in states]
        }

    def _reset_key_stream(self):
        payload = bytearray(self.IMAGE_REPORT_LENGTH)
        payload[0] = 0x02
        self.device.write(payload)

    def reset(self):
        payload = bytearray(32)
        payload[0:2] = [0x03, 0x02]
        self.device.write_feature(payload)

    def set_brightness(self, percent):
        if isinstance(percent, float):
            percent = int(100.0 * percent)

        percent = min(max(percent, 0), 100)

        payload = bytearray(32)
        payload[0:2] = [0x03, 0x08, percent]
        self.device.write_feature(payload)

    def get_serial_number(self):
        serial = self.device.read_feature(0x06, 32)
        return self._extract_string(serial[2:])

    def get_firmware_version(self):
        version = self.device.read_feature(0x05, 32)
        return self._extract_string(version[6:])

    def set_key_image(self, key, image):
        if min(max(key, 0), self.KEY_COUNT - 1) != key:
            raise IndexError("Invalid key index {}.".format(key))

        image = bytes(image or self.BLANK_KEY_IMAGE)

        page_number = 0
        bytes_remaining = len(image)
        while bytes_remaining > 0:
            this_length = min(bytes_remaining, self.IMAGE_REPORT_PAYLOAD_LENGTH)
            bytes_sent = page_number * self.IMAGE_REPORT_PAYLOAD_LENGTH

            header = [
                0x02,
                0x07,
                key,
                1 if this_length == bytes_remaining else 0,
                this_length & 0xFF,
                this_length >> 8,
                page_number & 0xFF,
                page_number >> 8
            ]

            payload = bytes(header) + image[bytes_sent:bytes_sent + this_length]
            padding = bytearray(self.IMAGE_REPORT_LENGTH - len(payload))
            self.device.write(payload + padding)

            bytes_remaining = bytes_remaining - this_length
            page_number = page_number + 1

    def set_key_color(self, key, r, g, b):
        if min(max(key, 0), self.KEY_COUNT + self.TOUCH_KEY_COUNT - 1) != key:
            raise IndexError("Invalid touch key index {}.".format(key))

        if r > 255 or r < 0 or g > 255 or g < 0 or b > 255 or b < 0:
            raise ValueError("Invalid color")

        payload = bytearray(32)
        payload[0:6] = [0x03, 0x06, key, r, g, b]
        self.device.write_feature(payload)

    def set_screen_image(self, image):
        if not image:
            image = self.BLANK_SCREEN_IMAGE

        image = bytes(image)

        page_number = 0
        bytes_remaining = len(image)
        while bytes_remaining > 0:
            this_length = min(bytes_remaining, self.IMAGE_REPORT_PAYLOAD_LENGTH)
            bytes_sent = page_number * self.IMAGE_REPORT_PAYLOAD_LENGTH

            header = [
                0x02,  # 0
                0x0b,  # 1
                0x00,  # 2
                0x01 if this_length == bytes_remaining else 0x00, # 3 is the last report?
                this_length & 0xff,  # 5 bytecount high byte
                (this_length >> 8) & 0xff,  # 4 bytecount high byte
                page_number & 0xff,  # 7 pagenumber low byte
                (page_number >> 8) & 0xff  # 6 pagenumber high byte
            ]

            payload = bytes(header) + image[bytes_sent:bytes_sent + this_length]
            padding = bytearray(self.IMAGE_REPORT_LENGTH - len(payload))
            self.device.write(payload + padding)

            bytes_remaining = bytes_remaining - this_length
            page_number = page_number + 1

    def set_touchscreen_image(self, image, x_pos=0, y_pos=0, width=0, height=0):
        pass



================================================
FILE: src/StreamDeck/Devices/StreamDeckOriginal.py
================================================
#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

from .StreamDeck import StreamDeck, ControlType


class StreamDeckOriginal(StreamDeck):
    """
    Represents a physically attached StreamDeck Original device.
    """

    KEY_COUNT = 15
    KEY_COLS = 5
    KEY_ROWS = 3

    KEY_PIXEL_WIDTH = 72
    KEY_PIXEL_HEIGHT = 72
    KEY_IMAGE_FORMAT = "BMP"
    KEY_FLIP = (True, True)
    KEY_ROTATION = 0

    DECK_TYPE = "Stream Deck Original"
    DECK_VISUAL = True

    IMAGE_REPORT_LENGTH = 8191
    IMAGE_REPORT_HEADER_LENGTH = 16

    # 72 x 72 black BMP
    BLANK_KEY_IMAGE = [
        0x42, 0x4d, 0xf6, 0x3c, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x36, 0x00, 0x00, 0x00, 0x28, 0x00,
        0x00, 0x00, 0x48, 0x00, 0x00, 0x00, 0x48, 0x00,
        0x00, 0x00, 0x01, 0x00, 0x18, 0x00, 0x00, 0x00,
        0x00, 0x00, 0xc0, 0x3c, 0x00, 0x00, 0xc4, 0x0e,
        0x00, 0x00, 0xc4, 0x0e, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ] + [0] * (KEY_PIXEL_WIDTH * KEY_PIXEL_HEIGHT * 3)

    def _convert_key_id_origin(self, key):
        key_col = key % self.KEY_COLS
        return (key - key_col) + ((self.KEY_COLS - 1) - key_col)

    def _read_control_states(self):
        states = self.device.read(1 + self.KEY_COUNT)
        if states is None:
            return None

        states = states[1:]
        return {
            ControlType.KEY: [bool(states[s]) for s in map(self._convert_key_id_origin, range(self.KEY_COUNT))]
        }

    def _reset_key_stream(self):
        payload = bytearray(self.IMAGE_REPORT_LENGTH)
        payload[0] = 0x02
        self.device.write(payload)

    def reset(self):
        payload = bytearray(17)
        payload[0:2] = [0x0B, 0x63]
        self.device.write_feature(payload)

    def set_brightness(self, percent):
        if isinstance(percent, float):
            percent = int(100.0 * percent)

        percent = min(max(percent, 0), 100)

        payload = bytearray(17)
        payload[0:6] = [0x05, 0x55, 0xaa, 0xd1, 0x01, percent]
        self.device.write_feature(payload)

    def get_serial_number(self):
        serial = self.device.read_feature(0x03, 17)
        return self._extract_string(serial[5:])

    def get_firmware_version(self):
        version = self.device.read_feature(0x04, 17)
        return self._extract_string(version[5:])

    def set_key_image(self, key, image):
        if min(max(key, 0), self.KEY_COUNT) != key:
            raise IndexError("Invalid key index {}.".format(key))

        image = bytes(image or self.BLANK_KEY_IMAGE)
        image_report_payload_length = len(image) // 2

        key = self._convert_key_id_origin(key)

        page_number = 0
        bytes_remaining = len(image)
        while bytes_remaining > 0:
            this_length = min(bytes_remaining, image_report_payload_length)
            bytes_sent = page_number * image_report_payload_length

            header = [
                0x02,
                0x01,
                page_number + 1,
                0,
                1 if this_length == bytes_remaining else 0,
                key + 1,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
            ]

            payload = bytes(header) + image[bytes_sent:bytes_sent + this_length]
            padding = bytearray(self.IMAGE_REPORT_LENGTH - len(payload))
            self.device.write(payload + padding)

            bytes_remaining = bytes_remaining - this_length
            page_number = page_number + 1

    def set_touchscreen_image(self, image, x_pos=0, y_pos=0, width=0, height=0):
        pass

    def set_key_color(self, key, r, g, b):
        pass

    def set_screen_image(self, image):
        pass



================================================
FILE: src/StreamDeck/Devices/StreamDeckOriginalV2.py
================================================
#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

from .StreamDeck import StreamDeck, ControlType


class StreamDeckOriginalV2(StreamDeck):
    """
    Represents a physically attached StreamDeck Original (V2) device.
    """

    KEY_COUNT = 15
    KEY_COLS = 5
    KEY_ROWS = 3

    KEY_PIXEL_WIDTH = 72
    KEY_PIXEL_HEIGHT = 72
    KEY_IMAGE_FORMAT = "JPEG"
    KEY_FLIP = (True, True)
    KEY_ROTATION = 0

    DECK_TYPE = "Stream Deck Original"
    DECK_VISUAL = True

    IMAGE_REPORT_LENGTH = 1024
    IMAGE_REPORT_HEADER_LENGTH = 8
    IMAGE_REPORT_PAYLOAD_LENGTH = IMAGE_REPORT_LENGTH - IMAGE_REPORT_HEADER_LENGTH

    # 72 x 72 black JPEG
    BLANK_KEY_IMAGE = [
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08,
        0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a,
        0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34,
        0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xdb, 0x00, 0x43, 0x01, 0x09,
        0x09, 0x09, 0x0c, 0x0b, 0x0c, 0x18, 0x0d, 0x0d, 0x18, 0x32, 0x21, 0x1c, 0x21, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32,
        0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32,
        0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32,
        0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x48, 0x00, 0x48, 0x03, 0x01, 0x22, 0x00,
        0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01,
        0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a,
        0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03, 0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00,
        0x00, 0x01, 0x7d, 0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07,
        0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62,
        0x72, 0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35, 0x36, 0x37,
        0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a,
        0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85,
        0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6,
        0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7,
        0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7,
        0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xc4, 0x00, 0x1f, 0x01, 0x00,
        0x03, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03,
        0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x11, 0x00, 0x02, 0x01, 0x02, 0x04, 0x04,
        0x03, 0x04, 0x07, 0x05, 0x04, 0x04, 0x00, 0x01, 0x02, 0x77, 0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21, 0x31,
        0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71, 0x13, 0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91, 0xa1, 0xb1, 0xc1, 0x09,
        0x23, 0x33, 0x52, 0xf0, 0x15, 0x62, 0x72, 0xd1, 0x0a, 0x16, 0x24, 0x34, 0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a,
        0x26, 0x27, 0x28, 0x29, 0x2a, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a,
        0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
        0x76, 0x77, 0x78, 0x79, 0x7a, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96,
        0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7,
        0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8,
        0xd9, 0xda, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9,
        0xfa, 0xff, 0xda, 0x00, 0x0c, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3f, 0x00, 0xf9, 0xfe, 0x8a, 0x28,
        0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a,
        0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02,
        0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0,
        0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28,
        0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a,
        0x28, 0xa0, 0x0f, 0xff, 0xd9
    ]

    def _read_control_states(self):
        states = self.device.read(4 + self.KEY_COUNT)
        if states is None:
            return None

        states = states[4:]
        return {
            ControlType.KEY: [bool(s) for s in states]
        }

    def _reset_key_stream(self):
        payload = bytearray(self.IMAGE_REPORT_LENGTH)
        payload[0] = 0x02
        self.device.write(payload)

    def reset(self):
        payload = bytearray(32)
        payload[0:2] = [0x03, 0x02]
        self.device.write_feature(payload)

    def set_brightness(self, percent):
        if isinstance(percent, float):
            percent = int(100.0 * percent)

        percent = min(max(percent, 0), 100)

        payload = bytearray(32)
        payload[0:2] = [0x03, 0x08, percent]
        self.device.write_feature(payload)

    def get_serial_number(self):
        serial = self.device.read_feature(0x06, 32)
        return self._extract_string(serial[2:])

    def get_firmware_version(self):
        version = self.device.read_feature(0x05, 32)
        return self._extract_string(version[6:])

    def set_key_image(self, key, image):
        if min(max(key, 0), self.KEY_COUNT) != key:
            raise IndexError("Invalid key index {}.".format(key))

        image = bytes(image or self.BLANK_KEY_IMAGE)

        page_number = 0
        bytes_remaining = len(image)
        while bytes_remaining > 0:
            this_length = min(bytes_remaining, self.IMAGE_REPORT_PAYLOAD_LENGTH)
            bytes_sent = page_number * self.IMAGE_REPORT_PAYLOAD_LENGTH

            header = [
                0x02,
                0x07,
                key,
                1 if this_length == bytes_remaining else 0,
                this_length & 0xFF,
                this_length >> 8,
                page_number & 0xFF,
                page_number >> 8
            ]

            payload = bytes(header) + image[bytes_sent:bytes_sent + this_length]
            padding = bytearray(self.IMAGE_REPORT_LENGTH - len(payload))
            self.device.write(payload + padding)

            bytes_remaining = bytes_remaining - this_length
            page_number = page_number + 1

    def set_touchscreen_image(self, image, x_pos=0, y_pos=0, width=0, height=0):
        pass

    def set_key_color(self, key, r, g, b):
        pass

    def set_screen_image(self, image):
        pass



================================================
FILE: src/StreamDeck/Devices/StreamDeckPedal.py
================================================
#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

from .StreamDeck import StreamDeck, ControlType


class StreamDeckPedal(StreamDeck):
    """
    Represents a physically attached StreamDeck Pedal device.
    """

    KEY_COUNT = 3
    KEY_COLS = 3
    KEY_ROWS = 1

    DECK_TYPE = "Stream Deck Pedal"
    DECK_VISUAL = False

    def _read_control_states(self):
        states = self.device.read(4 + self.KEY_COUNT)
        if states is None:
            return None

        states = states[4:]
        return {
            ControlType.KEY: [bool(s) for s in states]
        }

    def _reset_key_stream(self):
        pass

    def reset(self):
        pass

    def set_brightness(self, percent):
        pass

    def get_serial_number(self):
        serial = self.device.read_feature(0x06, 32)
        return self._extract_string(serial[2:])

    def get_firmware_version(self):
        version = self.device.read_feature(0x05, 32)
        return self._extract_string(version[6:])

    def set_key_image(self, key, image):
        pass

    def set_touchscreen_image(self, image, x_pos=0, y_pos=0, width=0, height=0):
        pass

    def set_key_color(self, key, r, g, b):
        pass

    def set_screen_image(self, image):
        pass



================================================
FILE: src/StreamDeck/Devices/StreamDeckPlus.py
================================================
#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

from .StreamDeck import StreamDeck, ControlType, DialEventType, TouchscreenEventType


def _dials_rotation_transform(value):
    if value < 0x80:
        # Clockwise rotation
        return value
    else:
        # Counterclockwise rotation
        return -(0x100 - value)


class StreamDeckPlus(StreamDeck):
    KEY_COUNT = 8
    KEY_COLS = 4
    KEY_ROWS = 2

    DIAL_COUNT = 4

    KEY_PIXEL_WIDTH = 120
    KEY_PIXEL_HEIGHT = 120
    KEY_IMAGE_FORMAT = "JPEG"
    KEY_FLIP = (False, False)
    KEY_ROTATION = 0

    DECK_TYPE = "Stream Deck +"
    DECK_VISUAL = True
    DECK_TOUCH = True

    TOUCHSCREEN_PIXEL_HEIGHT = 100
    TOUCHSCREEN_PIXEL_WIDTH = 800
    TOUCHSCREEN_IMAGE_FORMAT = "JPEG"
    TOUCHSCREEN_FLIP = (False, False)
    TOUCHSCREEN_ROTATION = 0

    _IMG_PACKET_LEN = 1024  # Max size for a data packet when setting images

    _KEY_PACKET_HEADER = 8
    _LCD_PACKET_HEADER = 16

    _KEY_PACKET_PAYLOAD_LEN = _IMG_PACKET_LEN - _KEY_PACKET_HEADER
    _LCD_PACKET_PAYLOAD_LEN = _IMG_PACKET_LEN - _LCD_PACKET_HEADER

    _DIAL_EVENT_TRANSFORM = {
        DialEventType.TURN: _dials_rotation_transform,
        DialEventType.PUSH: bool,
    }

    # 120 x 120 black JPEG
    BLANK_KEY_IMAGE = [
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00,
        0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb,
        0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07,
        0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b,
        0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e,
        0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c,
        0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34,
        0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34,
        0x32, 0xff, 0xdb, 0x00, 0x43, 0x01, 0x09, 0x09, 0x09, 0x0c, 0x0b,
        0x0c, 0x18, 0x0d, 0x0d, 0x18, 0x32, 0x21, 0x1c, 0x21, 0x32, 0x32,
        0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32,
        0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32,
        0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32,
        0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32,
        0x32, 0x32, 0x32, 0x32, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x78,
        0x00, 0x78, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11,
        0x01, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a,
        0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03, 0x03,
        0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7d,
        0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41,
        0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91,
        0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24,
        0x33, 0x62, 0x72, 0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a,
        0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38,
        0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53,
        0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66,
        0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79,
        0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93,
        0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5,
        0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7,
        0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
        0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1,
        0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2,
        0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xc4, 0x00,
        0x1f, 0x01, 0x00, 0x03, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
        0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03,
        0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00,
        0xb5, 0x11, 0x00, 0x02, 0x01, 0x02, 0x04, 0x04, 0x03, 0x04, 0x07,
        0x05, 0x04, 0x04, 0x00, 0x01, 0x02, 0x77, 0x00, 0x01, 0x02, 0x03,
        0x11, 0x04, 0x05, 0x21, 0x31, 0x06, 0x12, 0x41, 0x51, 0x07, 0x61,
        0x71, 0x13, 0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91, 0xa1, 0xb1,
        0xc1, 0x09, 0x23, 0x33, 0x52, 0xf0, 0x15, 0x62, 0x72, 0xd1, 0x0a,
        0x16, 0x24, 0x34, 0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a, 0x26,
        0x27, 0x28, 0x29, 0x2a, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43,
        0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56,
        0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69,
        0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x82, 0x83,
        0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95,
        0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
        0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9,
        0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2,
        0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe2, 0xe3, 0xe4,
        0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6,
        0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xda, 0x00, 0x0c, 0x03, 0x01, 0x00,
        0x02, 0x11, 0x03, 0x11, 0x00, 0x3f, 0x00, 0xf9, 0xfe, 0x8a, 0x28,
        0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a,
        0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02,
        0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0,
        0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28,
        0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a,
        0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02,
        0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0,
        0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28,
        0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a,
        0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02,
        0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0,
        0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28,
        0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a,
        0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02,
        0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0,
        0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28,
        0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a,
        0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02,
        0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0,
        0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28,
        0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a,
        0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02,
        0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0,
        0x0f, 0xff, 0xd9
    ]

    # 120 x 800 black JPEG
    BLANK_TOUCHSCREEN_IMAGE = [
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00,
        0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb,
        0x00, 0x43, 0x00, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
        0x01, 0xff, 0xdb, 0x00, 0x43, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x03, 0x20,
        0x00, 0x64, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11,
        0x01, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a,
        0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03, 0x03,
        0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7d,
        0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41,
        0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91,
        0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24,
        0x33, 0x62, 0x72, 0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a,
        0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38,
        0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53,
        0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66,
        0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79,
        0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93,
        0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5,
        0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7,
        0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
        0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1,
        0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2,
        0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xc4, 0x00,
        0x1f, 0x01, 0x00, 0x03, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
        0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03,
        0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00,
        0xb5, 0x11, 0x00, 0x02, 0x01, 0x02, 0x04, 0x04, 0x03, 0x04, 0x07,
        0x05, 0x04, 0x04, 0x00, 0x01, 0x02, 0x77, 0x00, 0x01, 0x02, 0x03,
        0x11, 0x04, 0x05, 0x21, 0x31, 0x06, 0x12, 0x41, 0x51, 0x07, 0x61,
        0x71, 0x13, 0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91, 0xa1, 0xb1,
        0xc1, 0x09, 0x23, 0x33, 0x52, 0xf0, 0x15, 0x62, 0x72, 0xd1, 0x0a,
        0x16, 0x24, 0x34, 0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a, 0x26,
        0x27, 0x28, 0x29, 0x2a, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43,
        0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56,
        0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69,
        0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x82, 0x83,
        0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95,
        0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
        0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9,
        0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2,
        0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe2, 0xe3, 0xe4,
        0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6,
        0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xda, 0x00, 0x0c, 0x03, 0x01, 0x00,
        0x02, 0x11, 0x03, 0x11, 0x00, 0x3f, 0x00, 0xff, 0x00, 0x3f, 0xfa,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a,
        0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80,
        0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2,
        0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28, 0xa2, 0x80, 0x0a, 0x28,
        0xa2, 0x80, 0x3f, 0xff, 0xd9
    ]

    def _reset_key_stream(self):
        payload = bytearray(self._IMG_PACKET_LEN)
        payload[0] = 0x02
        self.device.write(payload)

    def reset(self):
        payload = bytearray(32)
        payload[0:2] = [0x03, 0x02]
        self.device.write_feature(payload)

    def _read_control_states(self):
        states = self.device.read(14)

        if states is None:
            return None

        states = states[1:]

        if states[0] == 0x00: # Key Event
            new_key_states = [bool(s) for s in states[3:11]]

            return {
                ControlType.KEY: new_key_states
            }
        elif states[0] == 0x02: # Touchscreen Event
            if states[3] == 1:
                event_type = TouchscreenEventType.SHORT
            elif states[3] == 2:
                event_type = TouchscreenEventType.LONG
            elif states[3] == 3:
                event_type = TouchscreenEventType.DRAG
            else:
                return None

            value = {
                'x': (states[6] << 8) + states[5],
                'y': (states[8] << 8) + states[7]
            }

            if event_type == TouchscreenEventType.DRAG:
                value["x_out"] = (states[10] << 8) + states[9]
                value["y_out"] = (states[12] << 8) + states[11]

            return {
                ControlType.TOUCHSCREEN: (event_type, value),
            }
        elif states[0] == 0x03: # Dial Event
            if states[3] == 0x01:
                event_type = DialEventType.TURN
            elif states[3] == 0x00:
                event_type = DialEventType.PUSH
            else:
                return None

            values = [self._DIAL_EVENT_TRANSFORM[event_type](s) for s in states[4:4 + self.DIAL_COUNT]]

            return {
                ControlType.DIAL: {
                    event_type: values,
                }
            }

    def set_brightness(self, percent):
        if isinstance(percent, float):
            percent = int(100.0 * percent)

        percent = min(max(percent, 0), 100)

        payload = bytearray(32)
        payload[0:3] = [0x03, 0x08, percent]

        self.device.write_feature(payload)

    def get_serial_number(self):
        serial = self.device.read_feature(0x06, 32)
        return self._extract_string(serial[5:])

    def get_firmware_version(self):
        version = self.device.read_feature(0x05, 32)
        return self._extract_string(version[5:])

    def set_key_image(self, key, image):
        if min(max(key, 0), self.KEY_COUNT) != key:
            raise IndexError("Invalid key index {}.".format(key))

        image = bytes(image or self.BLANK_KEY_IMAGE)

        page_number = 0
        bytes_remaining = len(image)
        while bytes_remaining > 0:
            this_length = min(bytes_remaining, self._KEY_PACKET_PAYLOAD_LEN)

            header = [
                0x02,                                           # 0
                0x07,                                           # 1
                key & 0xff,                                     # 2 key_index
                1 if this_length == bytes_remaining else 0,     # 3 is_last
                this_length & 0xff,                             # 4 bytecount low byte
                (this_length >> 8) & 0xff,                      # 5 bytecount high byte
                page_number & 0xff,                             # 6 pagenumber low byte
                (page_number >> 8) & 0xff,                      # 7 pagenumber high byte
            ]

            bytes_sent = page_number * (self._KEY_PACKET_PAYLOAD_LEN)
            payload = bytes(header) + image[bytes_sent:bytes_sent + this_length]
            padding = bytearray(self._IMG_PACKET_LEN - len(payload))
            self.device.write(payload + padding)
            bytes_remaining = bytes_remaining - this_length
            page_number = page_number + 1

    def set_touchscreen_image(self, image, x_pos=0, y_pos=0, width=0, height=0):
        if not image:
            image = self.BLANK_TOUCHSCREEN_IMAGE
            x_pos = 0
            y_pos = 0
            width = self.TOUCHSCREEN_PIXEL_WIDTH
            height = self.TOUCHSCREEN_PIXEL_HEIGHT

        if min(max(x_pos, 0), self.TOUCHSCREEN_PIXEL_WIDTH) != x_pos:
            raise IndexError("Invalid x position {}.".format(x_pos))

        if min(max(y_pos, 0), self.TOUCHSCREEN_PIXEL_HEIGHT) != y_pos:
            raise IndexError("Invalid y position {}.".format(y_pos))

        if min(max(width, 1), self.TOUCHSCREEN_PIXEL_WIDTH - x_pos) != width:
            raise IndexError("Invalid draw width {}.".format(width))

        if min(max(height, 1), self.TOUCHSCREEN_PIXEL_HEIGHT - y_pos) != height:
            raise IndexError("Invalid draw height {}.".format(height))

        image = bytes(image)

        page_number = 0
        bytes_remaining = len(image)
        while bytes_remaining > 0:
            this_length = min(bytes_remaining, self._LCD_PACKET_PAYLOAD_LEN)
            bytes_sent = page_number * self._LCD_PACKET_PAYLOAD_LEN

            header = [
                0x02,  # 0
                0x0c,  # 1
                x_pos & 0xff,  # 2 xpos low byte
                (x_pos >> 8) & 0xff,  # 3 xpos high byte
                y_pos & 0xff,  # 4 ypos low byte
                (y_pos >> 8) & 0xff,  # 5 ypos high byte
                width & 0xff,  # 6 width low byte // 120
                (width >> 8) & 0xff,  # 7 width high byte
                height & 0xff,  # 8 height low byte // 120
                (height >> 8) & 0xff,  # 9 height high byte
                1 if this_length == bytes_remaining else 0,  # 10 is the last report?
                page_number & 0xff,  # 12 pagenumber low byte
                (page_number >> 8) & 0xff,  # 11 pagenumber high byte
                this_length & 0xff,  # 14 bytecount high byte
                (this_length >> 8) & 0xff,  # 13 bytecount high byte
                0x00,  # 15 padding
            ]

            payload = bytes(header) + image[bytes_sent:bytes_sent + this_length]
            padding = bytearray(self._IMG_PACKET_LEN - len(payload))
            self.device.write(payload + padding)

            bytes_remaining = bytes_remaining - this_length
            page_number = page_number + 1

    def set_key_color(self, key, r, g, b):
        pass

    def set_screen_image(self, image):
        pass



================================================
FILE: src/StreamDeck/Devices/StreamDeckStudio.py
================================================
#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

from .StreamDeck import ControlType, DialEventType, StreamDeck
from ..ImageHelpers import PILHelper


def _dials_rotation_transform(value):
    if value < 0x80:
        # Clockwise rotation
        return value
    else:
        # Counterclockwise rotation
        return -(0x100 - value)


class StreamDeckStudio(StreamDeck):
    KEY_COUNT = 32
    KEY_COLS = 16
    KEY_ROWS = 2

    DIAL_COUNT = 2

    KEY_PIXEL_WIDTH = 80
    KEY_PIXEL_HEIGHT = 120
    KEY_IMAGE_FORMAT = "JPEG"
    KEY_FLIP = (False, False)
    KEY_ROTATION = 0

    DECK_TYPE = "Stream Deck Studio"
    DECK_VISUAL = True

    _HID_INPUT_REPORT = 0x01
    _HID_OUTPUT_REPORT_ID = 0x02

    _DIAL_RING_CMD = 0x0F
    _DIAL_KNOB_CMD = 0x10
    _DIAL_RING_SEGMENTS = 24

    _IMG_PACKET_LEN = 1024

    _KEY_PACKET_HEADER = 8
    _LCD_PACKET_HEADER = 16

    _KEY_PACKET_PAYLOAD_LEN = _IMG_PACKET_LEN - _KEY_PACKET_HEADER
    _LCD_PACKET_PAYLOAD_LEN = _IMG_PACKET_LEN - _LCD_PACKET_HEADER

    _DIAL_EVENT_TRANSFORM = {
        DialEventType.TURN: _dials_rotation_transform,
        DialEventType.PUSH: bool,
    }

    def __init__(self, device):
        super().__init__(device)
        self.BLANK_KEY_IMAGE = PILHelper.to_native_key_format(
            self, PILHelper.create_key_image(self, "black")
        )

    def _reset_key_stream(self):
        payload = bytearray(self._IMG_PACKET_LEN)
        payload[0] = self._HID_OUTPUT_REPORT_ID
        self.device.write(payload)

    def reset(self):
        payload = bytearray(32)
        payload[0:2] = [0x03, 0x02]
        self.device.write_feature(payload)

    def _read_control_states(self):
        states = self.device.read(43)

        if states is None:
            return None

        states = states[1:]

        if states[0] == 0x00:
            return self._parse_key_event(states)
        elif states[0] == 0x03:
            return self._parse_dial_event(states)

        return None

    def _parse_key_event(self, states):
        new_key_states = [bool(s) for s in states[3:35]]
        return {ControlType.KEY: new_key_states}

    def _parse_dial_event(self, states):
        if states[3] == 0x01:
            event_type = DialEventType.TURN
        elif states[3] == 0x00:
            event_type = DialEventType.PUSH
        else:
            return None

        values = [
            self._DIAL_EVENT_TRANSFORM[event_type](s)
            for s in states[4:4 + self.DIAL_COUNT]
        ]

        return {ControlType.DIAL: {event_type: values}}

    def set_brightness(self, percent):
        if isinstance(percent, float):
            percent = int(100.0 * percent)

        percent = max(0, min(percent, 100))

        payload = bytearray(32)
        payload[0:3] = [0x03, 0x08, percent]

        self.device.write_feature(payload)

    def get_serial_number(self):
        serial = self.device.read_feature(0x06, 32)
        return self._extract_string(serial[5:])

    def get_firmware_version(self):
        version = self.device.read_feature(0x05, 32)
        return self._extract_string(version[5:])

    def set_key_image(self, key, image):
        if not 0 <= key < self.KEY_COUNT:
            raise IndexError(f"Invalid key index {key}.")

        image = bytes(image or self.BLANK_KEY_IMAGE)

        page_number = 0
        bytes_remaining = len(image)

        while bytes_remaining > 0:
            this_length = min(bytes_remaining, self._KEY_PACKET_PAYLOAD_LEN)
            is_last = 1 if this_length == bytes_remaining else 0

            header = [
                self._HID_OUTPUT_REPORT_ID,
                0x07,
                key & 0xFF,  # key index
                is_last,
                this_length & 0xFF,  # bytecount low byte
                (this_length >> 8) & 0xFF,  # bytecount high byte
                page_number & 0xFF,  # page number low byte
                (page_number >> 8) & 0xFF,  # page number high byte
            ]

            bytes_sent = page_number * self._KEY_PACKET_PAYLOAD_LEN
            payload = bytes(header) + image[bytes_sent:bytes_sent + this_length]
            padding = bytearray(self._IMG_PACKET_LEN - len(payload))
            self.device.write(payload + padding)

            bytes_remaining -= this_length
            page_number += 1

    def set_touchscreen_image(self, image, x_pos=0, y_pos=0, width=0, height=0):
        pass

    def set_key_color(self, key, r, g, b):
        pass

    def set_screen_image(self, image):
        pass

    def set_encoder_knob_color(self, encoder, rgb):
        data = [
            self._HID_OUTPUT_REPORT_ID,
            self._DIAL_KNOB_CMD,
            encoder,
            rgb[0], rgb[1], rgb[2],
        ]
        self.device.write(bytes(data))

    def set_encoder_ring_color(self, encoder, rgb):
        data = [
            self._HID_OUTPUT_REPORT_ID,
            self._DIAL_RING_CMD,
            encoder,
        ] + [rgb[0], rgb[1], rgb[2]] * self._DIAL_RING_SEGMENTS
        self.device.write(bytes(data))

    def set_encoder_ring_percentage(
            self, encoder, rgb, value, segment_count=21):
        """
        Sets the color of a portion of the encoder ring based on a percentage
        value.
        Args:
            encoder (int): The encoder index (0 or 1).
            rgb (tuple): A tuple of (R, G, B) values for the color.
            value (int): The percentage value (0-100) to fill the ring.
            segment_count (int): The number of segments to light up for 100%
                (default is 21).
        """
        if not 0 < segment_count <= self._DIAL_RING_SEGMENTS:
            raise ValueError(
                f"Invalid segment count {segment_count}, "
                f"must be between 1 and {self._DIAL_RING_SEGMENTS}."
            )

        segments = round(value * segment_count / 100.0)
        led_data = (
            list(rgb) * segments + [0, 0, 0] * (self._DIAL_RING_SEGMENTS - segments)
        )

        if encoder == 0:
            offset = self._DIAL_RING_SEGMENTS * 3 // 2
            led_data = led_data[offset:] + led_data[:offset]

        data = [self._HID_OUTPUT_REPORT_ID, self._DIAL_RING_CMD, encoder] + led_data
        self.device.write(bytes(data))



================================================
FILE: src/StreamDeck/Devices/StreamDeckXL.py
================================================
#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

from .StreamDeck import StreamDeck, ControlType


class StreamDeckXL(StreamDeck):
    """
    Represents a physically attached StreamDeck XL device.
    """

    KEY_COUNT = 32
    KEY_COLS = 8
    KEY_ROWS = 4

    KEY_PIXEL_WIDTH = 96
    KEY_PIXEL_HEIGHT = 96
    KEY_IMAGE_FORMAT = "JPEG"
    KEY_FLIP = (True, True)
    KEY_ROTATION = 0

    DECK_TYPE = "Stream Deck XL"
    DECK_VISUAL = True

    IMAGE_REPORT_LENGTH = 1024
    IMAGE_REPORT_HEADER_LENGTH = 8
    IMAGE_REPORT_PAYLOAD_LENGTH = IMAGE_REPORT_LENGTH - IMAGE_REPORT_HEADER_LENGTH

    # 96 x 96 black JPEG
    BLANK_KEY_IMAGE = [
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08,
        0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a,
        0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34,
        0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xdb, 0x00, 0x43, 0x01, 0x09,
        0x09, 0x09, 0x0c, 0x0b, 0x0c, 0x18, 0x0d, 0x0d, 0x18, 0x32, 0x21, 0x1c, 0x21, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32,
        0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32,
        0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0x32,
        0x32, 0x32, 0x32, 0x32, 0x32, 0x32, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x60, 0x00, 0x60, 0x03, 0x01, 0x22, 0x00,
        0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01,
        0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a,
        0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03, 0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00,
        0x00, 0x01, 0x7d, 0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07,
        0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62,
        0x72, 0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35, 0x36, 0x37,
        0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a,
        0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85,
        0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6,
        0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7,
        0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7,
        0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xc4, 0x00, 0x1f, 0x01, 0x00,
        0x03, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03,
        0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x11, 0x00, 0x02, 0x01, 0x02, 0x04, 0x04,
        0x03, 0x04, 0x07, 0x05, 0x04, 0x04, 0x00, 0x01, 0x02, 0x77, 0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21, 0x31,
        0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71, 0x13, 0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91, 0xa1, 0xb1, 0xc1, 0x09,
        0x23, 0x33, 0x52, 0xf0, 0x15, 0x62, 0x72, 0xd1, 0x0a, 0x16, 0x24, 0x34, 0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a,
        0x26, 0x27, 0x28, 0x29, 0x2a, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a,
        0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
        0x76, 0x77, 0x78, 0x79, 0x7a, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96,
        0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7,
        0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8,
        0xd9, 0xda, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9,
        0xfa, 0xff, 0xda, 0x00, 0x0c, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3f, 0x00, 0xf9, 0xfe, 0x8a, 0x28,
        0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a,
        0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02,
        0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0,
        0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28,
        0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a,
        0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02,
        0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0,
        0x02, 0x8a, 0x28, 0xa0, 0x02, 0x8a, 0x28, 0xa0, 0x0f, 0xff, 0xd9
    ]

    def _read_control_states(self):
        states = self.device.read(4 + self.KEY_COUNT)
        if states is None:
            return None

        states = states[4:]
        return {
            ControlType.KEY: [bool(s) for s in states]
        }

    def _reset_key_stream(self):
        payload = bytearray(self.IMAGE_REPORT_LENGTH)
        payload[0] = 0x02
        self.device.write(payload)

    def reset(self):
        payload = bytearray(32)
        payload[0:2] = [0x03, 0x02]
        self.device.write_feature(payload)

    def set_brightness(self, percent):
        if isinstance(percent, float):
            percent = int(100.0 * percent)

        percent = min(max(percent, 0), 100)

        payload = bytearray(32)
        payload[0:2] = [0x03, 0x08, percent]
        self.device.write_feature(payload)

    def get_serial_number(self):
        serial = self.device.read_feature(0x06, 32)
        return self._extract_string(serial[2:])

    def get_firmware_version(self):
        version = self.device.read_feature(0x05, 32)
        return self._extract_string(version[6:])

    def set_key_image(self, key, image):
        if min(max(key, 0), self.KEY_COUNT) != key:
            raise IndexError("Invalid key index {}.".format(key))

        image = bytes(image or self.BLANK_KEY_IMAGE)

        page_number = 0
        bytes_remaining = len(image)
        while bytes_remaining > 0:
            this_length = min(bytes_remaining, self.IMAGE_REPORT_PAYLOAD_LENGTH)
            bytes_sent = page_number * self.IMAGE_REPORT_PAYLOAD_LENGTH

            header = [
                0x02,
                0x07,
                key,
                1 if this_length == bytes_remaining else 0,
                this_length & 0xFF,
                this_length >> 8,
                page_number & 0xFF,
                page_number >> 8
            ]

            payload = bytes(header) + image[bytes_sent:bytes_sent + this_length]
            padding = bytearray(self.IMAGE_REPORT_LENGTH - len(payload))
            self.device.write(payload + padding)

            bytes_remaining = bytes_remaining - this_length
            page_number = page_number + 1

    def set_touchscreen_image(self, image, x_pos=0, y_pos=0, width=0, height=0):
        pass

    def set_key_color(self, key, r, g, b):
        pass

    def set_screen_image(self, image):
        pass



================================================
FILE: src/StreamDeck/ImageHelpers/__init__.py
================================================
[Empty file]


================================================
FILE: src/StreamDeck/ImageHelpers/PILHelper.py
================================================
#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

import io
from PIL import Image

from ..Devices.StreamDeck import StreamDeck


def _create_image(image_format, background):
    return Image.new("RGB", image_format['size'], background)


def _scale_image(image, image_format, margins=(0, 0, 0, 0), background='black'):
    if len(margins) != 4:
        raise ValueError("Margins should be given as an array of four integers.")

    final_image = _create_image(image_format, background=background)

    thumbnail_max_width = final_image.width - (margins[1] + margins[3])
    thumbnail_max_height = final_image.height - (margins[0] + margins[2])

    thumbnail = image.convert("RGBA")
    thumbnail.thumbnail((thumbnail_max_width, thumbnail_max_height), Image.LANCZOS)

    thumbnail_x = (margins[3] + (thumbnail_max_width - thumbnail.width) // 2)
    thumbnail_y = (margins[0] + (thumbnail_max_height - thumbnail.height) // 2)

    final_image.paste(thumbnail, (thumbnail_x, thumbnail_y), thumbnail)

    return final_image


def _to_native_format(image, image_format):
    if image.size != image_format['size']:
        image.thumbnail(image_format['size'])

    if image_format['rotation']:
        image = image.rotate(image_format['rotation'])

    if image_format['flip'][0]:
        image = image.transpose(Image.FLIP_LEFT_RIGHT)

    if image_format['flip'][1]:
        image = image.transpose(Image.FLIP_TOP_BOTTOM)

    # We want a compressed image in a given codec, convert.
    with io.BytesIO() as compressed_image:
        image.save(compressed_image, image_format['format'], quality=100)
        return compressed_image.getvalue()


def create_image(deck: StreamDeck, background: str = 'black') -> Image.Image:
    """
    .. deprecated:: 0.9.5
        Use :func:`~PILHelper.create_key_image` method instead.
    """
    return create_key_image(deck, background)


def create_key_image(deck: StreamDeck, background: str = 'black') -> Image.Image:
    """
    Creates a new PIL Image with the correct image dimensions for the given
    StreamDeck device's keys.

    .. seealso:: See :func:`~PILHelper.to_native_key_format` method for converting a
                 PIL image instance to the native key image format of a given
                 StreamDeck device.

    :param StreamDeck deck: StreamDeck device to generate a compatible image for.
    :param str background: Background color to use, compatible with `PIL.Image.new()`.

    :rtype: PIL.Image
    :return: Created PIL image
    """
    return _create_image(deck.key_image_format(), background)


def create_touchscreen_image(deck: StreamDeck, background: str = 'black') -> Image.Image:
    """
    Creates a new PIL Image with the correct image dimensions for the given
    StreamDeck device's touchscreen.

    .. seealso:: See :func:`~PILHelper.to_native_touchscreen_format` method for converting a
                 PIL image instance to the native touchscreen image format of a given
                 StreamDeck device.

    :param StreamDeck deck: StreamDeck device to generate a compatible image for.
    :param str background: Background color to use, compatible with `PIL.Image.new()`.

    :rtype: PIL.Image
    :return: Created PIL image
    """
    return _create_image(deck.touchscreen_image_format(), background)


def create_screen_image(deck: StreamDeck, background: str = 'black') -> Image.Image:
    """
    Creates a new PIL Image with the correct image dimensions for the given
    StreamDeck device's screen.

    .. seealso:: See :func:`~PILHelper.to_native_screen_format` method for converting a
                 PIL image instance to the native screen image format of a given
                 StreamDeck device.

    :param StreamDeck deck: StreamDeck device to generate a compatible image for.
    :param str background: Background color to use, compatible with `PIL.Image.new()`.

    :rtype: PIL.Image
    :return: Created PIL image
    """
    return _create_image(deck.screen_image_format(), background)


def create_scaled_image(deck: StreamDeck, image: Image.Image, margins: tuple[int, int, int, int] = (0, 0, 0, 0), background: str = 'black') -> Image.Image:
    """
    .. deprecated:: 0.9.5
        Use :func:`~PILHelper.create_scaled_key_image` method instead.
    """
    return create_scaled_key_image(deck, image, margins, background)


def create_scaled_key_image(deck: StreamDeck, image: Image.Image, margins: tuple[int, int, int, int] = (0, 0, 0, 0), background: str = 'black') -> Image.Image:
    """
    Creates a new key image that contains a scaled version of a given image,
    resized to best fit the given StreamDeck device's keys with the given
    margins around each side.

    The scaled image is centered within the new key image, offset by the given
    margins. The aspect ratio of the image is preserved.

    .. seealso:: See :func:`~PILHelper.to_native_key_format` method for converting a
                 PIL image instance to the native key image format of a given
                 StreamDeck device.

    :param StreamDeck deck: StreamDeck device to generate a compatible image for.
    :param Image image: PIL Image object to scale
    :param list(int): Array of margin pixels in (top, right, bottom, left) order.
    :param str background: Background color to use, compatible with `PIL.Image.new()`.

    :rtrype: PIL.Image
    :return: Loaded PIL image scaled and centered
    """
    return _scale_image(image, deck.key_image_format(), margins, background)


def create_scaled_touchscreen_image(deck: StreamDeck, image: Image.Image, margins: tuple[int, int, int, int] = (0, 0, 0, 0), background: str = 'black') -> Image.Image:
    """
    Creates a new touchscreen image that contains a scaled version of a given image,
    resized to best fit the given StreamDeck device's touchscreen with the given
    margins around each side.

    The scaled image is centered within the new touchscreen image, offset by the given
    margins. The aspect ratio of the image is preserved.

    .. seealso:: See :func:`~PILHelper.to_native_touchscreen_format` method for converting a
                 PIL image instance to the native key image format of a given
                 StreamDeck device.

    :param StreamDeck deck: StreamDeck device to generate a compatible image for.
    :param Image image: PIL Image object to scale
    :param list(int): Array of margin pixels in (top, right, bottom, left) order.
    :param str background: Background color to use, compatible with `PIL.Image.new()`.

    :rtrype: PIL.Image
    :return: Loaded PIL image scaled and centered
    """
    return _scale_image(image, deck.touchscreen_image_format(), margins, background)


def create_scaled_screen_image(deck: StreamDeck, image: Image.Image, margins: tuple[int, int, int, int] = (0, 0, 0, 0), background: str = 'black') -> Image.Image:
    """
    Creates a new screen image that contains a scaled version of a given image,
    resized to best fit the given StreamDeck device's screen with the given
    margins around each side.

    The scaled image is centered within the new screen image, offset by the given
    margins. The aspect ratio of the image is preserved.

    .. seealso:: See :func:`~PILHelper.to_native_screen_format` method for converting a
                 PIL image instance to the native key image format of a given
                 StreamDeck device.

    :param StreamDeck deck: StreamDeck device to generate a compatible image for.
    :param Image image: PIL Image object to scale
    :param list(int): Array of margin pixels in (top, right, bottom, left) order.
    :param str background: Background color to use, compatible with `PIL.Image.new()`.

    :rtrype: PIL.Image
    :return: Loaded PIL image scaled and centered
    """
    return _scale_image(image, deck.screen_image_format(), margins, background)


def to_native_format(deck: StreamDeck, image: Image.Image) -> bytes:
    """
    .. deprecated:: 0.9.5
        Use :func:`~PILHelper.to_native_key_format` method instead.
    """
    return to_native_key_format(deck, image)


def to_native_key_format(deck: StreamDeck, image: Image.Image) -> bytes:
    """
    Converts a given PIL image to the native key image format for a StreamDeck,
    suitable for passing to :func:`~StreamDeck.set_key_image`.

    .. seealso:: See :func:`~PILHelper.create_image` method for creating a PIL
                 image instance for a given StreamDeck device.

    :param StreamDeck deck: StreamDeck device to generate a compatible native image for.
    :param PIL.Image image: PIL Image to convert to the native StreamDeck image format

    :rtype: enumerable()
    :return: Image converted to the given StreamDeck's native format
    """
    return _to_native_format(image, deck.key_image_format())


def to_native_touchscreen_format(deck: StreamDeck, image: Image.Image) -> bytes:
    """
    Converts a given PIL image to the native touchscreen image format for a StreamDeck,
    suitable for passing to :func:`~StreamDeck.set_touchscreen_image`.

    .. seealso:: See :func:`~PILHelper.create_touchscreen_image` method for creating a PIL
                 image instance for a given StreamDeck device.

    :param StreamDeck deck: StreamDeck device to generate a compatible native image for.
    :param PIL.Image image: PIL Image to convert to the native StreamDeck image format

    :rtype: enumerable()
    :return: Image converted to the given StreamDeck's native touchscreen format
    """
    return _to_native_format(image, deck.touchscreen_image_format())


def to_native_screen_format(deck: StreamDeck, image: Image.Image) -> bytes:
    """
    Converts a given PIL image to the native screen image format for a StreamDeck,
    suitable for passing to :func:`~StreamDeck.set_screen_image`.

    .. seealso:: See :func:`~PILHelper.create_screen_image` method for creating a PIL
                 image instance for a given StreamDeck device.

    :param StreamDeck deck: StreamDeck device to generate a compatible native image for.
    :param PIL.Image image: PIL Image to convert to the native StreamDeck image format

    :rtype: enumerable()
    :return: Image converted to the given StreamDeck's native screen format
    """
    return _to_native_format(image, deck.screen_image_format())



================================================
FILE: src/StreamDeck/Transport/__init__.py
================================================
[Empty file]


================================================
FILE: src/StreamDeck/Transport/Dummy.py
================================================
#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

import binascii
import logging

from .Transport import Transport, TransportError


class Dummy(Transport):
    """
    Dummy transport layer, for testing.
    """

    class Device(Transport.Device):
        def __init__(self, vid, pid):
            self.vid = vid
            self.pid = pid
            self.id = "{}:{}".format(vid, pid)
            self.is_open = False

        def open(self):
            if self.is_open:
                return

            logging.info("Deck opened")
            self.is_open = True

        def close(self):
            if not self.is_open:
                return

            logging.info("Deck closed")
            self.is_open = False

        def is_open(self):
            return True

        def connected(self):
            return True

        def vendor_id(self):
            return self.vid

        def product_id(self):
            return self.pid

        def path(self):
            return self.id

        def write_feature(self, payload):
            if not self.is_open:
                raise TransportError("Deck feature write while deck not open.")

            logging.info("Deck feature write (length %s):\n%s", len(payload), binascii.hexlify(payload, ' ').decode('utf-8'))
            return True

        def read_feature(self, report_id, length):
            if not self.is_open:
                raise TransportError("Deck feature read while deck not open.")

            logging.info("Deck feature read (length %s)", length)
            return bytearray(length)

        def write(self, payload):
            if not self.is_open:
                raise TransportError("Deck write while deck not open.")

            logging.info("Deck report write (length %s):\n%s", len(payload), binascii.hexlify(payload, ' ').decode('utf-8'))
            return True

        def read(self, length):
            if not self.is_open:
                raise TransportError("Deck read while deck not open.")

            logging.info("Deck report read (length %s)", length)
            return None

    @staticmethod
    def probe():
        pass

    def enumerate(self, vid, pid):
        return [Dummy.Device(vid=vid, pid=pid)]



================================================
FILE: src/StreamDeck/Transport/LibUSBHIDAPI.py
================================================
#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

import atexit
import ctypes
import ctypes.util
import os
import platform
import threading

from .Transport import Transport, TransportError


class LibUSBHIDAPI(Transport):
    """
    USB HID transport layer, using the LibUSB HIDAPI dynamically linked library
    directly via ctypes.
    """

    class Library():
        HIDAPI_INSTANCE = None
        HOMEBREW_PREFIX = None

        def _get_homebrew_path(self):
            if self.platform_name != "Darwin":
                return None

            homebrew_path = os.environ.get('HOMEBREW_PREFIX')
            if not homebrew_path:
                try:
                    import subprocess # nosec B404

                    homebrew_path = subprocess.run(['brew', '--prefix'], stdout=subprocess.PIPE, text=True, check=True).stdout.strip() # nosec
                except: # nosec B110
                    pass

            return homebrew_path

        def _load_hidapi_library(self, library_search_list):
            """
            Loads the given LibUSB HIDAPI dynamic library from the host system,
            if available.

            :rtype: ctypes.CDLL
            :return: Loaded HIDAPI library instance, or None if no library was found.
            """

            # If the library's already loaded, we can use the existing instance and skip the slow load process.
            if self.HIDAPI_INSTANCE:
                return self.HIDAPI_INSTANCE

            # If we're running on MacOS, we very likely need to search for the library in the Homebrew path if it's installed.
            # The ctypes loader won't look in there by default unless the user has a Homebrew installed python, which gets patched
            # on installation.
            if not self.HOMEBREW_PREFIX:
                type(self).HOMEBREW_PREFIX = self._get_homebrew_path()

            for lib_name in library_search_list:
                # We'll try to use ctypes' utility function to find the library first, using
                # its default search paths. It requires the name of the library only (minus all
                # path prefix and extension suffix).
                library_name_no_extension = os.path.basename(os.path.splitext(lib_name)[0])
                try:
                    found_lib = ctypes.util.find_library(library_name_no_extension)
                except:
                    found_lib = None

                # If we've running with a Homebrew installation, and find_library() didn't find the library in
                # any of the default search paths, we'll look in Homebrew instead as a fallback.
                if not found_lib and self.HOMEBREW_PREFIX:
                    library_path_homebrew = os.path.join(self.HOMEBREW_PREFIX, 'lib', lib_name)

                    if os.path.exists(library_path_homebrew):
                        found_lib = library_path_homebrew

                try:
                    type(self).HIDAPI_INSTANCE = ctypes.cdll.LoadLibrary(found_lib if found_lib else lib_name)
                    break
                except: # nosec B110
                    pass
            else:
                return None

            class hid_device_info(ctypes.Structure):
                """
                Structure definition for the hid_device_info structure defined
                in the LibUSB HIDAPI library API.
                """
                pass

            hid_device_info._fields_ = [
                ('path', ctypes.c_char_p),
                ('vendor_id', ctypes.c_ushort),
                ('product_id', ctypes.c_ushort),
                ('serial_number', ctypes.c_wchar_p),
                ('release_number', ctypes.c_ushort),
                ('manufacturer_string', ctypes.c_wchar_p),
                ('product_string', ctypes.c_wchar_p),
                ('usage_page', ctypes.c_ushort),
                ('usage', ctypes.c_ushort),
                ('interface_number', ctypes.c_int),
                ('next', ctypes.POINTER(hid_device_info))
            ]

            self.HIDAPI_INSTANCE.hid_init.argtypes = []
            self.HIDAPI_INSTANCE.hid_init.restype = ctypes.c_int

            self.HIDAPI_INSTANCE.hid_exit.argtypes = []
            self.HIDAPI_INSTANCE.hid_exit.restype = ctypes.c_int

            self.HIDAPI_INSTANCE.hid_enumerate.argtypes = [ctypes.c_ushort, ctypes.c_ushort]
            self.HIDAPI_INSTANCE.hid_enumerate.restype = ctypes.POINTER(hid_device_info)

            self.HIDAPI_INSTANCE.hid_free_enumeration.argtypes = [ctypes.POINTER(hid_device_info)]
            self.HIDAPI_INSTANCE.hid_free_enumeration.restype = None

            self.HIDAPI_INSTANCE.hid_open_path.argtypes = [ctypes.c_char_p]
            self.HIDAPI_INSTANCE.hid_open_path.restype = ctypes.c_void_p

            self.HIDAPI_INSTANCE.hid_close.argtypes = [ctypes.c_void_p]
            self.HIDAPI_INSTANCE.hid_close.restype = None

            self.HIDAPI_INSTANCE.hid_set_nonblocking.argtypes = [ctypes.c_void_p, ctypes.c_int]
            self.HIDAPI_INSTANCE.hid_set_nonblocking.restype = ctypes.c_int

            self.HIDAPI_INSTANCE.hid_send_feature_report.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_char), ctypes.c_size_t]
            self.HIDAPI_INSTANCE.hid_send_feature_report.restype = ctypes.c_int

            self.HIDAPI_INSTANCE.hid_get_feature_report.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_char), ctypes.c_size_t]
            self.HIDAPI_INSTANCE.hid_get_feature_report.restype = ctypes.c_int

            self.HIDAPI_INSTANCE.hid_write.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_char), ctypes.c_size_t]
            self.HIDAPI_INSTANCE.hid_write.restype = ctypes.c_int

            self.HIDAPI_INSTANCE.hid_read.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_char), ctypes.c_size_t]
            self.HIDAPI_INSTANCE.hid_read.restype = ctypes.c_int

            self.HIDAPI_INSTANCE.hid_init()
            atexit.register(self.HIDAPI_INSTANCE.hid_exit)

            return self.HIDAPI_INSTANCE

        def __init__(self):
            """
            Creates a new LibUSB HIDAPI library instance, used to interface with
            HID devices attached to the host system.
            """

            search_library_names = {
                "Windows": ["hidapi.dll", "libhidapi-0.dll", "./hidapi.dll"],
                "Linux": ["libhidapi-libusb.so", "libhidapi-libusb.so.0"],
                "Darwin": ["libhidapi.dylib"],
                "FreeBSD": ["libhidapi.so"],
            }

            self.platform_name = platform.system()
            platform_search_library_names = search_library_names.get(self.platform_name)

            if not platform_search_library_names:
                raise TransportError("No suitable LibUSB HIDAPI library search names were found for this system.")

            self.hidapi = self._load_hidapi_library(platform_search_library_names)
            if not self.hidapi:
                raise TransportError("No suitable LibUSB HIDAPI library found on this system. Is the '{}' library installed?".format(platform_search_library_names[0]))

            self.mutex = threading.Lock()

        def enumerate(self, vendor_id=None, product_id=None):
            """
            Enumerates all available USB HID devices on the system.

            :param int vid: USB Vendor ID to filter all devices by, `None` if the
                            device list should not be filtered by vendor.
            :param int pid: USB Product ID to filter all devices by, `None` if the
                            device list should not be filtered by product.

            :rtype: list(dict())
            :return: List of discovered USB HID device attributes.
            """

            vendor_id = vendor_id or 0
            product_id = product_id or 0

            device_list = []

            with self.mutex:
                device_enumeration = self.hidapi.hid_enumerate(vendor_id, product_id)

                if device_enumeration:
                    current_device = device_enumeration

                    while current_device:
                        device_list.append({
                            'path': current_device.contents.path.decode('utf-8'),
                            'vendor_id': current_device.contents.vendor_id,
                            'product_id': current_device.contents.product_id,
                        })

                        current_device = current_device.contents.next

                self.hidapi.hid_free_enumeration(device_enumeration)

            return device_list

        def open_device(self, path):
            """
            Opens a HID device by its canonical path on the host system.

            :rtype: Handle
            :return: Device handle if opened successfully, None if open failed.
            """
            with self.mutex:
                if type(path) is not bytes:
                    path = bytes(path, 'utf-8')

                handle = self.hidapi.hid_open_path(path)

                if not handle:
                    raise TransportError("Could not open HID device.")

                self.hidapi.hid_set_nonblocking(handle, 1)

            return handle

        def close_device(self, handle):
            """
            Closes a HID device by its open device handle on the host system.

            :param Handle handle: Device handle to close.
            """
            with self.mutex:
                if handle:
                    self.hidapi.hid_close(handle)

        def send_feature_report(self, handle, data):
            """
            Sends a HID Feature report to an open HID device.

            :param Handle handle: Device handle to access.
            :param bytearray() data: Array of bytes to send to the device, as a
                                     feature report. The first byte of the
                                     report should be the Report ID of the
                                     report being sent.

            :rtype: int
            :return: Number of bytes successfully sent to the device.
            """
            if not handle:
                raise TransportError("No HID device.")

            with self.mutex:
                result = self.hidapi.hid_send_feature_report(handle, bytes(data), len(data))

            if result < 0:
                raise TransportError("Failed to write feature report (%d)" % result)

            return result

        def get_feature_report(self, handle, report_id, length):
            """
            Retrieves a HID Feature report from an open HID device.

            :param Handle handle: Device handle to access.
            :param int report_id: Report ID of the report being read.
            :param int length: Maximum length of the Feature report to read.

            :rtype: bytearray()
            :return: Array of bytes containing the read Feature report. The
                     first byte of the report will be the Report ID of the
                     report that was read.
            """
            if not handle:
                raise TransportError("No HID device.")

            # We may need to oversize our read due a bug in some versions of
            # HIDAPI. Only applied on Mac systems, as this will cause other
            # issues on other platforms.
            read_length = (length + 1) if self.platform_name == 'Darwin' else length

            data = ctypes.create_string_buffer(read_length)
            data[0] = report_id

            with self.mutex:
                result = self.hidapi.hid_get_feature_report(handle, data, len(data))

            if result < 0:
                raise TransportError("Failed to read feature report (%d)" % result)

            if length < read_length and result == read_length:
                # Mac HIDAPI 0.9.0 bug, we read one less than we expected (not including report ID).
                # We requested an over-sized report, so we actually got the amount we wanted.
                return data.raw

            # We read an extra byte (as expected). Just return the first length requested bytes.
            return data.raw[:length]

        def write(self, handle, data):
            """
            Writes a HID Out report to an open HID device.

            :param Handle handle: Device handle to access.
            :param bytearray() data: Array of bytes to send to the device, as an
                                     out report. The first byte of the report
                                     should be the Report ID of the report being
                                     sent.

            :rtype: int
            :return: Number of bytes successfully sent to the device.
            """
            if not handle:
                raise TransportError("No HID device.")

            with self.mutex:
                result = self.hidapi.hid_write(handle, bytes(data), len(data))

            if result < 0:
                raise TransportError("Failed to write out report (%d)" % result)

            return result

        def read(self, handle, length):
            """
            Performs a non-blocking read of a HID In report from an open HID device.

            :param Handle handle: Device handle to access.
            :param int length: Maximum length of the In report to read.

            :rtype: bytearray()
            :return: Array of bytes containing the read In report. The
                     first byte of the report will be the Report ID of the
                     report that was read.
            """
            if not handle:
                raise TransportError("No HID device.")

            data = ctypes.create_string_buffer(length)

            with self.mutex:
                result = self.hidapi.hid_read(handle, data, len(data))

            if result < 0:
                raise TransportError("Failed to read in report (%d)" % result)
            elif result == 0:
                return None

            return data.raw[:length]

    class Device(Transport.Device):
        def __init__(self, hidapi, device_info):
            self.hidapi = hidapi
            self.device_info = device_info
            self.device_handle = None
            self.mutex = threading.Lock()

        def __del__(self):
            self.close()

        def __exit__(self):
            self.close()

        def open(self):
            with self.mutex:
                if self.device_handle:
                    return

                self.device_handle = self.hidapi.open_device(self.device_info['path'])

        def close(self):
            with self.mutex:
                if self.device_handle:
                    self.hidapi.close_device(self.device_handle)
                    self.device_handle = None

        def is_open(self):
            with self.mutex:
                return self.device_handle is not None

        def connected(self):
            with self.mutex:
                return any([d['path'] == self.device_info['path'] for d in self.hidapi.enumerate()])

        def vendor_id(self):
            return self.device_info['vendor_id']

        def product_id(self):
            return self.device_info['product_id']

        def path(self):
            return self.device_info['path']

        def write_feature(self, payload):
            with self.mutex:
                return self.hidapi.send_feature_report(self.device_handle, payload)

        def read_feature(self, report_id, length):
            with self.mutex:
                return self.hidapi.get_feature_report(self.device_handle, report_id, length)

        def write(self, payload):
            with self.mutex:
                return self.hidapi.write(self.device_handle, payload)

        def read(self, length):
            with self.mutex:
                return self.hidapi.read(self.device_handle, length)

    @staticmethod
    def probe():
        LibUSBHIDAPI.Library()

    def enumerate(self, vid, pid):
        hidapi = LibUSBHIDAPI.Library()

        return [LibUSBHIDAPI.Device(hidapi, d) for d in hidapi.enumerate(vendor_id=vid, product_id=pid)]



================================================
FILE: src/StreamDeck/Transport/Transport.py
================================================
#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

from abc import ABC, abstractmethod


class TransportError(Exception):
    """
    Exception thrown when attempting to access a device using a backend
    transport that has failed (for example, if the requested device could not
    be accessed).
    """

    pass


class Transport(ABC):
    """
    Base transport layer, representing an abstract communication back-end which
    can be used to discovery attached StreamDeck devices.
    """

    class Device(ABC):
        """
        Base connection device, representing an abstract connected device which
        can be communicated with by an upper layer high level protocol.
        """

        @abstractmethod
        def open(self) -> None:
            """
            Opens the device for input/output. This must be called prior to
            sending or receiving any reports.

            .. seealso:: See :func:`~Transport.Device.close` for the
                         corresponding close method.
            """
            pass

        @abstractmethod
        def close(self) -> None:
            """
            Closes the device for input/output.

            .. seealso:: See :func:`~~Transport.Device.open` for the
                         corresponding open method.
            """
            pass

        @abstractmethod
        def is_open(self) -> bool:
            """
            Indicates if the physical device object this instance is attached
            to has been opened by the host.

            :rtype: bool
            :return: `True` if the device is open, `False` otherwise.
            """
            pass

        @abstractmethod
        def connected(self) -> bool:
            """
            Indicates if the physical device object this instance is attached
            to is still connected to the host.

            :rtype: bool
            :return: `True` if the device is still connected, `False` otherwise.
            """
            pass

        @abstractmethod
        def path(self) -> str:
            """
            Retrieves the logical path of the attached device within the
            current system. This can be used to uniquely differentiate one
            device from another.

            :rtype: str
            :return: Logical device path for the attached device.
            """
            pass

        @abstractmethod
        def vendor_id(self) -> int:
            """
            Retrieves the vendor ID value of the attached device.

            :rtype: int
            :return: Vendor ID of the attached device.
            """
            pass

        @abstractmethod
        def product_id(self) -> int:
            """
            Retrieves the product ID value of the attached device.

            :rtype: int
            :return: Product ID of the attached device.
            """
            pass

        @abstractmethod
        def write_feature(self, payload: bytes) -> int:
            """
            Sends a HID Feature report to the open HID device.

            :param enumerable() payload: Enumerate list of bytes to send to the
                                         device, as a feature report. The first
                                         byte of the report should be the Report
                                         ID of the report being sent.

            :rtype: int
            :return: Number of bytes successfully sent to the device.
            """
            pass

        @abstractmethod
        def read_feature(self, report_id: int, length: int) -> bytes:
            """
            Reads a HID Feature report from the open HID device.

            :param int report_id: Report ID of the report being read.
            :param int length: Maximum length of the Feature report to read.

            :rtype: list(byte)
            :return: List of bytes containing the read Feature report. The
                     first byte of the report will be the Report ID of the
                     report that was read.
            """
            pass

        @abstractmethod
        def write(self, payload: bytes) -> int:
            """
            Sends a HID Out report to the open HID device.

            :param enumerable() payload: Enumerate list of bytes to send to the
                                         device, as an Out report. The first
                                         byte of the report should be the Report
                                         ID of the report being sent.

            :rtype: int
            :return: Number of bytes successfully sent to the device.
            """
            pass

        @abstractmethod
        def read(self, length: int) -> bytes:
            """
            Performs a blocking read of a HID In report from the open HID device.

            :param int length: Maximum length of the In report to read.

            :rtype: list(byte)
            :return: List of bytes containing the read In report. The first byte
                     of the report will be the Report ID of the report that was
                     read.
            """
            pass

    @staticmethod
    @abstractmethod
    def probe() -> None:
        """
        Attempts to determine if the back-end is installed and usable. It is
        expected that probe failures throw exceptions detailing their exact
        cause of failure.
        """
        pass

    @abstractmethod
    def enumerate(self, vid: int, pid: int) -> list[Device]:
        """
        Enumerates all available devices on the system using the current
        transport back-end.

        :param int vid: USB Vendor ID to filter all devices by, `None` if the
                        device list should not be filtered by vendor.
        :param int pid: USB Product ID to filter all devices by, `None` if the
                        device list should not be filtered by product.

        :rtype: list(Transport.Device)
        :return: List of discovered devices that are available through this
                 transport back-end.
        """
        pass



================================================
FILE: test/test.py
================================================
#!/usr/bin/env python3

#         Python Stream Deck Library
#      Released under the MIT license
#
#   dean [at] fourwalledcubicle [dot] com
#         www.fourwalledcubicle.com
#

import argparse
import logging
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../src'))

from StreamDeck.DeviceManager import DeviceManager
from StreamDeck.ImageHelpers import PILHelper
from PIL import ImageDraw


def test_pil_helpers(deck):
    if not deck.is_visual():
        return

    test_key_image_pil = PILHelper.create_key_image(deck)
    test_scaled_key_image_pil = PILHelper.create_scaled_key_image(deck, test_key_image_pil)     # noqa: F841
    test_key_image_native = PILHelper.to_native_key_format(deck, test_scaled_key_image_pil)     # noqa: F841

    if deck.is_touch():
        test_touchscreen_image_pil = PILHelper.create_touchscreen_image(deck)
        test_scaled_touchscreen_image_pil = PILHelper.create_scaled_touchscreen_image(deck, test_touchscreen_image_pil)     # noqa: F841
        test_touchscreen_image_native = PILHelper.to_native_touchscreen_format(deck, test_scaled_touchscreen_image_pil)     # noqa: F841


def test_basic_apis(deck):
    with deck:
        deck.open()

        connected = deck.connected()     # noqa: F841
        deck_id = deck.id()     # noqa: F841
        key_count = deck.key_count()     # noqa: F841
        vendor_id = deck.vendor_id()     # noqa: F841
        product_id = deck.product_id()     # noqa: F841
        deck_type = deck.deck_type()     # noqa: F841
        key_layout = deck.key_layout()     # noqa: F841
        key_image_format = deck.key_image_format() if deck.is_visual() else None     # noqa: F841
        key_states = deck.key_states()     # noqa: F841
        dial_states = deck.dial_states()     # noqa: F841
        touchscreen_image_format = deck.touchscreen_image_format() if deck.is_touch() else None     # noqa: F841

        deck.set_key_callback(None)
        deck.reset()

        if deck.is_visual():
            deck.set_brightness(30)

            test_key_image_pil = PILHelper.create_key_image(deck)
            test_key_image_native = PILHelper.to_native_key_format(deck, test_key_image_pil)
            deck.set_key_image(0, None)
            deck.set_key_image(0, test_key_image_native)

            if deck.is_touch():
                test_touchscreen_image_pil = PILHelper.create_touchscreen_image(deck)
                test_touchscreen_image_native = PILHelper.to_native_touchscreen_format(deck, test_touchscreen_image_pil)
                deck.set_touchscreen_image(None)
                deck.set_touchscreen_image(test_touchscreen_image_native, 0, 0, test_touchscreen_image_pil.width, test_touchscreen_image_pil.height)

        deck.close()


def test_key_pattern(deck):
    if not deck.is_visual():
        return

    test_key_image = PILHelper.create_key_image(deck)

    draw = ImageDraw.Draw(test_key_image)
    draw.rectangle((0, 0) + test_key_image.size, fill=(0x11, 0x22, 0x33), outline=(0x44, 0x55, 0x66))

    test_key_image = PILHelper.to_native_key_format(deck, test_key_image)

    with deck:
        deck.open()
        deck.set_key_image(0, test_key_image)
        deck.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    parser = argparse.ArgumentParser(description="StreamDeck Library test.")
    parser.add_argument("--model", help="Stream Deck model name to test")
    parser.add_argument("--test", help="Stream Deck test to run")
    args = parser.parse_args()

    manager = DeviceManager(transport="dummy")
    streamdecks = manager.enumerate()

    test_streamdecks = streamdecks
    if args.model:
        test_streamdecks = [deck for deck in test_streamdecks if deck.deck_type() == args.model]

    if len(test_streamdecks) == 0:
        logging.error("Error: No Stream Decks to test. Known models: {}".format([d.deck_type() for d in streamdecks]))
        sys.exit(1)

    tests = {
        "PIL Helpers": test_pil_helpers,
        "Basic APIs": test_basic_apis,
        "Key Pattern": test_key_pattern,
    }

    test_runners = tests
    if args.test:
        test_runners = {name: test for (name, test) in test_runners.items() if name == args.test}

    if len(test_runners) == 0:
        logging.error("Error: No Stream Decks tests to run. Known tests: {}".format([name for name, test in tests.items()]))
        sys.exit(1)

    for deck_index, deck in enumerate(test_streamdecks):
        logging.info("Using Deck Type: {}".format(deck.deck_type()))

        for name, test in test_runners.items():
            logging.info("Running Test: {}".format(name))
            test(deck)
            logging.info("Finished Test: {}".format(name))



================================================
FILE: .github/ISSUE_TEMPLATE/bug_report.md
================================================
---
name: Bug report
about: Create a report to help us improve
title: ''
labels: bug
assignees: ''

---

**Describe the bug**
Please give a clear and concise description of what the bug is.

**To Reproduce**
Please list the steps to reproduce the behavior.

**StreamDeck Information**
List the model of StreamDeck(s) you are using here.

**System Information**
List details about your operating system and hardware setup here, including OS name and version, and the version of any library dependencies you are using.

You should also include the version(s) of the library you are using - if not using a tagged release, list the commit hash you are testing here.



================================================
FILE: .github/ISSUE_TEMPLATE/feature_request.md
================================================
---
name: Feature request
about: Suggest an idea for this project
title: ''
labels: enhancement
assignees: ''

---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.


