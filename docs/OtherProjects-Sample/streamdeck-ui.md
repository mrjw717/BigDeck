
https://github.com/timothycrosley/streamdeck-ui
================================================
FILE: README.md
================================================
[![streamdeck_ui - Linux compatible UI for the Elgato Stream Deck](art/logo_large.png)](https://timothycrosley.github.io/streamdeck-ui/)
_________________

[![PyPI version](https://badge.fury.io/py/streamdeck-ui.svg)](http://badge.fury.io/py/streamdeck-ui)
[![Test Status](https://github.com/timothycrosley/streamdeck-ui/workflows/Test/badge.svg?branch=master)](https://github.com/timothycrosley/streamdeck-ui/actions?query=workflow%3ATest)
[![codecov](https://codecov.io/gh/timothycrosley/streamdeck-ui/branch/master/graph/badge.svg)](https://codecov.io/gh/timothycrosley/streamdeck-ui)
[![Join the chat at https://gitter.im/timothycrosley/streamdeck-ui](https://badges.gitter.im/timothycrosley/streamdeck-ui.svg)](https://gitter.im/timothycrosley/streamdeck-ui?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![License](https://img.shields.io/github/license/mashape/apistatus.svg)](https://pypi.python.org/pypi/streamdeck-ui/)
[![Downloads](https://pepy.tech/badge/streamdeck-ui)](https://pepy.tech/project/streamdeck-ui)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![Imports: isort](https://img.shields.io/badge/%20imports-isort-%231674b1?style=flat&labelColor=ef8336)](https://timothycrosley.github.io/isort/)
 
_________________

[Read Latest Documentation](https://timothycrosley.github.io/streamdeck-ui/) 
[Release notes](CHANGELOG.md) 
_________________

**streamdeck_ui** A Linux compatible UI for the Elgato Stream Deck.

![Streamdeck UI Usage Example](art/example.gif)

## Key Features

* **Linux Compatible**: Enables usage of Stream Deck devices (Original, MK2, Mini and XL) on Linux.
* **Multi-device**: Enables connecting and configuring multiple Stream Decks on one computer.
* **Brightness Control**: Supports controlling the brightness from both the configuration UI and buttons on the device itself.
* **Configurable Button Display**: Icons + Text, Icon Only, and Text Only configurable per button on the Stream Deck.
* **Multi-Action Support**: Run commands, write text and press hotkey combinations at the press of a single button on your Stream Deck.
* **Button Pages**: streamdeck_ui supports multiple pages of buttons and dynamically setting up buttons to switch between those pages.
* **Auto Reconnect**: Automatically and gracefully reconnects, in the case the device is unplugged and replugged in.
* **Import/Export**: Supports saving and restoring Stream Deck configuration.
* **Drag/Drop**: Move buttons by simply drag and drop.
* **Drag/Drop Image**: Configure a button image by dragging it from your file manager onto the button.
* **Auto Dim**: Configure the Stream Deck to automatically dim the display after a period of time. A button press wakes it up again.
* **Animated icons**: Use an animated gif to liven things up a bit.
* **Runs under systemd**: Run automatically in the background as a systemd --user service.
* **Stream Deck Pedal**: Supports actions when pressing pedals.

Communication with the Stream Deck is powered by the [Python Elgato Stream Deck Library](https://github.com/abcminiuser/python-elgato-streamdeck#python-elgato-stream-deck-library).
## Installation Guides
* [Arch/Manjaro](docs/installation/arch.md)
* [CentOS](docs/installation/centos.md)
* [Fedora](docs/installation/fedora.md)
* [openSUSE](docs/installation/opensuse.md)
* [Ubuntu/Mint](docs/installation/ubuntu.md)

Once you're up and running, consider installing a [systemd service](docs/installation/systemd.md).

> Use the [troubleshooting](docs/troubleshooting.md) guide or [search](https://github.com/timothycrosley/streamdeck-ui/issues?q=is%3Aissue) the issues for guidance.

### Precooked Scripts
There are scripts for setting up streamdeck_ui on [Debian/Ubuntu](scripts/ubuntu_install.sh) and [Fedora](scripts/fedora_install.sh).

## Help

### Start without showing the user interface

Note you can start streamdeck_ui without showing the configuration user interface as follows:
```
streamdeck -n
```
### Command
Enter a value in the command field to execute a command. For example, `gnome-terminal` will launch a new terminal on Ubuntu/Fedora or `obs` will launch OBS.

#### Examples 
> These examples are for Ubuntu using xorg.
You can use a tool like `xdotool` to interact with other applications.

Find the window with a title starting with `Meet - ` and bring it to focus. This helps if you have a Google Meet session on a tab somewhere but you lost it behind another window. 
``` console
xdotool search --name '^Meet - .+$' windowactivate 
```
> The meeting tab must be active one if you have multiple tabs open, since the window title is set by the currently active tab.

Find the window with a title starting with `Meet - ` and then send `ctrl+d` to it. This has the effect of toggling the mute button in Google Meet.
``` console
xdotool search --name '^Meet - .+$' windowactivate --sync key ctrl+d
```

Change the system volume up (or down) by a certain percentage. Assumes you're using PulseAudio/Alsa Mixer.
``` console
amixer -D pulse sset Master 20%+
```
If you want you invoke a command that uses shell-script specific things like `&&` or `|`, run it via bash. This command will shift focus to firefox using the `wmctrl`, and then shifts focus to the first tab: 

``` console
bash -c "wmctrl -a firefox  && xdotool key alt+1"
```

### Press Keys
Simulates key press combinations (hot keys). The basic format is a group of keys, separated by a `+` sign to press simultaneously. Separate key combination groups with a `,` if additional key combinations are needed. For example, `alt+F4,f` means press and hold `alt`, followed by `F4` and then release both. Next, press and release `f`. 

You can also specify a KeyCode in hex format, for example, `0x74` is the KeyCode for `t`. This is also sometimes called the keysym value.

> You can use the `xev` tool and capture the key you are looking for.
> In the output, look for the **keysym hex value**, for example `(keysym 0x74, t)`
>
> Use `comma` or `plus` if you want to actually *output* `,` or `+` respectively.
> 
> Use `delay <n>` to add a delay, where `<n>` is the number (float or integer) of seconds to delay. If `<n>` is not specified, 0.5 second default is used. If `<n>` fails to parse as a valid number, it will result in no delay.
> 

#### Examples
- `F11` - Press F11. If you have focus on a browser, this will toggle full screen.
- `alt+F4` - Closes the current window.
- `ctrl+w` - Closes the current browser tab.
- `cmd+left` - View split on left. Note `cmd` is the **super** key (equivalent of the Windows key).
- `alt+plus` - Presses the alt and the `+` key at the same time.
- `alt+delay+F4` - Press alt, then wait 0.5 seconds, then press F4. Release both.
- `1,delay,delay,2,delay,delay,3` - Type 123 with a 1-second delay between key presses (using default delay).
- `1,delay 1,2,delay 1,3` - Type 123 with a 1-second delay between key presses (using custom delay).
- `e,c,h,o,space,",t,e,s,t,",enter` - Type `echo "test"` and press enter.
- `ctrl+alt+0x74` - Opens a new terminal window. `0x74` is the KeyCode for `t`. TIP: If the character doesn't work, try using the KeyCode instead.
- `0xffe5` - Toggle Caps Lock.
- `0xffaf` - The `/` key on the numeric key pad.

The standard list of keys can be found [at the source](https://pynput.readthedocs.io/en/latest/_modules/pynput/keyboard/_base.html#Key).

The `super` key (Windows key) can be problematic on some versions of Linux. Instead of using the Key Press feature, you could use the Command feature as follows. In this example, it will press `Super` and `4`, which launches application number 4 in your favorites (Ubuntu).
```
xdotool key "Super_L+4"
```

### Write Text
A quick way of typing longer pieces of text (verbatim). Note that unlike the *Press Keys* action,
write text does not accept special (modifier) keys. However, if you type Enter (causing a new line) it will
press enter during the output.

#### Examples

```
Unfortunately that's a hard no.
Kind regards,
Joe
```
![nope](art/nope.gif)

## Known issues
Confirm you are running the latest release with `pip show streamdeck-ui`. Compare it to: [![PyPI version](https://badge.fury.io/py/streamdeck-ui.svg)](http://badge.fury.io/py/streamdeck-ui)

- Streamdeck uses [pynput](https://github.com/moses-palmer/pynput) for simulating **Key Presses** but it lacks proper [support for Wayland](https://github.com/moses-palmer/pynput/issues/189). Generally your results will be good when using X (Ubuntu/Linux Mint). [This thread](https://github.com/timothycrosley/streamdeck-ui/issues/47) may be useful.
- **Key Press** or **Write Text** does not work on Fedora (outside of the streamdeck itself), which is not particularly useful. However, still do a lot with the **Command** feature.
- Some users have reported that the Stream Deck device does not work on all on specific USB ports, as it draws quite a bit of power and/or has [strict bandwidth requirements](https://github.com/timothycrosley/streamdeck-ui/issues/69#issuecomment-715887397). Try a different port.
- If you are executing a shell script from the Command feature - remember to add the shebang at the top of your file, for the language in question. `#!/bin/bash` or `#!/usr/bin/python3` etc. The streamdeck may appear to lock up if you don't under some distros.


================================================
FILE: CHANGELOG.md
================================================
# Upgrade

To upgrade to the latest version, run:

```
python -m pip install streamdeck-ui --user --upgrade
```

> Note you may have to use `python3`, `python3.8` etc. depending on your operating system and Python version.

# Change log
## 2.0.16 - TBD
## Features
- Added ~ path expansion for icons.
## Fixes
- Fix error when pressing Streamdeck Pedal.
## 2.0.15 - 8 March 2023
### Features
- Added support for Stream Deck Pedal.

## 2.0.14 - 4 Mar 2023
### Features
- Ensure only one instance can run (prevents settings file corruption).
- Press `Ctrl+c` in terminal to quit.
- Supports systemd install and added documentation.

## 2.0.13 - 27 Feb 2023
### Fixes
- Requirement for Python < 3.11 removed.
- Switched to pyside6.
### Features
- Added support for a new sub-variant of the StreamDeck XL.
- Allow Stream Deck UI to start, even if virtual keyboard won't work.
- Improved troubleshooting messages.
- Updated documentation and installation guides.
## 2.0.6 - 23 Sep 2022
### Fixes
- Image drag/drop from external applications.
- Dimmer not working properly.
## 2.0.5 - 18 Sep 2022
### Features
- Support for new Stream Deck Mini.
### Fixes
- Fix install under Fedora 36 (pillow dependency version bump).
## 2.0.4 - 29 Apr 2022
### Features
- Recover from a suspend/resume cycle.

### Fixes
- Button icon stuck in pushed state when changing from page 1.
- Remove python3-xlib dependency.

## 2.0.3 - 6 Mar 2022

### Features
- UI starts up even if no Stream Deck attached.
- SVG file type support.
- Keys widget now has examples built in.
- Help menu with links to websites.
- About dialog shows application version and primary dependency versions.
- Support hex key codes in Key Press. For example, 0x74.
- Support vertical text alignment.
- New display system:
    - User interface shows same image as Stream Deck.
    - Text overlay on top of image, with automatic font outline.
    - Buttons image change when pressed (visual feedback).
    - Animated GIF support.
    - CPU indicator for display processing.

### Fixes
- Tray context menu not interrupted by window activation.
## 1.1.3 - 2 Feb 2022

### Features
- Support for Stream Deck MK.2 added.
- Remember previous image selection directory.
- Auto dim to a configurable percentage.
- Drag and drop icons onto buttons from file browser.
- Follow the settings file location if symbolic link.

### Fixes
- Works with Python 3.10 (resolves Fedora 35 install).
## 1.1.2 - April 30, 2021
### Fixes
- Regression with multi-character keys.
## 1.1.1 - April 29, 2021
### Features
- Open main window from tray with Configure... menu item.
- Dim the display from tray.
- Supports variable delay duration in Key press action.
### Fixes
- On exit, reset the display to 50% brightness.
- Documentation for Ubuntu 18.04 added.

## 1.1.0 - April 20, 2021
### Features
- Automatically dim the display after a configurable amount of time.

## 1.0.7 - April 6, 2021
### Features
- Drag and drop support for rearranging buttons around in UI.
- Launches minimized with `-n` or `--no-ui`.
- Window title has been updated to `Stream Deck UI`.
- A remove image button has been added. Cancelling during image selection no longer removes image.
- Image selection button defaults to previous image path, if there is one.
- Reset to the standby image after exiting. This makes it easy to see if streamdeck-ui is running or not.
- Supports `delay` in Key Press action to add a 0.5 second delay.
- Supports `plus` and `comma` in the Key Press action to output `+` and `,` respectively.
- Separator added between Exit and other menu items.
- Avoid unnecessary writes to settings file.
- Improved parsing of command line arguments for launching programs.
### Fixes
- Missing button image error handling added.
- Avoid losing configuration if there is an exception while writing file.
- Updated to streamdeck 0.8.4 to improve stability.
- Updated to Pillow 8.2 to improve stability and fixes jpeg artifacts.
- Fixed race condition where streamdeck buttons get scrambled.
- Fixed `core dumped` error when exiting.
- Improved error handling for invalid command or key press actions.
- Fixed black on black color issue on UI buttons.
- Removed requirement for plugdev group.
- Waits for Stream Deck to be attached on start up.

## 1.0.2 - November 25, 2019
- Updated driver requirement to enable full compatibility with XL.

## 1.0.1 - October 8, 2019
- Initial API stable release.



================================================
FILE: LICENSE
================================================
MIT License

Copyright (c) 2019 Timothy Crosley

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.



================================================
FILE: pyproject.toml
================================================
[tool.poetry]
name = "streamdeck_ui"
version = "2.0.16"
description = "A service, Web Interface, and UI for interacting with your computer using a Stream Deck"
authors = ["Timothy Crosley <timothy.crosley@gmail.com>"]
license = "MIT"
readme = "README.md"

[tool.poetry.dependencies]
python = ">=3.8,<3.12"
streamdeck = "^0.9.3"
pillow = "^9.4.0"
pynput = "^1.7.6"
pyside6 = "^6.4.2"
CairoSVG = "^2.5.2"
filetype = "^1.0.10"
python-xlib = "^0.33"

[tool.poetry.dev-dependencies]
vulture = ">=1.0"
bandit = ">=1.6"
safety = ">=1.8"
isort = ">=5.3"
flake8-bugbear = ">=19.8"
black = {version = ">=18.3-alpha.0", allow-prereleases = true}
mypy = ">=0.730.0"
ipython = ">=7.7"
pytest = ">=5.0"
pytest-cov = ">=2.7"
pytest-mock = ">=1.10"
pep8-naming = ">=0.8.2"
portray = ">=1.3.0"
cruft = ">=2.2"
jupyter = "^1.0"
ipdb = "^0.12.2"
hypothesis-auto = "^1.1"
pydantic = "^1.6"
numpy = "^1.22.1"
types-pkg-resources = "^0.1.3"

[tool.poetry.scripts]
streamdeck = "streamdeck_ui.gui:start"
[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"

[tool.black]
line-length = 100

[tool.isort]
profile = "hug"

[tool.portray]
output_dir = "site"
include_reference_documentation = false
extra_dirs = ["art", "images", "media", "scripts"]

[tool.portray.mkdocs]
repo_url = "https://github.com/timothycrosley/streamdeck-ui"
edit_uri = "edit/master/"



================================================
FILE: README-de.md
================================================
[![streamdeck_ui - Linux kompatibles UI für das Elgato Stream Deck](art/logo_large.png)](https://timothycrosley.github.io/streamdeck-ui/)
_________________

[![PyPI version](https://badge.fury.io/py/streamdeck-ui.svg)](http://badge.fury.io/py/streamdeck-ui)
[![Test Status](https://github.com/timothycrosley/streamdeck-ui/workflows/Test/badge.svg?branch=master)](https://github.com/timothycrosley/streamdeck-ui/actions?query=workflow%3ATest)
[![codecov](https://codecov.io/gh/timothycrosley/streamdeck-ui/branch/master/graph/badge.svg)](https://codecov.io/gh/timothycrosley/streamdeck-ui)
[![Join the chat at https://gitter.im/timothycrosley/streamdeck-ui](https://badges.gitter.im/timothycrosley/streamdeck-ui.svg)](https://gitter.im/timothycrosley/streamdeck-ui?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![License](https://img.shields.io/github/license/mashape/apistatus.svg)](https://pypi.python.org/pypi/streamdeck-ui/)
[![Downloads](https://pepy.tech/badge/streamdeck-ui)](https://pepy.tech/project/streamdeck-ui)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![Imports: isort](https://img.shields.io/badge/%20imports-isort-%231674b1?style=flat&labelColor=ef8336)](https://timothycrosley.github.io/isort/)
 
_________________

[Lese die neueste Dokumentation](https://timothycrosley.github.io/streamdeck-ui/) 
[Release notes](CHANGELOG.md) 
_________________

> WARNUNG: Diese Dokumentation ist veraltet und möglicherweise nicht korrekt.

**streamdeck_ui** Ein Linux kompatibles UserInterface für das Elgato Stream Deck.

![Streamdeck UI Usage Example](art/example.gif)

## Eigenschaften

* **Linux Kompatibel**: Ermöglicht die Nutzung aller Stream Deck Geräte mit Linux ohne code zu benötigen.
* **Mehrere Geräte**: Ermöglicht die Verbindung und Konfiguration mehrere Stream Deck Geräte an einem Computer.
* **Helligkeits-Steuerung**: Unterstützt die Einstellung der Helligkeit von der Konfigurations-Oberfläche und den Knöpfen am Gerät selbst.
* **Konfigurierbares Tastenbild**: Icon + Text, nur Icon und nur Text sind pro Taste des Stream Decks konfigurierbar.
* **Multi-Action Unterstützung**: Kommandos starten, Text schreiben und Hotkey-Kombinationen drücken mit einem einzigen Tastendruck auf dem Stream Deck.
* **Tasten-Seiten**: streamdeck_ui bietet mehrere Seiten von Tasten mit dynamischer Einstellung von Tasten zum Umschalten zwischen ihnen.
* **Automatisches Wiederverbinden**: Das Gerät wird automatisch und problemlos wieder verbunden, falls das Gerät ab- und wieder angesteckt wurde.
* **Import/Export**: Bietet das Abspeichern und Wiederherstellen ganzer Stream Deck Konfigurationen.

Die Kommunikation mit dem Streamdeck erfolgt durch die [Python Elgato Stream Deck Library](https://github.com/abcminiuser/python-elgato-streamdeck#python-elgato-stream-deck-library).

## Linux Schnellstart
**Python 3.8** wird benötigt. Sie können die Version, die sie installiert haben, überprüfen mit `python3 --version`.
### Vorgefertigte Skripte
Es gibt fertige Skripte um streamdeck_ui auf [Debian/Ubuntu](scripts/ubuntu_install.sh) und [Fedora](scripts/fedora_install.sh) zu installieren.
### Manuelle Installation
Um streamdeck_ui unter Linux zu verwenden, müssen einige System-Bibliotheken als Voraussetzung installiert werden.
Die Namen dieser Bibliotheken können, abhängig von ihrem Betriebssystem, variieren.  
Debian / Ubuntu:
``` console
sudo apt install python3-pip libhidapi-libusb0 libxcb-xinerama0
```
Fedora:
``` console
sudo dnf install python3-pip python3-devel hidapi
```
Wenn sie die GNOME shell verwenden, könnten sie eine Erweiterung, die den [KStatusNotifierItem/AppIndicator Support](https://extensions.gnome.org/extension/615/appindicator-support/) bietet, manuell installieren müssen um das Tray-Icon anzuzeigen.

Um streamdeck_ui ohne root-Rechte zu benutzen, müssen sie ihrem user vollen Zugriff auf das Gerät erlauben.

Fügen sie die folgenden udev rules mit Hilfe ihres Editors hinzu:
``` console
sudoedit /etc/udev/rules.d/70-streamdeck.rules
# Wenn das nicht funktioniert, versuchen sie:
sudo nano /etc/udev/rules.d/70-streamdeck.rules
```
Fügen sie die folgenden Zeilen ein:
``` console
SUBSYSTEM=="usb", ATTRS{idVendor}=="0fd9", TAG+="uaccess"
```
Aktivieren sie die Regeln:
``` console
sudo udevadm trigger
```

Die Installation der Anwendung selbst erfolgt via pip:
``` console
pip3 install streamdeck-ui --user
```
Stellen sie sicher, dass `$HOME/.local/bin` in ihrem PATH enthalten ist.  
Wenn das nicht der Fall ist, fügen sie
``` console
PATH=$PATH:$HOME/.local/bin
```
an das Ende ihrer shell Konfigurationsdatei (wahrscheinlich .bashrc in ihrem home directory) hinzu.

Jetzt können sie `streamdeck` starten um mit der Konfiguration zu beginnen.

``` console
streamdeck
```

Es wird empfohlen `streamdeck` in die Autostart-Liste ihrer Fenster-Umgebung aufzunehmen. Wenn sie es verwenden wollen ohne dass das Benutzer-Interface angezeigt wird, verwenden sie`streamdeck -n`.

## Allgemeiner Schnellstart

Auf anderen Betriebssystemen müssen sie die benötigten [Abhängigkeiten](https://github.com/abcminiuser/python-elgato-streamdeck#package-dependencies) der Bibliothek installieren.
Danach verwenden sie pip zur Installation der Anwendung:

``` console
pip3 install streamdeck-ui --user
streamdeck
```

Beachten sie auch die Anleitungen für

* [Arch/Manjaro](docs/installation/arch.md)
* [CentOS](docs/installation/centos.md)
* [Fedora](docs/installation/fedora.md)
* [openSUSE](docs/installation/opensuse.md)
* [Ubuntu/Mint](docs/installation/ubuntu.md)

## Hilfe
### Befehl (Command)
Geben sie einen Befehl in das Feld "Command" ein, um ihn auszuführen. In Ubuntu/Fedora starten sie ein Terminal mit `gnome-terminal`, `obs` startet OBS.

#### Beispiele (Ubuntu)
Sie können ein tool wie `xdotool` verwenden, um mit anderen Programmen zu interagieren.

Finden sie das Fenster, das mit `Meet - ` beginnt, und setzen sie den Fokus darauf. Das hilft ihnen, wenn sie eine Google Meet Sitzung auf irgend einem Tab haben, die aber hinter anderen Fenstern verloren gegangen ist.
``` console
xdotool search --name '^Meet - .+$' windowactivate 
```
> Der Meeting-Tab muss aktiv sein wenn sie mehrere Tabs offen haben, da der Fenstertitel vom derzeit aktiven Tab gesetzt wird.

Finden sie das Fenster, das mit `Meet - ` beginnt, und senden sie `ctrl+d` dorthin. Das bewirkt das Umschalten der Stummschaltung (mute button) in Google Meet.
``` console
xdotool search --name '^Meet - .+$' windowactivate --sync key ctrl+d
```

Drehen sie die System-Lautstärke um einen gewissen Prozentsatz hoch (oder runter). Wir nehmen an, sie verwenden PulseAudio/Alsa Mixer.
``` console
amixer -D pulse sset Master 20%+
```
Wenn sie einen Befehl abgeben wollen der shell-script spezifische Dinge wie `&&` oder `|` enthält, dann starten sie ihn via bash. Dieser Befehl wird de Fokus auf Firefox setzen, indem es `wmctrl` nutzt, und dann den Fokus auf den ersten Tab verschieben: 

``` console
bash -c "wmctrl -a firefox  && xdotool key alt+1"
```

### Tasten drücken
Simuliert Tasten-Kombinationen (hot keys). Grundsätzlich werden Tasten, die gleichzeitig betätigt werden, mit einem `+` Zeichen verbunden. Trennen sie Tasten-Kombinationen mit einem `,` , wenn zusätzliche Kombinationen benötigt werden. Die Zeichenfolge `alt+F4,f` zum Beispiel bedeutet drücke und halte `alt`, gefolgt von `F4` und lass dann beide los. Drücke anschließend `f` und lass es wieder los. 

Sie können auch einen Tasten-Code im hex Format verwenden, `0x74` ist zum Beispiel der Tasten-Code für `t`. Dieser Wert wird auch manchmal als keysym bezeichnet.

> Sie können das tool `xev` verwenden um den Key-Code einer Taste zu ermitteln.
> Suchen sie in der Ausgabe nach **keysym hex value**, zum Beispiel `(keysym 0x74, t)`
>
> Verwenden sie `comma` oder `plus`, wenn sie ein `,` oder ein `+` *ausgeben* wollen.
> 
> Verwenden sie `delay <n>` um eine Verzögerung einzufügen, wobei `<n>` die Anzahl (float oder integer) der Sekunden ist. Wenn `<n>` nicht angegeben wird, wird eine Standardverzögerung von 0.5 Sekundenverwendet. Wenn `<n>` nicht als gültige Zahl erkannt wird, erfolgt keine Verzögerung.
> 

#### Beispiele
- `F11` - drückt F11. Wenn der Fokus auf einem Browser ist, schaltet das zwischen Vollbild und Normalbild hin und her.
- `alt+F4` - schließt das aktuelle Fenster.
- `ctrl+w` - schließt den aktuellen Browser-Tab.
- `cmd+left` - verkleinert das Fenster auf seine linke Hälfte. Achtung, `cmd` ist die **super** Taste (entsprechend der Windows Taste).
- `alt+plus` - drückt die  alt und die `+` Taste gleichzeitin.
- `alt+delay+F4` - drücke alt, warte dann 0.5 Sekunden, drücke dann F4. Lass beide Tasten los.
- `1,delay,delay,2,delay,delay,3` - tippe 123 mit 1-Sekunden Pausen zwischen den Tastendrucken (unter Verwendung der Standardpausen).
- `1,delay 1,2,delay 1,3` - tippe 123 mit 1-Sekunden Pausen zwischen den Tastendrucken (unter Verwendung selbst definierter Pausen).
- `e,c,h,o,space,",t,e,s,t,",enter` - tippe `echo "test"` und drücke Enter.
- `ctrl+alt+0x74` - öffnet ein neues Terminalfenster. `0x74` ist der Tasten-Code von `t`. TIP: Verwenden sie den Tasten-Code, wenn der Buchstabe nicht funktioniert.
- `0xffe5` - Caps Lock umschalten.
- `0xffaf` - Die `/` Taste im Ziffernblock der Tastatur.

Die Standardliste der Tasten finden sie [im source-code](https://pynput.readthedocs.io/en/latest/_modules/pynput/keyboard/_base.html#Key).

Die `super` Taste (Windows-Taste) kann bei einigen Linux-Versionen problematisch sein. Statt der Tastendruck-Funktion können sie dann die Befehls-Funktion wie folgt benutzen. In diesem Beispiel wollen wir die `Super` Taste und `4` drücken, was die Anwendung Nummer 4 ihrer Favoriten startet (Ubuntu).
```
xdotool key "Super_L+4"
```

### Text schreiben:
Das ist ein schneller Weg um längere Textstücke zu schreiben (Wort für Wort). Beachten sie, dass anders als in der Tastendruck-Funtion,
hier keine Spezial-(Modifikations-)Tasten akzeptiert werden. Wenn sie jedoch Enter drücken (um eine neue Zeile zu beginnen) wird auch Enter bei der Ausgabe ausgegeben.

#### Beispiele

```
Unfortunately that's a hard no.
Kind regards,
Joe
```
![nope](art/nope.gif)

## bekannte Probleme
Stellen sie sicher, dass sie die neueste Version verwenden mit `pip3 show streamdeck-ui`. Vergleichen sie es mit: [![PyPI version](https://badge.fury.io/py/streamdeck-ui.svg)](http://badge.fury.io/py/streamdeck-ui)

- Streamdeck verwendet [pynput](https://github.com/moses-palmer/pynput) zur Simulation derf **Tasten-Betätigungen** wodurch ordentliche [Unterstützung für Wayland](https://github.com/moses-palmer/pynput/issues/189) fehlt. Im Allgemeinen werden sie gute Ergebnisse bei Verwendung von X haben (Ubuntu/Linux Mint). [Dieser thread](https://github.com/timothycrosley/streamdeck-ui/issues/47) lönnte nützlich sein.
- **Taste drücken** oder **Text schreiben** funktioniert nicht unter Fedora (außerhalb von streamdeck selbst), was nicht besonders hilfreich ist. Die **Befehls-Funktion** kann aber trotzdem eine Menge.
- Version [1.0.2](https://pypi.org/project/streamdeck-ui/) hat keine Fehler-Behandlung bei der **Befehls-** und der **Taste drücken** Funktion. Deshalb müssen sie vorsichtig sein - ein ungültiger Befehl oder Tastendruck stoppt auch alle anderen Prozesse. Bitte upgraden sie zur neuesten Version.
- Einige Anwender haben berichtet, dass das Stream Deck Gerätnicht an allen USB-ports funktioniert, da es einiges an Strom verbraucht und/oder [strenge Bandbreitenanforderungen](https://github.com/timothycrosley/streamdeck-ui/issues/69#issuecomment-715887397) hat. Versuchen sie einen anderen Anschluß.
- Wenn sie einen shell script mit der Befehls-Funktion ausführen, vergessen sie nicht das shebang für die entsprechende Sprache am Anfangihrer Datei haben. `#!/bin/bash` oder `#!/usr/bin/python3` etc. Das streamdeck könnte sich andernfalls unter einigen Distros aufhängen.



================================================
FILE: setup.cfg
================================================
[flake8]
max-line-length = 200
extend-ignore =
    E203  # https://github.com/psf/black/blob/master/docs/the_black_code_style.md#slices



================================================
FILE: .coveragerc
================================================
[report]
exclude_lines =
    pragma: no cover
omit =
    *tests*
    streamdeck_ui/ui_main.py




================================================
FILE: .cruft.json
================================================
{
  "template": "https://github.com/timothycrosley/cookiecutter-python/",
  "commit": "71391fd9999067ef4b38aa05e7116087fac431f8",
  "context": {
    "cookiecutter": {
      "full_name": "Timothy Crosley",
      "email": "timothy.crosley@gmail.com",
      "github_username": "timothycrosley",
      "project_name": "streamdeck_ui",
      "description": "A service, Web Interface, and UI for interacting with your computer using a Stream Deck",
      "version": "0.0.1",
      "_template": "https://github.com/timothycrosley/cookiecutter-python/"
    }
  },
  "checkout": null
}



================================================
FILE: docs/troubleshooting.md
================================================
# Troubleshooting

> Note you may need to use `python`, `python3` or `python3.8` in the commands shown below, depending on your distribution. The examples simply use `python` for simplicity's sake.

## Basics
There are **four** important things you need to get a working system.

1. You need a working Python 3.8 or higher with pip installed.
2. You need to install hidapi.
3. You need a udev rule that allows access to your Stream Deck.
4. You need to install streamdeck-ui and all its dependencies with pip.

## Key Press and Write Text do not work
  Streamdeck uses [pynput](https://github.com/moses-palmer/pynput) for simulating **Key Presses** but it was not designed for [Wayland](https://github.com/moses-palmer/pynput/issues/189). Generally your results will be good when using X, but it seems like most new releases of Linux are switching away from it.

## ImportError

If you get an error such as:
```
ImportError: cannot import name 'QtWidgets' from 'PySide6'
```
This usually means a problem with PySide6. Try resolving with this:
``` console
python -m pip install --force-reinstall --no-cache-dir pyside6
```

## No System Tray Indicator
You may receive an error like this on start-up:
```
qt.core.qobject.connect: QObject::connect: No such signal QPlatformNativeInterface::systemTrayWindowChanged(QScreen*)
```

This is because gnome does not provide a System Tray out the box and you will need an extension
 [KStatusNotifierItem/AppIndicator Support](https://extensions.gnome.org/extension/615/appindicator-support/) to make the system tray icon show up.

## Could not load the Qt platform plugin "xcb"

You may get the following error:
```
qt.qpa.plugin: Could not load the Qt platform plugin "xcb" in "" even though it was found.
This application failed to start because no Qt platform plugin could be initialized. Reinstalling the application may fix this problem.
```
 On Ubuntu, resolve this problem by installing:
``` console
sudo apt install libxcb-xinerama0
```
> You may encounter a similar error where the cause is "libxcb-cursor.so.0: cannot open shared object file: No such file or directory". This can be resolved by installing the `libxcb-cursor0` package.

On Arch, resolve this problem by installing:
```
sudo pacman -S qt6-base
```
You could also try [`qt5-x11extras`](https://archlinux.org/packages/extra/x86_64/qt5-x11extras/) if `qt6-base` didn't work for you.

## ModuleNotFoundError: No module named 'pkg_resources'
This module is part of `setuptools` but may be missing on your system.
```
python -m pip install setuptools
```





================================================
FILE: docs/contributing/1.-contributing-guide.md
================================================
Contributing to streamdeck_ui
========

Looking for a useful open source project to contribute to?
Want your contributions to be warmly welcomed and acknowledged?
Welcome! You have found the right place.

## Getting streamdeck_ui set up for local development
The first step when contributing to any project is getting it set up on your local machine. streamdeck_ui aims to make this as simple as possible.

Account Requirements:

- [A valid GitHub account](https://github.com/join)

Base System Requirements:

- Python3.8+
- poetry
- bash or a bash compatible shell (should be auto-installed on Linux / Mac)

Once you have verified that you system matches the base requirements you can start to get the project working by following these steps:

1. [Fork the project on GitHub](https://github.com/timothycrosley/streamdeck_ui/fork).
2. Clone your fork to your local file system:
    `git clone https://github.com/$GITHUB_ACCOUNT/streamdeck_ui.git`
3. `cd streamdeck_ui`
4. `poetry install`

## Making a contribution
Congrats! You're now ready to make a contribution! Use the following as a guide to help you reach a successful pull-request:

1. Check the [issues page](https://github.com/timothycrosley/streamdeck_ui/issues) on GitHub to see if the task you want to complete is listed there.
    - If it's listed there, write a comment letting others know you are working on it.
    - If it's not listed in GitHub issues, go ahead and log a new issue. Then add a comment letting everyone know you have it under control.
        - If you're not sure if it's something that is good for the main streamdeck_ui project and want immediate feedback, you can discuss it [here](https://gitter.im/timothycrosley/streamdeck-ui).
2. Create an issue branch for your local work `git checkout -b issue/$ISSUE-NUMBER`.
3. Do your magic here.
4. Ensure your code matches the [HOPE-8 Coding Standard](https://github.com/hugapi/HOPE/blob/master/all/HOPE-8--Style-Guide-for-Hug-Code.md#hope-8----style-guide-for-hug-code) used by the project.
5. Submit a pull request to the main project repository via GitHub.

Thanks for the contribution! It will quickly get reviewed, and, once accepted, will result in your name being added to the acknowledgments list :).

## Thank you!
I can not tell you how thankful I am for the hard work done by streamdeck_ui contributors like *you*.

Thank you!

~Timothy Crosley




================================================
FILE: docs/contributing/2.-coding-standard.md
================================================
# HOPE 8 -- Style Guide for Hug Code

|             |                                             |
| ------------| ------------------------------------------- |
| HOPE:       | 8                                           |
| Title:      | Style Guide for Hug Code                    |
| Author(s):  | Timothy Crosley <timothy.crosley@gmail.com> |
| Status:     | Active                                      |
| Type:       | Process                                     |
| Created:    | 19-May-2019                                 |
| Updated:    | 17-August-2019                                 |

## Introduction

This document gives coding conventions for the Hug code comprising the Hug core as well as all official interfaces, extensions, and plugins for the framework.
Optionally, projects that use Hug are encouraged to follow this HOPE and link to it as a reference.

## PEP 8 Foundation

All guidelines in this document are in addition to those defined in Python's [PEP 8](https://www.python.org/dev/peps/pep-0008/) and [PEP 257](https://www.python.org/dev/peps/pep-0257/) guidelines.

## Line Length

Too short of lines discourage descriptive variable names where they otherwise make sense.
Too long of lines reduce overall readability and make it hard to compare 2 files side by side.
There is no perfect number: but for Hug, we've decided to cap the lines at 100 characters.

## Descriptive Variable names

Naming things is hard. Hug has a few strict guidelines on the usage of variable names, which hopefully will reduce some of the guesswork:
- No one character variable names.
    - Except for x, y, and z as coordinates.
- It's not okay to override built-in functions.
    - Except for `id`. Guido himself thought that shouldn't have been moved to the system module. It's too commonly used, and alternatives feel very artificial.
- Avoid Acronyms, Abbreviations, or any other short forms - unless they are almost universally understand.

## Adding new modules

New modules added to the a project that follows the HOPE-8 standard should all live directly within the base `PROJECT_NAME/` directory without nesting. If the modules are meant only for internal use within the project, they should be prefixed with a leading underscore. For example, def _internal_function. Modules should contain a docstring at the top that gives a general explanation of the purpose and then restates the project's use of the MIT license.
There should be a `tests/test_$MODULE_NAME.py` file created to correspond to every new module that contains test coverage for the module. Ideally, tests should be 1:1 (one test object per code object, one test method per code method) to the extent cleanly possible.

## Automated Code Cleaners

All code submitted to Hug should be formatted using Black and isort.
Black should be run with the line length set to 100, and isort with Black compatible settings in place.

## Automated Code Linting

All code submitted to hug should run through the following tools:

- Black and isort verification.
- Flake8
   - flake8-bugbear
- Bandit
- pep8-naming
- vulture
- safety



================================================
FILE: docs/contributing/3.-code-of-conduct.md
================================================
# HOPE 11 -- Code of Conduct

|             |                                             |
| ------------| ------------------------------------------- |
| HOPE:       | 11                                          |
| Title:      | Code of Conduct                             |
| Author(s):  | Timothy Crosley <timothy.crosley@gmail.com> |
| Status:     | Active                                      |
| Type:       | Process                                     |
| Created:    | 17-August-2019                              |
| Updated:    | 17-August-2019                              |

## Abstract

Defines the Code of Conduct for Hug and all related projects.

## Our Pledge

In the interest of fostering an open and welcoming environment, we as
contributors and maintainers pledge to making participation in our project and
our community a harassment-free experience for everyone, regardless of age, body
size, disability, ethnicity, sex characteristics, gender identity and expression,
level of experience, education, socio-economic status, nationality, personal
appearance, race, religion, or sexual identity and orientation.

## Our Standards

Examples of behavior that contributes to creating a positive environment
include:

* Using welcoming and inclusive language
* Being respectful of differing viewpoints and experiences
* Gracefully accepting constructive criticism
* Focusing on what is best for the community
* Showing empathy towards other community members

Examples of unacceptable behavior by participants include:

* The use of sexualized language or imagery and unwelcome sexual attention or
 advances
* Trolling, insulting/derogatory comments, and personal or political attacks
* Public or private harassment
* Publishing others' private information, such as a physical or electronic
 address, without explicit permission
* Other conduct which could reasonably be considered inappropriate in a
 professional setting

## Our Responsibilities

Project maintainers are responsible for clarifying the standards of acceptable
behavior and are expected to take appropriate and fair corrective action in
response to any instances of unacceptable behavior.

Project maintainers have the right and responsibility to remove, edit, or
reject comments, commits, code, wiki edits, issues, and other contributions
that are not aligned to this Code of Conduct, or to ban temporarily or
permanently any contributor for other behaviors that they deem inappropriate,
threatening, offensive, or harmful.

## Scope

This Code of Conduct applies both within project spaces and in public spaces
when an individual is representing the project or its community. Examples of
representing a project or community include using an official project e-mail
address, posting via an official social media account, or acting as an appointed
representative at an online or offline event. Representation of a project may be
further defined and clarified by project maintainers.

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported by contacting [timothy.crosley@gmail.com](mailto:timothy.crosley@gmail.com). All
complaints will be reviewed and investigated and will result in a response that
is deemed necessary and appropriate to the circumstances. Confidentiality will be maintained
with regard to the reporter of an incident.
Further details of specific enforcement policies may be posted separately.

Project maintainers who do not follow or enforce the Code of Conduct in good
faith may face temporary or permanent repercussions as determined by other
members of the project's leadership.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant][https://www.contributor-covenant.org], version 1.4,
available at https://www.contributor-covenant.org/version/1/4/code-of-conduct.html

For answers to common questions about this code of conduct, see
https://www.contributor-covenant.org/faq



================================================
FILE: docs/contributing/4.-acknowledgements.md
================================================
Contributors
===================

## Core Developers
- Pieter Venter (@dodgyrabbit)
- Timothy Crosley (@timothycrosley)

## Notable Bug Reporters
-

## Code Contributors
-

## Documenters
- @xorbital
- Chris Rogers (@chrisprad)
- @simonCor
- Afonso F. Garcia (@AfonsoFGarcia)

--------------------------------------------

A sincere thanks to everyone who helps make streamdeck_ui into a great Python3 project!

~Timothy Crosley



================================================
FILE: docs/installation/arch.md
================================================
# Installing on Arch
This has been tested on Arch with XFCE, Manjaro in Feb 2023.

## Install hidapi
``` console
sudo pacman -S hidapi python-pip qt6-base
```
## Set path
You need to add `~/.local/bin` to your path. Be sure to add this to your `.bashrc` (or equivalent) file so it automatically sets it for you in future.
``` console
PATH=$PATH:$HOME/.local/bin
```

## Upgrade pip
You may need to upgrade pip, using pip. On Arch this is usually not required.
Setuptools is required but may not be installed on Arch.
```
python -m pip install --upgrade pip
python -m pip install setuptools
```
## Configure access to Elgato devices
The following will create a file called `/etc/udev/rules.d/70-streamdeck.rules` and add the following text to it: `SUBSYSTEM=="usb", ATTRS{idVendor}=="0fd9", TAG+="uaccess"`. Creating this file adds a udev rule that provides your user with access to USB devices created by Elgato.
``` bash
sudo sh -c 'echo "SUBSYSTEM==\"usb\", ATTRS{idVendor}==\"0fd9\", TAG+=\"uaccess\"" > /etc/udev/rules.d/70-streamdeck.rules'
```
For the rule to take immediate effect, run the following command:
``` bash
sudo udevadm trigger
```
If the software is having problems later to detect the Stream Deck, you can try unplugging/plugging it back in.

## Install Stream Deck UI
```
python -m pip install streamdeck-ui --user
```

Launch with
```
streamdeck
```
See [troubleshooting](../troubleshooting.md) for tips if you're stuck.



================================================
FILE: docs/installation/centos.md
================================================
# Installing on CentOS
This has been tested on CentOS 7, 8.

## Install hidapi
``` bash
sudo yum install epel-release
sudo yum update
sudo yum install hidapi
```

> ### Note for CentOS7
> 
> If you're having trouble installing hdapi, try installing the epel from the Fedora site as follows:
> 
``` console
sudo rpm -Uvh https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
```
>  and try the hdapi install again.

## Install python 3.8
CentOS 7/8 ships with Python 3.6. We need to build version 3.8 (or later if you prefer).
``` bash
sudo yum -y groupinstall "Development Tools"
sudo yum -y install openssl-devel bzip2-devel libffi-devel
wget https://www.python.org/ftp/python/3.8.9/Python-3.8.9.tgz
tar xvf Python-3.8.9.tgz 
cd Python-3.8.9/
./configure --enable-optimizations
sudo make altinstall
```
## Upgrade pip
You need to upgrade pip, using pip. In my experience, old versions of pip may fail to properly install some of the required Python dependencies.
```
python3.8 -m pip install --upgrade pip
```
## Configure access to Elgato devices
The following will create a file called `/etc/udev/rules.d/70-streamdeck.rules` and add the following text to it: `SUBSYSTEM=="usb", ATTRS{idVendor}=="0fd9", TAG+="uaccess"`. Creating this file adds a udev rule that provides your user with access to USB devices created by Elgato.
``` bash
sudo sh -c 'echo "SUBSYSTEM==\"usb\", ATTRS{idVendor}==\"0fd9\", TAG+=\"uaccess\"" > /etc/udev/rules.d/70-streamdeck.rules'
```
For the rule to take immediate effect, run the following command:
``` bash
sudo udevadm trigger
```
If the software is having problems later to detect the Stream Deck, you can try unplugging/plugging it back in.

## Install Stream Deck UI
```
python3.8 -m pip install streamdeck-ui --user
```
Launch with
```
streamdeck
```
See [troubleshooting](../troubleshooting.md) for tips if you're stuck.


================================================
FILE: docs/installation/fedora.md
================================================
# Installing on Fedora
This has been tested on Fedora 36, 37.

## Install hidapi
``` bash
sudo dnf install python3-pip python3-devel hidapi
```

## Upgrade pip
You need to upgrade pip, using pip. In my experience, old versions of pip may fail to properly install some of the required Python dependencies.
```
python -m pip install --upgrade pip
```
## Configure access to Elgato devices
The following will create a file called `/etc/udev/rules.d/70-streamdeck.rules` and add the following text to it: `SUBSYSTEM=="usb", ATTRS{idVendor}=="0fd9", TAG+="uaccess"`. Creating this file adds a udev rule that provides your user with access to USB devices created by Elgato.
``` bash
sudo sh -c 'echo "SUBSYSTEM==\"usb\", ATTRS{idVendor}==\"0fd9\", TAG+=\"uaccess\"" > /etc/udev/rules.d/70-streamdeck.rules'
```
For the rule to take immediate effect, run the following command:
``` bash
sudo udevadm trigger
```
If the software is having problems later to detect the Stream Deck, you can try unplugging/plugging it back in.

## Install Stream Deck UI
```
python -m pip install streamdeck-ui --user
```
See [system tray](../troubleshooting.md#no-system-tray-indicator) installation.

Launch with
```
streamdeck
```
See [troubleshooting](../troubleshooting.md) for tips if you're stuck.



================================================
FILE: docs/installation/opensuse.md
================================================
# Installing on openSUSE
This has been tested on Tumbleweed.

## Install hidapi
``` console
sudo zypper install libhidapi-libusb0 python310-devel kernel-devel
```
 > `python310-devel` and `kernel-devel` are required because pip is going to have to build `evdev`.

## Upgrade pip
You may need to upgrade pip, using pip.
```
python3 -m pip install --upgrade pip
```
## Configure access to Elgato devices
The following will create a file called `/etc/udev/rules.d/70-streamdeck.rules` and add the following text to it: `SUBSYSTEM=="usb", ATTRS{idVendor}=="0fd9", TAG+="uaccess"`. Creating this file adds a udev rule that provides your user with access to USB devices created by Elgato.
``` bash
sudo sh -c 'echo "SUBSYSTEM==\"usb\", ATTRS{idVendor}==\"0fd9\", TAG+=\"uaccess\"" > /etc/udev/rules.d/70-streamdeck.rules'
```
For the rule to take immediate effect, run the following command:
``` bash
sudo udevadm trigger
```
If the software is having problems later to detect the Stream Deck, you can try unplugging/plugging it back in.

## Install Stream Deck UI
```
python3 -m pip install streamdeck-ui --user
```

See [system tray](../troubleshooting.md#no-system-tray-indicator) installation.

Launch with
```
streamdeck
```
See [troubleshooting](../troubleshooting.md) for tips if you're stuck.


================================================
FILE: docs/installation/systemd.md
================================================
# systemd installation
Once you have a working streamdeck_ui installation, you can also configure it to run as a systemd user service. It will automatically run when you login and you can manage it using `systemctl`.
## Installation
Make a directory where the systemd user configuration will be stored.
``` bash
mkdir -p $HOME/.local/share/systemd/user/
```
Create (an empty) configuration file.
``` bash
touch $HOME/.local/share/systemd/user/streamdeck.service
```
Use your favorite editor and paste the following content into the `streamdeck.service` file (rembember replace `<yourusername>`):
```
[Unit]
Description=A Linux compatible UI for the Elgato Stream Deck.

[Service]
Type=simple
ExecStart=/home/<yourusername>/.local/bin/streamdeck -n
Restart=on-failure

[Install]
WantedBy=default.target
```
To make the configuration take effect and install the service into systemd, run the following commands:
```
systemctl --user daemon-reload
systemctl --user enable streamdeck
```
> Tip: Before you continue, make sure you are not already running streamdeck_ui. If it's open, click File > Exit. Only one instance of streamdeck_ui can be running at a time.

You are now all set. To start the service, run the following command:
```
systemctl --user start streamdeck
```
There are some additional commands that may be useful.

To see the status of the service, run:
```
systemctl --user status streamdeck
```
To review the service log file (newest entries at the top) for troubleshooting, run:
```
journalctl --user -r
```
To stop the service, run:
```
systemctl --user stop streamdeck
```
## Installation in virtual environment
If you have installed streamdeck_ui in a virtual environment, you can still use it in a systemd service.

Assume you are in the following directory:
```
/home/johnsmith/streamdeck_ui
```
You create a virtual environment, called `.venv` and activate it as follows:
```
python3 -m venv .venv
source .venv/bin/activate
```
and finally install streamdeck_ui like this:
```
python3 -m pip install streamdeck_ui
```

> Your virtual environment is now configured and located in `/home/johnsmith/streamdeck_ui/.venv`

The steps for installing the systemd service is exactly the same. The only difference is you have to point the `ExecStart=` to the streamdeck executable inside the virtual environment, like so:
```
ExecStart=/home/johnsmith/streamdeck_ui/.venv/bin/streamdeck -n
```
## Uninstalling
The following steps will stop, disable, remove the configuration file and finally reload the settings:
```
systemctl --user stop streamdeck
systemctl --user disable streamdeck
rm $HOME/.local/share/systemd/user/streamdeck.service
systemctl --user daemon-reload
```


================================================
FILE: docs/installation/ubuntu.md
================================================
# Installing on Ubuntu
This has been tested on Ubuntu 2004, 2204, Linux Mint 20.

## Install hidapi
``` console
sudo apt install libhidapi-libusb0 python3-pip
```

> Note that for version `2.0.6` and below, you also need to install `libxcb-xinerama0` (include it with apt in the line above). 
## Set path
You need to add `~/.local/bin` to your path. Be sure to add this to your `.bashrc` (or equivalent) file so it automatically sets it for you in future.
``` console
PATH=$PATH:$HOME/.local/bin
```
## Upgrade pip
You need to upgrade pip, using pip. In my experience, old versions of pip may fail to properly install some of the required Python dependencies.
```
python3 -m pip install --upgrade pip
```


## Configure access to Elgato devices
The following will create a file called `/etc/udev/rules.d/70-streamdeck.rules` and add the following text to it: `SUBSYSTEM=="usb", ATTRS{idVendor}=="0fd9", TAG+="uaccess"`. Creating this file adds a udev rule that provides your user with access to USB devices created by Elgato.
``` bash
sudo sh -c 'echo "SUBSYSTEM==\"usb\", ATTRS{idVendor}==\"0fd9\", TAG+=\"uaccess\"" > /etc/udev/rules.d/70-streamdeck.rules'
```
For the rule to take immediate effect, run the following command:
``` bash
sudo udevadm trigger
```
If the software is having problems later to detect the Stream Deck, you can try unplugging/plugging it back in.

## Install Stream Deck UI
```
python3 -m pip install streamdeck-ui --user
```

Launch with
```
streamdeck
```
See [troubleshooting](../troubleshooting.md) for tips if you're stuck.



================================================
FILE: notebooks/device_information.ipynb
================================================
# Jupyter notebook converted to Python script.

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


# Prints diagnostic information about a given StreamDeck
def print_deck_info(index, deck):
    image_format = deck.key_image_format()

    flip_description = {
        (False, False): "not mirrored",
        (True, False): "mirrored horizontally",
        (False, True): "mirrored vertically",
        (True, True): "mirrored horizontally/vertically",
    }

    print("Deck {} - {}.".format(index, deck.deck_type()), flush=True)
    print("\t - ID: {}".format(deck.id()), flush=True)
    print("\t - Serial: '{}'".format(deck.get_serial_number()), flush=True)
    print("\t - Firmware Version: '{}'".format(deck.get_firmware_version()), flush=True)
    print("\t - Key Count: {} ({}x{} grid)".format(
        deck.key_count(),
        deck.key_layout()[0],
        deck.key_layout()[1]), flush=True)
    print("\t - Key Images: {}x{} pixels, {} format, rotated {} degrees, {}".format(
        image_format['size'][0],
        image_format['size'][1],
        image_format['format'],
        image_format['rotation'],
        flip_description[image_format['flip']]), flush=True)


if __name__ == "__main__":
    streamdecks = DeviceManager().enumerate()

    print("Found {} Stream Deck(s).\n".format(len(streamdecks)))

    for index, deck in enumerate(streamdecks):
        deck.open()
        deck.reset()

        print_deck_info(index, deck)

        deck.close()
# Output:
#   Found 1 Stream Deck(s).

#   

#   Deck 0 - Stream Deck (Original).

#   	 - ID: b'0001:0010:00'

#   	 - Serial: 'AL07I1C0830'

#   	 - Firmware Version: '1.0.170133  '

#   	 - Key Count: 15 (3x5 grid)

#   	 - Key Images: 72x72 pixels, BMP format, rotated 0 degrees, mirrored horizontally/vertically


deck = streamdecks[0]

deck.close()
deck.open()


dir(deck)

from subprocess import run


def my_key_callback(*args, **kwargs):
    print(args)
    print(kwargs)
    run(["kwrite"])


deck.set_key_callback(my_key_callback)
# Output:
#   (<StreamDeck.Devices.StreamDeckOriginal.StreamDeckOriginal object at 0x7f81d4592198>, 6, True)

#   {}

#   (<StreamDeck.Devices.StreamDeckOriginal.StreamDeckOriginal object at 0x7f81d4592198>, 6, False)

#   {}


from subprocess import run


def my_callback(*args, **kwargs):
    print("hi")

from StreamDeck.DeviceManager import DeviceManager
streamdecks = DeviceManager().enumerate()
deck = streamdecks[0]
if not deck.connected():
    deck.connect()
deck.set_key_callback(my_callback)
print(deck)
print(deck.connected())
# Output:
#   <StreamDeck.Devices.StreamDeckOriginal.StreamDeckOriginal object at 0x7f5c0c094278>

#   True


STREAMDECK_TEMPLATE = "/home/timothyedmundcrosley/Projects/streamdeck_ui/streamdeck_ui/main.ui"

import sys
from PySide6 import QtUiTools
from PySide6.QtGui import *
from PySide6.QtWidgets import QApplication


def start():
    app = QApplication(sys.argv)
    window = QtUiTools.QUiLoader().load(STREAMDECK_TEMPLATE)
    window.show()
    return app

app.exec()



================================================
FILE: notebooks/.ipynb_checkpoints/device_information-checkpoint.ipynb
================================================
# Jupyter notebook converted to Python script.

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


# Prints diagnostic information about a given StreamDeck
def print_deck_info(index, deck):
    image_format = deck.key_image_format()

    flip_description = {
        (False, False): "not mirrored",
        (True, False): "mirrored horizontally",
        (False, True): "mirrored vertically",
        (True, True): "mirrored horizontally/vertically",
    }

    print("Deck {} - {}.".format(index, deck.deck_type()), flush=True)
    print("\t - ID: {}".format(deck.id()), flush=True)
    print("\t - Serial: '{}'".format(deck.get_serial_number()), flush=True)
    print("\t - Firmware Version: '{}'".format(deck.get_firmware_version()), flush=True)
    print("\t - Key Count: {} ({}x{} grid)".format(
        deck.key_count(),
        deck.key_layout()[0],
        deck.key_layout()[1]), flush=True)
    print("\t - Key Images: {}x{} pixels, {} format, rotated {} degrees, {}".format(
        image_format['size'][0],
        image_format['size'][1],
        image_format['format'],
        image_format['rotation'],
        flip_description[image_format['flip']]), flush=True)


if __name__ == "__main__":
    streamdecks = DeviceManager().enumerate()

    print("Found {} Stream Deck(s).\n".format(len(streamdecks)))

    for index, deck in enumerate(streamdecks):
        deck.open()
        deck.reset()

        print_deck_info(index, deck)

        deck.close()
# Output:
#   Found 1 Stream Deck(s).

#   

#   Deck 0 - Stream Deck (Original).

#   	 - ID: b'0001:0009:00'

#   	 - Serial: 'AL07I1C0830'

#   	 - Firmware Version: '1.0.170133  '

#   	 - Key Count: 15 (3x5 grid)

#   	 - Key Images: 72x72 pixels, BMP format, rotated 0 degrees, mirrored horizontally/vertically


deck = streamdecks[0]

deck.close()
deck.open()


dir(deck)

def my_key_callback(*args, **kwargs):
    print(args)
    print(kwargs)


deck.set_key_callback(my_key_callback)
# Output:
#   (<StreamDeck.Devices.StreamDeckOriginal.StreamDeckOriginal object at 0x7f1148faf470>, 5, True)

#   {}

#   (<StreamDeck.Devices.StreamDeckOriginal.StreamDeckOriginal object at 0x7f1148faf470>, 5, False)

#   {}

#   (<StreamDeck.Devices.StreamDeckOriginal.StreamDeckOriginal object at 0x7f1148faf470>, 6, True)

#   {}

#   (<StreamDeck.Devices.StreamDeckOriginal.StreamDeckOriginal object at 0x7f1148faf470>, 6, False)

#   {}

#   (<StreamDeck.Devices.StreamDeckOriginal.StreamDeckOriginal object at 0x7f1148faf470>, 10, True)

#   {}

#   (<StreamDeck.Devices.StreamDeckOriginal.StreamDeckOriginal object at 0x7f1148faf470>, 10, False)

#   {}


from subprocess import run


def my_callback(*args, **kwargs):
    print("hi")

from StreamDeck.DeviceManager import DeviceManager
streamdecks = DeviceManager().enumerate()
deck = streamdecks[0]
if not deck.connected():
    deck.connect()
deck.set_key_callback(my_callback)



================================================
FILE: scripts/clean.sh
================================================
#!/bin/bash
set -euxo pipefail

poetry run isort streamdeck_ui/ tests/ --skip ui_main.py --skip resources_rc.py --skip ui_settings.py
poetry run black streamdeck_ui/ tests/ --exclude 'ui_main.py|resources_rc.py|ui_settings.py' --line-length 200



================================================
FILE: scripts/compile_ui.sh
================================================
#!/bin/bash -xe

poetry run pyside6-uic streamdeck_ui/main.ui --from-imports streamdeck_ui -o streamdeck_ui/ui_main.py
poetry run pyside6-uic streamdeck_ui/settings.ui --from-imports streamdeck_ui -o streamdeck_ui/ui_settings.py
poetry run pyside6-rcc streamdeck_ui/resources.qrc -o streamdeck_ui/resources_rc.py


================================================
FILE: scripts/done.sh
================================================
#!/bin/bash
set -euxo pipefail

./scripts/clean.sh
./scripts/test.sh



================================================
FILE: scripts/fedora_install.sh
================================================
#!/bin/bash -xe
echo "Installing libraries"
sudo dnf install python3-pip python3-devel hidapi

echo "Adding udev rules and reloading"
sudo tee /etc/udev/rules.d/70-streamdeck.rules << EOF
SUBSYSTEM=="usb", ATTRS{idVendor}=="0fd9", TAG+="uaccess"
EOF
sudo udevadm trigger

pip3 install --user streamdeck_ui
echo "If the installation was successful, run 'streamdeck' to start."



================================================
FILE: scripts/lint.sh
================================================
#!/bin/bash
set -euxo pipefail

poetry run cruft check
poetry run mypy --ignore-missing-imports streamdeck_ui/ --exclude 'ui_main.py|resources_rc.py|ui_settings.py'
poetry run isort --check --diff streamdeck_ui/ tests/ --skip ui_main.py --skip resources_rc.py --skip ui_settings.py --line-length 200
poetry run black --check --diff streamdeck_ui/ tests/ --exclude 'ui_main.py|resources_rc.py|ui_settings.py' --line-length 200
poetry run flake8 streamdeck_ui/ tests/ --ignore F403,F401,W503 --exclude ui_main.py,resources_rc.py,ui_settings.py
poetry run safety check -i 39462 -i 40291 -i 44715 -i 47794 -i 51457
poetry run bandit -r streamdeck_ui/



================================================
FILE: scripts/streamdeck.service
================================================
[Unit]
Description=A Linux compatible UI for the Elgato Stream Deck.

[Service]
Type=simple
ExecStart=<path to streamdeck> -n
Restart=on-failure

[Install]
WantedBy=default.target



================================================
FILE: scripts/test.sh
================================================
#!/bin/bash
set -euxo pipefail

./scripts/lint.sh
poetry run pytest -s --cov=streamdeck_ui/ --cov=tests --cov-report=term-missing ${@-} --cov-report html



================================================
FILE: scripts/ubuntu_install.sh
================================================
#!/bin/bash -xe
echo "Installing libraries"
sudo apt install python3-pip libhidapi-libusb0 libxcb-xinerama0

echo "Adding udev rules and reloading"
sudo tee /etc/udev/rules.d/70-streamdeck.rules << EOF
SUBSYSTEM=="usb", ATTRS{idVendor}=="0fd9", TAG+="uaccess"
EOF
sudo udevadm trigger

pip3 install --user streamdeck_ui
echo "If the installation was successful, run 'streamdeck' to start."



================================================
FILE: streamdeck_ui/__init__.py
================================================
"""**streamdeck_ui**

A Linux compatible UI for the Elgato Stream Deck.
"""
__version__ = "1.0.2"



================================================
FILE: streamdeck_ui/api.py
================================================
"""Defines the Python API for interacting with the StreamDeck Configuration UI"""
import json
import os
import threading
from functools import partial
from typing import Dict, List, Optional, Tuple, Union, cast

from PIL.ImageQt import ImageQt
from PySide6.QtCore import QObject, Signal
from PySide6.QtGui import QImage, QPixmap
from StreamDeck.Devices import StreamDeck
from StreamDeck.Transport.Transport import TransportError

from streamdeck_ui.config import CONFIG_FILE_VERSION, DEFAULT_FONT, STATE_FILE
from streamdeck_ui.dimmer import Dimmer
from streamdeck_ui.display.display_grid import DisplayGrid
from streamdeck_ui.display.filter import Filter
from streamdeck_ui.display.image_filter import ImageFilter
from streamdeck_ui.display.pulse_filter import PulseFilter
from streamdeck_ui.display.text_filter import TextFilter
from streamdeck_ui.stream_deck_monitor import StreamDeckMonitor


class KeySignalEmitter(QObject):
    key_pressed = Signal(str, int, bool)


class StreamDeckSignalEmitter(QObject):
    attached = Signal(dict)
    "A signal that is raised whenever a new StreamDeck is attached."
    detached = Signal(str)
    "A signal that is raised whenever a StreamDeck is detached. "
    cpu_changed = Signal(str, int)


class StreamDeckServer:
    """A StreamDeckServer represents the core server logic for interacting and
    managing multiple Stream Decks.
    """

    def __init__(self) -> None:
        self.decks: Dict[str, StreamDeck.StreamDeck] = {}
        "Lookup with serial number -> StreamDeck"

        self.deck_ids: Dict[str, str] = {}
        "Lookup with device.id -> serial number"

        self.state: Dict[str, Dict[str, Union[int, str, Dict[int, Dict[int, Dict[str, str]]]]]] = {}
        "The data structure holding configuration for all Stream Decks"

        # REVIEW: Should we use the same lock as the display? What exactly
        # are we protecting? The UI is signaled via message passing.
        self.key_event_lock = threading.Lock()
        "Lock to serialize key press events"

        self.display_handlers: Dict[str, DisplayGrid] = {}
        "Lookup with a display handler for each Stream Deck"

        self.lock: threading.Lock = threading.Lock()
        "Lock to coordinate polling, updates etc to Stream Decks"

        self.dimmers: Dict[str, Dimmer] = {}
        "Lookup with the dimmer for each Stream Deck"

        # REVIEW: Should we just create one signal emitter for
        # plug events and key signals?
        self.streamdeck_keys = KeySignalEmitter()
        "Use the connect method on the key_pressed signal to subscribe"

        self.plugevents = StreamDeckSignalEmitter()
        "Use the connect method on the attached and detached methods to subscribe"

        self.monitor: Optional[StreamDeckMonitor] = None
        "Monitors for Stream Deck(s) attached to the computer"

    def stop_dimmer(self, serial_number: str) -> None:
        """Stops the dimmer for the given Stream Deck

        :param serial_number: The Stream Deck serial number.
        :type serial_number: str
        """
        self.dimmers[serial_number].stop()

    def reset_dimmer(self, serial_number: str) -> bool:
        """Resets the dimmer for the given Stream Deck. This means the display
        will not be dimmed and the timer starts. Reloads configuration.

        Args:
            serial_number (str): The Stream Deck serial number
        Returns:
            bool: Returns True if the dimmer had to be reset (i.e. woken up), False otherwise.
        """
        self.dimmers[serial_number].brightness = self.get_brightness(serial_number)
        self.dimmers[serial_number].brightness_dimmed = self.get_brightness_dimmed(serial_number)
        return self.dimmers[serial_number].reset()

    def toggle_dimmers(self):
        """If at least one Deck is still "on", all will be dimmed off. Otherwise
        toggles displays on.
        """
        at_least_one: bool = False
        for _serial_number, dimmer in self.dimmers.items():
            if not dimmer.dimmed:
                at_least_one = True
                break

        for _serial_number, dimmer in self.dimmers.items():
            if at_least_one:
                dimmer.dim()
            else:
                dimmer.dim(True)

    def cpu_usage_callback(self, serial_number: str, cpu_usage: int):
        """An internal method that takes emits a signal on a QObject.

        :param serial_number: The Stream Deck serial number
        :type serial_number: str
        :param cpu_usage: The current CPU usage
        :type cpu_usage: int
        """
        self.plugevents.cpu_changed.emit(serial_number, cpu_usage)

    def _key_change_callback(self, deck_id: str, _deck: StreamDeck.StreamDeck, key: int, state: bool) -> None:
        """Callback whenever a key is pressed.

        Stream Deck key events fire on a background thread. Emit a signal
        to bring it back to UI thread, so we can use Qt objects for timers etc.
        Since multiple keys could fire simultaniously, we need to protect
        shared state with a lock
        """
        with self.key_event_lock:
            displayhandler = self.display_handlers[deck_id]
            displayhandler.set_keypress(key, state)
            self.streamdeck_keys.key_pressed.emit(deck_id, key, state)

    def get_display_timeout(self, deck_id: str) -> int:
        """Returns the amount of time in seconds before the display gets dimmed."""
        return cast(int, self.state.get(deck_id, {}).get("display_timeout", 0))

    def set_display_timeout(self, deck_id: str, timeout: int) -> None:
        """Sets the amount of time in seconds before the display gets dimmed."""
        self.state.setdefault(deck_id, {})["display_timeout"] = timeout
        self.dimmers[deck_id].timeout = timeout
        self._save_state()

    def _save_state(self):
        self.export_config(STATE_FILE)

    def open_config(self, config_file: str):
        with open(config_file) as state_file:
            config = json.loads(state_file.read())
            file_version = config.get("streamdeck_ui_version", 0)
            if file_version != CONFIG_FILE_VERSION:
                raise ValueError("Incompatible version of config file found: " f"{file_version} does not match required version " f"{CONFIG_FILE_VERSION}.")

            self.state = {}
            for deck_id, deck in config["state"].items():
                deck["buttons"] = {int(page_id): {int(button_id): button for button_id, button in buttons.items()} for page_id, buttons in deck.get("buttons", {}).items()}
                self.state[deck_id] = deck

    def import_config(self, config_file: str) -> None:
        self.stop()
        self.open_config(config_file)
        self._save_state()
        self.start()

    def export_config(self, output_file: str) -> None:
        try:
            with open(output_file + ".tmp", "w") as state_file:
                state_file.write(json.dumps({"streamdeck_ui_version": CONFIG_FILE_VERSION, "state": self.state}, indent=4, separators=(",", ": ")))
        except Exception as error:
            print(f"The configuration file '{output_file}' was not updated. Error: {error}")
            raise
        else:
            os.replace(output_file + ".tmp", os.path.realpath(output_file))

    def attached(self, streamdeck_id: str, streamdeck: StreamDeck):
        streamdeck.open()
        streamdeck.reset()
        serial_number = streamdeck.get_serial_number()

        # Store mapping from device id -> serial number
        # The detached event only knows about the id that got detached
        self.deck_ids[streamdeck_id] = serial_number
        self.decks[serial_number] = streamdeck
        self.initialize_state(serial_number, streamdeck.key_count())
        streamdeck.set_key_callback(partial(self._key_change_callback, serial_number))
        self.update_streamdeck_filters(serial_number)

        self.dimmers[serial_number] = Dimmer(
            self.get_display_timeout(serial_number),
            self.get_brightness(serial_number),
            self.get_brightness_dimmed(serial_number),
            lambda brightness: self.decks[serial_number].set_brightness(brightness),
        )
        self.dimmers[serial_number].reset()

        self.plugevents.attached.emit({"id": streamdeck_id, "serial_number": serial_number, "type": streamdeck.deck_type(), "layout": streamdeck.key_layout()})

    def initialize_state(self, serial_number: str, buttons: int):
        """Initializes the state for the given serial number. This allocates
        buttons and pages based on the layout.

        :param serial_number: The Stream Deck serial number
        :type serial_number: str
        :param layout: The button layout for this Stream Deck
        :type layout: Tuple[int, int]
        """
        for page in range(10):
            for button in range(buttons):
                self._button_state(serial_number, page, button)

    def detached(self, id: str):
        serial_number = self.deck_ids.get(id, None)
        if serial_number:
            self.cleanup(id, serial_number)
            self.plugevents.detached.emit(serial_number)

    def cleanup(self, id: str, serial_number: str):
        display_grid = self.display_handlers[serial_number]
        display_grid.stop()
        del self.display_handlers[serial_number]

        dimmer = self.dimmers[serial_number]
        dimmer.stop()
        del self.dimmers[serial_number]

        streamdeck = self.decks[serial_number]
        try:
            if streamdeck.connected():
                streamdeck.set_brightness(50)
                streamdeck.reset()
                streamdeck.close()
        except TransportError:
            pass

        del self.decks[serial_number]
        del self.deck_ids[id]

    def start(self):
        if not self.monitor:
            self.monitor = StreamDeckMonitor(self.lock, self.attached, self.detached)
        self.monitor.start()

    def stop(self):
        self.monitor.stop()

    def get_deck(self, deck_id: str) -> Dict[str, Dict[str, Union[str, Tuple[int, int]]]]:
        """Returns a dictionary with some Stream Deck properties

        :param deck_id: The Stream Deck serial number
        :type deck_id: str
        :return: A dictionary with 'type' and 'layout' as keys
        :rtype: Dict[str, Dict[str, Union[str, Tuple[int, int]]]]
        """
        return {"type": self.decks[deck_id].deck_type(), "layout": self.decks[deck_id].key_layout()}

    def _button_state(self, deck_id: str, page: int, button: int) -> dict:
        buttons = self.state.setdefault(deck_id, {}).setdefault("buttons", {})
        buttons_state = buttons.setdefault(page, {})  # type: ignore
        return buttons_state.setdefault(button, {})  # type: ignore

    def swap_buttons(self, deck_id: str, page: int, source_button: int, target_button: int) -> None:
        """Swaps the properties of the source and target buttons"""
        temp = cast(dict, self.state[deck_id]["buttons"])[page][source_button]
        cast(dict, self.state[deck_id]["buttons"])[page][source_button] = cast(dict, self.state[deck_id]["buttons"])[page][target_button]
        cast(dict, self.state[deck_id]["buttons"])[page][target_button] = temp
        self._save_state()

        # Update rendering for these two images
        self.update_button_filters(deck_id, page, source_button)
        self.update_button_filters(deck_id, page, target_button)
        display_handler = self.display_handlers[deck_id]
        display_handler.synchronize()

    def set_button_text(self, deck_id: str, page: int, button: int, text: str) -> None:
        """Set the text associated with a button"""
        if self.get_button_text(deck_id, page, button) != text:
            self._button_state(deck_id, page, button)["text"] = text
            self._save_state()
            self.update_button_filters(deck_id, page, button)
            display_handler = self.display_handlers[deck_id]
            display_handler.synchronize()

    def get_button_text(self, deck_id: str, page: int, button: int) -> str:
        """Returns the text set for the specified button"""
        return self._button_state(deck_id, page, button).get("text", "")

    def set_button_icon(self, deck_id: str, page: int, button: int, icon: str) -> None:
        """Sets the icon associated with a button"""

        if self.get_button_icon(deck_id, page, button) != icon:
            self._button_state(deck_id, page, button)["icon"] = icon
            self._save_state()
            self.update_button_filters(deck_id, page, button)
            display_handler = self.display_handlers[deck_id]
            display_handler.synchronize()

    def get_text_vertical_align(self, serial_number: str, page: int, button: int) -> str:
        """Gets the vertical text alignment. Values are bottom, middle-bottom, middle, middle-top, top

        :param serial_number: The Stream Deck serial number.
        :type serial_number: str
        :param page: The page the button is on
        :type page: int
        :param button: The button index
        :type button: int
        :return: The vertical alignment setting
        :rtype: str
        """
        return self._button_state(serial_number, page, button).get("text_vertical_align", "")

    def set_text_vertical_align(self, serial_number: str, page: int, button: int, alignment: str) -> None:
        """Gets the vertical text alignment. Values are top, middle, bottom

        :param serial_number: The Stream Deck serial number.
        :type serial_number: str
        :param page: The page the button is on
        :type page: int
        :param button: The button index
        :type button: int
        :return: The vertical alignment setting
        :rtype: str
        """
        if self.get_text_vertical_align(serial_number, page, button) != alignment:
            self._button_state(serial_number, page, button)["text_vertical_align"] = alignment
            self._save_state()
            self.update_button_filters(serial_number, page, button)
            display_handler = self.display_handlers[serial_number]
            display_handler.synchronize()

    def get_button_icon_pixmap(self, deck_id: str, page: int, button: int) -> Optional[QPixmap]:
        """Returns the QPixmap value for the given button (streamdeck, page, button)

        :param deck_id: The Stream Deck serial number
        :type deck_id: str
        :param page: The page index
        :type page: int
        :param button: The button index
        :type button: int
        :return: A QPixmap object containing the image currently on the button
        :rtype: Optional[QPixmap]
        """

        pil_image = self.display_handlers[deck_id].get_image(page, button)
        if pil_image:
            qt_image = ImageQt(pil_image)
            qt_image = qt_image.convertToFormat(QImage.Format.Format_ARGB32)
            return QPixmap(qt_image)
        return None

    def get_button_icon(self, deck_id: str, page: int, button: int) -> str:
        """Returns the icon path for the specified button"""
        return self._button_state(deck_id, page, button).get("icon", "")

    def set_button_change_brightness(self, deck_id: str, page: int, button: int, amount: int) -> None:
        """Sets the brightness changing associated with a button"""
        if self.get_button_change_brightness(deck_id, page, button) != amount:
            self._button_state(deck_id, page, button)["brightness_change"] = amount
            self._save_state()

    def get_button_change_brightness(self, deck_id: str, page: int, button: int) -> int:
        """Returns the brightness change set for a particular button"""
        return self._button_state(deck_id, page, button).get("brightness_change", 0)

    def set_button_command(self, deck_id: str, page: int, button: int, command: str) -> None:
        """Sets the command associated with the button"""
        if self.get_button_command(deck_id, page, button) != command:
            self._button_state(deck_id, page, button)["command"] = command
            self._save_state()

    def get_button_command(self, deck_id: str, page: int, button: int) -> str:
        """Returns the command set for the specified button"""
        return self._button_state(deck_id, page, button).get("command", "")

    def set_button_switch_page(self, deck_id: str, page: int, button: int, switch_page: int) -> None:
        """Sets the page switch associated with the button"""
        if self.get_button_switch_page(deck_id, page, button) != switch_page:
            self._button_state(deck_id, page, button)["switch_page"] = switch_page
            self._save_state()

    def get_button_switch_page(self, deck_id: str, page: int, button: int) -> int:
        """Returns the page switch set for the specified button. 0 implies no page switch."""
        return self._button_state(deck_id, page, button).get("switch_page", 0)

    def set_button_keys(self, deck_id: str, page: int, button: int, keys: str) -> None:
        """Sets the keys associated with the button"""
        if self.get_button_keys(deck_id, page, button) != keys:
            self._button_state(deck_id, page, button)["keys"] = keys
            self._save_state()

    def get_button_keys(self, deck_id: str, page: int, button: int) -> str:
        """Returns the keys set for the specified button"""
        return self._button_state(deck_id, page, button).get("keys", "")

    def set_button_write(self, deck_id: str, page: int, button: int, write: str) -> None:
        """Sets the text meant to be written when button is pressed"""
        if self.get_button_write(deck_id, page, button) != write:
            self._button_state(deck_id, page, button)["write"] = write
            self._save_state()

    def get_button_write(self, deck_id: str, page: int, button: int) -> str:
        """Returns the text to be produced when the specified button is pressed"""
        return self._button_state(deck_id, page, button).get("write", "")

    def set_brightness(self, deck_id: str, brightness: int) -> None:
        """Sets the brightness for every button on the deck"""
        if self.get_brightness(deck_id) != brightness:
            self.decks[deck_id].set_brightness(brightness)
            self.state.setdefault(deck_id, {})["brightness"] = brightness
            self._save_state()

    def get_brightness(self, deck_id: str) -> int:
        """Gets the brightness that is set for the specified stream deck"""
        return self.state.get(deck_id, {}).get("brightness", 100)  # type: ignore

    def get_brightness_dimmed(self, deck_id: str) -> int:
        """Gets the percentage value of the full brightness that is used when dimming the specified
        stream deck"""
        return self.state.get(deck_id, {}).get("brightness_dimmed", 0)  # type: ignore

    def set_brightness_dimmed(self, deck_id: str, brightness_dimmed: int) -> None:
        """Sets the percentage value that will be used for dimming the full brightness"""
        self.state.setdefault(deck_id, {})["brightness_dimmed"] = brightness_dimmed
        self._save_state()

    def change_brightness(self, deck_id: str, amount: int = 1) -> None:
        """Change the brightness of the deck by the specified amount"""
        brightness = max(min(self.get_brightness(deck_id) + amount, 100), 0)
        self.set_brightness(deck_id, brightness)
        self.dimmers[deck_id].brightness = brightness
        self.dimmers[deck_id].reset()

    def get_page(self, deck_id: str) -> int:
        """Gets the current page shown on the stream deck"""
        return self.state.get(deck_id, {}).get("page", 0)  # type: ignore

    def set_page(self, deck_id: str, page: int) -> None:
        """Sets the current page shown on the stream deck"""
        if self.get_page(deck_id) != page:
            self.state.setdefault(deck_id, {})["page"] = page
            self._save_state()

        display_handler = self.display_handlers[deck_id]

        # Let the display know to process new set of pipelines
        display_handler.set_page(page)
        # Wait for at least one cycle
        display_handler.synchronize()

    def update_streamdeck_filters(self, serial_number: str):
        """Updates the filters for all the StreamDeck buttons.

        :param serial_number: The StreamDeck serial number.
        :type serial_number: str
        """

        for deck_id, deck_state in self.state.items():
            deck = self.decks.get(deck_id, None)

            # Deck is not attached right now
            if deck is None:
                continue

            # REVIEW: Is there a better way to enumerate
            if deck_id != serial_number:
                continue

            # FIXME: Debug this - linter says there should not be a length. Issue is the way
            # the type hinting is defined causes it to believe there *may* not be a list
            pages = len(deck_state["buttons"])  # type: ignore

            display_handler = self.display_handlers.get(serial_number, DisplayGrid(self.lock, deck, pages, self.cpu_usage_callback))
            display_handler.set_page(self.get_page(deck_id))
            self.display_handlers[serial_number] = display_handler

            for page, buttons in deck_state.get("buttons", {}).items():  # type: ignore
                for button in buttons:
                    self.update_button_filters(serial_number, page, button)

            display_handler.start()

    def update_button_filters(self, serial_number: str, page: int, button: int):
        """Sets the filters for a given button. Any previous filters are replaced.

        :param serial_number: The StreamDeck serial number
        :type serial_number: str
        :param page: The page number
        :type page: int
        :param button: The button to update
        :type button: int
        :param size: The size of the image. This will be refactored out. defaults to (72, 72)
        :type size: tuple, optional
        """
        display_handler = self.display_handlers[serial_number]
        button_settings = self._button_state(serial_number, page, button)
        filters: List[Filter] = []

        icon = button_settings.get("icon")
        if icon:
            # Now we have deck, page and buttons
            filters.append(ImageFilter(icon))

        if button_settings.get("pulse"):
            filters.append(PulseFilter())

        text = button_settings.get("text")
        font = button_settings.get("font", DEFAULT_FONT)
        vertical_align = button_settings.get("text_vertical_align", "")

        if text:
            filters.append(TextFilter(text, font, vertical_align))

        display_handler.replace(page, button, filters)



================================================
FILE: streamdeck_ui/config.py
================================================
"""Defines shared configuration variables for the streamdeck_ui project"""
import os

PROJECT_PATH = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(PROJECT_PATH, "logo.png")
FONTS_PATH = os.path.join(PROJECT_PATH, "fonts")
DEFAULT_FONT = os.path.join("roboto", "Roboto-Regular.ttf")
STATE_FILE = os.environ.get("STREAMDECK_UI_CONFIG", os.path.expanduser("~/.streamdeck_ui.json"))
CONFIG_FILE_VERSION = 1  # Update only if backward incompatible changes are made to the config file



================================================
FILE: streamdeck_ui/dimmer.py
================================================
import threading
from typing import Callable, Optional

from StreamDeck.Transport.Transport import TransportError


class Dimmer:
    def __init__(self, timeout: int, brightness: int, brightness_dimmed: int, brightness_callback: Callable[[int], None]):
        """Constructs a new Dimmer instance

        :param int timeout: The time in seconds before the dimmer starts.
        :param int brightness: The normal brightness level.
        :param int brightness_dimmed: The percentage of normal brightness when dimmed.
        :param Callable[[int], None] brightness_callback: Callback that receives the current
                                                          brightness level.
        """
        self.timeout = timeout
        self.brightness = brightness
        "The brightness when not dimmed"
        self.brightness_dimmed = brightness_dimmed
        "The percentage of normal brightness when dimmed"
        self.brightness_callback = brightness_callback
        self.__stopped = False
        self.dimmed = True
        "True if the Stream Deck is dimmed, False otherwise"
        self.__timer: Optional[threading.Timer] = None

    def dimmed_brightness(self) -> int:
        """Calculates the effective brightness when dimmed.

        :return: The brightness value when applying the dim percentage to the normal brightness.
        :rtype: int
        """
        return int(self.brightness * (self.brightness_dimmed / 100))

    def stop(self) -> None:
        """Stops the dimmer and sets the brightness back to normal. Call
        reset to start normal dimming operation."""
        if self.__timer:
            self.__timer.cancel()
            self.__timer = None

        try:
            self.brightness_callback(self.brightness)
        except KeyError:
            # During detach cleanup, this is likely to happen
            pass
        except TransportError:
            pass
        self.__stopped = True

    def reset(self) -> bool:
        """Reset the dimmer and start counting down again. If it was busy dimming, it will
        immediately stop dimming. Callback fires to set brightness back to normal."""

        self.__stopped = False
        if self.__timer:
            self.__timer.cancel()
            self.__timer = None

        if self.timeout:
            self.__timer = threading.Timer(self.timeout, self.dim)
            self.__timer.start()

        if self.dimmed:
            self.brightness_callback(self.brightness)
            self.dimmed = False
            if self.dimmed_brightness() < 20:
                # The screen was "too dark" so reset and let caller know
                return True

        return False
        # Returning false means "I didn't have to reset it"

    def dim(self, toggle: bool = False):
        """Manually initiate a dim event.
        If the dimmer is stopped, this has no effect."""

        if self.__stopped:
            return

        if toggle and self.dimmed:
            # Don't dim
            self.reset()
        elif self.__timer:
            # No need for the timer anymore, stop it
            self.__timer.cancel()
            self.__timer = None

            self.brightness_callback(self.dimmed_brightness())
            self.dimmed = True



================================================
FILE: streamdeck_ui/gui.py
================================================
"""Defines the QT powered interface for configuring Stream Decks"""
import os
import shlex
import signal
import sys
import time
from functools import partial
from subprocess import Popen  # nosec - Need to allow users to specify arbitrary commands
from typing import Dict, Optional

import pkg_resources
from PySide6 import QtWidgets
from PySide6.QtCore import QMimeData, QSignalBlocker, QSize, Qt, QTimer, QUrl
from PySide6.QtGui import QAction, QDesktopServices, QDrag, QIcon
from PySide6.QtWidgets import QApplication, QDialog, QFileDialog, QMainWindow, QMenu, QMessageBox, QSizePolicy, QSystemTrayIcon

from streamdeck_ui.api import StreamDeckServer
from streamdeck_ui.config import LOGO, STATE_FILE
from streamdeck_ui.semaphore import Semaphore, SemaphoreAcquireError
from streamdeck_ui.ui_main import Ui_MainWindow
from streamdeck_ui.ui_settings import Ui_SettingsDialog

pnput_supported: bool = True
try:
    from pynput import keyboard
    from pynput.keyboard import Controller, Key
except ImportError as pynput_error:
    pnput_supported = False
    print("---------------")
    print("*** Warning ***")
    print("---------------")
    print("Virtual keyboard functionality has been disabled.")
    print("You can still run Stream Deck UI, however you will not be able to emulate key presses or text typing.")
    print("The most likely reason you are seeing this message is because you don't have an X server running")
    print("and your operating system uses Wayland.")
    print("")
    print(f"For troubleshooting purposes, the actual error is: \n{pynput_error}")


api: StreamDeckServer

BUTTON_STYLE = """
    QToolButton {
    margin: 2px;
    border: 2px solid #444444;
    border-radius: 8px;
    background-color: #000000;
    border-style: outset;}
    QToolButton:checked {
    margin: 2px;
    border: 2px solid #cccccc;
    border-radius: 8px;
    background-color: #000000;
    border-style: outset;}
"""

BUTTON_DRAG_STYLE = """
    QToolButton {
    margin: 2px;
    border: 2px solid #999999;
    border-radius: 8px;
    background-color: #000000;
    border-style: outset;}
"""

selected_button: Optional[QtWidgets.QToolButton] = None
"A reference to the currently selected button"

text_update_timer: Optional[QTimer] = None
"Timer used to delay updates to the button text"

dimmer_options = {"Never": 0, "10 Seconds": 10, "1 Minute": 60, "5 Minutes": 300, "10 Minutes": 600, "15 Minutes": 900, "30 Minutes": 1800, "1 Hour": 3600, "5 Hours": 7200, "10 Hours": 36000}
last_image_dir = ""


class DraggableButton(QtWidgets.QToolButton):
    """A QToolButton that supports drag and drop and swaps the button properties on drop"""

    def __init__(self, parent, ui, api: StreamDeckServer):
        super(DraggableButton, self).__init__(parent)

        self.setAcceptDrops(True)
        self.ui = ui
        self.api = api

    def mouseMoveEvent(self, e):  # noqa: N802 - Part of QT signature.
        if e.buttons() != Qt.LeftButton:
            return

        self.api.reset_dimmer(_deck_id(self.ui))

        mimedata = QMimeData()
        drag = QDrag(self)
        drag.setMimeData(mimedata)
        drag.exec(Qt.MoveAction)

    def dropEvent(self, e):  # noqa: N802 - Part of QT signature.
        global selected_button

        self.setStyleSheet(BUTTON_STYLE)
        serial_number = _deck_id(self.ui)
        page = _page(self.ui)

        if e.source():
            # Ignore drag and drop on yourself
            if e.source().index == self.index:
                return

            self.api.swap_buttons(serial_number, page, e.source().index, self.index)
            # In the case that we've dragged the currently selected button, we have to
            # check the target button instead so it appears that it followed the drag/drop
            if e.source().isChecked():
                e.source().setChecked(False)
                self.setChecked(True)
                selected_button = self
        else:
            # Handle drag and drop from outside the application
            if e.mimeData().hasUrls:
                file_name = e.mimeData().urls()[0].toLocalFile()
                self.api.set_button_icon(serial_number, page, self.index, file_name)

        if e.source():
            icon = self.api.get_button_icon_pixmap(serial_number, page, e.source().index)
            if icon:
                e.source().setIcon(icon)

        icon = self.api.get_button_icon_pixmap(serial_number, page, self.index)
        if icon:
            self.setIcon(icon)

    def dragEnterEvent(self, e):  # noqa: N802 - Part of QT signature.
        if type(self) is DraggableButton:
            e.setAccepted(True)
            self.setStyleSheet(BUTTON_DRAG_STYLE)
        else:
            e.setAccepted(False)

    def dragLeaveEvent(self, e):  # noqa: N802 - Part of QT signature.
        self.setStyleSheet(BUTTON_STYLE)


def _replace_special_keys(key):
    """Replaces special keywords the user can use with their character equivalent."""
    if key.lower() == "plus":
        return "+"
    if key.lower() == "comma":
        return ","
    if key.lower().startswith("delay"):
        return key.lower()
    return key


def handle_keypress(ui, deck_id: str, key: int, state: bool) -> None:
    # TODO: Handle both key down and key up events in future.
    if state:
        if api.reset_dimmer(deck_id):
            return

        if pnput_supported:
            kb = Controller()
        page = api.get_page(deck_id)

        command = api.get_button_command(deck_id, page, key)
        if command:
            try:
                Popen(shlex.split(command))
            except Exception as error:
                print(f"The command '{command}' failed: {error}")

        if pnput_supported:
            keys = api.get_button_keys(deck_id, page, key)
            if keys:
                keys = keys.strip().replace(" ", "")
                for section in keys.split(","):
                    # Since + and , are used to delimit our section and keys to press,
                    # they need to be substituted with keywords.
                    section_keys = [_replace_special_keys(key_name) for key_name in section.split("+")]

                    # Translate string to enum, or just the string itself if not found
                    section_keys = [getattr(Key, key_name.lower(), key_name) for key_name in section_keys]

                    for key_name in section_keys:
                        if isinstance(key_name, str) and key_name.startswith("delay"):
                            sleep_time_arg = key_name.split("delay", 1)[1]
                            if sleep_time_arg:
                                try:
                                    sleep_time = float(sleep_time_arg)
                                except Exception:
                                    print(f"Could not convert sleep time to float '{sleep_time_arg}'")
                                    sleep_time = 0
                            else:
                                # default if not specified
                                sleep_time = 0.5

                            if sleep_time:
                                try:
                                    time.sleep(sleep_time)
                                except Exception:
                                    print(f"Could not sleep with provided sleep time '{sleep_time}'")
                        else:
                            try:
                                if isinstance(key_name, str) and key_name.lower().startswith("0x"):
                                    kb.press(keyboard.KeyCode(int(key_name, 16)))
                                else:
                                    kb.press(key_name)

                            except Exception:
                                print(f"Could not press key '{key_name}'")

                    for key_name in section_keys:
                        if not (isinstance(key_name, str) and key_name.startswith("delay")):
                            try:
                                if isinstance(key_name, str) and key_name.lower().startswith("0x"):
                                    kb.release(keyboard.KeyCode(int(key_name, 16)))
                                else:
                                    kb.release(key_name)
                            except Exception:
                                print(f"Could not release key '{key_name}'")

        if pnput_supported:
            write = api.get_button_write(deck_id, page, key)
            if write:
                try:
                    kb.type(write)
                except Exception as error:
                    print(f"Could not complete the write command: {error}")

        brightness_change = api.get_button_change_brightness(deck_id, page, key)
        if brightness_change:
            try:
                api.change_brightness(deck_id, brightness_change)
            except Exception as error:
                print(f"Could not change brightness: {error}")

        switch_page = api.get_button_switch_page(deck_id, page, key)
        if switch_page:
            api.set_page(deck_id, switch_page - 1)
            if _deck_id(ui) == deck_id:
                ui.pages.setCurrentIndex(switch_page - 1)


def _deck_id(ui) -> str:
    """Returns the currently selected Stream Deck serial number

    :param ui: A reference to the ui object
    :type ui: _type_
    :return: The serial number
    :rtype: str
    """
    return ui.device_list.itemData(ui.device_list.currentIndex())


def _page(ui) -> int:
    return ui.pages.currentIndex()


def update_button_text(ui, text: str) -> None:
    if selected_button:
        deck_id = _deck_id(ui)
        if deck_id:
            # There may be no decks attached
            api.set_button_text(deck_id, _page(ui), selected_button.index, text)  # type: ignore # Index property added
            icon = api.get_button_icon_pixmap(deck_id, _page(ui), selected_button.index)  # type: ignore # Index property added
            if icon:
                selected_button.setIcon(icon)


def update_button_command(ui, command: str) -> None:
    if selected_button:
        deck_id = _deck_id(ui)
        api.set_button_command(deck_id, _page(ui), selected_button.index, command)  # type: ignore # Index property added


def update_button_keys(ui, keys: str) -> None:
    if selected_button:
        deck_id = _deck_id(ui)
        api.set_button_keys(deck_id, _page(ui), selected_button.index, keys)  # type: ignore # Index property added


def update_button_write(ui) -> None:
    if selected_button:
        deck_id = _deck_id(ui)
        api.set_button_write(deck_id, _page(ui), selected_button.index, ui.write.toPlainText())  # type: ignore # Index property added


def update_change_brightness(ui, amount: int) -> None:
    if selected_button:
        deck_id = _deck_id(ui)
        api.set_button_change_brightness(deck_id, _page(ui), selected_button.index, amount)  # type: ignore # Index property added


def update_switch_page(ui, page: int) -> None:
    if selected_button:
        deck_id = _deck_id(ui)
        api.set_button_switch_page(deck_id, _page(ui), selected_button.index, page)  # type: ignore # Index property added


def change_page(ui, page: int) -> None:
    global selected_button

    """Change the Stream Deck to the desired page and update
    the on-screen buttons.

    :param ui: Reference to the ui
    :type ui: _type_
    :param page: The page number to switch to
    :type page: int
    """
    if selected_button:
        selected_button.setChecked(False)
        selected_button = None

    deck_id = _deck_id(ui)
    if deck_id:
        api.set_page(deck_id, page)
        redraw_buttons(ui)
        api.reset_dimmer(deck_id)

    reset_button_configuration(ui)


def select_image(window) -> None:
    global last_image_dir
    deck_id = _deck_id(window.ui)
    image_file = api.get_button_icon(deck_id, _page(window.ui), selected_button.index)  # type: ignore # Index property added
    if not image_file:
        if not last_image_dir:
            image_file = os.path.expanduser("~")
        else:
            image_file = last_image_dir
    file_name = QFileDialog.getOpenFileName(window, "Open Image", image_file, "Image Files (*.png *.jpg *.bmp *.svg *.gif)")[0]
    if file_name:
        last_image_dir = os.path.dirname(file_name)
        deck_id = _deck_id(window.ui)
        api.set_button_icon(deck_id, _page(window.ui), selected_button.index, file_name)  # type: ignore # Index property added
        redraw_buttons(window.ui)


def align_text_vertical(window) -> None:
    serial_number = _deck_id(window.ui)
    position = api.get_text_vertical_align(serial_number, _page(window.ui), selected_button.index)  # type: ignore # Index property added
    if position == "bottom" or position == "":
        position = "middle-bottom"
    elif position == "middle-bottom":
        position = "middle"
    elif position == "middle":
        position = "middle-top"
    elif position == "middle-top":
        position = "top"
    else:
        position = ""

    api.set_text_vertical_align(serial_number, _page(window.ui), selected_button.index, position)  # type: ignore # Index property added
    redraw_buttons(window.ui)


def remove_image(window) -> None:
    deck_id = _deck_id(window.ui)
    image = api.get_button_icon(deck_id, _page(window.ui), selected_button.index)  # type: ignore # Index property added
    if image:
        confirm = QMessageBox(window)
        confirm.setWindowTitle("Remove image")
        confirm.setText("Are you sure you want to remove the image for this button?")
        confirm.setStandardButtons(QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No)
        confirm.setIcon(QMessageBox.Icon.Question)
        button = confirm.exec()
        if button == QMessageBox.StandardButton.Yes:
            api.set_button_icon(deck_id, _page(window.ui), selected_button.index, "")  # type: ignore # Index property added
            redraw_buttons(window.ui)


def redraw_buttons(ui) -> None:
    deck_id = _deck_id(ui)
    current_tab = ui.pages.currentWidget()
    buttons = current_tab.findChildren(QtWidgets.QToolButton)
    for button in buttons:
        if not button.isHidden():
            # When rebuilding the buttons, we hide the old ones
            # and mark for deletion. They still hang around so
            # ignore them here
            icon = api.get_button_icon_pixmap(deck_id, _page(ui), button.index)
            if icon:
                button.setIcon(icon)


def set_brightness(ui, value: int) -> None:
    deck_id = _deck_id(ui)
    api.set_brightness(deck_id, value)


def set_brightness_dimmed(ui, value: int) -> None:
    deck_id = _deck_id(ui)
    api.set_brightness_dimmed(deck_id, value)
    api.reset_dimmer(deck_id)


def button_clicked(ui, clicked_button, buttons) -> None:
    global selected_button
    selected_button = clicked_button
    for button in buttons:
        if button == clicked_button:
            continue

        button.setChecked(False)

    deck_id = _deck_id(ui)
    button_id = selected_button.index  # type: ignore # Index property added
    if selected_button.isChecked():  # type: ignore # False positive mypy
        enable_button_configuration(ui, True)
        ui.text.setText(api.get_button_text(deck_id, _page(ui), button_id))
        ui.command.setText(api.get_button_command(deck_id, _page(ui), button_id))
        ui.keys.setCurrentText(api.get_button_keys(deck_id, _page(ui), button_id))
        ui.write.setPlainText(api.get_button_write(deck_id, _page(ui), button_id))
        ui.change_brightness.setValue(api.get_button_change_brightness(deck_id, _page(ui), button_id))
        ui.switch_page.setValue(api.get_button_switch_page(deck_id, _page(ui), button_id))
        api.reset_dimmer(deck_id)
    else:
        selected_button = None
        reset_button_configuration(ui)


def enable_button_configuration(ui, enabled: bool):
    ui.text.setEnabled(enabled)
    ui.command.setEnabled(enabled)
    ui.keys.setEnabled(enabled)
    ui.write.setEnabled(enabled)
    ui.change_brightness.setEnabled(enabled)
    ui.switch_page.setEnabled(enabled)
    ui.imageButton.setEnabled(enabled)
    ui.removeButton.setEnabled(enabled)
    ui.textButton.setEnabled(enabled)
    ui.label_5.setVisible(pnput_supported)
    ui.keys.setVisible(pnput_supported)
    ui.label_6.setVisible(pnput_supported)
    ui.write.setVisible(pnput_supported)


def reset_button_configuration(ui):
    """Clears the configuration for a button and disables editing of them. This is done when
    there is no key selected or if there are no devices connected.
    """
    ui.text.clear()
    ui.command.clear()
    ui.keys.clearEditText()
    ui.write.clear()
    ui.change_brightness.setValue(0)
    ui.switch_page.setValue(0)
    enable_button_configuration(ui, False)


def browse_documentation():
    url = QUrl("https://timothycrosley.github.io/streamdeck-ui/")
    QDesktopServices.openUrl(url)


def browse_github():
    url = QUrl("https://github.com/timothycrosley/streamdeck-ui")
    QDesktopServices.openUrl(url)


def build_buttons(ui, tab) -> None:
    global selected_button

    if hasattr(tab, "deck_buttons"):
        buttons = tab.findChildren(QtWidgets.QToolButton)
        for button in buttons:
            button.hide()
            # Mark them as hidden. They will be GC'd later
            button.deleteLater()

        tab.deck_buttons.hide()
        tab.deck_buttons.deleteLater()
        # Remove the inner page
        del tab.children()[0]
        # Remove the property
        del tab.deck_buttons

    selected_button = None
    # When rebuilding any selection is cleared

    deck_id = _deck_id(ui)

    if not deck_id:
        return
    deck = api.get_deck(deck_id)

    # Create a new base_widget with tab as it's parent
    # This is effectively a "blank tab"
    base_widget = QtWidgets.QWidget(tab)

    # Add an inner page (QtQidget) to the page
    tab.children()[0].addWidget(base_widget)

    # Set a property - this allows us to check later
    # if we've already created the buttons
    tab.deck_buttons = base_widget

    row_layout = QtWidgets.QVBoxLayout(base_widget)
    index = 0
    buttons = []
    for _row in range(deck["layout"][0]):  # type: ignore
        column_layout = QtWidgets.QHBoxLayout()
        row_layout.addLayout(column_layout)

        for _column in range(deck["layout"][1]):  # type: ignore
            button = DraggableButton(base_widget, ui, api)
            button.setCheckable(True)
            button.index = index
            button.setSizePolicy(QSizePolicy.Policy.MinimumExpanding, QSizePolicy.Policy.MinimumExpanding)
            button.setToolButtonStyle(Qt.ToolButtonStyle.ToolButtonIconOnly)
            button.setIconSize(QSize(80, 80))
            button.setStyleSheet(BUTTON_STYLE)
            buttons.append(button)
            column_layout.addWidget(button)
            index += 1

        column_layout.addStretch(1)
    row_layout.addStretch(1)

    # Note that the button click event captures the ui variable, the current button
    #  and all the other buttons
    for button in buttons:
        button.clicked.connect(lambda button=button, buttons=buttons: button_clicked(ui, button, buttons))


def export_config(window) -> None:
    file_name = QFileDialog.getSaveFileName(window, "Export Config", os.path.expanduser("~/streamdeck_ui_export.json"), "JSON (*.json)")[0]
    if not file_name:
        return

    api.export_config(file_name)


def import_config(window) -> None:
    file_name = QFileDialog.getOpenFileName(window, "Import Config", os.path.expanduser("~"), "Config Files (*.json)")[0]
    if not file_name:
        return

    api.import_config(file_name)
    redraw_buttons(window.ui)


def build_device(ui, _device_index=None) -> None:
    """This method builds the device configuration user interface.
    It is called if you switch to a different Stream Deck,
    a Stream Deck is added or when the last one is removed.
    It must deal with the case where there is no Stream Deck as
    a result.

    :param ui: A reference to the ui
    :type ui: _type_
    :param _device_index: Not used, defaults to None
    :type _device_index: _type_, optional
    """
    style = ""
    if ui.device_list.count() > 0:
        style = "background-color: black"

    for page_id in range(ui.pages.count()):
        page = ui.pages.widget(page_id)
        page.setStyleSheet(style)
        build_buttons(ui, page)

    if ui.device_list.count() > 0:
        ui.settingsButton.setEnabled(True)
        # Set the active page for this device
        ui.pages.setCurrentIndex(api.get_page(_deck_id(ui)))

        # Draw the buttons for the active page
        redraw_buttons(ui)
    else:
        ui.settingsButton.setEnabled(False)
        reset_button_configuration(ui)


class MainWindow(QMainWindow):
    """Represents the main streamdeck-ui configuration Window. A QMainWindow
    object provides a lot of standard main window features out the box.

    The QtCreator UI designer allows you to create a UI quickly. It compiles
    into a class called Ui_MainWindow() and everything comes together by
    calling the setupUi() method and passing a reference to the QMainWindow.

    :param QMainWindow: The parent QMainWindow object
    :type QMainWindow: [type]
    """

    ui: Ui_MainWindow
    "A reference to all the UI objects for the main window"

    def __init__(self):
        super(MainWindow, self).__init__()
        self.ui = Ui_MainWindow()
        self.ui.setupUi(self)
        self.window_shown: bool = True

    def closeEvent(self, event) -> None:  # noqa: N802 - Part of QT signature.
        self.window_shown = False
        self.hide()
        event.ignore()

    def systray_clicked(self, status=None) -> None:
        if status is QtWidgets.QSystemTrayIcon.ActivationReason.Context:
            return
        if self.window_shown:
            self.hide()
            self.window_shown = False
            return

        self.bring_to_top()

    def bring_to_top(self):
        self.show()
        self.activateWindow()
        self.raise_()
        self.window_shown = True

    def about_dialog(self):
        title = "About StreamDeck UI"
        description = "A Linux compatible UI for the Elgato Stream Deck."
        app = QApplication.instance()
        body = [description, "Version {}\n".format(app.applicationVersion())]
        dependencies = ("streamdeck", "pyside6", "pillow", "pynput")
        for dep in dependencies:
            try:
                dist = pkg_resources.get_distribution(dep)
                body.append("{} {}".format(dep, dist.version))
            except pkg_resources.DistributionNotFound:
                pass
        QtWidgets.QMessageBox.about(self, title, "\n".join(body))


def queue_update_button_text(ui, text: str) -> None:
    """Instead of directly updating the text (label) associated with
    the button, add a small delay. If this is called before the
    timer fires, delay it again. Effectively this creates an update
    queue. It makes the textbox more response, as rendering the button
    and saving to the API each time can feel somewhat slow.

    :param ui: Reference to the ui
    :type ui: _type_
    :param text: The new text value
    :type text: str
    """
    global text_update_timer

    if text_update_timer:
        text_update_timer.stop()

    text_update_timer = QTimer()
    text_update_timer.setSingleShot(True)
    text_update_timer.timeout.connect(partial(update_button_text, ui, text))  # type: ignore [attr-defined]
    text_update_timer.start(500)


def change_brightness(deck_id: str, brightness: int):
    """Changes the brightness of the given streamdeck, but does not save
    the state."""
    api.decks[deck_id].set_brightness(brightness)


class SettingsDialog(QDialog):
    def __init__(self, parent):
        super().__init__(parent)
        self.ui: Ui_SettingsDialog = Ui_SettingsDialog()
        self.ui.setupUi(self)
        self.show()


def show_settings(window: MainWindow) -> None:
    """Shows the settings dialog and allows the user the change deck specific
    settings. Settings are not saved until OK is clicked."""
    ui = window.ui
    deck_id = _deck_id(ui)
    settings = SettingsDialog(window)
    api.stop_dimmer(deck_id)

    for label, value in dimmer_options.items():
        settings.ui.dim.addItem(f"{label}", userData=value)

    existing_timeout = api.get_display_timeout(deck_id)
    existing_index = next((i for i, (k, v) in enumerate(dimmer_options.items()) if v == existing_timeout), None)

    if existing_index is None:
        settings.ui.dim.addItem(f"Custom: {existing_timeout}s", userData=existing_timeout)
        existing_index = settings.ui.dim.count() - 1
        settings.ui.dim.setCurrentIndex(existing_index)
    else:
        settings.ui.dim.setCurrentIndex(existing_index)

    existing_brightness_dimmed = api.get_brightness_dimmed(deck_id)
    settings.ui.brightness_dimmed.setValue(existing_brightness_dimmed)

    settings.ui.label_streamdeck.setText(deck_id)
    settings.ui.brightness.setValue(api.get_brightness(deck_id))
    settings.ui.brightness.valueChanged.connect(partial(change_brightness, deck_id))
    settings.ui.dim.currentIndexChanged.connect(partial(disable_dim_settings, settings))
    if settings.exec():
        # Commit changes
        if existing_index != settings.ui.dim.currentIndex():
            # dimmers[deck_id].timeout = settings.ui.dim.currentData()
            api.set_display_timeout(deck_id, settings.ui.dim.currentData())
        set_brightness(window.ui, settings.ui.brightness.value())
        set_brightness_dimmed(window.ui, settings.ui.brightness_dimmed.value())
    else:
        # User cancelled, reset to original brightness
        change_brightness(deck_id, api.get_brightness(deck_id))

    api.reset_dimmer(deck_id)


def disable_dim_settings(settings: SettingsDialog, _index: int) -> None:
    disable = dimmer_options.get(settings.ui.dim.currentText()) == 0
    settings.ui.brightness_dimmed.setDisabled(disable)
    settings.ui.label_brightness_dimmed.setDisabled(disable)


def toggle_dim_all() -> None:
    api.toggle_dimmers()


def create_main_window(logo: QIcon, app: QApplication) -> MainWindow:
    """Creates the main application window and configures slots and signals

    :param logo: The icon displayed in the main application window
    :type logo: QIcon
    :param app: The QApplication that started it all
    :type app: QApplication
    :return: Returns the MainWindow instance
    :rtype: MainWindow
    """
    main_window = MainWindow()
    ui = main_window.ui
    ui.text.textChanged.connect(partial(queue_update_button_text, ui))
    ui.command.textChanged.connect(partial(update_button_command, ui))
    ui.keys.currentTextChanged.connect(partial(update_button_keys, ui))
    ui.write.textChanged.connect(partial(update_button_write, ui))
    ui.change_brightness.valueChanged.connect(partial(update_change_brightness, ui))
    ui.switch_page.valueChanged.connect(partial(update_switch_page, ui))
    ui.imageButton.clicked.connect(partial(select_image, main_window))
    ui.textButton.clicked.connect(partial(align_text_vertical, main_window))
    ui.removeButton.clicked.connect(partial(remove_image, main_window))
    ui.settingsButton.clicked.connect(partial(show_settings, main_window))
    ui.actionExport.triggered.connect(partial(export_config, main_window))
    ui.actionImport.triggered.connect(partial(import_config, main_window))
    ui.actionExit.triggered.connect(app.exit)
    ui.actionAbout.triggered.connect(main_window.about_dialog)
    ui.actionDocs.triggered.connect(browse_documentation)
    ui.actionGithub.triggered.connect(browse_github)
    ui.settingsButton.setEnabled(False)
    enable_button_configuration(ui, False)
    return main_window


def create_tray(logo: QIcon, app: QApplication, main_window: MainWindow) -> QSystemTrayIcon:
    """Creates a system tray with the provided icon and parent. The main
    window passed will be activated when clicked.

    :param logo: The icon to show in the system tray
    :type logo: QIcon
    :param app: The parent object the tray is bound to
    :type app: QApplication
    :param main_window: The window what will be activated by the tray
    :type main_window: QMainWindow
    :return: Returns the QSystemTrayIcon instance
    :rtype: QSystemTrayIcon
    """
    tray = QSystemTrayIcon(logo, app)
    tray.activated.connect(main_window.systray_clicked)  # type: ignore [attr-defined]

    menu = QMenu()
    action_dim = QAction("Dim display (toggle)", main_window)
    action_dim.triggered.connect(toggle_dim_all)  # type: ignore [attr-defined]
    action_configure = QAction("Configure...", main_window)
    action_configure.triggered.connect(main_window.bring_to_top)  # type: ignore [attr-defined]
    menu.addAction(action_dim)
    menu.addAction(action_configure)
    menu.addSeparator()
    action_exit = QAction("Exit", main_window)
    action_exit.triggered.connect(app.exit)  # type: ignore [attr-defined]
    menu.addAction(action_exit)
    tray.setContextMenu(menu)
    return tray


def streamdeck_cpu_changed(ui, serial_number: str, cpu: int):
    if cpu > 100:
        cpu = 100
    if _deck_id(ui) == serial_number:
        ui.cpu_usage.setValue(cpu)
        ui.cpu_usage.setToolTip(f"Rendering CPU usage: {cpu}%")
        ui.cpu_usage.update()


def streamdeck_attached(ui, deck: Dict):
    serial_number = deck["serial_number"]
    blocker = QSignalBlocker(ui.device_list)
    try:
        ui.device_list.addItem(f"{deck['type']} - {serial_number}", userData=serial_number)
    finally:
        blocker.unblock()
    build_device(ui)


def streamdeck_detached(ui, serial_number):
    index = ui.device_list.findData(serial_number)
    if index != -1:
        # Should not be (how can you remove a device that was never attached?)
        # Check anyways
        blocker = QSignalBlocker(ui.device_list)
        try:
            ui.device_list.removeItem(index)
        finally:
            blocker.unblock()
        build_device(ui)


def sigterm_handler(api, app, signal_value, frame):
    api.stop()
    app.quit()
    if signal_value == signal.SIGTERM:
        # Indicate to systemd that it was a clean termination
        print("Exiting normally")
        sys.exit()
    else:
        # Terminations for other reasons are treated as an error condition
        sys.exit(1)


def start(_exit: bool = False) -> None:
    global api
    show_ui = True
    if "-h" in sys.argv or "--help" in sys.argv:
        print(f"Usage: {os.path.basename(sys.argv[0])}")
        print("Flags:")
        print("  -h, --help\tShow this message")
        print("  -n, --no-ui\tRun the program without showing a UI")
        return
    elif "-n" in sys.argv or "--no-ui" in sys.argv:
        show_ui = False

    try:
        version = pkg_resources.get_distribution("streamdeck_ui").version
    except pkg_resources.DistributionNotFound:
        version = "devel"

    try:
        with Semaphore("/tmp/streamdeck_ui.lock"):  # nosec - this file is only observed with advisory lock
            # The semaphore was created, so this is the first instance

            api = StreamDeckServer()
            if os.path.isfile(STATE_FILE):
                api.open_config(STATE_FILE)

            # The QApplication object holds the Qt event loop and you need one of these
            # for your application
            app = QApplication(sys.argv)
            app.setApplicationName("Streamdeck UI")
            app.setApplicationVersion(version)
            logo = QIcon(LOGO)
            app.setWindowIcon(logo)
            main_window = create_main_window(logo, app)
            ui = main_window.ui
            tray = create_tray(logo, app, main_window)

            api.streamdeck_keys.key_pressed.connect(partial(handle_keypress, ui))

            ui.device_list.currentIndexChanged.connect(partial(build_device, ui))
            ui.pages.currentChanged.connect(partial(change_page, ui))

            api.plugevents.attached.connect(partial(streamdeck_attached, ui))
            api.plugevents.detached.connect(partial(streamdeck_detached, ui))
            api.plugevents.cpu_changed.connect(partial(streamdeck_cpu_changed, ui))

            api.start()

            # Configure signal hanlders
            # https://stackoverflow.com/a/4939113/192815
            timer = QTimer()
            timer.start(500)
            timer.timeout.connect(lambda: None)  # type: ignore [attr-defined] # Let interpreter run to handle signal

            # Handle SIGTERM so we release semaphore and shutdown API gracefully
            signal.signal(signal.SIGTERM, partial(sigterm_handler, api, app))

            # Handle <ctrl+c>
            signal.signal(signal.SIGINT, partial(sigterm_handler, api, app))

            tray.show()
            if show_ui:
                main_window.show()

            if _exit:
                return
            else:
                app.exec()
                api.stop()
                sys.exit()

    except SemaphoreAcquireError:
        # The semaphore already exists, so another instance is running
        sys.exit()


if __name__ == "__main__":
    start()



================================================
FILE: streamdeck_ui/main.ui
================================================
<?xml version="1.0" encoding="UTF-8"?>
<ui version="4.0">
 <class>MainWindow</class>
 <widget class="QMainWindow" name="MainWindow">
  <property name="geometry">
   <rect>
    <x>0</x>
    <y>0</y>
    <width>940</width>
    <height>490</height>
   </rect>
  </property>
  <property name="windowTitle">
   <string>Stream Deck UI</string>
  </property>
  <widget class="QWidget" name="centralwidget">
   <property name="autoFillBackground">
    <bool>false</bool>
   </property>
   <layout class="QVBoxLayout" name="verticalLayout_2">
    <property name="spacing">
     <number>6</number>
    </property>
    <property name="leftMargin">
     <number>9</number>
    </property>
    <property name="bottomMargin">
     <number>3</number>
    </property>
    <item>
     <layout class="QHBoxLayout" name="main_horizontalLayout">
      <property name="spacing">
       <number>12</number>
      </property>
      <property name="leftMargin">
       <number>0</number>
      </property>
      <property name="topMargin">
       <number>0</number>
      </property>
      <property name="rightMargin">
       <number>0</number>
      </property>
      <property name="bottomMargin">
       <number>0</number>
      </property>
      <item>
       <layout class="QVBoxLayout" name="left_verticalLayout" stretch="0,1">
        <property name="spacing">
         <number>6</number>
        </property>
        <property name="sizeConstraint">
         <enum>QLayout::SetDefaultConstraint</enum>
        </property>
        <property name="topMargin">
         <number>0</number>
        </property>
        <item>
         <layout class="QHBoxLayout" name="deviceSettings_horizontalLayout">
          <property name="leftMargin">
           <number>0</number>
          </property>
          <property name="topMargin">
           <number>0</number>
          </property>
          <property name="rightMargin">
           <number>0</number>
          </property>
          <property name="bottomMargin">
           <number>0</number>
          </property>
          <item>
           <widget class="QComboBox" name="device_list">
            <property name="minimumSize">
             <size>
              <width>400</width>
              <height>0</height>
             </size>
            </property>
           </widget>
          </item>
          <item>
           <widget class="QPushButton" name="settingsButton">
            <property name="sizePolicy">
             <sizepolicy hsizetype="Minimum" vsizetype="Expanding">
              <horstretch>0</horstretch>
              <verstretch>0</verstretch>
             </sizepolicy>
            </property>
            <property name="minimumSize">
             <size>
              <width>0</width>
              <height>0</height>
             </size>
            </property>
            <property name="maximumSize">
             <size>
              <width>30</width>
              <height>16777215</height>
             </size>
            </property>
            <property name="text">
             <string/>
            </property>
            <property name="icon">
             <iconset resource="resources.qrc">
              <normaloff>:/icons/icons/gear.png</normaloff>:/icons/icons/gear.png</iconset>
            </property>
           </widget>
          </item>
          <item>
           <widget class="QProgressBar" name="cpu_usage">
            <property name="sizePolicy">
             <sizepolicy hsizetype="Fixed" vsizetype="Expanding">
              <horstretch>0</horstretch>
              <verstretch>0</verstretch>
             </sizepolicy>
            </property>
            <property name="maximumSize">
             <size>
              <width>25</width>
              <height>25</height>
             </size>
            </property>
            <property name="maximum">
             <number>130</number>
            </property>
            <property name="value">
             <number>0</number>
            </property>
            <property name="orientation">
             <enum>Qt::Vertical</enum>
            </property>
            <property name="format">
             <string/>
            </property>
           </widget>
          </item>
         </layout>
        </item>
        <item>
         <widget class="QTabWidget" name="pages">
          <property name="sizePolicy">
           <sizepolicy hsizetype="Preferred" vsizetype="Preferred">
            <horstretch>0</horstretch>
            <verstretch>0</verstretch>
           </sizepolicy>
          </property>
          <property name="autoFillBackground">
           <bool>false</bool>
          </property>
          <property name="styleSheet">
           <string notr="true">b</string>
          </property>
          <property name="currentIndex">
           <number>0</number>
          </property>
          <widget class="QWidget" name="page_1">
           <attribute name="title">
            <string>Page 1</string>
           </attribute>
           <layout class="QGridLayout" name="gridLayout_2"/>
          </widget>
          <widget class="QWidget" name="page_2">
           <attribute name="title">
            <string>2</string>
           </attribute>
           <layout class="QGridLayout" name="gridLayout_3"/>
          </widget>
          <widget class="QWidget" name="page_3">
           <attribute name="title">
            <string>3</string>
           </attribute>
           <layout class="QGridLayout" name="gridLayout_11"/>
          </widget>
          <widget class="QWidget" name="page_4">
           <attribute name="title">
            <string>4</string>
           </attribute>
           <layout class="QGridLayout" name="gridLayout_10"/>
          </widget>
          <widget class="QWidget" name="page_5">
           <attribute name="title">
            <string>5</string>
           </attribute>
           <layout class="QGridLayout" name="gridLayout_9"/>
          </widget>
          <widget class="QWidget" name="page_6">
           <attribute name="title">
            <string>6</string>
           </attribute>
           <layout class="QGridLayout" name="gridLayout_8"/>
          </widget>
          <widget class="QWidget" name="page_7">
           <attribute name="title">
            <string>7</string>
           </attribute>
           <layout class="QGridLayout" name="gridLayout_7"/>
          </widget>
          <widget class="QWidget" name="page_8">
           <attribute name="title">
            <string>8</string>
           </attribute>
           <layout class="QGridLayout" name="gridLayout_6"/>
          </widget>
          <widget class="QWidget" name="page_9">
           <attribute name="title">
            <string>9</string>
           </attribute>
           <layout class="QGridLayout" name="gridLayout_5"/>
          </widget>
          <widget class="QWidget" name="tab_10">
           <attribute name="title">
            <string>10</string>
           </attribute>
           <layout class="QGridLayout" name="gridLayout_4"/>
          </widget>
         </widget>
        </item>
       </layout>
      </item>
      <item>
       <layout class="QHBoxLayout" name="right_horizontalLayout">
        <item>
         <widget class="QGroupBox" name="groupBox">
          <property name="minimumSize">
           <size>
            <width>250</width>
            <height>0</height>
           </size>
          </property>
          <property name="title">
           <string>Configure Button</string>
          </property>
          <layout class="QVBoxLayout" name="verticalLayout_3">
           <item>
            <layout class="QFormLayout" name="formLayout">
             <item row="0" column="0">
              <widget class="QLabel" name="label">
               <property name="text">
                <string>Image:</string>
               </property>
              </widget>
             </item>
             <item row="0" column="1">
              <layout class="QHBoxLayout" name="horizontalLayout_2">
               <property name="spacing">
                <number>6</number>
               </property>
               <item>
                <widget class="QPushButton" name="imageButton">
                 <property name="text">
                  <string>Image...</string>
                 </property>
                </widget>
               </item>
               <item>
                <widget class="QPushButton" name="removeButton">
                 <property name="sizePolicy">
                  <sizepolicy hsizetype="Minimum" vsizetype="Minimum">
                   <horstretch>0</horstretch>
                   <verstretch>0</verstretch>
                  </sizepolicy>
                 </property>
                 <property name="maximumSize">
                  <size>
                   <width>30</width>
                   <height>16777215</height>
                  </size>
                 </property>
                 <property name="toolTip">
                  <string>Remove the image from the button</string>
                 </property>
                 <property name="text">
                  <string/>
                 </property>
                 <property name="icon">
                  <iconset resource="resources.qrc">
                   <normaloff>:/icons/icons/cross.png</normaloff>:/icons/icons/cross.png</iconset>
                 </property>
                </widget>
               </item>
              </layout>
             </item>
             <item row="1" column="0">
              <widget class="QLabel" name="label_2">
               <property name="text">
                <string>Label:</string>
               </property>
              </widget>
             </item>
             <item row="2" column="0">
              <widget class="QLabel" name="label_3">
               <property name="text">
                <string>Command:</string>
               </property>
              </widget>
             </item>
             <item row="2" column="1">
              <widget class="QLineEdit" name="command"/>
             </item>
             <item row="3" column="0">
              <widget class="QLabel" name="label_5">
               <property name="text">
                <string>Press Keys:</string>
               </property>
              </widget>
             </item>
             <item row="3" column="1">
              <widget class="QComboBox" name="keys">
               <property name="editable">
                <bool>true</bool>
               </property>
               <item>
                <property name="text">
                 <string notr="true"/>
                </property>
               </item>
               <item>
                <property name="text">
                 <string notr="true">F11</string>
                </property>
               </item>
               <item>
                <property name="text">
                 <string notr="true">alt+F4</string>
                </property>
               </item>
               <item>
                <property name="text">
                 <string notr="true">ctrl+w</string>
                </property>
               </item>
               <item>
                <property name="text">
                 <string notr="true">cmd+left</string>
                </property>
               </item>
               <item>
                <property name="text">
                 <string notr="true">alt+plus</string>
                </property>
               </item>
               <item>
                <property name="text">
                 <string notr="true">alt+delay+F3</string>
                </property>
               </item>
               <item>
                <property name="text">
                 <string notr="true">backspace</string>
                </property>
               </item>
               <item>
                <property name="text">
                 <string notr="true">right</string>
                </property>
               </item>
               <item>
                <property name="text">
                 <string notr="true">page_up</string>
                </property>
               </item>
               <item>
                <property name="text">
                 <string notr="true">media_volume_up</string>
                </property>
               </item>
               <item>
                <property name="text">
                 <string notr="true">media_volume_down</string>
                </property>
               </item>
               <item>
                <property name="text">
                 <string notr="true">media_volume_mute</string>
                </property>
               </item>
               <item>
                <property name="text">
                 <string notr="true">media_previous</string>
                </property>
               </item>
               <item>
                <property name="text">
                 <string notr="true">media_next</string>
                </property>
               </item>
               <item>
                <property name="text">
                 <string notr="true">media_play_pause</string>
                </property>
               </item>
              </widget>
             </item>
             <item row="4" column="0">
              <widget class="QLabel" name="label_8">
               <property name="text">
                <string>Switch Page:</string>
               </property>
              </widget>
             </item>
             <item row="4" column="1">
              <widget class="QSpinBox" name="switch_page">
               <property name="minimum">
                <number>0</number>
               </property>
               <property name="maximum">
                <number>10</number>
               </property>
               <property name="value">
                <number>0</number>
               </property>
              </widget>
             </item>
             <item row="5" column="0">
              <widget class="QLabel" name="label_7">
               <property name="text">
                <string>Brightness +/-:</string>
               </property>
              </widget>
             </item>
             <item row="5" column="1">
              <widget class="QSpinBox" name="change_brightness">
               <property name="minimum">
                <number>-99</number>
               </property>
              </widget>
             </item>
             <item row="6" column="0">
              <widget class="QLabel" name="label_6">
               <property name="text">
                <string>Write Text:</string>
               </property>
              </widget>
             </item>
             <item row="6" column="1">
              <widget class="QPlainTextEdit" name="write"/>
             </item>
             <item row="1" column="1">
              <layout class="QHBoxLayout" name="horizontalLayout_3">
               <item>
                <widget class="QLineEdit" name="text"/>
               </item>
               <item>
                <widget class="QPushButton" name="textButton">
                 <property name="minimumSize">
                  <size>
                   <width>30</width>
                   <height>0</height>
                  </size>
                 </property>
                 <property name="maximumSize">
                  <size>
                   <width>30</width>
                   <height>16777215</height>
                  </size>
                 </property>
                 <property name="toolTip">
                  <string>Text vertical alignment</string>
                 </property>
                 <property name="text">
                  <string/>
                 </property>
                 <property name="icon">
                  <iconset resource="resources.qrc">
                   <normaloff>:/icons/icons/vertical-align.png</normaloff>:/icons/icons/vertical-align.png</iconset>
                 </property>
                </widget>
               </item>
              </layout>
             </item>
            </layout>
           </item>
          </layout>
         </widget>
        </item>
       </layout>
      </item>
     </layout>
    </item>
   </layout>
  </widget>
  <widget class="QMenuBar" name="menubar">
   <property name="geometry">
    <rect>
     <x>0</x>
     <y>0</y>
     <width>940</width>
     <height>22</height>
    </rect>
   </property>
   <widget class="QMenu" name="menuFile">
    <property name="title">
     <string>File</string>
    </property>
    <addaction name="actionImport"/>
    <addaction name="actionExport"/>
    <addaction name="separator"/>
    <addaction name="actionExit"/>
   </widget>
   <widget class="QMenu" name="menuHelp">
    <property name="title">
     <string>Help</string>
    </property>
    <addaction name="actionDocs"/>
    <addaction name="actionGithub"/>
    <addaction name="separator"/>
    <addaction name="actionAbout"/>
   </widget>
   <addaction name="menuFile"/>
   <addaction name="menuHelp"/>
  </widget>
  <widget class="QStatusBar" name="statusbar"/>
  <action name="actionImport">
   <property name="text">
    <string>Import</string>
   </property>
  </action>
  <action name="actionExport">
   <property name="text">
    <string>Export</string>
   </property>
  </action>
  <action name="actionExit">
   <property name="text">
    <string>Exit</string>
   </property>
  </action>
  <action name="actionDocs">
   <property name="text">
    <string>Documentation</string>
   </property>
  </action>
  <action name="actionGithub">
   <property name="text">
    <string>Github</string>
   </property>
  </action>
  <action name="actionAbout">
   <property name="text">
    <string>About...</string>
   </property>
  </action>
 </widget>
 <tabstops>
  <tabstop>device_list</tabstop>
  <tabstop>settingsButton</tabstop>
  <tabstop>pages</tabstop>
  <tabstop>imageButton</tabstop>
  <tabstop>removeButton</tabstop>
  <tabstop>text</tabstop>
  <tabstop>textButton</tabstop>
  <tabstop>command</tabstop>
  <tabstop>keys</tabstop>
  <tabstop>switch_page</tabstop>
  <tabstop>change_brightness</tabstop>
  <tabstop>write</tabstop>
 </tabstops>
 <resources>
  <include location="resources.qrc"/>
 </resources>
 <connections/>
</ui>



================================================
FILE: streamdeck_ui/mock_streamdeck.py
================================================
from StreamDeck.Devices import StreamDeck


class StreamDeckMock(StreamDeck.StreamDeck):
    """
    Represents a physically attached StreamDeck Original device.
    """

    KEY_COUNT = 24
    KEY_COLS = 6
    KEY_ROWS = 4

    KEY_PIXEL_WIDTH = 72
    KEY_PIXEL_HEIGHT = 72
    KEY_IMAGE_FORMAT = "BMP"
    KEY_FLIP = (True, True)
    KEY_ROTATION = 0

    DECK_TYPE = "Stream Deck Original"

    IMAGE_REPORT_LENGTH = 8191
    IMAGE_REPORT_HEADER_LENGTH = 16

    # fmt: off
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
    # fmt: on

    def _convert_key_id_origin(self, key):
        """
        Converts a key index from or to a origin at the physical top-left of
        the StreamDeck device.

        :param int key: Index of the button with either a device or top-left origin.

        :rtype: int
        :return: Key index converted to the opposite key origin (device or top-left).
        """

        key_col = key % self.KEY_COLS
        return (key - key_col) + ((self.KEY_COLS - 1) - key_col)

    def _read_key_states(self):
        """
        Reads the key states of the StreamDeck. This is used internally by
        :func:`~StreamDeck._read` to talk to the actual device.

        :rtype: list(bool)
        :return: Button states, with the origin at the top-left of the deck.
        """

        return None

    def __del__(self):
        """
        Delete handler for the StreamDeck, automatically closing the transport
        if it is currently open and terminating the transport reader thread.
        """
        pass

        # states = self.device.read(1 + self.KEY_COUNT)
        # if states is None:
        #     return None

        # states = states[1:]
        # return [bool(states[s]) for s in map(self._convert_key_id_origin, range(self.KEY_COUNT))]

    def open(self):
        """
        Opens the device for input/output. This must be called prior to setting
        or retrieving any device state.

        .. seealso:: See :func:`~StreamDeck.close` for the corresponding close method.
        """
        # self.device.open()
        # self._reset_key_stream()
        # self._setup_reader(self._read)

    def close(self):
        """
        Closes the device for input/output.

        .. seealso:: See :func:`~StreamDeck.open` for the corresponding open method.
        """
        pass

    def is_open(self):
        """
        Indicattes if the StreamDeck device is currently open and ready for use..

        :rtype: bool
        :return: `True` if the deck is open, `False` otherwise.
        """
        return True

    def connected(self):
        """
        Indicates if the physical StreamDeck device this instance is attached to
        is still connected to the host.

        :rtype: bool
        :return: `True` if the deck is still connected, `False` otherwise.
        """
        return True

    def id(self):
        """
        Retrieves the physical ID of the attached StreamDeck. This can be used
        to differentiate one StreamDeck from another.

        :rtype: str
        :return: Identifier for the attached device.
        """
        return "/dev/dummy"

    def _reset_key_stream(self):
        """
        Sends a blank key report to the StreamDeck, resetting the key image
        streamer in the device. This prevents previously started partial key
        writes that were not completed from corrupting images sent from this
        application.
        """

        payload = bytearray(self.IMAGE_REPORT_LENGTH)
        payload[0] = 0x02
        # self.device.write(payload)

    def reset(self):
        """
        Resets the StreamDeck, clearing all button images and showing the
        standby image.
        """

        payload = bytearray(17)
        payload[0:2] = [0x0B, 0x63]
        # self.device.write_feature(payload)

    def set_brightness(self, percent):
        """
        Sets the global screen brightness of the StreamDeck, across all the
        physical buttons.

        :param int/float percent: brightness percent, from [0-100] as an `int`,
                                  or normalized to [0.0-1.0] as a `float`.
        """

        print(f"Dummy brightness changed to: {percent}")
        if isinstance(percent, float):
            percent = int(100.0 * percent)

        percent = min(max(percent, 0), 100)

        payload = bytearray(17)
        payload[0:6] = [0x05, 0x55, 0xAA, 0xD1, 0x01, percent]
        # self.device.write_feature(payload)

    def get_serial_number(self):
        """
        Gets the serial number of the attached StreamDeck.

        :rtype: str
        :return: String containing the serial number of the attached device.
        """

        # serial = self.device.read_feature(0x03, 17)
        # return self._extract_string(serial[5:])
        return "FAKE"

    def get_firmware_version(self):
        """
        Gets the firmware version of the attached StreamDeck.

        :rtype: str
        :return: String containing the firmware version of the attached device.
        """

        # version = self.device.read_feature(0x04, 17)
        # return self._extract_string(version[5:])
        return "1.0"

    def set_key_image(self, key, image):
        """
        Sets the image of a button on the StreamDeck to the given image. The
        image being set should be in the correct format for the device, as an
        enumerable collection of bytes.

        .. seealso:: See :func:`~StreamDeck.get_key_image_format` method for
                     information on the image format accepted by the device.

        :param int key: Index of the button whose image is to be updated.
        :param enumerable image: Raw data of the image to set on the button.
                                 If `None`, the key will be cleared to a black
                                 color.
        """

    pass



================================================
FILE: streamdeck_ui/resources.qrc
================================================
<RCC>
    <qresource prefix="/icons">
        <file>icons/cross.png</file>
        <file>icons/gear.png</file>
        <file>icons/vertical-align.png</file>
    </qresource>
</RCC>



================================================
FILE: streamdeck_ui/resources_rc.py
================================================
# Resource object code (Python 3)
# Created by: object code
# Created by: The Resource Compiler for Qt version 6.4.2
# WARNING! All changes made in this file will be lost!

from PySide6 import QtCore

qt_resource_data = b"\
\x00\x00\x049\
\x89\
PNG\x0d\x0a\x1a\x0a\x00\x00\x00\x0dIHDR\x00\
\x00\x00\x18\x00\x00\x00\x18\x08\x06\x00\x00\x00\xe0w=\xf8\
\x00\x00\x00\x19tEXtSoftware\
\x00Adobe ImageRead\
yq\xc9e<\x00\x00\x03\xdbIDATx\xda\xb4\
VMHTQ\x14>3o4g*R\xe9\xc7n\
\x10\xb5)\x15\x0c\xe9\x16L\xe9P\x86\xe2\x18FE\x14\
Q\x10\xad\x86 h\xd1\xa6MK\x97mZE\xed\x8a\
\x886\x11\xad\x8a@\xb0 \x87\x19|jjX6I\
\x09\xea\x8c\xc3\xcc\xd8\xa4\xf6\xd4\x99y\x9ds\xdf\xbd\xaf\
\xe7\x9b\xa46]\xf8|\xde{\xcf\xf9\xbes\xef9\xef\
\xbc\xf1\x98\xa6\x09\xffs\xf8\x9ex<\xe0\xc1\x7f\xbc\x16\
\xc2\xf8\xe8A<(Y\x80\xa2\x0b44\x17\xa4o\x04\
,\xdcF\xbfW\xe4k\xca=5\xc2\xb8\xd8s\xfe\xd6\
-^\xfam\xfc\xaf#B>gn\xde$_\x0a0\
\xac6\xb4s\xf8\x07O\x10F\xb5\x9e\x8bH>;;\
\x0b\xc1p\x98\x8d\xbe{\xc7\xc0\x8aB7e4\xea2\
\xbdk\x11\xc1\xf5\xc8\xe9\x1b7x6\x9b\x85\xa6P\x88\
}\x8c\xc7\x1bpk\x0a\x91\xd0\xceZ\x8eO/#\xf9\
\xe4\xe4$\x14\x0a\x05\xc8\xe5r\xd0r\xf2$\x1b\xe9\xef\
/\x13\x81?\x90w_\xbb\xc6\xe7\xe6\xe6\x84\xef\xe2\xe2\
\x224\x1e9\xc2>\x0f\x0d5\xe0\xde\x03\xed\x8ct\x1c\
\xc6\x88C]]lff\x06VWW!\x9dNC\
+\xce\xc7b\xb15\x22\xe0\x22\xef\xbcz\x95+\x1fB\
 \x10\x80\xd7\x8f\x1e\xe9\x94G\xf2Q'\xd0))\xef\
\xa3Q\x16\xea\xecd\xd3\xd3\xd3\xc28\x95JA\xb0\xbd\
\x9d\x8d\x0f\x0e\xda\x22\xe0 ?~\xe1\x02W\xb6\x04\xbf\
\xdf\x0fo\x9f=\x13\xe4\x1e\x0b \x04h\x94\xa4\xc8h\
<\xce\x82mm,\x99L\x8a#\xd3\xd1\x0f\xb6\xb6\xb2\
\xc4\xd8\x18\x93\xa6\x9c\xc8\x8f\x9e:%\xf2E6\x84\xaa\
\xaa*\x88\xbd|i\x93{\xad\xdc\xfe\x160\xa5\x08\x95\
\xe2\xf8\xf00;\x88\xf7\x98\xc9d\xa0T*\x01%\xaf\
\x91s\xf6ub\x82\xa1\x1d?\xdc\xd1!\xee\x9c\xf6\x08\
D>\xd4\xd7GWh\x93+\x01\xcfCI\xee\xaaw\
q\x05m\xdd\xdd\x22J5\xaa\xab\xab\x05a>\x9f\xb7\
\xd7*++a$\x1a\xd5\x89X\xb3`\xbf\x1fe'\
0]'\xf9\x82\x11\xefkld\x86a\x08\x1bz.\
//\xdb\xe4\x9a\xa6\xc1p,V\x16\xb9\xf3\x04\xbe\xf5\
\xde\x1cr\x22\x91\xbe\xde\xde\xc8\xe1`\x90\x7f\x9f\x9f\x87\
\xa5\xa5%;\xa1t\x92\xf9l\xd6\x8e|\xddV\xd1/\
\x95*\x1d\xa8\x90\xcaJ\xbd\xc2\xeb\x85\x0cV\x94\x1a\x1e\
y\x05\x059\xff)\xff_E\xac8@\xb7\xa1\x1dr\
8\xb8\xfa\x8bx\xfd[\x9a\x9b\xf9T\x22Q\xb6O\xd8\
\xe2\xf7\xb3\xaca0g\x15\x96\xf5\xadu\x04\x04y\xa8\
\xbe\x9e\xa7\xb1\xce\xd5\xfaF\xacs\x13K\xd2i\xbb\x15\
ER\x0e\x91\xbf\x0a\xa8\xc8O\xec\xdd\xcb\x17\xb0L\xd5\
Um\xf0\xf9 \x9aJ\xe9I\xc3\x98\xdd\x83\xa4>\xc7\
52\x9cO\xa1\x88\xe9\x12)\x13P\xe4]\xbbv\xf1\
\x95\x1f?l\x82\x0al\xe9\xbd\x99\x8c.[\xb8\xfe\x0d\
\xc9\xf6\xb9DH\xf4\xb3Kd\x8d\x80\x22?\xb7};\
7\xb1\x14\x9d\xce/r9A\xee\xb5\xaaE\xa7dN\
 \xd9\x01\x97\xc8~\x9c\x8f9D\x9c\x02\x82\xfcJm\
-\xf7\x16\x8bk\xc8\x1f;\xc85\x19UQ\x8a\x8c\x22\
\xd9!\x97H\x13\xce\x07eN(\x18\xad\xd9R\xbb\x7f\
\xbd\xa6\x86;\x0d\x09\xf7\x90\xdc\x94\xe4\xf4>\xbfF|\
@l\xa6\x84\xa33\x95\xa6\x8ed-.\x11\x12\x8d\xe2\
:\x05\xa6\xed\xb0\x8c\xa7p\xa1\xe1\x18n\xa8d\xdf\x91\
\xe4I\xc4\x1b\x9c\xc7\x11y\x89q\xc4\x8c\x14\x09\xe0\x93\
\xc8\xfe\xe0{\x1b\x83J\x88s\xd4!\xda\xf1\xabv\x09\
``\xa2\xa6\xc6\xa4'\xce#u\xff\xf0\xad\x94\xbe\x11\
\x97o\xb8\xce\xf1\xfd\xaeX\x00\xd84\x09\xf0\x1d\x8f7\
7b\x18\xbb\xa7\x01\x9e\xf7a\x97\xc0\xf5Zy#~\
\xaaT\xf9\x92\xd3\x93\x02\xafFlC\x9b\x9d\xe8\x9b\xc2\
Iq\xc00\xb6|\x02\xb8\x8b\xdd\xa1\x7fA~\x05T\
\x85\xfa\xa4\xa3\xea\x14\x1e+5\xa2\x9c\x0b\x12E\xb9\xa6\
~,h\x8e\xae\xa2~\x5c\x94d\xc7X\x96\xdd\xa2\xf0\
K\x80\x01\x00\x9en\x09\xdb\x0f\x1d\x92\xbe\x00\x00\x00\x00\
IEND\xaeB`\x82\
\x00\x00\x00\xec\
\x89\
PNG\x0d\x0a\x1a\x0a\x00\x00\x00\x0dIHDR\x00\
\x00\x00\x1a\x00\x00\x00\x1a\x08\x04\x00\x00\x00\x03C\x84E\
\x00\x00\x00\xb3IDAT8\xcbc`\xa0\x1c8\x80\
0\xa3\x03\x0b\x90\x9c\xe20\x11H\xb280BD\x89\
\xd1R\xe7\xf0\x1f\x08k\x08jC\xd2\xd2\x08\xd4\xf0\x07\
\x08\xff;\xd4\x13\xa1\x0d\xac\xb1\x16\xa8\xf8\xa7\xc3? \
\xfc\x09dU\x81\x8d\xc2\xa3\x85\xc9\x81\xc3a2\xd8a\
\xc8p\xa2\x03;P\x06\x87&\x90#\xe4\x1dZ\x1c\xaa\
\x1d\xaa\x1c\xce\x81\x95\x9f\x03\xb2\xaa\x81\x22\xb2\x10Y\x9c\
\xbe\x82\xb2f\x825\xcd$\x22\xb8\x1d\xc0\x01\x01t\x22\
\x8b\xc3\x22\xb0\xa6EP\x1e\xa3\x03\xa1`\x07\x87\xdf\x02\
\xb0\xa6\x05\xe0\xb0#&zG5\xd1M\x13\x99\x91K\
N2\x22'\xc1\x92\x955\xc8\xcc\x84dfw\x92\x0b\
\x162\x8b0b\x01\x00\xb7\xde\xa5\xf5\xa1bS{\x00\
\x00\x00\x00IEND\xaeB`\x82\
\x00\x00\x05=\
\x89\
PNG\x0d\x0a\x1a\x0a\x00\x00\x00\x0dIHDR\x00\
\x00\x00\x18\x00\x00\x00\x18\x08\x06\x00\x00\x00\xe0w=\xf8\
\x00\x00\x00\x19tEXtSoftware\
\x00Adobe ImageRead\
yq\xc9e<\x00\x00\x04\xdfIDATx\xda\xb4\
U]L\x9be\x14>\xfd\x87V\xba\x96\xd22\x08#\
\x19\xcb4\x8b\xd94Qf\x82\x8af@\x8a4\x5cL\
\x1d\x5cL#\xe1nD\xaa\xd1\xab\x11\x22\x81\x90\xe8\x85\
Q,\x86lW\xb2M\x09ht!$\x1d\x1d-1\
F\xb8\xda2\x98\x17K\x81a\xc6XX\xf8i+\x7f\
\xed\xd7B\xeby\xde\xef\xfb\xba\x8eh\xe2\x8d_r\xfa\
\x9e\x9e\x9f\xe7\xbc\xefy\xcf9\xaf&\x93\xc9\xd0\xff\xf9\
\xe9\xf1\xd3\xd8\xd8H\x1a\x8d\x86t:\x9d\xa0\xdcO\xab\
\xd5by\x8b\xc9\xcedV\xc4\xbbLQ\xa6\x1b\xe9t\
\xfa)\xfb\xfd\xfd}A\xd8\xf8\xd8\xd8\x98\x1c\xe0\xc0\xf7\
2\xd3KL\x93l8\xaf\xc8\xca\x07\x07\x07{\xcdf\
\xb3M\xa0\xef\xee\xc6ZZZ:U@\xde\xd4qf\
\xcf0\xddf\xba\xf5\xd4\x06\x0f\x80W\xb2C\xe5\xf0\xf0\
\xf0%^k\xf9\xff\xf1T*\x05\x10m<\x1e/Z\
XX\xd0\x83\xc0C\x06\x1dl`\xab\xf8T\x02\xe3\xdf\
\x02\x9c\x86\xc1\xd0\xd0\xd0@8\x1c&\xac\xfc\xbf\x8e\x8f\
\xda\xc6\xab\x06`\xb9\x04\x99\xa2\xab;\xe0\x83\x00\xa7U\
P\x18QCC\x03\xf8\x0f\x07\x06\x06\xfa\xa3\xd1h6\
bEE\x05\xf5\xf3W__\xfffII\xc9II\
\x92\x84\xdcd2\xd1\xca\xca\xca\x1f\xe3\xe3\xe3\xbf\xb6\xf3\
\xb7\xb8\xb8\x98\xf5\xb1\xdb\xed\xd4\xd6\xd6\xd6\xce\xec\xb7~\
\xbf_\x0e\xe0v\xbb\xa1{\x96\xc9\xdd\xdf\xef\xf3\xa9A\
\x8cF\x139\x1c\x85\x827\x18\x8c\xd9\x02@\xdeS\xa9\
\xa4\xe076\x22\x94LJY\xf0\xf6v\xaf\x97\xd9\x00\
\xd3\x5c \x10\x90/\x99s\xca`\xc69\x9c\xe8\xc2\x85\
\xb6\x8f\xfb\xfa\xbe\xee\xdb\xd9\xd9aP=\xa1J67\
7iii\x89\xd4\xc0\x00*//'\xab\xd5*l\
$)A\x16\x8b\x85\xe0\xcb\xd5x\x13\xe0\xc9d\xf2\xc9\
\x1d`G\x08\xc2)\x08s~\xb5W\xaf^\x1b\x80\x83\
F\xa3\xa5\xfb\xf7\x17\xe9\xce\x9d\x19\x11\xa8\xb8\xb8X\x10\
x\xc8\xa0\x83\x0dl\xe1\x03_`\x00\x0b\x98\xd9>\xe0\
4\xbd\xcd\xcbQUX]\xfd\xfa\x1b\xdb\xdb\xdb\x22\x0d\
\xcb\xcb\x0f\xa9\xa0\xa0 9::\xfa\xdb\xc4D\xf0\x1e\
\xf4uu\xb5'<\x1eO5\xeb\x8c\x06\x83N\xa4\x0f\
>SSS\xb8\x8cO\x95\xeb\xf8\x93\xe9\x17\x11`o\
o\xaf\xc8\xe7\xfb\xe6\x22\xef\xc4\xa1\xa6\x0c\x17\xba\xb2\xf2\
X\xec\xce\xef\xbf118x\xe5;\xf4\x06\xf4\xcc\x9f\
\xe1\x9dK\xf5\xf5n\x0flJKKq\xb2\xe7/_\
\xbe\xf4%\xf4\x9c\xde\x0d\xaf\xf7\xa3\x8el\x8a\xf8hV\
\xde\x85mnn\x9e@\xeb\xeb\xeb\xa2\x14\xe3\xf1\x04\xdf\
M\x1e\x85B!4OP\xe9^P\x102\xe8`\x03\
[\xf8\xa8\xfe\xc0\x02f6E|\x02-\xf2\xaa\xb6}\
:\x9d!\x8c(\x8c\x09\x93\xc9\xcc\xabn\xff\xe0\xcc\x82\
L\xd6E\x85-|\x9e\xf8\xa7\x05f\xee\x09\xb8\xfbw\
\xff\xb2\xdb\x0b\x09\x94\x9foaG=\xaffqYM\
M\xe7_`\xb3*\x0eb\x05\x81\x87\x0c:\xd8\xc8\xb6\
\x16R\xfd\x81\x05\xcc\xec\x09\xf8O\xa4\xb5\xb5\xb5O\xdd\
]ww\xef\xf9#G\xca\x9fs8\x5c\xb4\xb6\xb6J\
\xcd\xcd\xefy8\x1d\x99\x91\x91k'\xa1on~\xbf\
\xf2\xec\xd9w=\xe1\xf0,9\x9d.\x9c\x86\x1e=Z\
\x0awuu\xfe\x90s\xc8H\xb6\x93\xd1\xb1j\xb9\xf2\
\xd7UU\xf5\xdaQ\xaf\xf7\x93\x0f\xf2\xf2\xcc\x14\x89\xac\
\xd3\xd6\xd6\x16\x1d;v\x82\x0a\x0b]\xb2gd\x95K\
\xf4\x1e\xaa\x8beE\x94H\xec\x92\xcf\xf7\xd5\x95\xe9\xe9\
\xdfQ9\xddjC\xa2\xc3E\x80\xb2\xb22Bc\xe8\
\xf5\xfaS\xdc(\xef\xf8\xfd\xc1\xcfP\x1d6\x9bC9\
\xf2\x0e\x9f\xe41\x8e.\x1cy\xaa\xf2\xce\x0f\xf3j\xe1\
\xe6\x8bP,\xb6A%%\x87y\xe4\xd4\xf60\xde\xcf\
\x9c\xff\xbb\xdc\xb8\x5c\xe2\xcbr\x00\xa7\xd3\x89\xf7\xe0\x14\
\xfb\x9e\x0b\x85\xa6;\xd5\xd9b6?C.\x97\x8b/\
:_\x80\xea\xf5\x06\x92\x8b\x22%\x82IR\x9cVW\
W\x99\xdf\xce\xce\xae\x9a\x9a\xaa^f\x7fb\xdc\xbbk\
kk\xf2%\xe3\xd69=M\xd7\xaf\xdf\xec|\xf0\xe0\
!\xcf\x1c\x83 \x80\xf6\xf4t|?;{{>\x16\
\x8b\x0a0\x10x\xc8\xa0\x83\x8dj\x0f_`\x00K\xad\
(q\x02\x9bM\xbc#5\xcc\xd7\x04\x02\xd3\x171s\
0o\xdc\xee\xaa\xcf\xd5\x1bS\xe5\xea,\xfa'\x9d*\
\xe7l\x84X\x1c\x8a\xc5b\xf2\x09\xd0\xb5\x9c\xb7\x10G\
\x9d\xac\xad}\xe5\x8b\xa2\x22'a\xe5\xff?r\xd0\x0e\
\xcc~\x9dNO\xb9\xa4\xbc\x07\x1d\xb09\xe03\x09,\
u\xb4\x8b2M$\x12\xe2\x0f\xdf~\x90/ZS]\
\xfd\xa2\x96\x9dG\xd8pF\x1e\xd5\x06m\x22!\xc5\x0e\
\x1d\xb2\x17\xc8\xf6\xd2\x16^4\xc5o\x86}H\xf1\x01\
xP\x9di\xd9\x14i0\x12\x89,Lh\xa2\x02\xe5\
q\xd7\xa8F\x1c\xe0U\xb6\xb1*6b\xdc\xb0\xdf&\
\xf7\xcfTN\xdd#\xe9;L\x9b\x0a\xc5\xd9&\xa3\x06\
\x00\x98\x11\x8f\x95\xb2\x1ar\x03\xfc\xc7\x0f\xb3\x04\x8f\x80\
\xa4\xd0\x1e\x02\xfc-\xc0\x00\xc9p\x09&<N\x86\x1b\
\x00\x00\x00\x00IEND\xaeB`\x82\
"

qt_resource_name = b"\
\x00\x05\
\x00o\xa6S\
\x00i\
\x00c\x00o\x00n\x00s\
\x00\x09\
\x06\xa6\x82g\
\x00c\
\x00r\x00o\x00s\x00s\x00.\x00p\x00n\x00g\
\x00\x12\
\x02-\x5c\xc7\
\x00v\
\x00e\x00r\x00t\x00i\x00c\x00a\x00l\x00-\x00a\x00l\x00i\x00g\x00n\x00.\x00p\x00n\
\x00g\
\x00\x08\
\x0b\x85Z\xe7\
\x00g\
\x00e\x00a\x00r\x00.\x00p\x00n\x00g\
"

qt_resource_struct = b"\
\x00\x00\x00\x00\x00\x02\x00\x00\x00\x01\x00\x00\x00\x01\
\x00\x00\x00\x00\x00\x00\x00\x00\
\x00\x00\x00\x00\x00\x02\x00\x00\x00\x01\x00\x00\x00\x02\
\x00\x00\x00\x00\x00\x00\x00\x00\
\x00\x00\x00\x00\x00\x02\x00\x00\x00\x03\x00\x00\x00\x03\
\x00\x00\x00\x00\x00\x00\x00\x00\
\x00\x00\x00(\x00\x00\x00\x00\x00\x01\x00\x00\x04=\
\x00\x00\x01\x86\x83\xe4\x1a\xfb\
\x00\x00\x00\x10\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\
\x00\x00\x01y*\x8dIj\
\x00\x00\x00R\x00\x00\x00\x00\x00\x01\x00\x00\x05-\
\x00\x00\x01y*\x8dIj\
"

def qInitResources():
    QtCore.qRegisterResourceData(0x03, qt_resource_struct, qt_resource_name, qt_resource_data)

def qCleanupResources():
    QtCore.qUnregisterResourceData(0x03, qt_resource_struct, qt_resource_name, qt_resource_data)

qInitResources()



================================================
FILE: streamdeck_ui/semaphore.py
================================================
import fcntl
import os


class SemaphoreAcquireError(Exception):
    pass


class Semaphore:
    def __init__(self, semaphore_file):
        self.semaphore_file = semaphore_file
        self.semaphore_fd = None

    def __enter__(self):
        # create the semaphore file if it does not exist
        if not os.path.exists(self.semaphore_file):
            open(self.semaphore_file, "w").close()

        # open the file descriptor for the semaphore file
        self.semaphore_fd = os.open(self.semaphore_file, os.O_CREAT)

        try:
            fcntl.flock(self.semaphore_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            raise SemaphoreAcquireError("Could not acquire semaphore lock")

    def __exit__(self, exc_type, exc_value, traceback):
        # release the semaphore
        fcntl.flock(self.semaphore_fd, fcntl.LOCK_UN)

        # close the file descriptor
        os.close(self.semaphore_fd)

        # reset the file descriptor to None
        self.semaphore_fd = None



================================================
FILE: streamdeck_ui/settings.ui
================================================
<?xml version="1.0" encoding="UTF-8"?>
<ui version="4.0">
 <class>SettingsDialog</class>
 <widget class="QDialog" name="SettingsDialog">
  <property name="windowModality">
   <enum>Qt::ApplicationModal</enum>
  </property>
  <property name="geometry">
   <rect>
    <x>0</x>
    <y>0</y>
    <width>452</width>
    <height>156</height>
   </rect>
  </property>
  <property name="sizePolicy">
   <sizepolicy hsizetype="Expanding" vsizetype="Expanding">
    <horstretch>0</horstretch>
    <verstretch>0</verstretch>
   </sizepolicy>
  </property>
  <property name="windowTitle">
   <string>Stream Deck Settings</string>
  </property>
  <property name="windowIcon">
   <iconset resource="resources.qrc">
    <normaloff>:/icons/icons/gear.png</normaloff>:/icons/icons/gear.png</iconset>
  </property>
  <layout class="QVBoxLayout" name="verticalLayout">
   <property name="leftMargin">
    <number>9</number>
   </property>
   <item>
    <layout class="QVBoxLayout" name="verticalLayout_2">
     <item>
      <layout class="QFormLayout" name="formLayout">
       <property name="horizontalSpacing">
        <number>30</number>
       </property>
       <property name="verticalSpacing">
        <number>6</number>
       </property>
       <item row="0" column="0">
        <widget class="QLabel" name="label">
         <property name="text">
          <string>Stream Deck:</string>
         </property>
        </widget>
       </item>
       <item row="0" column="1">
        <widget class="QLabel" name="label_streamdeck">
         <property name="text">
          <string/>
         </property>
        </widget>
       </item>
       <item row="1" column="0">
        <widget class="QLabel" name="label_brightness">
         <property name="text">
          <string>Brightness:</string>
         </property>
        </widget>
       </item>
       <item row="1" column="1">
        <widget class="QSlider" name="brightness">
         <property name="orientation">
          <enum>Qt::Horizontal</enum>
         </property>
        </widget>
       </item>
       <item row="2" column="0">
        <widget class="QLabel" name="label_dim">
         <property name="text">
          <string>Auto dim after:</string>
         </property>
        </widget>
       </item>
       <item row="2" column="1">
        <widget class="QComboBox" name="dim">
         <property name="currentText">
          <string/>
         </property>
        </widget>
       </item>
       <item row="3" column="0">
        <widget class="QLabel" name="label_brightness_dimmed">
         <property name="text">
          <string>Dim to %:</string>
         </property>
        </widget>
       </item>
       <item row="3" column="1">
        <widget class="QSlider" name="brightness_dimmed">
         <property name="orientation">
          <enum>Qt::Horizontal</enum>
         </property>
        </widget>
       </item>
      </layout>
     </item>
    </layout>
   </item>
   <item>
    <widget class="QDialogButtonBox" name="buttonBox">
     <property name="orientation">
      <enum>Qt::Horizontal</enum>
     </property>
     <property name="standardButtons">
      <set>QDialogButtonBox::Cancel|QDialogButtonBox::Ok</set>
     </property>
     <property name="centerButtons">
      <bool>false</bool>
     </property>
    </widget>
   </item>
  </layout>
 </widget>
 <resources>
  <include location="resources.qrc"/>
 </resources>
 <connections>
  <connection>
   <sender>buttonBox</sender>
   <signal>accepted()</signal>
   <receiver>SettingsDialog</receiver>
   <slot>accept()</slot>
   <hints>
    <hint type="sourcelabel">
     <x>248</x>
     <y>254</y>
    </hint>
    <hint type="destinationlabel">
     <x>157</x>
     <y>274</y>
    </hint>
   </hints>
  </connection>
  <connection>
   <sender>buttonBox</sender>
   <signal>rejected()</signal>
   <receiver>SettingsDialog</receiver>
   <slot>reject()</slot>
   <hints>
    <hint type="sourcelabel">
     <x>316</x>
     <y>260</y>
    </hint>
    <hint type="destinationlabel">
     <x>286</x>
     <y>274</y>
    </hint>
   </hints>
  </connection>
 </connections>
</ui>



================================================
FILE: streamdeck_ui/stream_deck_monitor.py
================================================
from threading import Event, Lock, Thread
from time import sleep
from typing import Callable, Dict, Optional

from StreamDeck import DeviceManager
from StreamDeck.Devices.StreamDeck import StreamDeck
from StreamDeck.Transport.Transport import TransportError


class StreamDeckMonitor:
    """Periodically checks if Stream Decks are attached or
    removed and raises the corresponding events.
    """

    streamdecks: Dict[str, StreamDeck]
    "A dictionary with the key as device id and value as StreamDeck"

    monitor_thread: Optional[Thread]
    "The thread the monitors Stream Decks"

    def __init__(self, lock: Lock, attached: Callable[[str, StreamDeck], None], detached: Callable[[str], None]):
        """Creates a new StreamDeckMonitor instance

        :param lock: A lock object that will be used to get exclusive access while enumerating
        Stream Decks. This lock must be shared by any object that will read or write to the
        Stream Deck.
        :type lock: threading.Lock
        :param attached: A callback function that is called when a new StreamDeck is attached. Note
        this runs on a background thread.
        :type attached: Callable[[StreamDeck], None]
        :param detached: A callback function that is called when a previously attached StreamDeck
        is detached. Note this runs on a background thread. The id of the device is passed as
        the only argument.
        :type detached: Callable[[str], None]
        """
        self.quit = Event()
        self.streamdecks = {}
        self.monitor_thread = None
        self.attached = attached
        self.detached = detached
        self.lock = lock

    def start(self):
        """Starts the monitor thread. If it is already running, nothing
        happens.
        """
        if not self.quit.is_set:
            return

        self.monitor_thread = Thread(target=self._run)
        # Won't prevent application from exiting, although we will always
        # attempt to gracefully shut down thread anyways
        self.monitor_thread.isDaemon = True
        self.quit.clear()
        self.monitor_thread.start()

    def stop(self):
        """Stops the monitor thread. If it is not running, nothing happens.
        Stopping will wait for the run thread to complete before returning.
        """
        if self.quit.is_set():
            return

        self.quit.set()
        try:
            self.monitor_thread.join()
        except RuntimeError:
            pass
        self.pipelmonitor_thread = None

        for streamdeck_id in self.streamdecks:
            self.detached(streamdeck_id)

        self.streamdecks = {}

    def _run(self):
        """Runs the internal monitor thread until completion"""
        showed_open_help: bool = False
        showed_enumeration_help: bool = False
        showed_libusb_help: bool = False
        while not self.quit.is_set():
            with self.lock:
                attached_streamdecks = []
                try:
                    attached_streamdecks = DeviceManager.DeviceManager().enumerate()
                    showed_libusb_help = False
                except DeviceManager.ProbeError:
                    if not showed_libusb_help:
                        print("\n------------------------")
                        print("*** Problem detected ***")
                        print("------------------------")
                        print("A suitable LibUSB installation could not be found.")
                        print("Check installation instructions:")
                        print("https://github.com/timothycrosley/streamdeck-ui")
                        showed_libusb_help = True

                        # No point showing the next help if we can't even enumerate
                        showed_enumeration_help = True
                        continue

                if len(attached_streamdecks) == 0:
                    if not showed_enumeration_help:
                        print("No Stream Deck(s) detected. Attach a Stream Deck.")
                        showed_enumeration_help = True
                else:
                    showed_enumeration_help = False

            # Look for new StreamDecks
            for streamdeck in attached_streamdecks:
                streamdeck_id = streamdeck.id()
                if streamdeck_id not in self.streamdecks:
                    try:
                        self.attached(streamdeck_id, streamdeck)
                        self.streamdecks[streamdeck_id] = streamdeck
                        showed_open_help = False
                    except TransportError:
                        if not showed_open_help:
                            print("\n------------------------")
                            print("*** Problem detected ***")
                            print("------------------------")
                            print("A Stream Deck is attached, but it could not be opened.")
                            print("Check installation instructions and ensure a udev rule has been added and loaded.")
                            print("https://github.com/timothycrosley/streamdeck-ui")
                            showed_open_help = True
                        pass

            # Look for suspended/resumed StreamDecks
            for streamdeck in list(self.streamdecks.values()):
                # Note that streamdeck.connected() will enumerate the devices attached.
                # Enumeration must not be done while other device operations on other
                # threads are running. Protect with the lock.
                # Note that it will only enumerate when is_open() returns false (short circuit),
                # so it won't do it uncessarily anyways.

                # Use a flag so we don't hold the lock while executing callback
                failed_but_attached = False
                with self.lock:
                    if not streamdeck.is_open() and streamdeck.connected():
                        failed_but_attached = True

                # The recovery strategy is to treat this as a detach and let the
                # next enumeration pick up the device and reinitialize.
                if failed_but_attached:
                    del self.streamdecks[streamdeck.id()]
                    self.detached(streamdeck.id())

            # Remove unplugged StreamDecks
            for streamdeck_id in list(self.streamdecks.keys()):
                if streamdeck_id not in [deck.id() for deck in attached_streamdecks]:
                    streamdeck = self.streamdecks[streamdeck_id]
                    del self.streamdecks[streamdeck_id]
                    self.detached(streamdeck_id)
            sleep(1)



================================================
FILE: streamdeck_ui/ui_main.py
================================================
# -*- coding: utf-8 -*-

################################################################################
## Form generated from reading UI file 'main.ui'
##
## Created by: Qt User Interface Compiler version 6.4.2
##
## WARNING! All changes made in this file will be lost when recompiling UI file!
################################################################################

from PySide6.QtCore import (QCoreApplication, QDate, QDateTime, QLocale,
    QMetaObject, QObject, QPoint, QRect,
    QSize, QTime, QUrl, Qt)
from PySide6.QtGui import (QAction, QBrush, QColor, QConicalGradient,
    QCursor, QFont, QFontDatabase, QGradient,
    QIcon, QImage, QKeySequence, QLinearGradient,
    QPainter, QPalette, QPixmap, QRadialGradient,
    QTransform)
from PySide6.QtWidgets import (QApplication, QComboBox, QFormLayout, QGridLayout,
    QGroupBox, QHBoxLayout, QLabel, QLayout,
    QLineEdit, QMainWindow, QMenu, QMenuBar,
    QPlainTextEdit, QProgressBar, QPushButton, QSizePolicy,
    QSpinBox, QStatusBar, QTabWidget, QVBoxLayout,
    QWidget)
from  . import resources_rc

class Ui_MainWindow(object):
    def setupUi(self, MainWindow):
        if not MainWindow.objectName():
            MainWindow.setObjectName(u"MainWindow")
        MainWindow.resize(940, 490)
        self.actionImport = QAction(MainWindow)
        self.actionImport.setObjectName(u"actionImport")
        self.actionExport = QAction(MainWindow)
        self.actionExport.setObjectName(u"actionExport")
        self.actionExit = QAction(MainWindow)
        self.actionExit.setObjectName(u"actionExit")
        self.actionDocs = QAction(MainWindow)
        self.actionDocs.setObjectName(u"actionDocs")
        self.actionGithub = QAction(MainWindow)
        self.actionGithub.setObjectName(u"actionGithub")
        self.actionAbout = QAction(MainWindow)
        self.actionAbout.setObjectName(u"actionAbout")
        self.centralwidget = QWidget(MainWindow)
        self.centralwidget.setObjectName(u"centralwidget")
        self.centralwidget.setAutoFillBackground(False)
        self.verticalLayout_2 = QVBoxLayout(self.centralwidget)
        self.verticalLayout_2.setSpacing(6)
        self.verticalLayout_2.setObjectName(u"verticalLayout_2")
        self.verticalLayout_2.setContentsMargins(9, -1, -1, 3)
        self.main_horizontalLayout = QHBoxLayout()
        self.main_horizontalLayout.setSpacing(12)
        self.main_horizontalLayout.setObjectName(u"main_horizontalLayout")
        self.main_horizontalLayout.setContentsMargins(0, 0, 0, 0)
        self.left_verticalLayout = QVBoxLayout()
        self.left_verticalLayout.setSpacing(6)
        self.left_verticalLayout.setObjectName(u"left_verticalLayout")
        self.left_verticalLayout.setSizeConstraint(QLayout.SetDefaultConstraint)
        self.left_verticalLayout.setContentsMargins(-1, 0, -1, -1)
        self.deviceSettings_horizontalLayout = QHBoxLayout()
        self.deviceSettings_horizontalLayout.setObjectName(u"deviceSettings_horizontalLayout")
        self.deviceSettings_horizontalLayout.setContentsMargins(0, 0, 0, 0)
        self.device_list = QComboBox(self.centralwidget)
        self.device_list.setObjectName(u"device_list")
        self.device_list.setMinimumSize(QSize(400, 0))

        self.deviceSettings_horizontalLayout.addWidget(self.device_list)

        self.settingsButton = QPushButton(self.centralwidget)
        self.settingsButton.setObjectName(u"settingsButton")
        sizePolicy = QSizePolicy(QSizePolicy.Minimum, QSizePolicy.Expanding)
        sizePolicy.setHorizontalStretch(0)
        sizePolicy.setVerticalStretch(0)
        sizePolicy.setHeightForWidth(self.settingsButton.sizePolicy().hasHeightForWidth())
        self.settingsButton.setSizePolicy(sizePolicy)
        self.settingsButton.setMinimumSize(QSize(0, 0))
        self.settingsButton.setMaximumSize(QSize(30, 16777215))
        icon = QIcon()
        icon.addFile(u":/icons/icons/gear.png", QSize(), QIcon.Normal, QIcon.Off)
        self.settingsButton.setIcon(icon)

        self.deviceSettings_horizontalLayout.addWidget(self.settingsButton)

        self.cpu_usage = QProgressBar(self.centralwidget)
        self.cpu_usage.setObjectName(u"cpu_usage")
        sizePolicy1 = QSizePolicy(QSizePolicy.Fixed, QSizePolicy.Expanding)
        sizePolicy1.setHorizontalStretch(0)
        sizePolicy1.setVerticalStretch(0)
        sizePolicy1.setHeightForWidth(self.cpu_usage.sizePolicy().hasHeightForWidth())
        self.cpu_usage.setSizePolicy(sizePolicy1)
        self.cpu_usage.setMaximumSize(QSize(25, 25))
        self.cpu_usage.setMaximum(130)
        self.cpu_usage.setValue(0)
        self.cpu_usage.setOrientation(Qt.Vertical)

        self.deviceSettings_horizontalLayout.addWidget(self.cpu_usage)


        self.left_verticalLayout.addLayout(self.deviceSettings_horizontalLayout)

        self.pages = QTabWidget(self.centralwidget)
        self.pages.setObjectName(u"pages")
        sizePolicy2 = QSizePolicy(QSizePolicy.Preferred, QSizePolicy.Preferred)
        sizePolicy2.setHorizontalStretch(0)
        sizePolicy2.setVerticalStretch(0)
        sizePolicy2.setHeightForWidth(self.pages.sizePolicy().hasHeightForWidth())
        self.pages.setSizePolicy(sizePolicy2)
        self.pages.setAutoFillBackground(False)
        self.pages.setStyleSheet(u"b")
        self.page_1 = QWidget()
        self.page_1.setObjectName(u"page_1")
        self.gridLayout_2 = QGridLayout(self.page_1)
        self.gridLayout_2.setObjectName(u"gridLayout_2")
        self.pages.addTab(self.page_1, "")
        self.page_2 = QWidget()
        self.page_2.setObjectName(u"page_2")
        self.gridLayout_3 = QGridLayout(self.page_2)
        self.gridLayout_3.setObjectName(u"gridLayout_3")
        self.pages.addTab(self.page_2, "")
        self.page_3 = QWidget()
        self.page_3.setObjectName(u"page_3")
        self.gridLayout_11 = QGridLayout(self.page_3)
        self.gridLayout_11.setObjectName(u"gridLayout_11")
        self.pages.addTab(self.page_3, "")
        self.page_4 = QWidget()
        self.page_4.setObjectName(u"page_4")
        self.gridLayout_10 = QGridLayout(self.page_4)
        self.gridLayout_10.setObjectName(u"gridLayout_10")
        self.pages.addTab(self.page_4, "")
        self.page_5 = QWidget()
        self.page_5.setObjectName(u"page_5")
        self.gridLayout_9 = QGridLayout(self.page_5)
        self.gridLayout_9.setObjectName(u"gridLayout_9")
        self.pages.addTab(self.page_5, "")
        self.page_6 = QWidget()
        self.page_6.setObjectName(u"page_6")
        self.gridLayout_8 = QGridLayout(self.page_6)
        self.gridLayout_8.setObjectName(u"gridLayout_8")
        self.pages.addTab(self.page_6, "")
        self.page_7 = QWidget()
        self.page_7.setObjectName(u"page_7")
        self.gridLayout_7 = QGridLayout(self.page_7)
        self.gridLayout_7.setObjectName(u"gridLayout_7")
        self.pages.addTab(self.page_7, "")
        self.page_8 = QWidget()
        self.page_8.setObjectName(u"page_8")
        self.gridLayout_6 = QGridLayout(self.page_8)
        self.gridLayout_6.setObjectName(u"gridLayout_6")
        self.pages.addTab(self.page_8, "")
        self.page_9 = QWidget()
        self.page_9.setObjectName(u"page_9")
        self.gridLayout_5 = QGridLayout(self.page_9)
        self.gridLayout_5.setObjectName(u"gridLayout_5")
        self.pages.addTab(self.page_9, "")
        self.tab_10 = QWidget()
        self.tab_10.setObjectName(u"tab_10")
        self.gridLayout_4 = QGridLayout(self.tab_10)
        self.gridLayout_4.setObjectName(u"gridLayout_4")
        self.pages.addTab(self.tab_10, "")

        self.left_verticalLayout.addWidget(self.pages)

        self.left_verticalLayout.setStretch(1, 1)

        self.main_horizontalLayout.addLayout(self.left_verticalLayout)

        self.right_horizontalLayout = QHBoxLayout()
        self.right_horizontalLayout.setObjectName(u"right_horizontalLayout")
        self.groupBox = QGroupBox(self.centralwidget)
        self.groupBox.setObjectName(u"groupBox")
        self.groupBox.setMinimumSize(QSize(250, 0))
        self.verticalLayout_3 = QVBoxLayout(self.groupBox)
        self.verticalLayout_3.setObjectName(u"verticalLayout_3")
        self.formLayout = QFormLayout()
        self.formLayout.setObjectName(u"formLayout")
        self.label = QLabel(self.groupBox)
        self.label.setObjectName(u"label")

        self.formLayout.setWidget(0, QFormLayout.LabelRole, self.label)

        self.horizontalLayout_2 = QHBoxLayout()
        self.horizontalLayout_2.setSpacing(6)
        self.horizontalLayout_2.setObjectName(u"horizontalLayout_2")
        self.imageButton = QPushButton(self.groupBox)
        self.imageButton.setObjectName(u"imageButton")

        self.horizontalLayout_2.addWidget(self.imageButton)

        self.removeButton = QPushButton(self.groupBox)
        self.removeButton.setObjectName(u"removeButton")
        sizePolicy3 = QSizePolicy(QSizePolicy.Minimum, QSizePolicy.Minimum)
        sizePolicy3.setHorizontalStretch(0)
        sizePolicy3.setVerticalStretch(0)
        sizePolicy3.setHeightForWidth(self.removeButton.sizePolicy().hasHeightForWidth())
        self.removeButton.setSizePolicy(sizePolicy3)
        self.removeButton.setMaximumSize(QSize(30, 16777215))
        icon1 = QIcon()
        icon1.addFile(u":/icons/icons/cross.png", QSize(), QIcon.Normal, QIcon.Off)
        self.removeButton.setIcon(icon1)

        self.horizontalLayout_2.addWidget(self.removeButton)


        self.formLayout.setLayout(0, QFormLayout.FieldRole, self.horizontalLayout_2)

        self.label_2 = QLabel(self.groupBox)
        self.label_2.setObjectName(u"label_2")

        self.formLayout.setWidget(1, QFormLayout.LabelRole, self.label_2)

        self.label_3 = QLabel(self.groupBox)
        self.label_3.setObjectName(u"label_3")

        self.formLayout.setWidget(2, QFormLayout.LabelRole, self.label_3)

        self.command = QLineEdit(self.groupBox)
        self.command.setObjectName(u"command")

        self.formLayout.setWidget(2, QFormLayout.FieldRole, self.command)

        self.label_5 = QLabel(self.groupBox)
        self.label_5.setObjectName(u"label_5")

        self.formLayout.setWidget(3, QFormLayout.LabelRole, self.label_5)

        self.keys = QComboBox(self.groupBox)
        self.keys.addItem(u"")
        self.keys.addItem(u"F11")
        self.keys.addItem(u"alt+F4")
        self.keys.addItem(u"ctrl+w")
        self.keys.addItem(u"cmd+left")
        self.keys.addItem(u"alt+plus")
        self.keys.addItem(u"alt+delay+F3")
        self.keys.addItem(u"backspace")
        self.keys.addItem(u"right")
        self.keys.addItem(u"page_up")
        self.keys.addItem(u"media_volume_up")
        self.keys.addItem(u"media_volume_down")
        self.keys.addItem(u"media_volume_mute")
        self.keys.addItem(u"media_previous")
        self.keys.addItem(u"media_next")
        self.keys.addItem(u"media_play_pause")
        self.keys.setObjectName(u"keys")
        self.keys.setEditable(True)

        self.formLayout.setWidget(3, QFormLayout.FieldRole, self.keys)

        self.label_8 = QLabel(self.groupBox)
        self.label_8.setObjectName(u"label_8")

        self.formLayout.setWidget(4, QFormLayout.LabelRole, self.label_8)

        self.switch_page = QSpinBox(self.groupBox)
        self.switch_page.setObjectName(u"switch_page")
        self.switch_page.setMinimum(0)
        self.switch_page.setMaximum(10)
        self.switch_page.setValue(0)

        self.formLayout.setWidget(4, QFormLayout.FieldRole, self.switch_page)

        self.label_7 = QLabel(self.groupBox)
        self.label_7.setObjectName(u"label_7")

        self.formLayout.setWidget(5, QFormLayout.LabelRole, self.label_7)

        self.change_brightness = QSpinBox(self.groupBox)
        self.change_brightness.setObjectName(u"change_brightness")
        self.change_brightness.setMinimum(-99)

        self.formLayout.setWidget(5, QFormLayout.FieldRole, self.change_brightness)

        self.label_6 = QLabel(self.groupBox)
        self.label_6.setObjectName(u"label_6")

        self.formLayout.setWidget(6, QFormLayout.LabelRole, self.label_6)

        self.write = QPlainTextEdit(self.groupBox)
        self.write.setObjectName(u"write")

        self.formLayout.setWidget(6, QFormLayout.FieldRole, self.write)

        self.horizontalLayout_3 = QHBoxLayout()
        self.horizontalLayout_3.setObjectName(u"horizontalLayout_3")
        self.text = QLineEdit(self.groupBox)
        self.text.setObjectName(u"text")

        self.horizontalLayout_3.addWidget(self.text)

        self.textButton = QPushButton(self.groupBox)
        self.textButton.setObjectName(u"textButton")
        self.textButton.setMinimumSize(QSize(30, 0))
        self.textButton.setMaximumSize(QSize(30, 16777215))
        icon2 = QIcon()
        icon2.addFile(u":/icons/icons/vertical-align.png", QSize(), QIcon.Normal, QIcon.Off)
        self.textButton.setIcon(icon2)

        self.horizontalLayout_3.addWidget(self.textButton)


        self.formLayout.setLayout(1, QFormLayout.FieldRole, self.horizontalLayout_3)


        self.verticalLayout_3.addLayout(self.formLayout)


        self.right_horizontalLayout.addWidget(self.groupBox)


        self.main_horizontalLayout.addLayout(self.right_horizontalLayout)


        self.verticalLayout_2.addLayout(self.main_horizontalLayout)

        MainWindow.setCentralWidget(self.centralwidget)
        self.menubar = QMenuBar(MainWindow)
        self.menubar.setObjectName(u"menubar")
        self.menubar.setGeometry(QRect(0, 0, 940, 22))
        self.menuFile = QMenu(self.menubar)
        self.menuFile.setObjectName(u"menuFile")
        self.menuHelp = QMenu(self.menubar)
        self.menuHelp.setObjectName(u"menuHelp")
        MainWindow.setMenuBar(self.menubar)
        self.statusbar = QStatusBar(MainWindow)
        self.statusbar.setObjectName(u"statusbar")
        MainWindow.setStatusBar(self.statusbar)
        QWidget.setTabOrder(self.device_list, self.settingsButton)
        QWidget.setTabOrder(self.settingsButton, self.pages)
        QWidget.setTabOrder(self.pages, self.imageButton)
        QWidget.setTabOrder(self.imageButton, self.removeButton)
        QWidget.setTabOrder(self.removeButton, self.text)
        QWidget.setTabOrder(self.text, self.textButton)
        QWidget.setTabOrder(self.textButton, self.command)
        QWidget.setTabOrder(self.command, self.keys)
        QWidget.setTabOrder(self.keys, self.switch_page)
        QWidget.setTabOrder(self.switch_page, self.change_brightness)
        QWidget.setTabOrder(self.change_brightness, self.write)

        self.menubar.addAction(self.menuFile.menuAction())
        self.menubar.addAction(self.menuHelp.menuAction())
        self.menuFile.addAction(self.actionImport)
        self.menuFile.addAction(self.actionExport)
        self.menuFile.addSeparator()
        self.menuFile.addAction(self.actionExit)
        self.menuHelp.addAction(self.actionDocs)
        self.menuHelp.addAction(self.actionGithub)
        self.menuHelp.addSeparator()
        self.menuHelp.addAction(self.actionAbout)

        self.retranslateUi(MainWindow)

        self.pages.setCurrentIndex(0)


        QMetaObject.connectSlotsByName(MainWindow)
    # setupUi

    def retranslateUi(self, MainWindow):
        MainWindow.setWindowTitle(QCoreApplication.translate("MainWindow", u"Stream Deck UI", None))
        self.actionImport.setText(QCoreApplication.translate("MainWindow", u"Import", None))
        self.actionExport.setText(QCoreApplication.translate("MainWindow", u"Export", None))
        self.actionExit.setText(QCoreApplication.translate("MainWindow", u"Exit", None))
        self.actionDocs.setText(QCoreApplication.translate("MainWindow", u"Documentation", None))
        self.actionGithub.setText(QCoreApplication.translate("MainWindow", u"Github", None))
        self.actionAbout.setText(QCoreApplication.translate("MainWindow", u"About...", None))
        self.settingsButton.setText("")
        self.cpu_usage.setFormat("")
        self.pages.setTabText(self.pages.indexOf(self.page_1), QCoreApplication.translate("MainWindow", u"Page 1", None))
        self.pages.setTabText(self.pages.indexOf(self.page_2), QCoreApplication.translate("MainWindow", u"2", None))
        self.pages.setTabText(self.pages.indexOf(self.page_3), QCoreApplication.translate("MainWindow", u"3", None))
        self.pages.setTabText(self.pages.indexOf(self.page_4), QCoreApplication.translate("MainWindow", u"4", None))
        self.pages.setTabText(self.pages.indexOf(self.page_5), QCoreApplication.translate("MainWindow", u"5", None))
        self.pages.setTabText(self.pages.indexOf(self.page_6), QCoreApplication.translate("MainWindow", u"6", None))
        self.pages.setTabText(self.pages.indexOf(self.page_7), QCoreApplication.translate("MainWindow", u"7", None))
        self.pages.setTabText(self.pages.indexOf(self.page_8), QCoreApplication.translate("MainWindow", u"8", None))
        self.pages.setTabText(self.pages.indexOf(self.page_9), QCoreApplication.translate("MainWindow", u"9", None))
        self.pages.setTabText(self.pages.indexOf(self.tab_10), QCoreApplication.translate("MainWindow", u"10", None))
        self.groupBox.setTitle(QCoreApplication.translate("MainWindow", u"Configure Button", None))
        self.label.setText(QCoreApplication.translate("MainWindow", u"Image:", None))
        self.imageButton.setText(QCoreApplication.translate("MainWindow", u"Image...", None))
#if QT_CONFIG(tooltip)
        self.removeButton.setToolTip(QCoreApplication.translate("MainWindow", u"Remove the image from the button", None))
#endif // QT_CONFIG(tooltip)
        self.removeButton.setText("")
        self.label_2.setText(QCoreApplication.translate("MainWindow", u"Label:", None))
        self.label_3.setText(QCoreApplication.translate("MainWindow", u"Command:", None))
        self.label_5.setText(QCoreApplication.translate("MainWindow", u"Press Keys:", None))

        self.label_8.setText(QCoreApplication.translate("MainWindow", u"Switch Page:", None))
        self.label_7.setText(QCoreApplication.translate("MainWindow", u"Brightness +/-:", None))
        self.label_6.setText(QCoreApplication.translate("MainWindow", u"Write Text:", None))
#if QT_CONFIG(tooltip)
        self.textButton.setToolTip(QCoreApplication.translate("MainWindow", u"Text vertical alignment", None))
#endif // QT_CONFIG(tooltip)
        self.textButton.setText("")
        self.menuFile.setTitle(QCoreApplication.translate("MainWindow", u"File", None))
        self.menuHelp.setTitle(QCoreApplication.translate("MainWindow", u"Help", None))
    # retranslateUi




================================================
FILE: streamdeck_ui/ui_settings.py
================================================
# -*- coding: utf-8 -*-

################################################################################
## Form generated from reading UI file 'settings.ui'
##
## Created by: Qt User Interface Compiler version 6.4.2
##
## WARNING! All changes made in this file will be lost when recompiling UI file!
################################################################################

from PySide6.QtCore import (QCoreApplication, QDate, QDateTime, QLocale,
    QMetaObject, QObject, QPoint, QRect,
    QSize, QTime, QUrl, Qt)
from PySide6.QtGui import (QBrush, QColor, QConicalGradient, QCursor,
    QFont, QFontDatabase, QGradient, QIcon,
    QImage, QKeySequence, QLinearGradient, QPainter,
    QPalette, QPixmap, QRadialGradient, QTransform)
from PySide6.QtWidgets import (QAbstractButton, QApplication, QComboBox, QDialog,
    QDialogButtonBox, QFormLayout, QLabel, QSizePolicy,
    QSlider, QVBoxLayout, QWidget)
from  . import resources_rc

class Ui_SettingsDialog(object):
    def setupUi(self, SettingsDialog):
        if not SettingsDialog.objectName():
            SettingsDialog.setObjectName(u"SettingsDialog")
        SettingsDialog.setWindowModality(Qt.ApplicationModal)
        SettingsDialog.resize(452, 156)
        sizePolicy = QSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        sizePolicy.setHorizontalStretch(0)
        sizePolicy.setVerticalStretch(0)
        sizePolicy.setHeightForWidth(SettingsDialog.sizePolicy().hasHeightForWidth())
        SettingsDialog.setSizePolicy(sizePolicy)
        icon = QIcon()
        icon.addFile(u":/icons/icons/gear.png", QSize(), QIcon.Normal, QIcon.Off)
        SettingsDialog.setWindowIcon(icon)
        self.verticalLayout = QVBoxLayout(SettingsDialog)
        self.verticalLayout.setObjectName(u"verticalLayout")
        self.verticalLayout.setContentsMargins(9, -1, -1, -1)
        self.verticalLayout_2 = QVBoxLayout()
        self.verticalLayout_2.setObjectName(u"verticalLayout_2")
        self.formLayout = QFormLayout()
        self.formLayout.setObjectName(u"formLayout")
        self.formLayout.setHorizontalSpacing(30)
        self.formLayout.setVerticalSpacing(6)
        self.label = QLabel(SettingsDialog)
        self.label.setObjectName(u"label")

        self.formLayout.setWidget(0, QFormLayout.LabelRole, self.label)

        self.label_streamdeck = QLabel(SettingsDialog)
        self.label_streamdeck.setObjectName(u"label_streamdeck")

        self.formLayout.setWidget(0, QFormLayout.FieldRole, self.label_streamdeck)

        self.label_brightness = QLabel(SettingsDialog)
        self.label_brightness.setObjectName(u"label_brightness")

        self.formLayout.setWidget(1, QFormLayout.LabelRole, self.label_brightness)

        self.brightness = QSlider(SettingsDialog)
        self.brightness.setObjectName(u"brightness")
        self.brightness.setOrientation(Qt.Horizontal)

        self.formLayout.setWidget(1, QFormLayout.FieldRole, self.brightness)

        self.label_dim = QLabel(SettingsDialog)
        self.label_dim.setObjectName(u"label_dim")

        self.formLayout.setWidget(2, QFormLayout.LabelRole, self.label_dim)

        self.dim = QComboBox(SettingsDialog)
        self.dim.setObjectName(u"dim")

        self.formLayout.setWidget(2, QFormLayout.FieldRole, self.dim)

        self.label_brightness_dimmed = QLabel(SettingsDialog)
        self.label_brightness_dimmed.setObjectName(u"label_brightness_dimmed")

        self.formLayout.setWidget(3, QFormLayout.LabelRole, self.label_brightness_dimmed)

        self.brightness_dimmed = QSlider(SettingsDialog)
        self.brightness_dimmed.setObjectName(u"brightness_dimmed")
        self.brightness_dimmed.setOrientation(Qt.Horizontal)

        self.formLayout.setWidget(3, QFormLayout.FieldRole, self.brightness_dimmed)


        self.verticalLayout_2.addLayout(self.formLayout)


        self.verticalLayout.addLayout(self.verticalLayout_2)

        self.buttonBox = QDialogButtonBox(SettingsDialog)
        self.buttonBox.setObjectName(u"buttonBox")
        self.buttonBox.setOrientation(Qt.Horizontal)
        self.buttonBox.setStandardButtons(QDialogButtonBox.Cancel|QDialogButtonBox.Ok)
        self.buttonBox.setCenterButtons(False)

        self.verticalLayout.addWidget(self.buttonBox)


        self.retranslateUi(SettingsDialog)
        self.buttonBox.accepted.connect(SettingsDialog.accept)
        self.buttonBox.rejected.connect(SettingsDialog.reject)

        QMetaObject.connectSlotsByName(SettingsDialog)
    # setupUi

    def retranslateUi(self, SettingsDialog):
        SettingsDialog.setWindowTitle(QCoreApplication.translate("SettingsDialog", u"Stream Deck Settings", None))
        self.label.setText(QCoreApplication.translate("SettingsDialog", u"Stream Deck:", None))
        self.label_streamdeck.setText("")
        self.label_brightness.setText(QCoreApplication.translate("SettingsDialog", u"Brightness:", None))
        self.label_dim.setText(QCoreApplication.translate("SettingsDialog", u"Auto dim after:", None))
        self.dim.setCurrentText("")
        self.label_brightness_dimmed.setText(QCoreApplication.translate("SettingsDialog", u"Dim to %:", None))
    # retranslateUi




================================================
FILE: streamdeck_ui/display/__init__.py
================================================
[Empty file]


================================================
FILE: streamdeck_ui/display/display_grid.py
================================================
import threading
from time import sleep, time
from typing import Callable, Dict, List, Optional

from PIL import Image
from StreamDeck.Devices.StreamDeck import StreamDeck
from StreamDeck.Devices.StreamDeckOriginal import StreamDeckOriginal
from StreamDeck.ImageHelpers import PILHelper
from StreamDeck.Transport.Transport import TransportError

from streamdeck_ui.display.empty_filter import EmptyFilter
from streamdeck_ui.display.filter import Filter
from streamdeck_ui.display.keypress_filter import KeypressFilter
from streamdeck_ui.display.pipeline import Pipeline


class DisplayGrid:
    """
    A DisplayGrid is made up of a collection of pipelines, each processing
    filters for one individual button display.
    """

    _empty_filter: EmptyFilter = EmptyFilter()
    "Static instance of EmptyFilter shared by all pipelines"

    def __init__(self, lock: threading.Lock, streamdeck: StreamDeck, pages: int, cpu_callback: Callable[[str, int], None], fps: int = 25):
        """Creates a new display instance

        :param lock: A lock object that will be used to get exclusive access while enumerating
        Stream Decks. This lock must be shared by any object that will read or write to the
        Stream Deck.
        :type lock: threading.Lock
        :param streamdeck: The StreamDeck instance associated with this display
        :type streamdeck: StreamDeck
        :param pages: The number of logical pages (screen sets)
        :type pages: int
        :param cpu_callback: A function to call whenever the CPU changes
        :type cpu_callback: Callable[[str, int], None]
        :param fps: The desired FPS, defaults to 25
        :type fps: int, optional
        """
        self.streamdeck = streamdeck
        # Reference to the actual device, used to update icons

        if streamdeck.is_visual():
            self.size = streamdeck.key_image_format()["size"]
        else:
            self.size = (StreamDeckOriginal.KEY_PIXEL_WIDTH, StreamDeckOriginal.KEY_PIXEL_HEIGHT)
            # Default to original stream deck size - even though we're not actually going to display anything
        self.serial_number = streamdeck.get_serial_number()

        self.pages: Dict[int, Dict[int, Pipeline]] = {}
        # A dictionary of lists of pipelines. Each page has
        # a list, corresponding to each button.

        # Initialize with a pipeline per key for all pages
        for page in range(pages):
            self.pages[page] = {}
            for button in range(self.streamdeck.key_count()):
                self.pages[page][button] = Pipeline()

        self.current_page: int = -1
        self.pipeline_thread: Optional[threading.Thread] = None
        self.quit = threading.Event()
        self.fps = fps
        # Configure the maximum frame rate we want to achieve
        self.time_per_frame = 1 / fps
        self.lock = lock
        self.sync = threading.Event()
        self.cpu_callback = cpu_callback
        # The sync event allows a caller to wait until all the buttons have been processed
        DisplayGrid._empty_filter.initialize(self.size)

    def replace(self, page: int, button: int, filters: List[Filter]):
        with self.lock:
            pipeline = Pipeline()
            pipeline.add(DisplayGrid._empty_filter)
            for filter in filters:
                filter.initialize(self.size)
                pipeline.add(filter)
            keypress = KeypressFilter()
            keypress.initialize(self.size)
            pipeline.add(keypress)
            self.pages[page][button] = pipeline

    def get_image(self, page: int, button: int) -> Image.Image:
        with self.lock:
            # REVIEW: Consider returning not the last result, but a thumbnail
            # or something that represents the current "static" look of
            # a button. This will need to be added to the interface
            # of a filter.
            return self.pages[page][button].last_result()

    def set_keypress(self, button: int, active: bool):
        with self.lock:
            for filter in self.pages[self.current_page][button].filters:
                if isinstance(filter[0], KeypressFilter):
                    filter[0].active = active

    def synchronize(self):
        # Wait until the next cycle is complete.
        # To *guarantee* that you have one complete pass, two waits are needed.
        # The first gets you to the end of one cycle (you could have called it
        # mid cycle). The second gets you one pass through. Worst case, you
        # do two full cycles. Best case, you do 1 full and one partial.
        self.sync.wait()
        self.sync.wait()

    def _run(self):
        """Method that runs on background thread and updates the pipelines."""
        frames = 0
        start = time()
        last_page = -1
        execution_time = 0
        frame_cache = {}

        while not self.quit.isSet():
            current_time = time()

            with self.lock:
                page = self.pages[self.current_page]

            force_update = False

            if last_page != page:
                # When a page switch happen, force the pipelines to redraw so icons update
                force_update = True
                last_page = page

            pipeline_cache_count = 0

            for button, pipeline in page.items():
                # Process all the steps in the pipeline and return the resulting image
                with self.lock:
                    image, hashcode = pipeline.execute(current_time)

                pipeline_cache_count += len(pipeline.output_cache)

                # If none of the filters in the pipeline yielded a change, use
                # the last known result
                if force_update and image is None:
                    image = pipeline.last_result()

                if image:
                    # We cannot afford to do this conversion on every final frame.
                    # Since we want the flexibilty of a pipeline engine that can mutate the
                    # images along a chain of filters, the outcome can be somewhat unpredicatable
                    # For example - a clock that changes time or an animation that changes
                    # the frame and font that overlays. In many instances there is a finite
                    # number of frames per pipeline (a looping GIF with image, a pulsing icon etc)
                    # Some may also be virtually have infinite mutations. A cache per pipeline
                    # with an eviction policy of the oldest would likely suffice.
                    # The main problem is since the pipeline can mutate it's too expensive to
                    # calculate the actual hash of the final frame.
                    # Create a hash function that the filter itself defines. It has to
                    # update the hashcode with the unique attributes of the input it requires
                    # to make the frame. This could be time, text, frame number etc.
                    # The hash can then be passed to the next step and XOR'd or combined
                    # with the next hash. This yields a final hash code that can then be
                    # used to cache the output. At the end of the pipeline the hash can
                    # be checked and final bytes will be ready to pipe to the device.

                    if self.streamdeck.is_visual():
                        # FIXME: This will be unbounded, old frames will need to be evicted
                        if hashcode not in frame_cache:
                            image = PILHelper.to_native_format(self.streamdeck, image)
                            frame_cache[hashcode] = image
                        else:
                            image = frame_cache[hashcode]

                        try:
                            with self.lock:
                                self.streamdeck.set_key_image(button, image)
                        except TransportError:
                            # Review - deadlock if you wait on yourself?
                            self.stop()
                            pass
                            return

            self.sync.set()
            self.sync.clear()
            # Calculate how long we took to process the pipeline
            elapsed_time = time() - current_time
            execution_time += elapsed_time

            # Calculate how much we have to sleep between processing cycles to maintain the desired FPS
            # If we have less than 5ms left, don't bother sleeping, as the context switch and
            # overhead of sleeping/waking up is consumed
            time_left = self.time_per_frame - elapsed_time
            if time_left > 0.005:
                sleep(time_left)

            frames += 1
            if time() - start > 1.0:
                execution_time_ms = int(execution_time * 1000)
                if self.cpu_callback:
                    self.cpu_callback(self.serial_number, int(execution_time_ms / 1000 * 100))
                # execution_time_ms = int(execution_time * 1000)
                # print(f"FPS: {frames} Execution time: {execution_time_ms} ms Execution %: {int(execution_time_ms/1000 * 100)}")
                # print(f"Output cache size: {len(frame_cache)}")
                # print(f"Pipeline cache size: {pipeline_cache_count}")
                execution_time = 0
                frames = 0
                start = time()

    def set_page(self, page: int):
        """Switches to the given page. Pipelines for that page starts running,
        other page pipelines stop.

        Args:
            page (int): The page number to switch to.
        """
        with self.lock:
            if self.current_page >= 0:
                # Ensure none of the button filters are active anymore
                old_page = self.pages[self.current_page]
                for _, pipeline in old_page.items():
                    for filter in pipeline.filters:
                        if isinstance(filter[0], KeypressFilter):
                            filter[0].active = False
            # REVIEW: We could detect the active key on the last page, and make it active
            # on the target page
            self.current_page = page

    def start(self):
        if self.pipeline_thread is not None:
            self.quit.set()
            try:
                self.pipeline_thread.join()
            except RuntimeError:
                pass

        self.quit.clear()
        self.pipeline_thread = threading.Thread(target=self._run)
        self.pipeline_thread.daemon = True
        self.pipeline_thread.start()
        self.synchronize()
        # Wait for first frames to become ready

    def stop(self):
        if self.pipeline_thread is not None:
            self.quit.set()
            try:
                self.pipeline_thread.join()
            except RuntimeError:
                pass
            self.pipeline_thread = None



================================================
FILE: streamdeck_ui/display/empty_filter.py
================================================
from fractions import Fraction
from typing import Callable, Tuple

from PIL import Image

from streamdeck_ui.display import filter


class EmptyFilter(filter.Filter):
    """
    This is the empty (base) filter where all pipelines start from.

    :param str name: The name of the filter. The name is useful for debugging purposes.
    """

    def __init__(self):
        super(EmptyFilter, self).__init__()

        # For EmptyFilter - create a unique hashcode based on the name of the type
        # This will create "some value" that uniquely identifies this filter output
        # Since it never changes, this works.
        # Calculate it once for speed
        self.hashcode = hash(self.__class__)

    def initialize(self, size: Tuple[int, int]):
        self.image = Image.new("RGB", size)

    def transform(self, get_input: Callable[[], Image.Image], get_output: Callable[[int], Image.Image], input_changed: bool, time: Fraction) -> Tuple[Image.Image, int]:
        """
        Returns an empty Image object.

        :param Fraction time: The current time in seconds, expressed as a fractional number since
        the start of the pipeline.
        """
        if not input_changed:
            return (None, self.hashcode)
        return ((self.image), self.hashcode)



================================================
FILE: streamdeck_ui/display/filter.py
================================================
from abc import ABC, abstractmethod
from fractions import Fraction
from typing import Callable, Tuple

from PIL import Image


class Filter(ABC):
    """
    A filter transforms a given input image to the desired output image. A filter can signal that it
    is complete and will be removed from the pipeline.

    :param str name: The name of the filter. The name is useful for debugging purposes.
    """

    size: Tuple[int, int]
    "The image size (width, height) in pixels that this filter transforms."

    is_complete: bool
    "Indicates if the filter is complete and should no longer be processed."

    def __init__(self):
        self.is_complete = False

    @abstractmethod
    def initialize(self, size: Tuple[int, int]):
        """Initializes the filter with the provided frame size. Since the construction
        of the filter can happen before the size of the display is known, initialization
        should be done here.

        :param size: The filter image size
        :type size: Tuple[int, int]
        """
        pass

    @abstractmethod
    def transform(self, get_input: Callable[[], Image.Image], get_output: Callable[[int], Image.Image], input_changed: bool, time: Fraction) -> Tuple[Image.Image, int]:
        """
        Transforms the given input image to the desired output image.
        The default behaviour is to return the orignal image.

        :param Callable[[], PIL.Image] get_input: A function that returns the input image to transform. Note that calling
        this will create a copy of the input image, and it is safe to manipulate directly.

        :param Callable[[int], PIL.Image] get_output: Provide the hashcode of the new frame and it will
        return the output frame if it already exists. This avoids having to redraw an output frame that is already
        cached.

        :param bool input_changed: True if the input is different from previous run, False otherwise.
        When true, you have to return an Image.

        :param Fraction time: The current time in seconds, expressed as a fractional number since
        the start of the pipeline.

        :rtype: PIL.Image
        :return: The transformed output image. If this filter did not modify the input, return None. This signals to the
        pipeline manager that there was no change and a cached version will be moved to the next stage.
        """
        pass



================================================
FILE: streamdeck_ui/display/image_filter.py
================================================
import itertools
import os
from fractions import Fraction
from io import BytesIO
from typing import Callable, Tuple

import cairosvg
import filetype
from PIL import Image, ImageSequence

from streamdeck_ui.display.filter import Filter


class ImageFilter(Filter):
    """
    Represents a static image. It transforms the input image by replacing it with a static image.
    """

    def __init__(self, file: str):
        super(ImageFilter, self).__init__()
        self.file = os.path.expanduser(file)

    def initialize(self, size: Tuple[int, int]):
        # Each frame needs to have a unique hashcode. Start with file name as baseline.
        image_hash = hash((self.__class__, self.file))
        frame_duration = []
        frame_hash = []

        try:
            kind = filetype.guess(self.file)
            if kind is None:
                svg_code = open(self.file).read()
                png = cairosvg.svg2png(svg_code, output_height=size[1], output_width=size[0])
                image_file = BytesIO(png)
                image = Image.open(image_file)
                frame_duration.append(-1)
                frame_hash.append(image_hash)
            else:
                image = Image.open(self.file)
                image.seek(0)
                # Frame number is used to create unique hash
                frame_number = 1
                while True:
                    try:
                        frame_duration.append(image.info["duration"])
                        # Create tuple and hash it, to combine the image and frame hashcodes
                        frame_hash.append(hash((image_hash, frame_number)))
                        image.seek(image.tell() + 1)
                        frame_number += 1
                    except EOFError:
                        # Reached the final frame
                        break
                    except KeyError:
                        # If the key 'duration' can't be found, it's not an animation
                        frame_duration.append(-1)
                        frame_hash.append(image_hash)
                        break

        except OSError as icon_error:
            # FIXME: caller should handle this?
            print(f"Unable to load icon {self.file} with error {icon_error}")
            image = Image.new("RGB", size)
            frame_duration.append(-1)
            frame_hash.append(image_hash)

        frames = ImageSequence.Iterator(image)

        # Scale all the frames to the target size
        self.frames = []
        for frame, milliseconds, hashcode in zip(frames, frame_duration, frame_hash):
            frame = frame.copy()
            frame.thumbnail(size, Image.LANCZOS)
            self.frames.append((frame, milliseconds, hashcode))

        self.frame_cycle = itertools.cycle(self.frames)
        self.current_frame = next(self.frame_cycle)
        self.frame_time = Fraction()

    def transform(self, get_input: Callable[[], Image.Image], get_output: Callable[[int], Image.Image], input_changed: bool, time: Fraction) -> Tuple[Image.Image, int]:
        """
        The transformation returns the loaded image, ando overwrites whatever came before.
        """

        # Unpack tuple to make code a bit easier to understand
        frame, duration, hashcode = self.current_frame

        if duration >= 0 and time - self.frame_time > duration / 1000:
            self.frame_time = time
            self.current_frame = next(self.frame_cycle)

            # Unpack updated value
            frame, duration, hashcode = self.current_frame

            image = get_output(hashcode)
            if image:
                return (image, hashcode)

            input = get_input()
            if frame.mode == "RGBA":
                # Use the transparency mask of the image to paste
                input.paste(frame, frame)
            else:
                input.paste(frame)
            return (input, hashcode)

        if input_changed:
            image = get_output(hashcode)
            if image:
                return (image, hashcode)

            input = get_input()

            if frame.mode == "RGBA":
                # Use the transparency mask of the image to paste
                input.paste(frame, frame)
            else:
                input.paste(frame)
            return (input, hashcode)
        else:
            return (None, hashcode)



================================================
FILE: streamdeck_ui/display/keypress_filter.py
================================================
from fractions import Fraction
from typing import Callable, Tuple

from PIL import Image, ImageEnhance

from streamdeck_ui.display.filter import Filter


class KeypressFilter(Filter):
    """This filter is applied whenever a key is being pressed"""

    def __init__(self):
        super(KeypressFilter, self).__init__()
        self.last_time: Fraction = Fraction()
        self.brightness = 1
        self.dim_brightness = 0.5
        self.filter_hash = hash(self.__class__)
        self.active = False
        self.last_state = False

    def initialize(self, size: Tuple[int, int]):
        self.blank_image = Image.new("RGB", size)
        self.size = size
        pass

    def transform(self, get_input: Callable[[], Image.Image], get_output: Callable[[int], Image.Image], input_changed: bool, time: Fraction) -> Tuple[Image.Image, int]:
        frame_hash = hash((self.filter_hash, self.active))
        if input_changed or self.active != self.last_state:
            self.last_state = self.active
            image = get_output(frame_hash)
            if image:
                return (image, frame_hash)

            input = get_input()
            if self.active:
                input = get_input()
                background = self.blank_image.copy()
                input.thumbnail((self.size[0] - 10, self.size[1] - 10), Image.ANTIALIAS)
                # Reduce the image by 10px

                enhancer = ImageEnhance.Brightness(input)
                input = enhancer.enhance(2)
                # Light it up a bit

                background.paste(input, (5, 5))
                # Center the image

                return (background, frame_hash)
            else:
                return (input, frame_hash)
        return (None, frame_hash)



================================================
FILE: streamdeck_ui/display/pipeline.py
================================================
from fractions import Fraction
from typing import Dict, List, Tuple

from PIL.Image import Image

from streamdeck_ui.display.filter import Filter


class Pipeline:
    def __init__(self) -> None:
        self.filters: List[Tuple[Filter, Image]] = []
        self.first_run = True
        self.output_cache: Dict[int, Image] = {}

    def add(self, filter: Filter) -> None:
        self.filters.append((filter, None))
        self.first_run = True

    def execute(self, time: Fraction) -> Tuple[Image, int]:
        """
        Executes all the filter in the pipeline and returns the final image, or None if the pipeline did not yield any changes.
        """

        image: Image = None
        is_modified = False
        pipeline_hash = 0

        # To avoid flake8 B023 (https://docs.python-guide.org/writing/gotchas/#late-binding-closures), we need to
        # capture the variable going into the lambda. However, as a result of that, we have a lambda that
        # technically takes an argument (with a default) that does not match the signature we declared
        # for the transform() method. There are likely other solutions to avoid the warning this produces,
        # like using functools.partial, but this needs to be investigated.

        for i, (current_filter, cached) in enumerate(self.filters):
            (image, hashcode) = current_filter.transform(
                lambda input_image=image: input_image.copy(),  # type: ignore [misc]
                lambda output_hash, pipeline_hash=pipeline_hash: self.output_cache.get(hash((output_hash, pipeline_hash)), None),  # type: ignore [misc]
                is_modified | self.first_run,
                time,
            )

            pipeline_hash = hash((hashcode, pipeline_hash))

            if not image:
                # Filter indicated that it did NOT change anything, pull up the last
                # cached value for the next step in the pipeline
                image = cached
            else:
                # The filter changed the image, cache it for future use
                # Update tuple with cached image
                self.filters[i] = (current_filter, image)
                is_modified = True

            # Store this image with pipeline hash if we haven't seen it.
            if pipeline_hash not in self.output_cache:
                self.output_cache[pipeline_hash] = image

        if self.first_run:
            # Force an update the first time the pipeline runs
            is_modified = True
            self.first_run = False

        return (image if is_modified else None, pipeline_hash)

    def last_result(self) -> Image:
        """
        Returns the last known output of the pipeline
        """
        return self.filters[-1][1]



================================================
FILE: streamdeck_ui/display/pulse_filter.py
================================================
from fractions import Fraction
from typing import Callable, Tuple

from PIL import Image, ImageEnhance

from streamdeck_ui.display.filter import Filter


class PulseFilter(Filter):
    def __init__(self):
        super(PulseFilter, self).__init__()
        self.last_time: Fraction = Fraction()
        self.pulse_delay = 0.5
        self.brightness = 1
        self.dim_brightness = 0.5
        self.filter_hash = hash(self.__class__)

    def initialize(self, size: Tuple[int, int]):
        pass

    def transform(self, get_input: Callable[[], Image.Image], get_output: Callable[[int], Image.Image], input_changed: bool, time: Fraction) -> Tuple[Image.Image, int]:
        brightness_changed = False
        if time - self.last_time > self.pulse_delay:
            brightness_changed = True
            self.last_time = time

            if self.brightness == self.dim_brightness:
                self.brightness = 1
            else:
                self.brightness = self.dim_brightness

        frame_hash = hash((self.filter_hash, self.brightness))
        if input_changed or brightness_changed:
            image = get_output(frame_hash)
            if image:
                return (image, frame_hash)

            input = get_input()
            enhancer = ImageEnhance.Brightness(input)
            input = enhancer.enhance(self.brightness)
            return (input, frame_hash)
        return (None, frame_hash)



================================================
FILE: streamdeck_ui/display/text_filter.py
================================================
import os
from fractions import Fraction
from typing import Callable, Tuple

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from streamdeck_ui.config import FONTS_PATH
from streamdeck_ui.display.filter import Filter


class TextFilter(Filter):
    font_blur: ImageFilter.Kernel = None
    # Static instance - no need to create one per Filter instance

    image: Image

    def __init__(self, text: str, font: str, vertical_align: str):
        super(TextFilter, self).__init__()
        self.text = text
        self.vertical_align = vertical_align
        self.true_font = ImageFont.truetype(os.path.join(FONTS_PATH, font), 14)
        # fmt: off
        kernel = [
            0, 1, 2, 1, 0,
            1, 2, 4, 2, 1,
            2, 4, 8, 4, 1,
            1, 2, 4, 2, 1,
            0, 1, 2, 1, 0]
        # fmt: on
        TextFilter.font_blur = ImageFilter.Kernel((5, 5), kernel, scale=0.1 * sum(kernel))
        self.offset = 0.0
        self.offset_direction = 1
        self.image = None

        # Hashcode should be created for anything that makes this frame unique
        self.hashcode = hash((self.__class__, text, font, vertical_align))

    def initialize(self, size: Tuple[int, int]):
        self.image = Image.new("RGBA", size)
        backdrop_draw = ImageDraw.Draw(self.image)

        # Calculate the height and width of the text we're drawing, using the font itself
        label_w, _ = backdrop_draw.textsize(self.text, font=self.true_font)

        # Calculate dimensions for text that include ascender (above the line)
        # and below the line  (descender) characters. This is used to adust the
        # font placement and should allow for button text to horizontally align
        # across buttons. Basically we want to figure out what is the tallest
        # text we will need to draw.
        _, label_h = backdrop_draw.textsize("lLpgyL|", font=self.true_font)

        gap = (size[1] - 5 * label_h) // 4

        if self.vertical_align == "top":
            label_y = 0
        elif self.vertical_align == "middle-top":
            label_y = gap + label_h
        elif self.vertical_align == "middle":
            label_y = size[1] // 2 - (label_h // 2)
        elif self.vertical_align == "middle-bottom":
            label_y = (gap + label_h) * 3
        else:
            label_y = size[1] - label_h
            # Default or "bottom"

        label_pos = ((size[0] - label_w) // 2, label_y)

        backdrop_draw.text(label_pos, text=self.text, font=self.true_font, fill="black")
        self.image = self.image.filter(TextFilter.font_blur)

        foreground_draw = ImageDraw.Draw(self.image)
        foreground_draw.text(label_pos, text=self.text, font=self.true_font, fill="white")

    def transform(self, get_input: Callable[[], Image.Image], get_output: Callable[[int], Image.Image], input_changed: bool, time: Fraction) -> Tuple[Image.Image, int]:
        """
        The transformation returns the loaded image, ando overwrites whatever came before.
        """

        if input_changed:
            image = get_output(self.hashcode)
            if image:
                return (image, self.hashcode)

            input = get_input()
            input.paste(self.image, self.image)
            return (input, self.hashcode)
        return (None, self.hashcode)



================================================
FILE: streamdeck_ui/fonts/roboto/LICENSE.txt
================================================

                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright [yyyy] [name of copyright owner]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.



================================================
FILE: tests/__init__.py
================================================
[Empty file]


================================================
FILE: tests/conftest.py
================================================
from unittest.mock import MagicMock

from streamdeck_ui import api

api.DeviceManager = MagicMock()
api.StreamDeck = MagicMock()
api.ImageHelpers = MagicMock()
api.export_config = MagicMock()



================================================
FILE: tests/test_api.py
================================================
import time

from hypothesis_auto import auto_pytest_magic

from streamdeck_ui import api

server = api.StreamDeckServer()

auto_pytest_magic(server.set_button_command)
auto_pytest_magic(server.get_button_command)
auto_pytest_magic(server.set_button_switch_page)
auto_pytest_magic(server.get_button_switch_page)
auto_pytest_magic(server.set_button_keys)
auto_pytest_magic(server.get_button_keys)
auto_pytest_magic(server.set_button_write)
auto_pytest_magic(server.get_button_write)
auto_pytest_magic(server.set_brightness, auto_allow_exceptions_=(KeyError,))
auto_pytest_magic(server.get_brightness)
auto_pytest_magic(server.change_brightness, auto_allow_exceptions_=(KeyError,))
auto_pytest_magic(server.get_page)



================================================
FILE: tests/test_dimmer.py
================================================
from time import sleep

import pytest

from streamdeck_ui.dimmer import Dimmer


@pytest.mark.parametrize("brightness, dim_percent, dimmed", [(100, 0, 0), (100, 50, 50), (100, 100, 100), (50, 50, 25)])
def test_dim_to_zero(brightness: int, dim_percent: int, dimmed: int):
    call_count = 0
    last_value = -1

    def dim(value: int):
        nonlocal last_value
        nonlocal call_count
        call_count = call_count + 1
        last_value = value

    dimmer = Dimmer(1, brightness, dim_percent, dim)
    dimmer.reset()
    sleep(1.1)
    assert dimmer.dimmed
    assert call_count == 2
    assert last_value == dimmed



================================================
FILE: tests/test_filter.py
================================================
import os
from fractions import Fraction

import pytest

from streamdeck_ui.display import empty_filter, image_filter, pipeline


def get_asset(file_name):
    """Resolve the given file name to a full path."""
    return os.path.join(os.path.dirname(__file__), "assets", file_name)


def test_default():
    default = empty_filter.EmptyFilter()
    default.initialize((16, 16))
    image, _ = default.transform(lambda: None, lambda hash: None, True, Fraction(0))
    assert image is not None
    assert default.is_complete is False


# TODO: Incorrect file locations default to "empty". Probably better that it throws.
@pytest.mark.parametrize("image", ["smile.png", "smile.jpg", "smile.svg", "dog.gif"])
def test_image_filter(image: str):
    size = (72, 72)
    pipe = pipeline.Pipeline()

    filter = empty_filter.EmptyFilter()
    filter.initialize(size)

    pipe.add(filter)
    time = Fraction(0)

    filter = image_filter.ImageFilter(get_asset(image))
    filter.initialize(size)
    pipe.add(filter)
    image, _ = pipe.execute(time)
    image, _ = pipe.execute(1)
    image, _ = pipe.execute(2)


def test_pipeline():
    size = (72, 72)
    pipe = pipeline.Pipeline()

    filter = empty_filter.EmptyFilter()
    filter.initialize(size)
    pipe.add(filter)

    filter = image_filter.ImageFilter(os.path.join(os.path.dirname(__file__), "assets/smile.png"))
    filter.initialize(size)
    pipe.add(filter)
    time = Fraction(0)
    final_image, _ = pipe.execute(time)
    assert final_image is not None



================================================
FILE: tests/test_gui.py
================================================
import sys
from unittest.mock import MagicMock

import pytest
from hypothesis_auto import auto_pytest_magic

from streamdeck_ui import api, gui

pytestmark = pytest.mark.skipif(sys.platform == "linux", reason="tests for mac only due to travis issues")

gui.selected_button = MagicMock()

auto_pytest_magic(gui.update_button_text, ui=MagicMock())
auto_pytest_magic(gui.update_button_command, ui=MagicMock())
auto_pytest_magic(gui.update_button_keys, ui=MagicMock())
auto_pytest_magic(gui.update_button_write, ui=MagicMock())
auto_pytest_magic(gui.update_change_brightness, ui=MagicMock())
auto_pytest_magic(gui.change_page, ui=MagicMock())
auto_pytest_magic(gui.set_brightness, ui=MagicMock(), auto_allow_exceptions_=(KeyError,))
auto_pytest_magic(gui.queue_update_button_text, ui=MagicMock())


def test_start():
    api.decks = {None: MagicMock()}
    gui.start(_exit=True)



================================================
FILE: tests/test_stream_deck_monitor.py
================================================
import threading
from time import sleep
from unittest import TestCase
from unittest.mock import patch

from streamdeck_ui.stream_deck_monitor import StreamDeckMonitor


def test_start_stop():
    lock: threading.Lock = threading.Lock()
    monitor = StreamDeckMonitor(lock, lambda serial, deck: None, lambda serial: None)
    monitor.start()
    # FIXME: Need to find a better way to find "evidence" that it worked
    sleep(1)
    monitor.stop()



================================================
FILE: .github/FUNDING.yml
================================================
github: "timothycrosley"



================================================
FILE: .github/ISSUE_TEMPLATE/bug_report.md
================================================
---
name: Bug report
about: STOP! We are no longer accepting bug reports
title: ''
labels: bug
assignees: ''

---

**STOP**

This project is no longer actively maintained and your bug report will be ignored. 
Please see https://github.com/timothycrosley/streamdeck-ui/issues/360




================================================
FILE: .github/ISSUE_TEMPLATE/config.yml
================================================
blank_issues_enabled: false



================================================
FILE: .github/workflows/test.yaml
================================================
name: Test

on: [push, pull_request, workflow_dispatch]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      #----------------------------------------------
      #       check-out repo and set-up python     
      #----------------------------------------------
      - name: Check out repository
        uses: actions/checkout@v2
      - name: Set up python 
        uses: actions/setup-python@v2
        with:
          python-version: 3.8
      #----------------------------------------------
      #  -----  install & configure poetry  -----      
      #----------------------------------------------
      - name: Install Poetry
        uses: snok/install-poetry@v1
        with:
          virtualenvs-create: true
          virtualenvs-in-project: true
      #----------------------------------------------
      #       load cached venv if cache exists      
      #----------------------------------------------
      - name: Load cached venv
        id: cached-poetry-dependencies
        uses: actions/cache@v2
        with:
          path: .venv
          key: venv-${{ runner.os }}-${{ hashFiles('**/poetry.lock') }}
      #----------------------------------------------
      # install dependencies if cache does not exist 
      #----------------------------------------------
      - name: Install dependencies
        if: steps.cached-poetry-dependencies.outputs.cache-hit != 'true'
        run: poetry install --no-interaction --no-root --no-ansi
      #----------------------------------------------
      # install your root project, if required 
      #----------------------------------------------      
      - name: Install library
        run: poetry install --no-interaction --no-ansi
      #----------------------------------------------
      # Install required libraries for ImageQt
      # This avoids:
      # ImportError: cannot import name 'ImageQt' from 'PIL.ImageQt'
      #----------------------------------------------      
      - name: Install library
        run: |
          sudo apt-get update
          sudo apt-get install -y libegl1 libgl1 libxkbcommon0
      #----------------------------------------------
      #              run Lint tests   
      #----------------------------------------------
      - name: Lint
        run: ./scripts/lint.sh
      #----------------------------------------------
      #    run test suite and output coverage file   
      #----------------------------------------------
      - name: Test
        run: bash -c "poetry run pytest tests/ -s --cov=streamdeck_ui/ --cov-report=term-missing ${@-}"
      #----------------------------------------------
      #            generate coverage stats              
      #----------------------------------------------
      - name: Generate Coverage Report
        run: poetry run coverage xml
      #----------------------------------------------
      #             upload coverage stats              
      #----------------------------------------------
      - name: Upload coverage
        uses: codecov/codecov-action@v1
        with:
          file: ./coverage.xml
          fail_ci_if_error: true


