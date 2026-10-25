(Files content cropped to 300k characters, download full ingest to see more)
================================================
FILE: README.md
================================================
# BarRaider's Stream Deck Tools

#### C# library that wraps all the communication with the Stream Deck App, allowing you to focus on actually writing the Plugin's logic.

[![Build Status](https://github.com/BarRaider/streamdeck-tools/actions/workflows/dotnetcore.yml/badge.svg)](https://github.com/BarRaider/streamdeck-tools/actions/workflows/dotnetcore.yml)  [![NuGet](https://img.shields.io/nuget/v/streamdeck-tools.svg?style=flat)](https://www.nuget.org/packages/streamdeck-tools)

**Author's website and contact information:** [https://barraider.com](https://barraider.com)  

# Stream Deck+ Support  
Instead of `PluginBase`, Derive from either `KeypadBase` (if you don't support dials), `EncoderBase` (for only dials), `KeyAndEncoderBase` (for both keys and dials)

# Getting Started
Introducing our new [wiki](https://github.com/BarRaider/streamdeck-tools/wiki) packed with usage instructions, examples and more.

# Dev Discussions / Support
**Discord:** Discuss in #developers-chat in [Bar Raiders](http://discord.barraider.com)

## Downloadable Resources
* [StreamDeck-Tools Template](https://github.com/BarRaider/streamdeck-tools/raw/master/utils/StreamDeck-Tools%20Template.vsix) for Visual Studio (2019/2022) - Automatically creates a project with all the files needed to compile a plugin. This is the best way to start a new plugin!
* [Install.bat](https://github.com/BarRaider/streamdeck-tools/blob/master/utils/install.bat) - Script that quickly uninstalls and reinstalls your plugin on the streamdeck (edit the batch file for more details). Put the install.bat file in your BIN folder (same folder that has Debug/Release sub-folders)
* [EasyPI](https://github.com/BarRaider/streamdeck-easypi) - Additional library used to easily pass information from the PI (Property Inspector) to your plugin.
* [Profiles](https://barraider.com/profiles) Downloadable empty profiles for the XL (32-key), Classic (15-key), Mini (6-key) and Mobile devices at https://barraider.com/profiles

## Library Features
- Encapsulates all the communicating with the Stream Deck, getting a plugin working on the Stream Deck only requires implementing the PluginBase class.
- Sample plugin now included in this project on Github
- Built-in integration with NLog. Use `Logger.LogMessage()` for logging. 
- Auto-populate user settings which were modified by the Property Inspector
- Access the Global Settings from anywhere in your code
- Simplified working with filenames from the Stream Deck SDK.
- `PluginActionId` attribute let's you easily associate your code to a specific action defined in the manifest.json
- Large set of helper functions to simplify creating images and sending them to the Stream Deck.

# Change Log

### Version 6.3.1
- Support for new Stream Deck types

### Version 6.2
- Support for .NET 8.0

### Version 6.1
- Support for new `DialDown` and `DialUp` events. 
- Removed support for deprecated `DialPress` event

### Version 6.0
1. Merged streamdeck-client-csharp package into library to allow better logging of errors
2. Added support for SD+ SDK
3. Increased timeout of connection to Stream Deck due to the Stream Deck taking longer than before to reply on load
4. Added error catching to prevent 3rd party plugin exception to impact communication


### Version 3.2 is out!
- Created new `ISDConnection` interface which is now implemented by SDConnection and used by PluginAction.
- GlobalSettingsManager now has a short delay before calling GetGlobalSettings(), to reduce spamming the Stream Deck SDK.
- Updated dependencies to latest version

### Version 3.1 is out!
- Updated Logger class to include process name and thread id

### Version 3.0 is out!
- Updated file handling in `Tools.AutoPopulateSettings` and `Tools.FilenameFromPayload` methods
- Removed obsolete MD5 functions, use SHA512 functions instead
- `Tools.CenterText` function now has optional out `textFitsImage` value to verify the text does not exceed the image width
- New `Tools.FormatBytes` function converts bytes to human-readable value
- New `Graphics.GetFontSizeWhereTextFitsImage` function helps locate the best size for a text to fit an image on 1 line
- Updated dependency packages to latest versions
- Bug fix where FileNameProperty attribute

### Version 2.7 is out!
- Fully wrapped all Stream Deck events (All part of the SDConneciton class). See ***"Subscribing to events"*** section below
- Added extension methods for multiple classes related to brushes/colors
- Added additional methods under the Tools class, including AddTextPathToGraphics which can be used to correctly position text on a key image based on the Text Settings in the Property Inspector see ***"Showing Title based on settings from Property Inspector"*** section below.
- Additional error checking
- Updated dependency packages to latest versions
- Sample plugin now included in this project on Github

### 2019-11-17
- Updated Install.bat (above) to newer version

### Version 2.6 is out!
- Added new MD5 functions in the `Tools` helper class
- Optimized SetImage to not resubmit an image that was just posted to the device. Can be overridden with new property in Connection.SetImage() function.




================================================
FILE: LICENSE
================================================
MIT License

Copyright (c) 2025 BarRaider

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
FILE: NUGET.md
================================================
# BarRaider's Stream Deck Tools

#### C# library that wraps all the communication with the Stream Deck App, allowing you to focus on actually writing the Plugin's logic.

[![NuGet](https://img.shields.io/nuget/v/streamdeck-tools.svg?style=flat)](https://www.nuget.org/packages/streamdeck-tools)

**Author's website and contact information:** [https://barraider.com](https://barraider.com)  
** Samples of plugins using this framework: [Samples][1]

### Version 3.2 is out!
- Created new `ISDConnection` interface which is now implemented by SDConnection and used by PluginAction.
- GlobalSettingsManager now has a short delay before calling GetGlobalSettings(), to reduce spamming the Stream Deck SDK.
- Updated dependencies to latest version

## Features
- Sample plugin now included in this project on Github
- Simplified working with filenames from the Stream Deck SDK. See ***"Working with files"*** section below
- Built-in integration with NLog. Use `Logger.LogMessage()` for logging. 
- Just call the `SDWrapper.Run()` and the library will take care of all the overhead
- Just have your plugin inherit PluginBase and implement the basic functionality. Use the PluginActionId to specify the UUID from the manifest file. (see samples on github page)
- Simplified receiving Global Settings updates through the new `ReceivedGlobalSettings` method
- Simplified receiving updates from the Property Inspector through the new `ReceivedSettings` method along with the new `Tools.AutoPopulateSettings()` method. See the ***"Auto-populating plugin settings"*** section below. 
- Introduced a new attribute called PluginActionId to indicate the Action's UUID (See below)
- Added support to switching plugin profiles.
- The DeviceId that the plugin is running on is now accessible from the `Connection` object
- Added new MD5 functions in the `Tools` helper class
- Optimized SetImage to not resubmit an image that was just posted to the device. Can be overridden with new property in Connection.SetImage() function.
- ExtensionMethods for Brush/Color/Graphics objects
- Helper functions in the `Tools` and `GraphicTools` classes

## How do I use this?
A list of plugins already using this library can be found [here][1]

This library wraps all the communication with the Stream Deck App, allowing you to focus on actually writing the Plugin's logic.
After creating a C# Console application, using this library requires two steps:

1. Create a class that inherits the PluginBase abstract class.  
Implement your logic, focusing on the methods provided in the base class.  
Follow the samples [here][1] for more details  
**New:** In version 2.x - use the `PluginActionId` attribute to indicate the action UUID associated with this class (must match the UUID set in the manifest file)

~~~~
[PluginActionId("plugin.uuid.from.manifest.file")]
public class MyPlugin : PluginBase
{
	// Create this constructor in your plugin and pass the objects to the PluginBase class
	public MyPlugin(SDConnection connection, InitialPayload payload) : base(connection, payload)
	{
		....
		// TODO: Use the payload.Settings to see the various settings set in the Property Inspector (in my samples, I create a private class that holds the settings)
		// Other relevant settings in the payload include the actual position of the plugin on the Stream Deck
		
		// Note: By passing the `connection` object back to the PluginBase (using the `base` in the constructor), you now have access to a property called `Connection` 
		// throughout your plugin.
	}
			....
			
	// TODO: Implement all the remaining abstract functions from PluginBase (or just leave them empty if you don't need them)
	
	// An example of how easy it is to populate settings in StreamDeck-Tools v2
	public override void ReceivedSettings(ReceivedSettingsPayload payload)
	{
		Tools.AutoPopulateSettings(settings, payload.Settings); // "settings" is a private class that holds the settings for your plugin's instance.
	}
}
~~~~

2. In your program.cs, just pass the args you received to the SDWrapper.Run() function, and you're done!  
**Note:** This process is much easier than the one used in 1.x and is based on using the `PluginActionId` attribute, as shown in Step 1 above.  
Example:
~~~~
class Program
{
	static void Main(string[] args)
	{
		SDWrapper.Run(args);
	}
}
~~~~

3. There is no step 3 - that's it! The abstract functions from PluginBase that are implemented in MyPlugin hold all the basics needed for a plugin to work. You can always listen to additional events using the `Connection` property.

[1]: https://github.com/BarRaider/streamdeck-tools/blob/master/samples.md


================================================
FILE: samples.md
================================================
## Samples of Github repositories using the StreamDeck-Tools framework

List is sorted from basic to more complex plugins:
1. Stopwatch plugin: https://github.com/BarRaider/streamdeck-stopwatchdemo
2. Delayed Text Input plugin: https://github.com/BarRaider/streamdeck-delayedtext
3. Stock Ticker plugin: https://github.com/BarRaider/streamdeck-stockticker
4. VoiceMeeter Integration plugin: https://github.com/BarRaider/streamdeck-voicemeeter


**Author's website and contact information:** [https://barraider.github.io](https://barraider.github.io)



================================================
FILE: StreamDeck-Tools.sln
================================================
﻿
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.4.33103.184
MinimumVisualStudioVersion = 10.0.40219.1
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "barraider-sdtools", "barraider-sdtools\barraider-sdtools.csproj", "{DABBD97D-6687-4CBD-A19E-AC9FFA3CEF03}"
EndProject
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "SamplePlugin", "SamplePlugin\SamplePlugin.csproj", "{4635D874-69C0-4010-BE46-77EF92EB1553}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Debug|x64 = Debug|x64
		Release|Any CPU = Release|Any CPU
		Release|x64 = Release|x64
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{DABBD97D-6687-4CBD-A19E-AC9FFA3CEF03}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{DABBD97D-6687-4CBD-A19E-AC9FFA3CEF03}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{DABBD97D-6687-4CBD-A19E-AC9FFA3CEF03}.Debug|x64.ActiveCfg = Debug|x64
		{DABBD97D-6687-4CBD-A19E-AC9FFA3CEF03}.Debug|x64.Build.0 = Debug|x64
		{DABBD97D-6687-4CBD-A19E-AC9FFA3CEF03}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{DABBD97D-6687-4CBD-A19E-AC9FFA3CEF03}.Release|Any CPU.Build.0 = Release|Any CPU
		{DABBD97D-6687-4CBD-A19E-AC9FFA3CEF03}.Release|x64.ActiveCfg = Release|x64
		{DABBD97D-6687-4CBD-A19E-AC9FFA3CEF03}.Release|x64.Build.0 = Release|x64
		{4635D874-69C0-4010-BE46-77EF92EB1553}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{4635D874-69C0-4010-BE46-77EF92EB1553}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{4635D874-69C0-4010-BE46-77EF92EB1553}.Debug|x64.ActiveCfg = Debug|x64
		{4635D874-69C0-4010-BE46-77EF92EB1553}.Debug|x64.Build.0 = Debug|x64
		{4635D874-69C0-4010-BE46-77EF92EB1553}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{4635D874-69C0-4010-BE46-77EF92EB1553}.Release|Any CPU.Build.0 = Release|Any CPU
		{4635D874-69C0-4010-BE46-77EF92EB1553}.Release|x64.ActiveCfg = Release|x64
		{4635D874-69C0-4010-BE46-77EF92EB1553}.Release|x64.Build.0 = Release|x64
	EndGlobalSection
	GlobalSection(SolutionProperties) = preSolution
		HideSolutionNode = FALSE
	EndGlobalSection
	GlobalSection(ExtensibilityGlobals) = postSolution
		SolutionGuid = {4FF0FD6C-650D-438B-9C5E-49C9259AE847}
	EndGlobalSection
EndGlobal



================================================
FILE: barraider-sdtools/README.md
================================================
# BarRaider's Stream Deck Tools

#### C# library that wraps all the communication with the Stream Deck App, allowing you to focus on actually writing the Plugin's logic.

[![Build Status](https://github.com/BarRaider/streamdeck-tools/actions/workflows/dotnetcore.yml/badge.svg)](https://github.com/BarRaider/streamdeck-tools/actions/workflows/dotnetcore.yml)  [![NuGet](https://img.shields.io/nuget/v/streamdeck-tools.svg?style=flat)](https://www.nuget.org/packages/streamdeck-tools)

**Author's website and contact information:** [https://barraider.com](https://barraider.com)  

# Stream Deck+ Support  
Instead of `PluginBase`, Derive from either `KeypadBase` (if you don't support dials), `EncoderBase` (for only dials), `KeyAndEncoderBase` (for both keys and dials)

# Getting Started
Introducing our new [wiki](https://github.com/BarRaider/streamdeck-tools/wiki) packed with usage instructions, examples and more.

# Dev Discussions / Support
**Discord:** Discuss in #developers-chat in [Bar Raiders](http://discord.barraider.com)

## Downloadable Resources
* [StreamDeck-Tools Template](https://github.com/BarRaider/streamdeck-tools/raw/master/utils/StreamDeck-Tools%20Template.vsix) for Visual Studio (2019/2022) - Automatically creates a project with all the files needed to compile a plugin. This is the best way to start a new plugin!
* [Install.bat](https://github.com/BarRaider/streamdeck-tools/blob/master/utils/install.bat) - Script that quickly uninstalls and reinstalls your plugin on the streamdeck (edit the batch file for more details). Put the install.bat file in your BIN folder (same folder that has Debug/Release sub-folders)
* [EasyPI](https://github.com/BarRaider/streamdeck-easypi) - Additional library used to easily pass information from the PI (Property Inspector) to your plugin.
* [Profiles](https://barraider.com/profiles) Downloadable empty profiles for the XL (32-key), Classic (15-key), Mini (6-key) and Mobile devices at https://barraider.com/profiles

## Library Features
- Encapsulates all the communicating with the Stream Deck, getting a plugin working on the Stream Deck only requires implementing the PluginBase class.
- Sample plugin now included in this project on Github
- Built-in integration with NLog. Use `Logger.LogMessage()` for logging. 
- Auto-populate user settings which were modified by the Property Inspector
- Access the Global Settings from anywhere in your code
- Simplified working with filenames from the Stream Deck SDK.
- `PluginActionId` attribute let's you easily associate your code to a specific action defined in the manifest.json
- Large set of helper functions to simplify creating images and sending them to the Stream Deck.

# Change Log

### Version 6.3
- Support for new Stream Deck types

### Version 6.2
- Support for .NET 8.0

### Version 6.1
- Support for new `DialDown` and `DialUp` events. 
- Removed support for deprecated `DialPress` event

### Version 6.0
1. Merged streamdeck-client-csharp package into library to allow better logging of errors
2. Added support for SD+ SDK
3. Increased timeout of connection to Stream Deck due to the Stream Deck taking longer than before to reply on load
4. Added error catching to prevent 3rd party plugin exception to impact communication


### Version 3.2 is out!
- Created new `ISDConnection` interface which is now implemented by SDConnection and used by PluginAction.
- GlobalSettingsManager now has a short delay before calling GetGlobalSettings(), to reduce spamming the Stream Deck SDK.
- Updated dependencies to latest version

### Version 3.1 is out!
- Updated Logger class to include process name and thread id

### Version 3.0 is out!
- Updated file handling in `Tools.AutoPopulateSettings` and `Tools.FilenameFromPayload` methods
- Removed obsolete MD5 functions, use SHA512 functions instead
- `Tools.CenterText` function now has optional out `textFitsImage` value to verify the text does not exceed the image width
- New `Tools.FormatBytes` function converts bytes to human-readable value
- New `Graphics.GetFontSizeWhereTextFitsImage` function helps locate the best size for a text to fit an image on 1 line
- Updated dependency packages to latest versions
- Bug fix where FileNameProperty attribute

### Version 2.7 is out!
- Fully wrapped all Stream Deck events (All part of the SDConneciton class). See ***"Subscribing to events"*** section below
- Added extension methods for multiple classes related to brushes/colors
- Added additional methods under the Tools class, including AddTextPathToGraphics which can be used to correctly position text on a key image based on the Text Settings in the Property Inspector see ***"Showing Title based on settings from Property Inspector"*** section below.
- Additional error checking
- Updated dependency packages to latest versions
- Sample plugin now included in this project on Github

### 2019-11-17
- Updated Install.bat (above) to newer version

### Version 2.6 is out!
- Added new MD5 functions in the `Tools` helper class
- Optimized SetImage to not resubmit an image that was just posted to the device. Can be overridden with new property in Connection.SetImage() function.




================================================
FILE: barraider-sdtools/barraider-sdtools.csproj
================================================
﻿<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFrameworks>netstandard2.0;net8.0</TargetFrameworks>
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
    <Authors>BarRaider</Authors>
    <Product>Stream Deck Tools by BarRaider</Product>
    <Description>Start developing your Elgato StreamDeck plugin faster!  
This library encapsulates all the overhead of setting up the framework, so that you can focus on writing the logic of the plugin itself.  
[Samples for using the library are provided here: https://github.com/BarRaider/streamdeck-tools]  
Using this library, you only need to derive from the abstract PluginBase class and add one line of code in your program.cs to have a working plugin. More info and working samples here: https://github.com/BarRaider/streamdeck-tools .  
Feel free to contact me for more information: https://barraider.com</Description>
    <Copyright>Copyright © BarRaider 2025</Copyright>
    <PackageProjectUrl>https://github.com/BarRaider/streamdeck-tools</PackageProjectUrl>
    <RepositoryUrl>https://github.com/BarRaider/streamdeck-tools</RepositoryUrl>
    <PackageTags>StreamDeck Elgato Library Plugin Stream Deck Toolkit</PackageTags>
    <PackageId>StreamDeck-Tools</PackageId>
    <PackageIconUrl></PackageIconUrl>
    <AssemblyVersion>6.3.1</AssemblyVersion>
    <FileVersion>6.3.1</FileVersion>
    <Version>6.3.1</Version>
    <PackageReleaseNotes>6.3.1 - Support for new Stream Deck types</PackageReleaseNotes>
    <RootNamespace>BarRaider.SdTools</RootNamespace>
    <AssemblyName>StreamDeckTools</AssemblyName>
    <PackageIcon>BRLogo_460.png</PackageIcon>
	<PackageReadmeFile>README.md</PackageReadmeFile>
	<PackageLicenseFile>LICENSE</PackageLicenseFile>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(TargetFramework)|$(Platform)'=='Debug|netstandard2.0|AnyCPU'">
    <DocumentationFile></DocumentationFile>
    <NoWarn>1701;1702;CA1416</NoWarn>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(TargetFramework)|$(Platform)'=='Debug|netstandard2.0|x64'">
    <DocumentationFile />
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(TargetFramework)|$(Platform)'=='Release|netstandard2.0|AnyCPU'">
    <DocumentationFile>streamdeck-tools.xml</DocumentationFile>
    <NoWarn>1701;1702;CA1416</NoWarn>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(TargetFramework)|$(Platform)'=='Release|netstandard2.0|x64'">
    <DocumentationFile>streamdeck-tools.xml</DocumentationFile>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(TargetFramework)|$(Platform)'=='Debug|net8.0|AnyCPU'">
    <NoWarn>1701;1702;CA1416</NoWarn>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(TargetFramework)|$(Platform)'=='Release|net8.0|AnyCPU'">
    <NoWarn>1701;1702;CA1416</NoWarn>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="CommandLineParser" Version="2.9.1" />
    <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
    <PackageReference Include="NLog" Version="5.3.4" />
    <PackageReference Include="System.Drawing.Common" Version="9.0.0" />
  </ItemGroup>
  <ItemGroup>
    <Folder Include="Properties\" />
  </ItemGroup>
  <ItemGroup>
    <None Include="..\LICENSE">
      <Pack>True</Pack>
      <PackagePath>\</PackagePath>
    </None>
    <None Include="BRLogo_460.png">
      <Pack>True</Pack>
      <PackagePath></PackagePath>
    </None>
	<None Include="README.md" Pack="true" PackagePath="\">
	  <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
	</None>
  </ItemGroup>
</Project>


================================================
FILE: barraider-sdtools/Attributes/FilenamePropertyAttribute.cs
================================================
﻿using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools
{

    /// <summary>
    /// FilenamePropertyAttribute - Used to indicate the current property holds a file name. 
    /// This will allow StreamDeck Tools to strip the mandatory "C:\fakepath\" added by the SDK
    /// </summary>
    [Serializable]
    [AttributeUsage(AttributeTargets.Property, AllowMultiple = false, Inherited = false)]
    public class FilenamePropertyAttribute : Attribute
    {
    }
}



================================================
FILE: barraider-sdtools/Attributes/PluginActionIdAttribute.cs
================================================
﻿using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools
{
    /// <summary>
    /// PluginActionId attribute
    /// Used to indicate the UUID in the manifest file that matches to this class
    /// </summary>
    [Serializable]
    [AttributeUsage(AttributeTargets.Class, AllowMultiple = false, Inherited = false)]
    public class PluginActionIdAttribute : Attribute
    {

        /// <summary>
        /// UUID of the action
        /// </summary>
        public string ActionId { get; private set; }

        /// <summary>
        /// Constructor - This attribute is used to indicate the UUID in the manifest file that matches to this class
        /// </summary>
        /// <param name="ActionId"></param>
        public PluginActionIdAttribute(string ActionId)
        {
            this.ActionId = ActionId;
        }
    }
}



================================================
FILE: barraider-sdtools/Backend/EncoderBase.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Main abstract class your plugin should derive from for dials (not keys)
    /// For keys use the KeyBase or KeyAndEncoderBase
    /// Holds implementation for all the basic functions
    /// If you're missing an event, you can register to it from the Connection.StreamDeckConnection object
    /// </summary>
    public abstract class EncoderBase : IEncoderPlugin
    {
        /// <summary>
        /// Called when the dial is rotated
        /// </summary>
        public abstract void DialRotate(DialRotatePayload payload);

        /// <summary>
        /// Called when the Dial is pressed
        /// </summary>
        public abstract void DialDown(DialPayload payload);

        /// <summary>
        /// Called when the Dial is released
        /// </summary>
        public abstract void DialUp(DialPayload payload);

        /// <summary>
        /// Called when the touchpad (above the dials) is pressed
        /// </summary>
        public abstract void TouchPress(TouchpadPressPayload payload);

        /// <summary>
        /// Called when the PropertyInspector has new settings
        /// </summary>
        /// <param name="payload"></param>
        public abstract void ReceivedSettings(ReceivedSettingsPayload payload);

        /// <summary>
        /// Called when GetGlobalSettings is called.
        /// </summary>
        /// <param name="payload"></param>
        public abstract void ReceivedGlobalSettings(ReceivedGlobalSettingsPayload payload);

        /// <summary>
        /// Called every second
        /// Logic for displaying title/image can go here
        /// </summary>
        public abstract void OnTick();

        /// <summary>
        /// Abstract method Called when the plugin is disposed
        /// </summary>
        public abstract void Dispose();

        /// <summary>
        /// Main iDisposable Dispose function
        /// </summary>
        public void Destroy()
        {
            Dispose();
            if (Connection != null)
            {
                Connection.Dispose();
            }
        }

        /// <summary>
        /// Connection object which handles your communication with the Stream Deck app
        /// </summary>
        protected ISDConnection Connection { get; private set; }

        /// <summary>
        /// Constructor for PluginBase. Receives the communication and plugin settings 
        /// Note that the settings object is not used by the base and should be consumed by the deriving class.
        /// Usually, a private class inside the deriving class is created which stores the settings
        /// Example for settings usage:
        /// * if (payload.Settings == null || payload.Settings.Count == 0)
        /// * {
        /// *         // Create default settings
        /// * }
        /// * else
        /// * {
        ///     this.settings = payload.Settings.ToObject();
        /// * }
        /// 
        /// </summary>
        /// <param name="connection">Communication module with Stream Deck</param>
        /// <param name="payload">Plugin settings - NOTE: Not used in base class, should be consumed by deriving class</param>
#pragma warning disable IDE0060 // Remove unused parameter
        public EncoderBase(ISDConnection connection, InitialPayload payload)
#pragma warning restore IDE0060 // Remove unused parameter
        {
            Connection = connection;
        }
    }
}



================================================
FILE: barraider-sdtools/Backend/ICommonPluginFunctions.cs
================================================
﻿using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Common functions used by both keypad and dial plugins
    /// </summary>
    public interface ICommonPluginFunctions : IDisposable
    {
        /// <summary>
        /// Called when the PropertyInspector has new settings
        /// </summary>
        /// <param name="payload"></param>
        void ReceivedSettings(ReceivedSettingsPayload payload);

        /// <summary>
        /// Called when GetGlobalSettings is called.
        /// </summary>
        /// <param name="payload"></param>
        void ReceivedGlobalSettings(ReceivedGlobalSettingsPayload payload);

        /// <summary>
        /// Called every second
        /// Logic for displaying title/image can go here
        /// </summary>
        void OnTick();

        /// <summary>
        /// Internal function used by StreamDeckTools to prevent memory leaks
        /// </summary>
        void Destroy();
    }
}



================================================
FILE: barraider-sdtools/Backend/IEncoderPlugin.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Interface used to capture dial/encoder events
    /// </summary>
    public interface IEncoderPlugin : ICommonPluginFunctions
    {
        /// <summary>
        /// Called when the dial is rotated
        /// </summary>
        void DialRotate(DialRotatePayload payload);

        /// <summary>
        /// Called when the Dial is pressed
        /// </summary>
        void DialDown(DialPayload payload);

        /// <summary>
        /// Called when the Dial is released
        /// </summary>
        void DialUp(DialPayload payload);

        /// <summary>
        /// Called when the touchpad (above the dials) is pressed
        /// </summary>
        void TouchPress(TouchpadPressPayload payload);
    }
}



================================================
FILE: barraider-sdtools/Backend/IKeypadPlugin.cs
================================================
﻿using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Interface used to capture key events
    /// </summary>
    public interface IKeypadPlugin : ICommonPluginFunctions
    {
        /// <summary>
        /// Called when a Stream Deck key is pressed
        /// </summary>
        void KeyPressed(KeyPayload payload);

        /// <summary>
        /// Called when a Stream Deck key is released
        /// </summary>
        void KeyReleased(KeyPayload payload);
    }
}



================================================
FILE: barraider-sdtools/Backend/ISDConnection.cs
================================================
﻿using BarRaider.SdTools.Events;
using BarRaider.SdTools.Wrappers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Text;
using System.Threading.Tasks;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Interface for a Stream Deck connection
    /// </summary>
    public interface ISDConnection : IDisposable
    {
        #region Events

        /// <summary>
        /// Event received by the plugin when the Property Inspector uses the sendToPlugin event.
        /// </summary>
        event EventHandler<SDEventReceivedEventArgs<SendToPlugin>> OnSendToPlugin;
        /// <summary>
        /// Event received when the user changes the title or title parameters.
        /// </summary>
        event EventHandler<SDEventReceivedEventArgs<TitleParametersDidChange>> OnTitleParametersDidChange;
        /// <summary>
        /// Event received when a monitored application is terminated
        /// </summary>
        event EventHandler<SDEventReceivedEventArgs<ApplicationDidTerminate>> OnApplicationDidTerminate;
        /// <summary>
        /// Event received when a monitored application is launched
        /// </summary>
        event EventHandler<SDEventReceivedEventArgs<ApplicationDidLaunch>> OnApplicationDidLaunch;
        /// <summary>
        /// Event received when a device is unplugged from the computer
        /// </summary>
        event EventHandler<SDEventReceivedEventArgs<DeviceDidDisconnect>> OnDeviceDidDisconnect;
        /// <summary>
        /// Event received when a device is plugged to the computer.
        /// </summary>
        event EventHandler<SDEventReceivedEventArgs<DeviceDidConnect>> OnDeviceDidConnect;
        /// <summary>
        /// Event received when the Property Inspector appears in the Stream Deck software user interface, for example when selecting a new instance.
        /// </summary>
        event EventHandler<SDEventReceivedEventArgs<PropertyInspectorDidAppear>> OnPropertyInspectorDidAppear;
        /// <summary>
        /// Event received when the Property Inspector for an instance is removed from the Stream Deck software user interface, for example when selecting a different instance.
        /// </summary>
        event EventHandler<SDEventReceivedEventArgs<PropertyInspectorDidDisappear>> OnPropertyInspectorDidDisappear;
        /// <summary>
        /// Event received when the computer wakes up
        /// </summary>
        event EventHandler<SDEventReceivedEventArgs<SystemDidWakeUp>> OnSystemDidWakeUp;

        #endregion

        #region Methods

        /// <summary>
        /// Send settings to the PropertyInspector
        /// </summary>
        /// <param name="settings"></param>
        /// <returns></returns>
        Task SendToPropertyInspectorAsync(JObject settings);

        /// <summary>
        /// Persists your plugin settings
        /// </summary>
        /// <param name="settings"></param>
        /// <returns></returns>
        Task SetSettingsAsync(JObject settings);

        /// <summary>
        /// Persists your global plugin settings
        /// </summary>
        /// <param name="settings">Settings to save globally</param>
        /// <param name="triggerDidReceiveGlobalSettings">Boolean whether to also trigger a didReceiveGlobalSettings event. Default is true</param>
        /// <returns></returns>
        Task SetGlobalSettingsAsync(JObject settings, bool triggerDidReceiveGlobalSettings = true);

        /// <summary>
        /// Persists your global plugin settings
        /// </summary>
        /// <returns></returns>
        Task GetGlobalSettingsAsync();

        /// <summary>
        /// Sets an image on the StreamDeck key.
        /// </summary>
        /// <param name="base64Image">Base64 encoded image</param>
        /// <param name="state">A 0-based integer value representing the state of an action with multiple states. This is an optional parameter. If not specified, the title is set to all states.</param>
        /// <param name="forceSendToStreamdeck">Should image be sent even if it is identical to the one sent previously. Default is false</param>
        /// <returns></returns>
        Task SetImageAsync(string base64Image, int? state = null, bool forceSendToStreamdeck = false);

        /// <summary>
        /// Sets an image on the StreamDeck key
        /// </summary>
        /// <param name="image">Image object</param>
        /// <param name="state">A 0-based integer value representing the state of an action with multiple states. This is an optional parameter. If not specified, the title is set to all states.</param>
        /// <param name="forceSendToStreamdeck">Should image be sent even if it is identical to the one sent previously. Default is false</param>
        /// <returns></returns>
        Task SetImageAsync(Image image, int? state = null, bool forceSendToStreamdeck = false);

        /// <summary>
        /// Sets the default image for this state, as configured in the manifest
        /// </summary>
        /// <returns></returns>
        Task SetDefaultImageAsync();

        /// <summary>
        /// Sets a title on the StreamDeck key
        /// </summary>
        /// <param name="title"></param>
        /// <param name="state">A 0-based integer value representing the state of an action with multiple states. This is an optional parameter. If not specified, the title is set to all states.</param>
        /// <returns></returns>
        Task SetTitleAsync(string title, int? state = null);

        /// <summary>
        /// Switches to one of the plugin's built-in profiles
        /// </summary>
        /// <param name="profileName"></param>
        /// <returns></returns>
        Task SwitchProfileAsync(string profileName);

        /// <summary>
        /// Switches to one of the plugin's built-in profiles. Allows to choose which device to switch it on.
        /// </summary>
        /// <param name="profileName"></param>
        /// <param name="deviceId"></param>
        /// <returns></returns>
        Task SwitchProfileAsync(string profileName, string deviceId);

        /// <summary>
        /// Shows the Alert (Yellow Triangle) on the StreamDeck key
        /// </summary>
        /// <returns></returns>
        Task ShowAlert();

        /// <summary>
        /// Shows the Success (Green checkmark) on the StreamDeck key
        /// </summary>
        /// <returns></returns>
        Task ShowOk();

        /// <summary>
        /// Add a message to the Stream Deck log. This is the log located at: %appdata%\Elgato\StreamDeck\logs\StreamDeck0.log
        /// </summary>
        /// <param name="message"></param>
        /// <returns></returns>
        Task LogSDMessage(string message);

        /// <summary>
        /// Gets the Stream Deck device's info
        /// </summary>
        /// <returns></returns>
        StreamDeckDeviceInfo DeviceInfo();

        /// <summary>
        /// Tells Stream Deck to return the current plugin settings via the ReceivedSettings function
        /// </summary>
        /// <returns></returns>
        Task GetSettingsAsync();

        /// <summary>
        /// Opens a URI in the user's browser
        /// </summary>
        /// <param name="uri"></param>
        /// <returns></returns>
        Task OpenUrlAsync(string uri);

        /// <summary>
        /// Opens a URI in the user's browser
        /// </summary>
        /// <param name="uri"></param>
        /// <returns></returns>
        Task OpenUrlAsync(Uri uri);

        /// <summary>
        /// Sets the plugin to a specific state which is pre-configured in the manifest file
        /// </summary>
        /// <param name="state"></param>
        /// <returns></returns>
        Task SetStateAsync(uint state);

        /// <summary>
        /// Sets the values of touchpad layouts items
        /// </summary>
        /// <param name="dictKeyValue">Dictionary holding the layout item keys and values you want to change</param>
        /// <returns></returns>
        Task SetFeedbackAsync(Dictionary<string, string> dictKeyValue);

        /// <summary>
        /// Sets the value of a single touchpad layout item
        /// </summary>
        /// <returns></returns>
        Task SetFeedbackAsync(string layoutItemKey, string value);

        /// <summary>
        /// Sets the values of touchpad layouts items using a preset JObject
        /// </summary>
        /// <param name="feedbackPayload"></param>
        /// <returns></returns>
        Task SetFeedbackAsync(JObject feedbackPayload);

        /// <summary>
        /// Changes the current Stream Deck+ touch display layout
        /// </summary>
        /// <returns></returns>
        Task SetFeedbackLayoutAsync(string layout);

        #endregion

        /// <summary>
        /// An opaque value identifying the plugin. This value is received during the Registration procedure
        /// </summary>
        [JsonIgnore]
        String ContextId { get; }

        /// <summary>
        /// An opaque value identifying the device the plugin is launched on.
        /// </summary>
        [JsonIgnore]
        String DeviceId { get; }

        /// <summary>
        /// StreamDeckConnection object, initialized based on the args received when launching the program
        /// </summary>
        [JsonIgnore]
        Communication.StreamDeckConnection StreamDeckConnection { get; }
    }
}



================================================
FILE: barraider-sdtools/Backend/KeyAndEncoderBase.cs
================================================
﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BarRaider.SdTools.Payloads;
using Newtonsoft.Json.Linq;

namespace BarRaider.SdTools
{

    /// <summary>
    /// Main abstract class your plugin should derive from for keys (not dials)
    /// For dials use the EncoderBase or KeyAndEncoderBase
    /// Holds implementation for all the basic functions
    /// If you're missing an event, you can register to it from the Connection.StreamDeckConnection object
    /// </summary>
    public abstract class KeyAndEncoderBase : IKeypadPlugin, IEncoderPlugin
    {
        /// <summary>
        /// Called when the dial is rotated
        /// </summary>
        public abstract void DialRotate(DialRotatePayload payload);

        /// <summary>
        /// Called when the Dial is pressed
        /// </summary>
        public abstract void DialDown(DialPayload payload);

        /// <summary>
        /// Called when the Dial is released
        /// </summary>
        public abstract void DialUp(DialPayload payload);

        /// <summary>
        /// Called when the touchpad (above the dials) is pressed
        /// </summary>
        public abstract void TouchPress(TouchpadPressPayload payload);

        /// <summary>
        /// Called when a Stream Deck key is pressed
        /// </summary>
        public abstract void KeyPressed(KeyPayload payload);

        /// <summary>
        /// Called when a Stream Deck key is released
        /// </summary>
        public abstract void KeyReleased(KeyPayload payload);

        /// <summary>
        /// Called when the PropertyInspector has new settings
        /// </summary>
        /// <param name="payload"></param>
        public abstract void ReceivedSettings(ReceivedSettingsPayload payload);

        /// <summary>
        /// Called when GetGlobalSettings is called.
        /// </summary>
        /// <param name="payload"></param>
        public abstract void ReceivedGlobalSettings(ReceivedGlobalSettingsPayload payload);

        /// <summary>
        /// Called every second
        /// Logic for displaying title/image can go here
        /// </summary>
        public abstract void OnTick();

        /// <summary>
        /// Abstract method Called when the plugin is disposed
        /// </summary>
        public abstract void Dispose();

        /// <summary>
        /// Main iDisposable Dispose function
        /// </summary>
        public void Destroy()
        {
            Dispose();
            if (Connection != null)
            {
                Connection.Dispose();
            }
        }

        /// <summary>
        /// Connection object which handles your communication with the Stream Deck app
        /// </summary>
        protected ISDConnection Connection { get; private set; }

        /// <summary>
        /// Constructor for PluginBase. Receives the communication and plugin settings 
        /// Note that the settings object is not used by the base and should be consumed by the deriving class.
        /// Usually, a private class inside the deriving class is created which stores the settings
        /// Example for settings usage:
        /// * if (payload.Settings == null || payload.Settings.Count == 0)
        /// * {
        /// *         // Create default settings
        /// * }
        /// * else
        /// * {
        ///     this.settings = payload.Settings.ToObject();
        /// * }
        /// 
        /// </summary>
        /// <param name="connection">Communication module with Stream Deck</param>
        /// <param name="payload">Plugin settings - NOTE: Not used in base class, should be consumed by deriving class</param>
#pragma warning disable IDE0060 // Remove unused parameter
        public KeyAndEncoderBase(ISDConnection connection, InitialPayload payload)
#pragma warning restore IDE0060 // Remove unused parameter
        {
            Connection = connection;
        }
    }
}


================================================
FILE: barraider-sdtools/Backend/KeypadBase.cs
================================================
﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BarRaider.SdTools.Payloads;
using Newtonsoft.Json.Linq;

namespace BarRaider.SdTools
{

    /// <summary>
    /// Main abstract class your plugin should derive from for keys (not dials)
    /// For dials use the EncoderBase or KeyAndEncoderBase
    /// Holds implementation for all the basic functions
    /// If you're missing an event, you can register to it from the Connection.StreamDeckConnection object
    /// </summary>
    public abstract class KeypadBase : IKeypadPlugin
    {
        /// <summary>
        /// Called when a Stream Deck key is pressed
        /// </summary>
        public abstract void KeyPressed(KeyPayload payload);

        /// <summary>
        /// Called when a Stream Deck key is released
        /// </summary>
        public abstract void KeyReleased(KeyPayload payload);

        /// <summary>
        /// Called when the PropertyInspector has new settings
        /// </summary>
        /// <param name="payload"></param>
        public abstract void ReceivedSettings(ReceivedSettingsPayload payload);

        /// <summary>
        /// Called when GetGlobalSettings is called.
        /// </summary>
        /// <param name="payload"></param>
        public abstract void ReceivedGlobalSettings(ReceivedGlobalSettingsPayload payload);

        /// <summary>
        /// Called every second
        /// Logic for displaying title/image can go here
        /// </summary>
        public abstract void OnTick();

        /// <summary>
        /// Abstract method Called when the plugin is disposed
        /// </summary>
        public abstract void Dispose();

        /// <summary>
        /// Main iDisposable Dispose function
        /// </summary>
        public void Destroy()
        {
            Dispose();
            if (Connection != null)
            {
                Connection.Dispose();
            }
        }

        /// <summary>
        /// Connection object which handles your communication with the Stream Deck app
        /// </summary>
        protected ISDConnection Connection { get; private set; }

        /// <summary>
        /// Constructor for PluginBase. Receives the communication and plugin settings 
        /// Note that the settings object is not used by the base and should be consumed by the deriving class.
        /// Usually, a private class inside the deriving class is created which stores the settings
        /// Example for settings usage:
        /// * if (payload.Settings == null || payload.Settings.Count == 0)
        /// * {
        /// *         // Create default settings
        /// * }
        /// * else
        /// * {
        ///     this.settings = payload.Settings.ToObject();
        /// * }
        /// 
        /// </summary>
        /// <param name="connection">Communication module with Stream Deck</param>
        /// <param name="payload">Plugin settings - NOTE: Not used in base class, should be consumed by deriving class</param>
#pragma warning disable IDE0060 // Remove unused parameter
        public KeypadBase(ISDConnection connection, InitialPayload payload)
#pragma warning restore IDE0060 // Remove unused parameter
        {
            Connection = connection;
        }
    }
}


================================================
FILE: barraider-sdtools/Backend/PluginBase.cs
================================================
﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BarRaider.SdTools.Payloads;
using Newtonsoft.Json.Linq;

namespace BarRaider.SdTools
{

    /// <summary>
    /// Obsolete! Use `KeypadBase` moving forward, or choose one of the other options: `EncoderBase`, `KeyAndEncoderBase`
    /// </summary>
    [Obsolete("PluginBase will be removed in next version. Use either 'KeypadBase' (if you don't support dials), 'EncoderBase' (for only dials), 'KeyAndEncoderBase' (for both keys and dials) instead")]
    public abstract class PluginBase : IKeypadPlugin
    {
        /// <summary>
        /// Called when a Stream Deck key is pressed
        /// </summary>
        public abstract void KeyPressed(KeyPayload payload);

        /// <summary>
        /// Called when a Stream Deck key is released
        /// </summary>
        public abstract void KeyReleased(KeyPayload payload);

        /// <summary>
        /// Called when the PropertyInspector has new settings
        /// </summary>
        /// <param name="payload"></param>
        public abstract void ReceivedSettings(ReceivedSettingsPayload payload);

        /// <summary>
        /// Called when GetGlobalSettings is called.
        /// </summary>
        /// <param name="payload"></param>
        public abstract void ReceivedGlobalSettings(ReceivedGlobalSettingsPayload payload);

        /// <summary>
        /// Called every second
        /// Logic for displaying title/image can go here
        /// </summary>
        public abstract void OnTick();

        /// <summary>
        /// Abstract method Called when the plugin is disposed
        /// </summary>
        public abstract void Dispose();

        /// <summary>
        /// Main iDisposable Dispose function
        /// </summary>
        public void Destroy()
        {
            Dispose();
            if (Connection != null)
            {
                Connection.Dispose();
            }
        }

        /// <summary>
        /// Connection object which handles your communication with the Stream Deck app
        /// </summary>
        protected ISDConnection Connection { get; private set; }

        /// <summary>
        /// Constructor for PluginBase. Receives the communication and plugin settings 
        /// Note that the settings object is not used by the base and should be consumed by the deriving class.
        /// Usually, a private class inside the deriving class is created which stores the settings
        /// Example for settings usage:
        /// * if (payload.Settings == null || payload.Settings.Count == 0)
        /// * {
        /// *         // Create default settings
        /// * }
        /// * else
        /// * {
        ///     this.settings = payload.Settings.ToObject();
        /// * }
        /// 
        /// </summary>
        /// <param name="connection">Communication module with Stream Deck</param>
        /// <param name="payload">Plugin settings - NOTE: Not used in base class, should be consumed by deriving class</param>
#pragma warning disable IDE0060 // Remove unused parameter
        public PluginBase(ISDConnection connection, InitialPayload payload)
#pragma warning restore IDE0060 // Remove unused parameter
        {
            Connection = connection;
        }
    }
}


================================================
FILE: barraider-sdtools/Backend/PluginContainer.cs
================================================
﻿using BarRaider.SdTools.Communication;
using BarRaider.SdTools.Communication.SDEvents;
using BarRaider.SdTools.Payloads;
using BarRaider.SdTools.Wrappers;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace BarRaider.SdTools
{
    class PluginContainer
    {
        private const int STREAMDECK_INITIAL_CONNECTION_TIMEOUT_SECONDS = 60;
        private StreamDeckConnection connection;
        private readonly ManualResetEvent connectEvent = new ManualResetEvent(false);
        private readonly ManualResetEvent disconnectEvent = new ManualResetEvent(false);
        private readonly SemaphoreSlim instancesLock = new SemaphoreSlim(1);
        private readonly IUpdateHandler updateHandler;
        private string pluginUUID = null;
        private StreamDeckInfo deviceInfo;
        private PluginUpdateInfo lastUpdateInfo = null;


        private static readonly Dictionary<string, Type> supportedActions = new Dictionary<string, Type>();

        // Holds all instances of plugin
        private static readonly Dictionary<string, ICommonPluginFunctions> instances = new Dictionary<string, ICommonPluginFunctions>();

        public PluginContainer(PluginActionId[] supportedActionIds, IUpdateHandler updateHandler)
        {
            this.updateHandler = updateHandler;
            foreach (PluginActionId action in supportedActionIds)
            {
                supportedActions[action.ActionId] = action.PluginBaseType;
            }
        }

        public void Run(StreamDeckOptions options)
        {
            pluginUUID = options.PluginUUID;
            deviceInfo = options.DeviceInfo;
            connection = new StreamDeckConnection(options.Port, options.PluginUUID, options.RegisterEvent);


            // Register for events
            connection.OnConnected += Connection_OnConnected;
            connection.OnDisconnected += Connection_OnDisconnected;
            connection.OnKeyDown += Connection_OnKeyDown;
            connection.OnKeyUp += Connection_OnKeyUp;
            connection.OnWillAppear += Connection_OnWillAppear;
            connection.OnWillDisappear += Connection_OnWillDisappear;
            connection.OnDialRotate += Connection_OnDialRotate;
            connection.OnDialDown += Connection_OnDialDown;
            connection.OnDialUp += Connection_OnDialUp;
            connection.OnTouchpadPress += Connection_OnTouchpadPress;

            // Settings changed
            connection.OnDidReceiveSettings += Connection_OnDidReceiveSettings;
            connection.OnDidReceiveGlobalSettings += Connection_OnDidReceiveGlobalSettings;

            // Plugin Version Updates
            if (updateHandler != null)
            {
                updateHandler.OnUpdateStatusChanged += UpdateHandler_OnUpdateStatusChanged;
                updateHandler.SetPluginConfiguration(Tools.GetExeName(), deviceInfo.Plugin.Version);
                Task.Run(() => updateHandler.CheckForUpdate());
            }

            // Start the connection
            connection.Run();
            Logger.Instance.LogMessage(TracingLevel.DEBUG, $"Plugin Loaded: UUID: {pluginUUID} Device Info: {deviceInfo}");
            Logger.Instance.LogMessage(TracingLevel.INFO, $"Plugin version: {deviceInfo.Plugin.Version}");
            Logger.Instance.LogMessage(TracingLevel.INFO, "Connecting to Stream Deck...");

            // Time to wait for initial connection
            if (connectEvent.WaitOne(TimeSpan.FromSeconds(STREAMDECK_INITIAL_CONNECTION_TIMEOUT_SECONDS)))
            {
                Logger.Instance.LogMessage(TracingLevel.INFO, "Connected to Stream Deck");

                // Initialize GlobalSettings manager
                GlobalSettingsManager.Instance.Initialize(connection);

                // We connected, loop every second until we disconnect
                while (!disconnectEvent.WaitOne(TimeSpan.FromMilliseconds(1000)))
                {
                    RunTick();
                }
            }
            Logger.Instance.LogMessage(TracingLevel.INFO, "Plugin Disconnected - Exiting");
        }

        // Button pressed
        private async void Connection_OnKeyDown(object sender, SDEventReceivedEventArgs<KeyDownEvent> e)
        {
            if (updateHandler?.IsBlockingUpdate ?? false)
            {
                if (!String.IsNullOrEmpty(lastUpdateInfo?.UpdateURL))
                {
                    await connection.OpenUrlAsync(lastUpdateInfo.UpdateURL);
                }
                return;
            }

            await instancesLock.WaitAsync();
            try
            {
#if DEBUG
                Logger.Instance.LogMessage(TracingLevel.DEBUG, $"Plugin Keydown: Context: {e.Event.Context} Action: {e.Event.Action} Payload: {e.Event.Payload?.ToStringEx()}");
#endif

                if (instances.ContainsKey(e.Event.Context))
                {
                    KeyPayload payload = new KeyPayload(e.Event.Payload.Coordinates,
                                                        e.Event.Payload.Settings, e.Event.Payload.State, e.Event.Payload.UserDesiredState, e.Event.Payload.IsInMultiAction);
                    if (instances[e.Event.Context] is IKeypadPlugin plugin)
                    {
                        plugin.KeyPressed(payload);
                    }
                    else
                    {
                        Logger.Instance.LogMessage(TracingLevel.ERROR, $"Keydown General Error: Could not convert {e.Event.Context} to IKeypadPlugin");
                    }
                }
            }
            finally
            {
                instancesLock.Release();
            }
        }

        // Button released
        private async void Connection_OnKeyUp(object sender, SDEventReceivedEventArgs<KeyUpEvent> e)
        {
            if (updateHandler?.IsBlockingUpdate ?? false)
            {
                return;
            }

            await instancesLock.WaitAsync();
            try
            {
#if DEBUG
                Logger.Instance.LogMessage(TracingLevel.DEBUG, $"Plugin Keyup: Context: {e.Event.Context} Action: {e.Event.Action} Payload: {e.Event.Payload?.ToStringEx()}");
#endif

                if (instances.ContainsKey(e.Event.Context))
                {
                    KeyPayload payload = new KeyPayload(e.Event.Payload.Coordinates,
                                                        e.Event.Payload.Settings, e.Event.Payload.State, e.Event.Payload.UserDesiredState, e.Event.Payload.IsInMultiAction);
                    if (instances[e.Event.Context] is IKeypadPlugin plugin)
                    {
                        plugin.KeyReleased(payload);
                    }
                    else
                    {
                        Logger.Instance.LogMessage(TracingLevel.ERROR, $"Keyup General Error: Could not convert {e.Event.Context} to IKeypadPlugin");
                    }
                }
            }
            finally
            {
                instancesLock.Release();
            }
        }

        // Function runs every second, used to update UI
        private async void RunTick()
        {
            if (updateHandler?.IsBlockingUpdate ?? false)
            {
                return;
            }

            await instancesLock.WaitAsync();
            try
            {
                foreach (KeyValuePair<string, ICommonPluginFunctions> kvp in instances.ToArray())
                {
                    kvp.Value.OnTick();
                }
            }
            finally
            {
                instancesLock.Release();
            }
        }

        // Action is loaded in the Stream Deck
        private async void Connection_OnWillAppear(object sender, SDEventReceivedEventArgs<WillAppearEvent> e)
        {
            SDConnection conn = new SDConnection(connection, pluginUUID, deviceInfo, e.Event.Action, e.Event.Context, e.Event.Device);
            await instancesLock.WaitAsync();
            try
            {
#if DEBUG
                Logger.Instance.LogMessage(TracingLevel.DEBUG, $"Plugin OnWillAppear: Context: {e.Event.Context} Action: {e.Event.Action} Payload: {e.Event.Payload?.ToStringEx()}");
#endif

                if (supportedActions.ContainsKey(e.Event.Action))
                {
                    try
                    {
                        if (instances.ContainsKey(e.Event.Context) && instances[e.Event.Context] != null)
                        {
                            Logger.Instance.LogMessage(TracingLevel.INFO, $"WillAppear called for already existing context {e.Event.Context} (might be inside a multi-action)");
                            return;
                        }
                        InitialPayload payload = new InitialPayload(e.Event.Payload, deviceInfo);
                        instances[e.Event.Context] = (ICommonPluginFunctions)Activator.CreateInstance(supportedActions[e.Event.Action], conn, payload);
                    }
                    catch (Exception ex)
                    {
                        Logger.Instance.LogMessage(TracingLevel.FATAL, $"Could not create instance of {supportedActions[e.Event.Action]} with context {e.Event.Context} - This may be due to an Exception raised in the constructor, or the class does not inherit PluginBase with the same constructor {ex}");
                    }
                }
                else
                {
                    Logger.Instance.LogMessage(TracingLevel.WARN, $"No plugin found that matches action: {e.Event.Action}");
                }
            }
            finally
            {
                instancesLock.Release();
            }
        }

        private async void Connection_OnWillDisappear(object sender, SDEventReceivedEventArgs<WillDisappearEvent> e)
        {
            await instancesLock.WaitAsync();
            try
            {
#if DEBUG
                Logger.Instance.LogMessage(TracingLevel.DEBUG, $"Plugin OnWillDisappear: Context: {e.Event.Context} Action: {e.Event.Action} Payload: {e.Event.Payload?.ToStringEx()}");
#endif

                if (instances.ContainsKey(e.Event.Context))
                {
                    instances[e.Event.Context].Destroy();
                    instances.Remove(e.Event.Context);
                }
            }
            finally
            {
                instancesLock.Release();
            }
        }

        // Settings updated
        private async void Connection_OnDidReceiveSettings(object sender, SDEventReceivedEventArgs<DidReceiveSettingsEvent> e)
        {
            await instancesLock.WaitAsync();
            try
            {
#if DEBUG
                Logger.Instance.LogMessage(TracingLevel.DEBUG, $"Plugin OnDidReceiveSettings: Context: {e.Event.Context} Action: {e.Event.Action} Payload: {e.Event.Payload?.ToStringEx()}");
#endif

                if (instances.ContainsKey(e.Event.Context))
                {
                    instances[e.Event.Context].ReceivedSettings(JObject.FromObject(e.Event.Payload).ToObject<ReceivedSettingsPayload>());
                }
            }
            finally
            {
                instancesLock.Release();
            }
        }

        // Global settings updated
        private async void Connection_OnDidReceiveGlobalSettings(object sender, SDEventReceivedEventArgs<DidReceiveGlobalSettingsEvent> e)
        {
            await instancesLock.WaitAsync();
            try
            {
#if DEBUG
                Logger.Instance.LogMessage(TracingLevel.DEBUG, $"Plugin OnDidReceiveGlobalSettings: Settings: {e.Event.Payload?.ToStringEx()}");
#endif

                var globalSettings = JObject.FromObject(e.Event.Payload).ToObject<ReceivedGlobalSettingsPayload>();
                foreach (string key in instances.Keys)
                {
                    instances[key].ReceivedGlobalSettings(globalSettings);
                }

                updateHandler?.SetGlobalSettings(globalSettings);
            }
            finally
            {
                instancesLock.Release();
            }
        }

        private async void Connection_OnTouchpadPress(object sender, SDEventReceivedEventArgs<TouchpadPressEvent> e)
        {
            if (updateHandler?.IsBlockingUpdate ?? false)
            {
                if (!String.IsNullOrEmpty(lastUpdateInfo?.UpdateURL))
                {
                    await connection.OpenUrlAsync(lastUpdateInfo.UpdateURL);
                }
                return;
            }

            await instancesLock.WaitAsync();
            try
            {
#if DEBUG
                Logger.Instance.LogMessage(TracingLevel.DEBUG, $"TouchpadPress: Context: {e.Event.Context} Action: {e.Event.Action} Payload: {e.Event.Payload?.ToStringEx()}");
#endif

                if (instances.ContainsKey(e.Event.Context))
                {
                    TouchpadPressPayload payload = new TouchpadPressPayload(e.Event.Payload.Coordinates,e.Event.Payload.Settings, e.Event.Payload.Controller, e.Event.Payload.IsLongPress, e.Event.Payload.TapPosition);
                    if (instances[e.Event.Context] is IEncoderPlugin plugin)
                    {
                        plugin.TouchPress(payload);
                    }
                    else
                    {
                        Logger.Instance.LogMessage(TracingLevel.ERROR, $"TouchpadPress General Error: Could not convert {e.Event.Context} to IEncoderPlugin");
                    }
                }
            }
            finally
            {
                instancesLock.Release();
            }
        }

        // Dial Up

        private async void Connection_OnDialUp(object sender, SDEventReceivedEventArgs<DialUpEvent> e)
        {
            if (updateHandler?.IsBlockingUpdate ?? false)
            {
                return;
            }

            await instancesLock.WaitAsync();
            try
            {
#if DEBUG
                Logger.Instance.LogMessage(TracingLevel.DEBUG, $"DialPress: Context: {e.Event.Context} Action: {e.Event.Action} Payload: {e.Event.Payload?.ToStringEx()}");
#endif

                if (instances.ContainsKey(e.Event.Context))
                {
                    DialPayload payload = new DialPayload(e.Event.Payload.Coordinates, e.Event.Payload.Settings, e.Event.Payload.Controller);
                    if (instances[e.Event.Context] is IEncoderPlugin plugin)
                    {
                        plugin.DialUp(payload);
                    }
                    else
                    {
                        Logger.Instance.LogMessage(TracingLevel.ERROR, $"DialDown General Error: Could not convert {e.Event.Context} to IEncoderPlugin");
                    }
                }
            }
            finally
            {
                instancesLock.Release();
            }
        }

        // Dial Down
        private async void Connection_OnDialDown(object sender, SDEventReceivedEventArgs<DialDownEvent> e)
        {
            if (updateHandler?.IsBlockingUpdate ?? false)
            {
                if (!String.IsNullOrEmpty(lastUpdateInfo?.UpdateURL))
                {
                    await connection.OpenUrlAsync(lastUpdateInfo.UpdateURL);
                }
                return;
            }

            await instancesLock.WaitAsync();
            try
            {
#if DEBUG
                Logger.Instance.LogMessage(TracingLevel.DEBUG, $"DialPress: Context: {e.Event.Context} Action: {e.Event.Action} Payload: {e.Event.Payload?.ToStringEx()}");
#endif

                if (instances.ContainsKey(e.Event.Context))
                {
                    DialPayload payload = new DialPayload(e.Event.Payload.Coordinates, e.Event.Payload.Settings, e.Event.Payload.Controller);
                    if (instances[e.Event.Context] is IEncoderPlugin plugin)
                    {
                        plugin.DialDown(payload);
                    }
                    else
                    {
                        Logger.Instance.LogMessage(TracingLevel.ERROR, $"DialDown General Error: Could not convert {e.Event.Context} to IEncoderPlugin");
                    }
                }
            }
            finally
            {
                instancesLock.Release();
            }
        }

        private async void Connection_OnDialRotate(object sender, SDEventReceivedEventArgs<DialRotateEvent> e)
        {
            if (updateHandler?.IsBlockingUpdate ?? false)
            {
                return;
            }

            await instancesLock.WaitAsync();
            try
            {
#if DEBUG
                Logger.Instance.LogMessage(TracingLevel.DEBUG, $"DialRotate: Context: {e.Event.Context} Action: {e.Event.Action} Payload: {e.Event.Payload?.ToStringEx()}");
#endif

                if (instances.ContainsKey(e.Event.Context))
                {
                    DialRotatePayload payload = new DialRotatePayload(e.Event.Payload.Coordinates, e.Event.Payload.Settings, e.Event.Payload.Controller, e.Event.Payload.Ticks, e.Event.Payload.IsDialPressed);
                    if (instances[e.Event.Context] is IEncoderPlugin plugin)
                    {
                        plugin.DialRotate(payload);
                    }
                    else
                    {
                        Logger.Instance.LogMessage(TracingLevel.ERROR, $"DialRotate General Error: Could not convert {e.Event.Context} to IEncoderPlugin");
                    }
                }
            }
            finally
            {
                instancesLock.Release();
            }
        }

        private async void UpdateHandler_OnUpdateStatusChanged(object sender, PluginUpdateInfo e)
        {
            lastUpdateInfo = e;
            if (!String.IsNullOrEmpty(e.UpdateURL))
            {
                await connection.OpenUrlAsync(e.UpdateURL);
            }

            if (!String.IsNullOrEmpty(e.UpdateImage))
            {
                await Task.Run(async () =>
                {
                    foreach (string contextId in instances.Keys.ToList())
                    {
                        await connection.SetImageAsync(e.UpdateImage, contextId, SDKTarget.HardwareAndSoftware, null);
                        await connection.SetTitleAsync(null, contextId, SDKTarget.HardwareAndSoftware, null);
                    }
                });
            }

            if (e.Status == PluginUpdateStatus.CriticalUpgrade)
            {
                Logger.Instance.LogMessage(TracingLevel.FATAL, $"Critical update needed");
                Environment.Exit(0);
            }
        }

        private void Connection_OnConnected(object sender, EventArgs e)
        {
            connectEvent.Set();
        }

        private void Connection_OnDisconnected(object sender, EventArgs e)
        {
            Logger.Instance.LogMessage(TracingLevel.INFO, "Disconnect event received");
            disconnectEvent.Set();
        }
    }
}



================================================
FILE: barraider-sdtools/Backend/SDConnection.cs
================================================
﻿using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Drawing;
using System.Threading.Tasks;
using System.Linq;
using BarRaider.SdTools.Wrappers;
using BarRaider.SdTools.Events;
using BarRaider.SdTools.Payloads;
using BarRaider.SdTools.Communication;
using BarRaider.SdTools.Communication.SDEvents;
using System.Collections.Generic;
using NLog.Layouts;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Connection object which handles your communication with the Stream Deck app
    /// </summary>
    public class SDConnection : ISDConnection
    {
        #region Private Members

        private string previousImageHash = null;

        [JsonIgnore]
        private readonly string actionId;

        /// <summary>
        /// An opaque value identifying the plugin. Received as an argument when the executable was launched.
        /// </summary>
        [JsonIgnore]
        private readonly string pluginUUID;

        /// <summary>
        /// Holds information about the devices connected to the computer
        /// </summary>
        [JsonIgnore]
        private readonly StreamDeckInfo deviceInfo;

        #endregion

        #region Public Events

        /// <summary>
        /// Event received by the plugin when the Property Inspector uses the sendToPlugin event.
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<SendToPlugin>> OnSendToPlugin;
        /// <summary>
        /// Event received when the user changes the title or title parameters.
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<TitleParametersDidChange>> OnTitleParametersDidChange;
        /// <summary>
        /// Event received when a monitored application is terminated
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<ApplicationDidTerminate>> OnApplicationDidTerminate;
        /// <summary>
        /// Event received when a monitored application is launched
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<ApplicationDidLaunch>> OnApplicationDidLaunch;
        /// <summary>
        /// Event received when a device is unplugged from the computer
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<DeviceDidDisconnect>> OnDeviceDidDisconnect;
        /// <summary>
        /// Event received when a device is plugged to the computer.
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<DeviceDidConnect>> OnDeviceDidConnect;
        /// <summary>
        /// Event received when the Property Inspector appears in the Stream Deck software user interface, for example when selecting a new instance.
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<PropertyInspectorDidAppear>> OnPropertyInspectorDidAppear;
        /// <summary>
        /// Event received when the Property Inspector for an instance is removed from the Stream Deck software user interface, for example when selecting a different instance.
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<PropertyInspectorDidDisappear>> OnPropertyInspectorDidDisappear;
        /// <summary>
        /// Event received when the computer wakes up
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<SystemDidWakeUp>> OnSystemDidWakeUp;

        #endregion

        #region Public Properties


        /// <summary>
        /// An opaque value identifying the plugin. This value is received during the Registration procedure
        /// </summary>
        [JsonIgnore]
        public String ContextId { get; private set; }

        /// <summary>
        /// An opaque value identifying the device the plugin is launched on.
        /// </summary>
        [JsonIgnore]
        public String DeviceId { get; private set; }

        /// <summary>
        /// StreamDeckConnection object, initialized based on the args received when launching the program
        /// </summary>
        [JsonIgnore]
        public StreamDeckConnection StreamDeckConnection { get; private set; }

        #endregion

        /// <summary>
        /// Public constructor, a StreamDeckConnection object is required along with the current action and context IDs
        /// These will be used to correctly communicate with the StreamDeck App
        /// </summary>
        /// <param name="connection"></param>
        /// <param name="pluginUUID"></param>
        /// <param name="deviceInfo"></param>
        /// <param name="actionId"></param>
        /// <param name="contextId"></param>
        /// /// <param name="deviceId"></param>
        public SDConnection(StreamDeckConnection connection, string pluginUUID, StreamDeckInfo deviceInfo, string actionId, string contextId, string deviceId)
        {
            StreamDeckConnection = connection;
            this.pluginUUID = pluginUUID;
            this.deviceInfo = deviceInfo;
            this.actionId = actionId;
            this.ContextId = contextId;
            this.DeviceId = deviceId;

            StreamDeckConnection.OnSendToPlugin += Connection_OnSendToPlugin;
            StreamDeckConnection.OnTitleParametersDidChange += Connection_OnTitleParametersDidChange;
            StreamDeckConnection.OnApplicationDidTerminate += Connection_OnApplicationDidTerminate;
            StreamDeckConnection.OnApplicationDidLaunch += Connection_OnApplicationDidLaunch;
            StreamDeckConnection.OnDeviceDidDisconnect += Connection_OnDeviceDidDisconnect;
            StreamDeckConnection.OnDeviceDidConnect += Connection_OnDeviceDidConnect;
            StreamDeckConnection.OnPropertyInspectorDidAppear += Connection_OnPropertyInspectorDidAppear;
            StreamDeckConnection.OnPropertyInspectorDidDisappear += Connection_OnPropertyInspectorDidDisappear;
            StreamDeckConnection.OnSystemDidWakeUp += StreamDeckConnection_OnSystemDidWakeUp;
        }

        #region Public Methods

        /// <summary>
        /// Dispose (Destructor) function
        /// </summary>
        public void Dispose()
        {
            StreamDeckConnection.OnSendToPlugin -= Connection_OnSendToPlugin;
            StreamDeckConnection.OnTitleParametersDidChange -= Connection_OnTitleParametersDidChange;
            StreamDeckConnection.OnApplicationDidTerminate -= Connection_OnApplicationDidTerminate;
            StreamDeckConnection.OnApplicationDidLaunch -= Connection_OnApplicationDidLaunch;
            StreamDeckConnection.OnDeviceDidDisconnect -= Connection_OnDeviceDidDisconnect;
            StreamDeckConnection.OnDeviceDidConnect -= Connection_OnDeviceDidConnect;
            StreamDeckConnection.OnPropertyInspectorDidAppear -= Connection_OnPropertyInspectorDidAppear;
            StreamDeckConnection.OnPropertyInspectorDidDisappear -= Connection_OnPropertyInspectorDidDisappear;
            StreamDeckConnection.OnSystemDidWakeUp -= StreamDeckConnection_OnSystemDidWakeUp;
        }

        /// <summary>
        /// Gets the Stream Deck device's info
        /// </summary>
        /// <returns></returns>
        public StreamDeckDeviceInfo DeviceInfo()
        {
            if (deviceInfo == null || string.IsNullOrEmpty(DeviceId))
            {
                Logger.Instance.LogMessage(TracingLevel.ERROR, $"Could not get DeviceInfo for DeviceId: {DeviceId} Devices: {deviceInfo?.Devices?.Length}");
                return null;
            }

            return deviceInfo.Devices.Where(d => d.Id == DeviceId).FirstOrDefault();
        }

        #endregion

        #region Public Requests

        /// <summary>
        /// Send settings to the PropertyInspector
        /// </summary>
        /// <param name="settings"></param>
        /// <returns></returns>
        public async Task SendToPropertyInspectorAsync(JObject settings)
        {
            if (StreamDeckConnection != null && !String.IsNullOrEmpty(ContextId) && !String.IsNullOrEmpty(actionId))
            {
                await StreamDeckConnection.SendToPropertyInspectorAsync(actionId, settings, ContextId);
            }
        }

        /// <summary>
        /// Persists your plugin settings
        /// </summary>
        /// <param name="settings"></param>
        /// <returns></returns>
        public async Task SetSettingsAsync(JObject settings)
        {
            if (StreamDeckConnection != null && !String.IsNullOrEmpty(ContextId) && !String.IsNullOrEmpty(actionId))
            {
                await StreamDeckConnection.SetSettingsAsync(settings, ContextId);
            }
        }

        /// <summary>
        /// Persists your global plugin settings
        /// </summary>
        /// <param name="settings">Settings to save globally</param>
        /// <param name="triggerDidReceiveGlobalSettings">Boolean whether to also trigger a didReceiveGlobalSettings event. Default is true</param>
        /// <returns></returns>
        public async Task SetGlobalSettingsAsync(JObject settings, bool triggerDidReceiveGlobalSettings = true)
        {
            if (StreamDeckConnection != null)
            {
                await StreamDeckConnection.SetGlobalSettingsAsync(settings);

                if (triggerDidReceiveGlobalSettings)
                {
                    await GetGlobalSettingsAsync();
                }
            }
        }

        /// <summary>
        /// Persists your global plugin settings
        /// </summary>
        /// <returns></returns>
        public async Task GetGlobalSettingsAsync()
        {
            if (StreamDeckConnection != null)
            {
                await StreamDeckConnection.GetGlobalSettingsAsync();
            }
        }

        /// <summary>
        /// Sets an image on the StreamDeck key.
        /// </summary>
        /// <param name="base64Image">Base64 encoded image</param>
        /// <param name="state">A 0-based integer value representing the state of an action with multiple states. This is an optional parameter. If not specified, the title is set to all states.</param>
        /// <param name="forceSendToStreamdeck">Should image be sent even if it is identical to the one sent previously. Default is false</param>
        /// <returns></returns>
        public async Task SetImageAsync(string base64Image, int? state = null, bool forceSendToStreamdeck = false)
        {
            string hash = Tools.StringToSHA512(base64Image);
            if (forceSendToStreamdeck || hash != previousImageHash)
            {
                previousImageHash = hash;
                await StreamDeckConnection.SetImageAsync(base64Image, ContextId, SDKTarget.HardwareAndSoftware, state);
            }
        }

        /// <summary>
        /// Sets an image on the StreamDeck key
        /// </summary>
        /// <param name="image">Image object</param>
        /// <param name="state">A 0-based integer value representing the state of an action with multiple states. This is an optional parameter. If not specified, the title is set to all states.</param>
        /// <param name="forceSendToStreamdeck">Should image be sent even if it is identical to the one sent previously. Default is false</param>
        /// <returns></returns>
        public async Task SetImageAsync(Image image, int? state = null, bool forceSendToStreamdeck = false)
        {
            string hash = Tools.ImageToSHA512(image);
            if (forceSendToStreamdeck || hash != previousImageHash)
            {
                previousImageHash = hash;
                await StreamDeckConnection.SetImageAsync(image, ContextId, SDKTarget.HardwareAndSoftware, state);
            }
        }

        /// <summary>
        /// Sets the default image for this state, as configured in the manifest
        /// </summary>
        /// <returns></returns>
        public async Task SetDefaultImageAsync()
        {
            await SetImageAsync((String)null);
        }

        /// <summary>
        /// Sets a title on the StreamDeck key
        /// </summary>
        /// <param name="title"></param>
        /// <param name="state">A 0-based integer value representing the state of an action with multiple states. This is an optional parameter. If not specified, the title is set to all states.</param>
        /// <returns></returns>
        public async Task SetTitleAsync(string title, int? state = null)
        {
            await StreamDeckConnection.SetTitleAsync(title, ContextId, SDKTarget.HardwareAndSoftware, state);
        }

        /// <summary>
        /// Switches to one of the plugin's built-in profiles
        /// </summary>
        /// <param name="profileName"></param>
        /// <returns></returns>
        public async Task SwitchProfileAsync(string profileName)
        {
            await StreamDeckConnection.SwitchToProfileAsync(this.DeviceId, profileName, this.pluginUUID);
        }

        /// <summary>
        /// Switches to one of the plugin's built-in profiles. Allows to choose which device to switch it on.
        /// </summary>
        /// <param name="profileName"></param>
        /// <param name="deviceId"></param>
        /// <returns></returns>
        public async Task SwitchProfileAsync(string profileName, string deviceId)
        {
            await StreamDeckConnection.SwitchToProfileAsync(deviceId, profileName, this.pluginUUID);
        }

        /// <summary>
        /// Shows the Alert (Yellow Triangle) on the StreamDeck key
        /// </summary>
        /// <returns></returns>
        public async Task ShowAlert()
        {
            await StreamDeckConnection.ShowAlertAsync(ContextId);
        }

        /// <summary>
        /// Shows the Success (Green checkmark) on the StreamDeck key
        /// </summary>
        /// <returns></returns>
        public async Task ShowOk()
        {
            await StreamDeckConnection.ShowOkAsync(ContextId);
        }

        /// <summary>
        /// Add a message to the Stream Deck log. This is the log located at: %appdata%\Elgato\StreamDeck\logs\StreamDeck0.log
        /// </summary>
        /// <param name="message"></param>
        /// <returns></returns>
        public async Task LogSDMessage(string message)
        {
            await StreamDeckConnection.LogMessageAsync(message);
        }

        /// <summary>
        /// Tells Stream Deck to return the current plugin settings via the ReceivedSettings function
        /// </summary>
        /// <returns></returns>
        public async Task GetSettingsAsync()
        {
            await StreamDeckConnection.GetSettingsAsync(ContextId);
        }

        /// <summary>
        /// Opens a URI in the user's browser
        /// </summary>
        /// <param name="uri"></param>
        /// <returns></returns>
        public async Task OpenUrlAsync(string uri)
        {
            await StreamDeckConnection.OpenUrlAsync(uri);
        }

        /// <summary>
        /// Opens a URI in the user's browser
        /// </summary>
        /// <param name="uri"></param>
        /// <returns></returns>
        public async Task OpenUrlAsync(Uri uri)
        {
            await StreamDeckConnection.OpenUrlAsync(uri);
        }

        /// <summary>
        /// Sets the plugin to a specific state which is pre-configured in the manifest file
        /// </summary>
        /// <param name="state"></param>
        /// <returns></returns>
        public async Task SetStateAsync(uint state)
        {
            await StreamDeckConnection.SetStateAsync(state, ContextId);
        }

        /// <summary>
        /// Sets the values of touchpad layouts items
        /// </summary>
        /// <param name="dictKeyValues"></param>
        /// <returns></returns>
        public async Task SetFeedbackAsync(Dictionary<string, string> dictKeyValues)
        {
            await StreamDeckConnection.SetFeedbackAsync(dictKeyValues, ContextId);
        }

        /// <summary>
        /// Sets the value of a single touchpad layout item
        /// </summary>
        /// <returns></returns>
        public async Task SetFeedbackAsync(string layoutItemKey, string value)
        {
            await StreamDeckConnection.SetFeedbackAsync(new Dictionary<string, string>() { { layoutItemKey, value } }, ContextId);
        }

        /// <summary>
        /// Sets the value of a single touchpad layout item
        /// </summary>
        /// <returns></returns>
        public async Task SetFeedbackAsync(JObject feedbackPayload)
        {
            await StreamDeckConnection.SetFeedbackAsync(feedbackPayload, ContextId);
        }


        /// <summary>
        /// Changes the current Stream Deck+ touch display layout
        /// </summary>
        /// <returns></returns>
        public async Task SetFeedbackLayoutAsync(string layout)
        {
            await StreamDeckConnection.SetFeedbackLayoutAsync(layout, ContextId);
        }

        #endregion

        #region Event Wrappers

        private void Connection_OnPropertyInspectorDidDisappear(object sender, SDEventReceivedEventArgs<PropertyInspectorDidDisappearEvent> e)
        {
            if (e.Event.Context == ContextId)
            {
                OnPropertyInspectorDidDisappear?.Invoke(this, new SDEventReceivedEventArgs<PropertyInspectorDidDisappear>(new PropertyInspectorDidDisappear(e.Event.Action, e.Event.Context, e.Event.Device)));
            }
        }

        private void Connection_OnPropertyInspectorDidAppear(object sender, SDEventReceivedEventArgs<PropertyInspectorDidAppearEvent> e)
        {
            if (e.Event.Context == ContextId)
            {
                OnPropertyInspectorDidAppear?.Invoke(this, new SDEventReceivedEventArgs<PropertyInspectorDidAppear>(new PropertyInspectorDidAppear(e.Event.Action, e.Event.Context, e.Event.Device)));
            }
        }

        private void Connection_OnDeviceDidConnect(object sender, SDEventReceivedEventArgs<DeviceDidConnectEvent> e)
        {
            OnDeviceDidConnect?.Invoke(this, new SDEventReceivedEventArgs<DeviceDidConnect>(new DeviceDidConnect(e.Event.DeviceInfo)));
        }

        private void Connection_OnDeviceDidDisconnect(object sender, SDEventReceivedEventArgs<DeviceDidDisconnectEvent> e)
        {
            OnDeviceDidDisconnect?.Invoke(this, new SDEventReceivedEventArgs<DeviceDidDisconnect>(new DeviceDidDisconnect(e.Event.Device)));
        }

        private void Connection_OnApplicationDidTerminate(object sender, SDEventReceivedEventArgs<ApplicationDidTerminateEvent> e)
        {
            OnApplicationDidTerminate?.Invoke(this, new SDEventReceivedEventArgs<ApplicationDidTerminate>(new ApplicationDidTerminate(new Payloads.ApplicationPayload(e.Event.Payload.Application))));
        }

        private void Connection_OnApplicationDidLaunch(object sender, SDEventReceivedEventArgs<ApplicationDidLaunchEvent> e)
        {
            OnApplicationDidLaunch?.Invoke(this, new SDEventReceivedEventArgs<ApplicationDidLaunch>(new ApplicationDidLaunch(new Payloads.ApplicationPayload(e.Event.Payload.Application))));
        }

        private void Connection_OnTitleParametersDidChange(object sender, SDEventReceivedEventArgs<TitleParametersDidChangeEvent> e)
        {
            if (e.Event.Context == ContextId)
            {
                // Special case to take into account that TitleParameters arrives right after an OnWillAppear
                if (OnTitleParametersDidChange == null)
                {
                    if (sender != this)
                    {
                        Task.Run(async () =>
                        {
                            await Task.Delay(1000);
                            Connection_OnTitleParametersDidChange(this, e);
                        });
                    }
                    return;
                }

                var payload = e.Event.Payload;
                var newPayload = new TitleParametersPayload(payload.Settings, payload.Coordinates, payload.State, payload.Title, payload.TitleParameters);
                OnTitleParametersDidChange?.Invoke(this, new SDEventReceivedEventArgs<TitleParametersDidChange>(new TitleParametersDidChange(e.Event.Action, e.Event.Context, e.Event.Device, newPayload)));
            }
        }

        private void Connection_OnSendToPlugin(object sender, SDEventReceivedEventArgs<SendToPluginEvent> e)
        {
            if (e.Event.Context == ContextId)
            {
                OnSendToPlugin?.Invoke(this, new SDEventReceivedEventArgs<SendToPlugin>(new SendToPlugin(e.Event.Action, e.Event.Context, e.Event.Payload)));
            }
        }

        private void StreamDeckConnection_OnSystemDidWakeUp(object sender, SDEventReceivedEventArgs<SystemDidWakeUpEvent> e)
        {
            OnSystemDidWakeUp?.Invoke(this, new SDEventReceivedEventArgs<SystemDidWakeUp>(new SystemDidWakeUp()));
        }

        #endregion
    }
}



================================================
FILE: barraider-sdtools/Backend/SDWrapper.cs
================================================
﻿using BarRaider.SdTools;
using BarRaider.SdTools.Payloads;
using CommandLine;
using System;

namespace BarRaider.SdTools
{
    /// <summary>
    /// * Easy Configuration Instructions:
    ///* 1. Use NuGet to get the following packages: 
    ///*          CommandLineParser by gsscoder
    ///*          streamdeck-client-csharp by Shane DeSeranno
    ///*          Newtonsoft.Json by James Newton-King
    ///* 2. Create a class that implements the IPluginable interface (which is located in BarRaider.SDTools), this will be your main plugin
    ///* 3. Pass the type of the class to the main function
    /// </summary>
    public static class SDWrapper
    {
        // Handles all the communication with the plugin
        private static PluginContainer container;

        /// /************************************************************************
        /// * Initial configuration from TyrenDe's streamdeck-client-csharp example:
        /// * https://github.com/TyrenDe/streamdeck-client-csharp
        /// * and SaviorXTanren's MixItUp.StreamDeckPlugin:
        /// * https://github.com/SaviorXTanren/mixer-mixitup/
        /// *************************************************************************/


        /// <summary>
        /// Library's main initialization point. 
        /// Pass the args from your Main function. We'll handle the rest
        /// </summary>
        /// <param name="args"></param>
        /// <param name="updateHandler"></param>
        public static void Run(string[] args, IUpdateHandler updateHandler = null)
        {
            Run(args, Tools.AutoLoadPluginActions(), updateHandler);
        }

        /// <summary>
        /// Library's main initialization point. 
        /// Pass the args from your Main function and a list of supported PluginActionIds, the framework will handle the rest.
        /// </summary>
        /// <param name="args"></param>
        /// <param name="supportedActionIds"></param>
        /// /// <param name="updateHandler"></param>
        private static void Run(string[] args, PluginActionId[] supportedActionIds, IUpdateHandler updateHandler)
        {
            Logger.Instance.LogMessage(TracingLevel.INFO, $"Plugin [{Tools.GetExeName()}] Loading - {supportedActionIds.Length} Actions Found");
            System.AppDomain.CurrentDomain.UnhandledException += UnhandledExceptionTrapper;

#if DEBUG
            Logger.Instance.LogMessage(TracingLevel.DEBUG, $"Plugin Loading - Args: {String.Join(" ", args)}");
#endif

            // The command line args parser expects all args to use `--`, so, let's append
            for (int count = 0; count < args.Length; count++)
            {
                if (args[count].StartsWith("-") && !args[count].StartsWith("--"))
                {
                    args[count] = $"-{args[count]}";
                }
            }

            Parser parser = new Parser((with) =>
            {
                with.EnableDashDash = true;
                with.CaseInsensitiveEnumValues = true;
                with.CaseSensitive = false;
                with.IgnoreUnknownArguments = true;
                with.HelpWriter = Console.Error;
            });

            ParserResult<StreamDeckOptions> options = parser.ParseArguments<StreamDeckOptions>(args);
            options.WithParsed<StreamDeckOptions>(o => RunPlugin(o, supportedActionIds, updateHandler));
        }


        private static void RunPlugin(StreamDeckOptions options, PluginActionId[] supportedActionIds, IUpdateHandler updateHandler)
        {
            container = new PluginContainer(supportedActionIds, updateHandler);
            container.Run(options);
        }

        private static void UnhandledExceptionTrapper(object sender, UnhandledExceptionEventArgs e)
        {
            Logger.Instance.LogMessage(TracingLevel.FATAL, $"Unhandled Exception: {e.ExceptionObject}");
        }
    }
}


================================================
FILE: barraider-sdtools/Communication/IPayload.cs
================================================
﻿namespace BarRaider.SdTools.Communication
{
    internal interface IPayload
    {
    }
}



================================================
FILE: barraider-sdtools/Communication/SDKTarget.cs
================================================
﻿namespace BarRaider.SdTools.Communication
{
    /// <summary>
    /// Target to send Title/Image to
    /// </summary>
    public enum SDKTarget : int
    {
        /// <summary>
        /// Send to both App and Device
        /// </summary>
        HardwareAndSoftware = 0,

        /// <summary>
        /// Send only to device
        /// </summary>
        HardwareOnly = 1,

        /// <summary>
        /// Send only to app
        /// </summary>
        SoftwareOnly = 2,
    }
}



================================================
FILE: barraider-sdtools/Communication/StreamDeckConnection.cs
================================================
﻿using BarRaider.SdTools.Communication.Messages;
using BarRaider.SdTools.Communication.SDEvents;
using BarRaider.SdTools.Wrappers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace BarRaider.SdTools.Communication
{
    /// <summary>
    /// Underlying object that communicates with the stream deck app
    /// </summary>
    public class StreamDeckConnection
    {
        private const int BufferSize = 1024 * 1024;

        private ClientWebSocket webSocket;
        private readonly SemaphoreSlim sendSocketSemaphore = new SemaphoreSlim(1);
        private readonly CancellationTokenSource cancelTokenSource = new CancellationTokenSource();
        private readonly string registerEvent;

        /// <summary>
        /// The port used to connect to the StreamDeck websocket
        /// </summary>
        public int Port { get; private set; }

        /// <summary>
        /// This is the unique identifier used to communicate with the register StreamDeck plugin.
        /// </summary>
        public string UUID { get; private set; }

        #region Public Events

        /// <summary>
        /// Raised when plugin is connected to stream deck app
        /// </summary>
        public event EventHandler<EventArgs> OnConnected;

        /// <summary>
        /// /// Raised when plugin is disconnected from stream deck app
        /// </summary>
        public event EventHandler<EventArgs> OnDisconnected;

        /// <summary>
        /// Raised when key is pushed down
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<KeyDownEvent>> OnKeyDown;

        /// <summary>
        /// Raised when key is released
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<KeyUpEvent>> OnKeyUp;

        /// <summary>
        /// Raised when the action is shown, main trigger for a PluginAction
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<WillAppearEvent>> OnWillAppear;

        /// <summary>
        /// Raised when the action is no longer shown, main trigger for Dispose of PluginAction
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<WillDisappearEvent>> OnWillDisappear;

        /// <summary>
        /// Contains information on the Title and its style
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<TitleParametersDidChangeEvent>> OnTitleParametersDidChange;

        /// <summary>
        /// Raised when a Stream Deck device is connected to the PC
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<DeviceDidConnectEvent>> OnDeviceDidConnect;

        /// <summary>
        /// Raised when a Stream Deck device has disconnected from the PC
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<DeviceDidDisconnectEvent>> OnDeviceDidDisconnect;

        /// <summary>
        /// Raised when a monitored app is launched/active
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<ApplicationDidLaunchEvent>> OnApplicationDidLaunch;

        /// <summary>
        /// Raised when a monitored app is terminated
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<ApplicationDidTerminateEvent>> OnApplicationDidTerminate;

        /// <summary>
        /// Raised after the PC wakes up from sleep
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<SystemDidWakeUpEvent>> OnSystemDidWakeUp;

        /// <summary>
        /// Raised when settings for the action are received
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<DidReceiveSettingsEvent>> OnDidReceiveSettings;

        /// <summary>
        /// Raised when global settings for the entire plugin are received
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<DidReceiveGlobalSettingsEvent>> OnDidReceiveGlobalSettings;

        /// <summary>
        /// Raised when the user is viewing the settings in the Stream Deck app
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<PropertyInspectorDidAppearEvent>> OnPropertyInspectorDidAppear;

        /// <summary>
        /// Raised when the user stops viewing the settings in the Stream Deck app
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<PropertyInspectorDidDisappearEvent>> OnPropertyInspectorDidDisappear;

        /// <summary>
        /// Raised when a payload is sent to the plugin from the PI
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<SendToPluginEvent>> OnSendToPlugin;

        /// <summary>
        /// Raised when a dial is rotated
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<DialRotateEvent>> OnDialRotate;

        /// <summary>
        /// Raised when a dial is down
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<DialDownEvent>> OnDialDown;

        /// <summary>
        /// Raised when a dial is up
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<DialUpEvent>> OnDialUp;

        /// <summary>
        /// Raised when the tochpad is pressed
        /// </summary>
        public event EventHandler<SDEventReceivedEventArgs<TouchpadPressEvent>> OnTouchpadPress;

        #endregion

        internal StreamDeckConnection(int port, string uuid, string registerEvent)
        {
            this.Port = port;
            this.UUID = uuid;
            this.registerEvent = registerEvent;
        }

        internal void Run()
        {
            if (webSocket == null)
            {
                webSocket = new ClientWebSocket();
                _ = this.RunAsync();
            }
        }

        internal void Stop()
        {
            cancelTokenSource.Cancel();
        }

        internal Task SendAsync(IMessage message)
        {
            try
            {
                return SendAsync(JsonConvert.SerializeObject(message));
            }
            catch (Exception ex)
            {
                Logger.Instance.LogMessage(TracingLevel.ERROR, $"{this.GetType()} SDTools SendAsync Exception: {ex}");
            }
            return null;
        }

        #region Requests

        internal Task SetTitleAsync(string title, string context, SDKTarget target, int? state)
        {
            return SendAsync(new SetTitleMessage(title, context, target, state));
        }

        internal Task LogMessageAsync(string message)
        {
            return SendAsync(new LogMessage(message));
        }

        internal Task SetImageAsync(Image image, string context, SDKTarget target, int? state)
        {
            try
            {
                using (MemoryStream memoryStream = new MemoryStream())
                {
                    image.Save(memoryStream, ImageFormat.Png);
                    byte[] imageBytes = memoryStream.ToArray();

                    // Convert byte[] to Base64 String
                    string base64String = $"data:image/png;base64,{Convert.ToBase64String(imageBytes)}";
                    return SetImageAsync(base64String, context, target, state);
                }
            }
            catch (Exception ex)
            {
                Logger.Instance.LogMessage(TracingLevel.ERROR, $"{this.GetType()} SetImageAsync Exception: {ex}");
            }
            return null;
        }

        internal Task SetImageAsync(string base64Image, string context, SDKTarget target, int? state)
        {
            return SendAsync(new SetImageMessage(base64Image, context, target, state));
        }

        internal Task ShowAlertAsync(string context)
        {
            return SendAsync(new ShowAlertMessage(context));
        }

        internal Task ShowOkAsync(string context)
        {
            return SendAsync(new ShowOkMessage(context));
        }

        internal Task SetGlobalSettingsAsync(JObject settings)
        {
            return SendAsync(new SetGlobalSettingsMessage(settings, this.UUID));
        }

        internal Task GetGlobalSettingsAsync()
        {
            return SendAsync(new GetGlobalSettingsMessage(this.UUID));
        }

        internal Task SetSettingsAsync(JObject settings, string context)
        {
            return SendAsync(new SetSettingsMessage(settings, context));
        }

        internal Task GetSettingsAsync(string context)
        {
            return SendAsync(new GetSettingsMessage(context));
        }

        internal Task SetStateAsync(uint state, string context)
        {
            return SendAsync(new SetStateMessage(state, context));
        }

        internal Task SendToPropertyInspectorAsync(string action, JObject data, string context)
        {
            return SendAsync(new SendToPropertyInspectorMessage(action, data, context));
        }

        internal Task SwitchToProfileAsync(string device, string profileName, string context)
        {
            return SendAsync(new SwitchToProfileMessage(device, profileName, context));
        }
        internal Task OpenUrlAsync(string uri)
        {
            return OpenUrlAsync(new Uri(uri));
        }

        internal Task OpenUrlAsync(Uri uri)
        {
            return SendAsync(new OpenUrlMessage(uri));
        }

        internal Task SetFeedbackAsync(Dictionary<string, string> dictKeyValues, string context)
        {
            return SendAsync(new SetFeedbackMessage(dictKeyValues, context));
        }

        internal Task SetFeedbackAsync(JObject feedbackPayload, string context)
        {
            return SendAsync(new SetFeedbackMessageEx(feedbackPayload, context));
        }

        internal Task SetFeedbackLayoutAsync(string layout, string context)
        {
            return SendAsync(new SetFeedbackLayoutMessage(layout, context));
        }

        #endregion

        #region Private Methods

        private async Task SendAsync(string text)
        {
            try
            {
                if (webSocket != null)
                {
                    try
                    {
                        await sendSocketSemaphore.WaitAsync();
                        byte[] buffer = Encoding.UTF8.GetBytes(text);
                        await webSocket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, cancelTokenSource.Token);
                    }
                    finally
                    {
                        sendSocketSemaphore.Release();
                    }
                }
            }
            catch (Exception ex)
            {
                Logger.Instance.LogMessage(TracingLevel.FATAL, $"{this.GetType()} SendAsync Exception: {ex}");
                await DisconnectAsync();
            }

        }

        private async Task RunAsync()
        {
            try
            {
                await webSocket.ConnectAsync(new Uri($"ws://localhost:{this.Port}"), cancelTokenSource.Token);
                if (webSocket.State != WebSocketState.Open)
                {

                    Logger.Instance.LogMessage(TracingLevel.FATAL, $"{this.GetType()} RunAsync failed - Websocket not open {webSocket.State}");
                    await DisconnectAsync();
                    return;
                }

                await SendAsync(new RegisterEventMessage(registerEvent, this.UUID));

                OnConnected?.Invoke(this, new EventArgs());
                await ReceiveAsync();
            }
            catch (Exception ex)
            {
                Logger.Instance.LogMessage(TracingLevel.FATAL, $"{this.GetType()} ReceiveAsync Exception: {ex}");
            }
            finally
            {
                Logger.Instance.LogMessage(TracingLevel.INFO, $"{this.GetType()} RunAsync completed, shutting down");
                await DisconnectAsync();
            }
        }

        private async Task<WebSocketCloseStatus> ReceiveAsync()
        {
            byte[] buffer = new byte[BufferSize];
            ArraySegment<byte> arrayBuffer = new ArraySegment<byte>(buffer);
            StringBuilder textBuffer = new StringBuilder(BufferSize);

            try
            {
                while (!cancelTokenSource.IsCancellationRequested && webSocket != null)
                {
                    WebSocketReceiveResult result = await webSocket.ReceiveAsync(arrayBuffer, cancelTokenSource.Token);

                    if (result != null)
                    {
                        if (result.MessageType == WebSocketMessageType.Close ||
                            (result.CloseStatus != null && result.CloseStatus.HasValue && result.CloseStatus.Value != WebSocketCloseStatus.Empty))
                        {
                            string closeStatus = (result.CloseStatus == null) ? "None" : (result.CloseStatus.HasValue) ? result.CloseStatus.Value.ToString() : "None";
                            Logger.Instance.LogMessage(TracingLevel.INFO, $"{this.GetType()} Received websocket close message. MessageType: {result.MessageType} CloseStatus: {closeStatus}");
                            return result.CloseStatus.GetValueOrDefault();
                        }
                        else if (result.MessageType == WebSocketMessageType.Text)
                        {
                            textBuffer.Append(Encoding.UTF8.GetString(buffer, 0, result.Count));
                            if (result.EndOfMessage)
                            {
#if DEBUG
                                Logger.Instance.LogMessage(TracingLevel.DEBUG, $"Incoming Message: {textBuffer}");
#endif

                                string strBuffer = textBuffer.ToString();
                                textBuffer.Clear();
                                BaseEvent evt = BaseEvent.Parse(strBuffer);
                                if (evt == null)
                                {
                                    Logger.Instance.LogMessage(TracingLevel.WARN, $"{this.GetType()} Unknown event received from Stream Deck: {strBuffer}");
                                    continue;
                                }

                                try
                                {
                                    switch (evt.Event)
                                    {
                                        case EventTypes.KeyDown: OnKeyDown?.Invoke(this, new SDEventReceivedEventArgs<KeyDownEvent>(evt as KeyDownEvent)); break;
                                        case EventTypes.KeyUp: OnKeyUp?.Invoke(this, new SDEventReceivedEventArgs<KeyUpEvent>(evt as KeyUpEvent)); break;
                                        case EventTypes.WillAppear: OnWillAppear?.Invoke(this, new SDEventReceivedEventArgs<WillAppearEvent>(evt as WillAppearEvent)); break;
                                        case EventTypes.WillDisappear: OnWillDisappear?.Invoke(this, new SDEventReceivedEventArgs<WillDisappearEvent>(evt as WillDisappearEvent)); break;
                                        case EventTypes.TitleParametersDidChange: OnTitleParametersDidChange?.Invoke(this, new SDEventReceivedEventArgs<TitleParametersDidChangeEvent>(evt as TitleParametersDidChangeEvent)); break;
                                        case EventTypes.DeviceDidConnect: OnDeviceDidConnect?.Invoke(this, new SDEventReceivedEventArgs<DeviceDidConnectEvent>(evt as DeviceDidConnectEvent)); break;
                                        case EventTypes.DeviceDidDisconnect: OnDeviceDidDisconnect?.Invoke(this, new SDEventReceivedEventArgs<DeviceDidDisconnectEvent>(evt as DeviceDidDisconnectEvent)); break;
                                        case EventTypes.ApplicationDidLaunch: OnApplicationDidLaunch?.Invoke(this, new SDEventReceivedEventArgs<ApplicationDidLaunchEvent>(evt as ApplicationDidLaunchEvent)); break;
                                        case EventTypes.ApplicationDidTerminate: OnApplicationDidTerminate?.Invoke(this, new SDEventReceivedEventArgs<ApplicationDidTerminateEvent>(evt as ApplicationDidTerminateEvent)); break;
                                        case EventTypes.SystemDidWakeUp: OnSystemDidWakeUp?.Invoke(this, new SDEventReceivedEventArgs<SystemDidWakeUpEvent>(evt as SystemDidWakeUpEvent)); break;
                                        case EventTypes.DidReceiveSettings: OnDidReceiveSettings?.Invoke(this, new SDEventReceivedEventArgs<DidReceiveSettingsEvent>(evt as DidReceiveSettingsEvent)); break;
                                        case EventTypes.DidReceiveGlobalSettings: OnDidReceiveGlobalSettings?.Invoke(this, new SDEventReceivedEventArgs<DidReceiveGlobalSettingsEvent>(evt as DidReceiveGlobalSettingsEvent)); break;
                                        case EventTypes.PropertyInspectorDidAppear: OnPropertyInspectorDidAppear?.Invoke(this, new SDEventReceivedEventArgs<PropertyInspectorDidAppearEvent>(evt as PropertyInspectorDidAppearEvent)); break;
                                        case EventTypes.PropertyInspectorDidDisappear: OnPropertyInspectorDidDisappear?.Invoke(this, new SDEventReceivedEventArgs<PropertyInspectorDidDisappearEvent>(evt as PropertyInspectorDidDisappearEvent)); break;
                                        case EventTypes.SendToPlugin: OnSendToPlugin?.Invoke(this, new SDEventReceivedEventArgs<SendToPluginEvent>(evt as SendToPluginEvent)); break;
                                        case EventTypes.DialRotate: OnDialRotate?.Invoke(this, new SDEventReceivedEventArgs<DialRotateEvent>(evt as DialRotateEvent)); break;
                                        case EventTypes.DialDown: OnDialDown?.Invoke(this, new SDEventReceivedEventArgs<DialDownEvent>(evt as DialDownEvent)); break;
                                        case EventTypes.DialUp: OnDialUp?.Invoke(this, new SDEventReceivedEventArgs<DialUpEvent>(evt as DialUpEvent)); break;
                                        case EventTypes.DialPress: /* Ignoring deprecated Stream Deck event;*/ break;
                                        case EventTypes.TouchpadPress: OnTouchpadPress?.Invoke(this, new SDEventReceivedEventArgs<TouchpadPressEvent>(evt as TouchpadPressEvent)); break;
                                        default:
                                            Logger.Instance.LogMessage(TracingLevel.WARN, $"{this.GetType()} Unsupported Stream Deck event: {strBuffer}");
                                            break;
                                    }
                                }
                                catch (Exception ex)
                                {
                                    Logger.Instance.LogMessage(TracingLevel.ERROR, $"{this.GetType()} Unhandled 3rd party exception when triggering {evt.Event} event. Exception: {ex}");
                                }

                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Logger.Instance.LogMessage(TracingLevel.FATAL, $"{this.GetType()} ReceiveAsync Exception: {ex}");
            }

            Logger.Instance.LogMessage(TracingLevel.INFO, $"{this.GetType()} ReceiveAsync ended with CancelToken: {cancelTokenSource.IsCancellationRequested} Websocket: {(webSocket == null ? "null" : "valid")}");
            return WebSocketCloseStatus.NormalClosure;
        }

        private async Task DisconnectAsync()
        {
            if (webSocket != null)
            {
                ClientWebSocket socket = webSocket;
                webSocket = null;

                try
                {
                    await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Disconnecting", cancelTokenSource.Token);
                }
                catch (Exception ex)
                {
                    Logger.Instance.LogMessage(TracingLevel.ERROR, $"{this.GetType()} DisconnectAsync failed to close connection. Exception: {ex}");
                }


                try
                {
                    socket.Dispose();
                }
                catch (Exception ex)
                {
                    Logger.Instance.LogMessage(TracingLevel.ERROR, $"{this.GetType()} DisconnectAsync failed to dispose websocket. Exception: {ex}");
                }

                OnDisconnected?.Invoke(this, EventArgs.Empty);
            }
        }

        #endregion
    }
}



================================================
FILE: barraider-sdtools/Communication/Messages/EmptyPayload.cs
================================================
﻿namespace BarRaider.SdTools.Communication.Messages
{
    /// <summary>
    /// Empty payload in event
    /// </summary>
    public class EmptyPayload : IPayload
    {
    }
}



================================================
FILE: barraider-sdtools/Communication/Messages/GetGlobalSettingsMessage.cs
================================================
﻿using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BarRaider.SdTools.Communication.Messages
{
    internal class GetGlobalSettingsMessage : IMessage
    {
        [JsonProperty("event")]
        public string Event { get { return "getGlobalSettings"; } }

        [JsonProperty("context")]
        public string Context { get; private set; }

        public GetGlobalSettingsMessage(string pluginUUID)
        {
            this.Context = pluginUUID;
        }
    }
}



================================================
FILE: barraider-sdtools/Communication/Messages/GetSettingsMessage.cs
================================================
﻿using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BarRaider.SdTools.Communication.Messages
{
    internal class GetSettingsMessage : IMessage
    {
        [JsonProperty("event")]
        public string Event { get { return "getSettings"; } }

        [JsonProperty("context")]
        public string Context { get; private set; }

        public GetSettingsMessage(string context)
        {
            this.Context = context;
        }
    }
}



================================================
FILE: barraider-sdtools/Communication/Messages/IMessage.cs
================================================
﻿namespace BarRaider.SdTools.Communication.Messages
{
    internal interface IMessage
    {
        string Event { get; }
    }
}



================================================
FILE: barraider-sdtools/Communication/Messages/LogMessage.cs
================================================
﻿using Newtonsoft.Json;

namespace BarRaider.SdTools.Communication.Messages
{
    internal class LogMessage : IMessage
    {
        [JsonProperty("event")]
        public string Event { get { return "logMessage"; } }

        [JsonProperty("payload")]
        public IPayload Payload { get; private set; }

        public LogMessage(string message)
        {
            this.Payload = new PayloadClass(message);
        }

        private class PayloadClass : IPayload
        {
            [JsonProperty("message")]
            public string Message { get; private set; }

            public PayloadClass(string message)
            {
                this.Message = message;
            }
        }
    }
}



================================================
FILE: barraider-sdtools/Communication/Messages/OpenUrlMessage.cs
================================================
﻿using Newtonsoft.Json;
using System;

namespace BarRaider.SdTools.Communication.Messages
{
    internal class OpenUrlMessage : IMessage
    {
        [JsonProperty("event")]
        public string Event { get { return "openUrl"; } }

        [JsonProperty("payload")]
        public IPayload Payload { get; private set; }

        public OpenUrlMessage(Uri uri)
        {
            this.Payload = new PayloadClass(uri);
        }

        private class PayloadClass : IPayload
        {
            [JsonProperty("url")]
            public string Url { get; private set; }

            public PayloadClass(Uri uri)
            {
                this.Url = uri.ToString();
            }
        }
    }
}



================================================
FILE: barraider-sdtools/Communication/Messages/RegisterEventMessage.cs
================================================
﻿using Newtonsoft.Json;
using System;

namespace BarRaider.SdTools.Communication.Messages
{
    internal class RegisterEventMessage : IMessage
    {
        [JsonProperty("event")]
        public string Event { get; private set; }

        [JsonProperty("uuid")]
        public string UUID { get; private set; }

        public RegisterEventMessage(string eventName, string uuid)
        {
            this.Event = eventName;
            this.UUID = uuid;
        }
    }
}



================================================
FILE: barraider-sdtools/Communication/Messages/SendToPropertyInspectorMessage.cs
================================================
﻿using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BarRaider.SdTools.Communication.Messages
{
    internal class SendToPropertyInspectorMessage : IMessage
    {
        [JsonProperty("event")]
        public string Event { get { return "sendToPropertyInspector"; } }

        [JsonProperty("context")]
        public string Context { get; private set; }

        [JsonProperty("payload")]
        public JObject Payload { get; private set; }

        [JsonProperty("action")]
        public string Action { get; private set; }

        public SendToPropertyInspectorMessage(string action, JObject data, string context)
        {
            this.Context = context;
            this.Payload = data;
            this.Action = action;
        }
    }
}



================================================
FILE: barraider-sdtools/Communication/Messages/SetFeedbackLayoutMessage.cs
================================================
﻿using Newtonsoft.Json;

namespace BarRaider.SdTools.Communication.Messages
{
    internal class SetFeedbackLayoutMessage : IMessage
    {
        [JsonProperty("event")]
        public string Event { get { return "setFeedbackLayout"; } }

        [JsonProperty("context")]
        public string Context { get; private set; }

        [JsonProperty("payload")]
        public IPayload Payload { get; private set; }

        public SetFeedbackLayoutMessage(string layout, string context)
        {
            this.Context = context;
            this.Payload = new PayloadClass(layout);
        }

        private class PayloadClass : IPayload
        {
            [JsonProperty("layout")]
            public string Layout { get; private set; }
            public PayloadClass(string layout)
            {
                this.Layout = layout;
            }
        }
    }
}



================================================
FILE: barraider-sdtools/Communication/Messages/SetFeedbackMessage.cs
================================================
﻿using Newtonsoft.Json;
using System.Collections.Generic;

namespace BarRaider.SdTools.Communication.Messages
{
    internal class SetFeedbackMessage : IMessage
    {
        [JsonProperty("event")]
        public string Event { get { return "setFeedback"; } }

        [JsonProperty("context")]
        public string Context { get; private set; }

        [JsonProperty("payload")]
        public Dictionary<string, string> DictKeyValues { get; private set; }

        public SetFeedbackMessage(Dictionary<string, string> dictKeyValues, string pluginUUID)
        {
            this.Context = pluginUUID;
            DictKeyValues = dictKeyValues;
        }
    }
}



================================================
FILE: barraider-sdtools/Communication/Messages/SetFeedbackMessageEx.cs
================================================
﻿using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;

namespace BarRaider.SdTools.Communication.Messages
{
    internal class SetFeedbackMessageEx : IMessage
    {
        [JsonProperty("event")]
        public string Event { get { return "setFeedback"; } }

        [JsonProperty("context")]
        public string Context { get; private set; }

        [JsonProperty("payload")]
        public JObject Payload { get; private set; }

        public SetFeedbackMessageEx(JObject payload, string pluginUUID)
        {
            this.Context = pluginUUID;
            Payload = payload;
        }
    }
}



================================================
FILE: barraider-sdtools/Communication/Messages/SetGlobalSettingsMessage.cs
================================================
﻿using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BarRaider.SdTools.Communication.Messages
{
    internal class SetGlobalSettingsMessage : IMessage
    {
        [JsonProperty("event")]
        public string Event { get { return "setGlobalSettings"; } }

        [JsonProperty("context")]
        public string Context { get; private set; }

        [JsonProperty("payload")]
        public JObject Payload { get; private set; }

        public SetGlobalSettingsMessage(JObject settings, string pluginUUID)
        {
            this.Context = pluginUUID;
            this.Payload = settings;
        }
    }
}



================================================
FILE: barraider-sdtools/Communication/Messages/SetImageMessage.cs
================================================
﻿using Newtonsoft.Json;

namespace BarRaider.SdTools.Communication.Messages
{
    internal class SetImageMessage : IMessage
    {
        [JsonProperty("event")]
        public string Event { get { return "setImage"; } }

        [JsonProperty("context")]
        public string Context { get; private set; }

        [JsonProperty("payload")]
        public IPayload Payload { get; private set; }

        public SetImageMessage(string base64Image, string context, SDKTarget target, int? state)
        {
            this.Context = context;
            this.Payload = new PayloadClass(base64Image, target, state);
        }

        private class PayloadClass : IPayload
        {
            [JsonProperty("image")]
            public string Image { get; private set; }

            [JsonProperty("target")]
            public SDKTarget Target { get; private set; }

            [JsonProperty("state", NullValueHandling = NullValueHandling.Ignore)]
            public int? State { get; private set; }

            public PayloadClass(string image, SDKTarget target, int? state)
            {
                this.Image = image;
                this.Target = target;
                this.State = state;
            }
        }
    }
}



================================================
FILE: barraider-sdtools/Communication/Messages/SetSettingsMessage.cs
================================================
﻿using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BarRaider.SdTools.Communication.Messages
{
    internal class SetSettingsMessage : IMessage
    {
        [JsonProperty("event")]
        public string Event { get { return "setSettings"; } }

        [JsonProperty("context")]
        public string Context { get; private set; }

        [JsonProperty("payload")]
        public JObject Payload { get; private set; }

        public SetSettingsMessage(JObject settings, string context)
        {
            this.Context = context;
            this.Payload = settings;
        }
    }
}



================================================
FILE: barraider-sdtools/Communication/Messages/SetStateMessage.cs
================================================
﻿using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BarRaider.SdTools.Communication.Messages
{
    internal class SetStateMessage : IMessage
    {
        [JsonProperty("event")]
        public string Event { get { return "setState"; } }

        [JsonProperty("context")]
        public string Context { get; private set; }

        [JsonProperty("payload")]
        public IPayload Payload { get; private set; }

        public SetStateMessage(uint state, string context)
        {
            this.Context = context;
            this.Payload = new PayloadClass(state);
        }

        private class PayloadClass : IPayload
        {
            [JsonProperty("state")]
            public uint State { get; private set; }

            public PayloadClass(uint state)
            {
                this.State = state;
            }
        }
    }
}



================================================
FILE: barraider-sdtools/Communication/Messages/SetTitleMessage.cs
================================================
﻿using Newtonsoft.Json;

namespace BarRaider.SdTools.Communication.Messages
{
    internal class SetTitleMessage : IMessage
    {
        [JsonProperty("event")]
        public string Event { get { return "setTitle"; } }

        [JsonProperty("context")]
        public string Context { get; private set; }

        [JsonProperty("payload")]
        public IPayload Payload { get; private set; }

        public SetTitleMessage(string title, string context, SDKTarget target, int? state)
        {
            this.Context = context;
            this.Payload = new PayloadClass(title, target, state);
        }

        private class PayloadClass : IPayload
        {
            [JsonProperty("title")]
            public string Title { get; private set; }

            [JsonProperty("target")]
            public SDKTarget Target { get; private set; }

            [JsonProperty("state", NullValueHandling = NullValueHandling.Ignore)]
            public int? State { get; private set; }

            public PayloadClass(string title, SDKTarget target, int? state)
            {
                this.Title = title;
                this.Target = target;
                this.State = state;
            }
        }
    }
}



================================================
FILE: barraider-sdtools/Communication/Messages/ShowAlertMessage.cs
================================================
﻿using Newtonsoft.Json;

namespace BarRaider.SdTools.Communication.Messages
{
    internal class ShowAlertMessage : IMessage
    {
        [JsonProperty("event")]
        public string Event { get { return "showAlert"; } }

        [JsonProperty("context")]
        public string Context { get; private set; }

        public ShowAlertMessage(string context)
        {
            this.Context = context;
        }
    }
}



================================================
FILE: barraider-sdtools/Communication/Messages/ShowOkMessage.cs
================================================
﻿using Newtonsoft.Json;

namespace BarRaider.SdTools.Communication.Messages
{
    internal class ShowOkMessage : IMessage
    {
        [JsonProperty("event")]
        public string Event { get { return "showOk"; } }

        [JsonProperty("context")]
        public string Context { get; private set; }

        public ShowOkMessage(string context)
        {
            this.Context = context;
        }
    }
}



================================================
FILE: barraider-sdtools/Communication/Messages/SwitchToProfileMessage.cs
================================================
﻿using Newtonsoft.Json;

namespace BarRaider.SdTools.Communication.Messages
{
    internal class SwitchToProfileMessage : IMessage
    {
        [JsonProperty("event")]
        public string Event { get { return "switchToProfile"; } }

        [JsonProperty("context")]
        public string Context { get; private set; }

        [JsonProperty("device")]
        public string Device { get; private set; }

        [JsonProperty("payload")]
        public IPayload Payload { get; private set; }

        public SwitchToProfileMessage(string device, string profileName, string pluginUUID)
        {
            this.Context = pluginUUID;
            this.Device = device;
            if (!string.IsNullOrEmpty(profileName))
            {
                this.Payload = new PayloadClass(profileName);
            }
            else
            {
                this.Payload = new EmptyPayload();
            }
        }

        private class PayloadClass : IPayload
        {
            [JsonProperty("profile")]
            public string Profile { get; private set; }

            public PayloadClass(string profile)
            {
                this.Profile = profile;
            }
        }
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/ApplicationDidLaunchEvent.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using Newtonsoft.Json;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// Payload for ApplicationDidLaunch event
    /// </summary>
    public class ApplicationDidLaunchEvent : BaseEvent
    {
        /// <summary>
        /// Application information
        /// </summary>
        [JsonProperty("payload")]
        public ApplicationPayload Payload { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/ApplicationDidTerminateEvent.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using Newtonsoft.Json;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// Payload for ApplicationDidTerminate Event
    /// </summary>
    public class ApplicationDidTerminateEvent : BaseEvent
    {
        /// <summary>
        /// Application payload
        /// </summary>
        [JsonProperty("payload")]
        public ApplicationPayload Payload { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/BaseEvent.cs
================================================
﻿using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// List of all supported event typs
    /// </summary>
    internal static class EventTypes
    {
        public const string KeyDown = "keyDown";
        public const string KeyUp = "keyUp";
        public const string WillAppear = "willAppear";
        public const string WillDisappear = "willDisappear";
        public const string TitleParametersDidChange = "titleParametersDidChange";
        public const string DeviceDidConnect = "deviceDidConnect";
        public const string DeviceDidDisconnect = "deviceDidDisconnect";
        public const string ApplicationDidLaunch = "applicationDidLaunch";
        public const string ApplicationDidTerminate = "applicationDidTerminate";
        public const string SystemDidWakeUp = "systemDidWakeUp";
        public const string DidReceiveSettings = "didReceiveSettings";
        public const string DidReceiveGlobalSettings = "didReceiveGlobalSettings";
        public const string PropertyInspectorDidAppear = "propertyInspectorDidAppear";
        public const string PropertyInspectorDidDisappear = "propertyInspectorDidDisappear";
        public const string SendToPlugin = "sendToPlugin";
        public const string DialRotate = "dialRotate";
        public const string DialPress = "dialPress";
        public const string DialDown = "dialDown";
        public const string DialUp = "dialUp";
        public const string TouchpadPress = "touchTap";
    }

    /// <summary>
    /// Base event that all the actual events derive from
    /// </summary>
    public abstract class BaseEvent
    {
        private static readonly Dictionary<string, Type> eventsMap = new Dictionary<string, Type>
        {
            { EventTypes.KeyDown, typeof(KeyDownEvent) },
            { EventTypes.KeyUp, typeof(KeyUpEvent) },

            { EventTypes.WillAppear, typeof(WillAppearEvent) },
            { EventTypes.WillDisappear, typeof(WillDisappearEvent) },

            { EventTypes.TitleParametersDidChange, typeof(TitleParametersDidChangeEvent) },

            { EventTypes.DeviceDidConnect, typeof(DeviceDidConnectEvent) },
            { EventTypes.DeviceDidDisconnect, typeof(DeviceDidDisconnectEvent) },

            { EventTypes.ApplicationDidLaunch, typeof(ApplicationDidLaunchEvent) },
            { EventTypes.ApplicationDidTerminate, typeof(ApplicationDidTerminateEvent) },

            { EventTypes.SystemDidWakeUp, typeof(SystemDidWakeUpEvent) },

            { EventTypes.DidReceiveSettings, typeof(DidReceiveSettingsEvent) },
            { EventTypes.DidReceiveGlobalSettings, typeof(DidReceiveGlobalSettingsEvent) },

            { EventTypes.PropertyInspectorDidAppear, typeof(PropertyInspectorDidAppearEvent) },
            { EventTypes.PropertyInspectorDidDisappear, typeof(PropertyInspectorDidDisappearEvent) },

            { EventTypes.SendToPlugin, typeof(SendToPluginEvent) },

            { EventTypes.DialRotate, typeof(DialRotateEvent) },
            { EventTypes.DialDown, typeof(DialDownEvent) },
            { EventTypes.DialUp, typeof(DialUpEvent) },
            { EventTypes.TouchpadPress, typeof(TouchpadPressEvent) },
            { EventTypes.DialPress, typeof(DialDownEvent) }, // Deprecated: Should be removed when event stops getting sent by SD
        };

        /// <summary>
        /// Name of the event raised
        /// </summary>
        [JsonProperty("event")]
        public string Event { get; set; }

        internal static BaseEvent Parse(string json)
        {
            JObject jsonObject = JObject.Parse(json);
            if (!jsonObject.ContainsKey("event"))
            {
                return null;
            }

            string eventType = jsonObject["event"].ToString();
            if (!eventsMap.ContainsKey(eventType))
            {
                return null;
            }

            return JsonConvert.DeserializeObject(json, eventsMap[eventType]) as BaseEvent;
        }
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/DeviceDidConnectEvent.cs
================================================
﻿using Newtonsoft.Json;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// Payload for DeviceDidConnect Event
    /// </summary>
    public class DeviceDidConnectEvent : BaseEvent
    {
        /// <summary>
        /// UUID of device
        /// </summary>
        [JsonProperty("device")]
        public string Device { get; private set; }

        /// <summary>
        /// Information on the device connected
        /// </summary>
        [JsonProperty("deviceInfo")]
        public StreamDeckDeviceInfo DeviceInfo { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/DeviceDidDisconnectEvent.cs
================================================
﻿using Newtonsoft.Json;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// Payload for DeviceDidDisconnect Event
    /// </summary>
    public class DeviceDidDisconnectEvent : BaseEvent
    {
        /// <summary>
        /// UUID of device that was disconnected
        /// </summary>
        [JsonProperty("device")]
        public string Device { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/DialDownEvent.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// Payload for Dial down event
    /// </summary>
    public class DialDownEvent : BaseEvent
    {
        /// <summary>
        /// Action Name
        /// </summary>
        [JsonProperty("action")]
        public string Action { get; private set; }

        /// <summary>
        /// Unique Action UUID
        /// </summary>
        [JsonProperty("context")]
        public string Context { get; private set; }

        /// <summary>
        /// Device UUID key was pressed on
        /// </summary>
        [JsonProperty("device")]
        public string Device { get; private set; }

        /// <summary>
        /// Information on dial status
        /// </summary>
        [JsonProperty("payload")]
        public DialPayload Payload { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/DialRotateEvent.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// Payload for dial rotation event
    /// </summary>
    public class DialRotateEvent : BaseEvent
    {
        /// <summary>
        /// Action Name
        /// </summary>
        [JsonProperty("action")]
        public string Action { get; private set; }

        /// <summary>
        /// Unique Action UUID
        /// </summary>
        [JsonProperty("context")]
        public string Context { get; private set; }

        /// <summary>
        /// Device UUID key was pressed on
        /// </summary>
        [JsonProperty("device")]
        public string Device { get; private set; }

        /// <summary>
        /// Information on dial rotation
        /// </summary>
        [JsonProperty("payload")]
        public DialRotatePayload Payload { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/DialUpEvent.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// Payload for Dial up event
    /// </summary>
    public class DialUpEvent : BaseEvent
    {
        /// <summary>
        /// Action Name
        /// </summary>
        [JsonProperty("action")]
        public string Action { get; private set; }

        /// <summary>
        /// Unique Action UUID
        /// </summary>
        [JsonProperty("context")]
        public string Context { get; private set; }

        /// <summary>
        /// Device UUID key was pressed on
        /// </summary>
        [JsonProperty("device")]
        public string Device { get; private set; }

        /// <summary>
        /// Information on dial status
        /// </summary>
        [JsonProperty("payload")]
        public DialPayload Payload { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/DidReceiveGlobalSettingsEvent.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using Newtonsoft.Json;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// Payload for DidReceiveGlobalSettings Event
    /// </summary>
    public class DidReceiveGlobalSettingsEvent : BaseEvent
    {
        /// <summary>
        /// Global Settings payload
        /// </summary>
        [JsonProperty("payload")]
        public ReceivedGlobalSettingsPayload Payload { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/DidReceiveSettingsEvent.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using Newtonsoft.Json;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// Payload for DidReceiveSettings Event
    /// </summary>
    public class DidReceiveSettingsEvent : BaseEvent
    {
        /// <summary>
        /// Action Name
        /// </summary>
        [JsonProperty("action")]
        public string Action { get; private set; }

        /// <summary>
        /// Context (unique action UUID)
        /// </summary>
        [JsonProperty("context")]
        public string Context { get; private set; }

        /// <summary>
        /// Device UUID action is on
        /// </summary>
        [JsonProperty("device")]
        public string Device { get; private set; }

        /// <summary>
        /// Settings for action
        /// </summary>
        [JsonProperty("payload")]
        public ReceivedSettingsPayload Payload { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/KeyDownEvent.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// Payload for KeyDown event
    /// </summary>
    public class KeyDownEvent : BaseEvent
    {
        /// <summary>
        /// Action Name
        /// </summary>
        [JsonProperty("action")]
        public string Action { get; private set; }

        /// <summary>
        /// Unique Action UUID
        /// </summary>
        [JsonProperty("context")]
        public string Context { get; private set; }

        /// <summary>
        /// Device UUID key was pressed on
        /// </summary>
        [JsonProperty("device")]
        public string Device { get; private set; }

        /// <summary>
        /// Information on key
        /// </summary>
        [JsonProperty("payload")]
        public KeyPayload Payload { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/KeyUpEvent.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using Newtonsoft.Json;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// Payload for KeyUp event
    /// </summary>
    public class KeyUpEvent : BaseEvent
    {
        /// <summary>
        /// Action name
        /// </summary>
        [JsonProperty("action")]
        public string Action { get; private set; }

        /// <summary>
        /// Unique action UUID
        /// </summary>
        [JsonProperty("context")]
        public string Context { get; private set; }

        /// <summary>
        /// Stream Deck device UUID
        /// </summary>
        [JsonProperty("device")]
        public string Device { get; private set; }

        /// <summary>
        /// Key settings
        /// </summary>
        [JsonProperty("payload")]
        public KeyPayload Payload { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/PropertyInspectorDidAppearEvent.cs
================================================
﻿using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// Payload for PropertyInspectorDidAppearEvent event
    /// </summary>
    public class PropertyInspectorDidAppearEvent : BaseEvent
    {
        /// <summary>
        /// Action Name
        /// </summary>
        [JsonProperty("action")]
        public string Action { get; private set; }

        /// <summary>
        /// Unique Action UUID
        /// </summary>
        [JsonProperty("context")]
        public string Context { get; private set; }

        /// <summary>
        /// Stream Deck device UUID
        /// </summary>
        [JsonProperty("device")]
        public string Device { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/PropertyInspectorDidDisappearEvent.cs
================================================
﻿using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// Payload for PropertyInspectorDidDisappearEvent event
    /// </summary>
    public class PropertyInspectorDidDisappearEvent : BaseEvent
    {
        /// <summary>
        /// Action Name
        /// </summary>
        [JsonProperty("action")]
        public string Action { get; private set; }

        /// <summary>
        /// Unique Action UUID
        /// </summary>
        [JsonProperty("context")]
        public string Context { get; private set; }

        /// <summary>
        /// Stream Deck device UUID
        /// </summary>
        [JsonProperty("device")]
        public string Device { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/SendToPluginEvent.cs
================================================
﻿using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// Payload for SendToPluginEvent event
    /// </summary>
    public class SendToPluginEvent : BaseEvent
    {
        /// <summary>
        /// Action Name
        /// </summary>
        [JsonProperty("action")]
        public string Action { get; private set; }

        /// <summary>
        /// Unique Action UUID
        /// </summary>
        [JsonProperty("context")]
        public string Context { get; private set; }

        /// <summary>
        /// Payload
        /// </summary>
        [JsonProperty("payload")]
        public JObject Payload { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/SystemDidWakeUpEvent.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using Newtonsoft.Json;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// Payload for SystemDidWakeUp event
    /// </summary>
    public class SystemDidWakeUpEvent : BaseEvent
    {
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/TitleParametersDidChangeEvent.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using Newtonsoft.Json;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// Payload for TitleParametersDidChangeEvent event
    /// </summary>
    public class TitleParametersDidChangeEvent : BaseEvent
    {
        /// <summary>
        /// Action Name
        /// </summary>
        [JsonProperty("action")]
        public string Action { get; private set; }

        /// <summary>
        /// Unique Action UUID
        /// </summary>
        [JsonProperty("context")]
        public string Context { get; private set; }

        /// <summary>
        /// Stream Deck device UUID
        /// </summary>
        [JsonProperty("device")]
        public string Device { get; private set; }

        /// <summary>
        /// Title settings
        /// </summary>
        [JsonProperty("payload")]
        public TitleParametersPayload Payload { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/TouchpadPressEvent.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// Payload for touchpad press
    /// </summary>
    public class TouchpadPressEvent : BaseEvent
    {
        /// <summary>
        /// Action Name
        /// </summary>
        [JsonProperty("action")]
        public string Action { get; private set; }

        /// <summary>
        /// Unique Action UUID
        /// </summary>
        [JsonProperty("context")]
        public string Context { get; private set; }

        /// <summary>
        /// Device UUID key was pressed on
        /// </summary>
        [JsonProperty("device")]
        public string Device { get; private set; }

        /// <summary>
        /// Information on touchpad press
        /// </summary>
        [JsonProperty("payload")]
        public TouchpadPressPayload Payload { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/WillAppearEvent.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using Newtonsoft.Json;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// Payload for WillAppearEvent event
    /// </summary>
    public class WillAppearEvent : BaseEvent
    {
        /// <summary>
        /// Action Name
        /// </summary>
        [JsonProperty("action")]
        public string Action { get; private set; }

        /// <summary>
        /// Unique Action UUID
        /// </summary>
        [JsonProperty("context")]
        public string Context { get; private set; }

        /// <summary>
        /// Stream Deck device UUID
        /// </summary>
        [JsonProperty("device")]
        public string Device { get; private set; }

        /// <summary>
        /// Appearance settings
        /// </summary>
        [JsonProperty("payload")]
        public AppearancePayload Payload { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Communication/SDEvents/WillDisappearEvent.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using Newtonsoft.Json;

namespace BarRaider.SdTools.Communication.SDEvents
{
    /// <summary>
    /// Payload for WillDisappearEvent event
    /// </summary>
    public class WillDisappearEvent : BaseEvent
    {
        /// <summary>
        /// Action Name
        /// </summary>
        [JsonProperty("action")]
        public string Action { get; private set; }

        /// <summary>
        /// Unique Action UUID
        /// </summary>
        [JsonProperty("context")]
        public string Context { get; private set; }

        /// <summary>
        /// Stream Deck device UUID
        /// </summary>
        [JsonProperty("device")]
        public string Device { get; private set; }

        /// <summary>
        /// settings
        /// </summary>
        [JsonProperty("payload")]
        public AppearancePayload Payload { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Events/ApplicationDidLaunch.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using Newtonsoft.Json;

namespace BarRaider.SdTools.Events
{
    /// <summary>
    /// Payload for ApplicationDidLaunch event
    /// </summary>
    public class ApplicationDidLaunch
    {
        /// <summary>
        /// Payload
        /// </summary>
        [JsonProperty("payload")]
        public ApplicationPayload Payload { get; private set; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="payload"></param>
        public ApplicationDidLaunch(ApplicationPayload payload)
        {
            Payload = payload;
        }
    }
}



================================================
FILE: barraider-sdtools/Events/ApplicationDidTerminate.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using Newtonsoft.Json;

namespace BarRaider.SdTools.Events
{
    /// <summary>
    /// Payload for ApplicationDidTerminate event
    /// </summary>
    public class ApplicationDidTerminate
    {
        /// <summary>
        /// Payload
        /// </summary>
        [JsonProperty("payload")]
        public ApplicationPayload Payload { get; private set; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="payload"></param>
        public ApplicationDidTerminate(ApplicationPayload payload)
        {
            Payload = payload;
        }
    }
}



================================================
FILE: barraider-sdtools/Events/DeviceDidConnect.cs
================================================
﻿using Newtonsoft.Json;

namespace BarRaider.SdTools.Events
{
    /// <summary>
    /// Payload for DeviceDidConnect event
    /// </summary>
    public class DeviceDidConnect
    {
        /// <summary>
        /// Device GUID
        /// </summary>
        [JsonProperty("device")]
        public string Device { get; private set; }

        /// <summary>
        /// Device Info
        /// </summary>
        [JsonProperty("deviceInfo")]
        public StreamDeckDeviceInfo DeviceInfo { get; private set; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="deviceInfo"></param>
        public DeviceDidConnect(StreamDeckDeviceInfo deviceInfo)
        {
            Device = deviceInfo?.Id;
            DeviceInfo = deviceInfo;
        }
    }
}



================================================
FILE: barraider-sdtools/Events/DeviceDidDisconnect.cs
================================================
﻿using Newtonsoft.Json;
using System;

namespace BarRaider.SdTools.Events
{
    /// <summary>
    /// Payload for DeviceDidDisconnect event
    /// </summary>
    public class DeviceDidDisconnect
    {
        /// <summary>
        /// Device GUID
        /// </summary>
        [JsonProperty("device")]
        public string Device { get; private set; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="device"></param>
        public DeviceDidDisconnect(String device)
        {
            Device = device;
        }
    }
}



================================================
FILE: barraider-sdtools/Events/PropertyInspectorDidAppear.cs
================================================
﻿using Newtonsoft.Json;

namespace BarRaider.SdTools.Events
{
    /// <summary>
    /// Payload for PropertyInspectorDidAppear event
    /// </summary>
    public class PropertyInspectorDidAppear
    {
        /// <summary>
        /// ActionId
        /// </summary>
        [JsonProperty("action")]
        public string Action { get; private set; }

        /// <summary>
        /// ContextId
        /// </summary>
        [JsonProperty("context")]
        public string Context { get; private set; }

        /// <summary>
        /// Device Guid
        /// </summary>
        [JsonProperty("device")]
        public string Device { get; private set; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="action"></param>
        /// <param name="context"></param>
        /// <param name="device"></param>
        public PropertyInspectorDidAppear(string action, string context, string device)
        {
            Action = action;
            Context = context;
            Device = device;
        }
    }
}



================================================
FILE: barraider-sdtools/Events/PropertyInspectorDidDisappear.cs
================================================
﻿using Newtonsoft.Json;

namespace BarRaider.SdTools.Events
{
    /// <summary>
    /// Payload for PropertyInspectorDidDisappear event
    /// </summary>
    public class PropertyInspectorDidDisappear
    {
        /// <summary>
        /// Action Id
        /// </summary>
        [JsonProperty("action")]
        public string Action { get; private set; }

        /// <summary>
        /// ContextId
        /// </summary>
        [JsonProperty("context")]
        public string Context { get; private set; }

        /// <summary>
        /// Device Guid
        /// </summary>
        [JsonProperty("device")]
        public string Device { get; private set; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="action"></param>
        /// <param name="context"></param>
        /// <param name="device"></param>
        public PropertyInspectorDidDisappear(string action, string context, string device)
        {
            Action = action;
            Context = context;
            Device = device;
        }
    }
}



================================================
FILE: barraider-sdtools/Events/SendToPlugin.cs
================================================
﻿using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BarRaider.SdTools.Events
{
    /// <summary>
    /// Payload for SendToPlugin event
    /// </summary>
    public class SendToPlugin
    {
        /// <summary>
        /// ActionId
        /// </summary>
        [JsonProperty("action")]
        public string Action { get; private set; }

        /// <summary>
        /// ContextId
        /// </summary>
        [JsonProperty("context")]
        public string Context { get; private set; }

        /// <summary>
        /// Payload
        /// </summary>
        [JsonProperty("payload")]
        public JObject Payload { get; private set; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="action"></param>
        /// <param name="context"></param>
        /// <param name="payload"></param>
        public SendToPlugin(string action, string context, JObject payload)
        {
            Action = action;
            Context = context;
            Payload = payload;
        }
    }
}



================================================
FILE: barraider-sdtools/Events/SystemDidWakeUp.cs
================================================
﻿namespace BarRaider.SdTools.Events
{
    /// <summary>
    /// Payload for SystemDidWakeUp event
    /// </summary>
    public class SystemDidWakeUp
    {
        /// <summary>
        /// Constructor
        /// </summary>
        public SystemDidWakeUp()
        {
        }
    }
}



================================================
FILE: barraider-sdtools/Events/TitleParametersDidChange.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using Newtonsoft.Json;

namespace BarRaider.SdTools.Events
{
    /// <summary>
    /// Payload for TitleParametersDidChange event
    /// </summary>
    public class TitleParametersDidChange
    {
        /// <summary>
        /// Action Id
        /// </summary>
        [JsonProperty("action")]
        public string Action { get; private set; }

        /// <summary>
        /// Context Id
        /// </summary>
        [JsonProperty("context")]
        public string Context { get; private set; }

        /// <summary>
        /// Device Guid
        /// </summary>
        [JsonProperty("device")]
        public string Device { get; private set; }

        /// <summary>
        /// Payload
        /// </summary>
        [JsonProperty("payload")]
        public TitleParametersPayload Payload { get; private set; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="action"></param>
        /// <param name="context"></param>
        /// <param name="device"></param>
        /// <param name="payload"></param>
        public TitleParametersDidChange(string action, string context, string device, TitleParametersPayload payload)
        {
            Action = action;
            Context = context;
            Device = device;
            Payload = payload;
        }
    }
}



================================================
FILE: barraider-sdtools/Payloads/AppearancePayload.cs
================================================
﻿using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BarRaider.SdTools.Payloads
{
    /// <summary>
    /// Payload for Apperance settings
    /// </summary>
    public class AppearancePayload
    {
        /// <summary>
        /// Additional settings
        /// </summary>
        [JsonProperty("settings")]
        public JObject Settings { get; private set; }

        /// <summary>
        /// Coordinates of key pressed
        /// </summary>
        [JsonProperty("coordinates")]
        public KeyCoordinates Coordinates { get; private set; }

        /// <summary>
        /// State of key
        /// </summary>
        [JsonProperty("state")]
        public uint State { get; private set; }

        /// <summary>
        /// Is action in MultiAction
        /// </summary>
        [JsonProperty("isInMultiAction")]
        public bool IsInMultiAction { get; private set; }

        /// <summary>
        /// Controller which issued the event
        /// </summary>
        [JsonProperty("controller")]
        public string Controller { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Payloads/ApplicationPayload.cs
================================================
﻿using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools.Payloads
{
    /// <summary>
    /// ApplicationPayload
    /// </summary>
    public class ApplicationPayload
    {
        /// <summary>
        /// Application Name
        /// </summary>
        [JsonProperty("application")]
        public string Application { get; private set; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="application"></param>
        public ApplicationPayload(string application)
        {
            Application = application;
        }
    }
}



================================================
FILE: barraider-sdtools/Payloads/DialPayload.cs
================================================
﻿using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools.Payloads
{
    /// <summary>
    /// Payload received when a dial is down or up
    /// </summary>
    public class DialPayload
    {
        /// <summary>
        /// Controller which issued the event
        /// </summary>
        [JsonProperty("controller")]
        public string Controller { get; private set; }

        /// <summary>
        /// Current event settings
        /// </summary>
        [JsonProperty("settings")]
        public JObject Settings { get; private set; }

        /// <summary>
        /// Coordinates of key on the stream deck
        /// </summary>
        [JsonProperty("coordinates")]
        public KeyCoordinates Coordinates { get; private set; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="coordinates"></param>
        /// <param name="settings"></param>
        /// <param name="controller"></param>
        public DialPayload(KeyCoordinates coordinates, JObject settings, string controller)
        {
            Coordinates = coordinates;
            Settings = settings;
            Controller = controller;
        }

        /// <summary>
        /// Default constructor for serialization
        /// </summary>
        public DialPayload() { }
    }
}



================================================
FILE: barraider-sdtools/Payloads/DialRotatePayload.cs
================================================
﻿using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools.Payloads
{
    /// <summary>
    /// Payload received when a dial is rotated
    /// </summary>
    public class DialRotatePayload
    {
        /// <summary>
        /// Controller which issued the event
        /// </summary>
        [JsonProperty("controller")]
        public string Controller { get; private set; }

        /// <summary>
        /// Current event settings
        /// </summary>
        [JsonProperty("settings")]
        public JObject Settings { get; private set; }

        /// <summary>
        /// Coordinates of key on the stream deck
        /// </summary>
        [JsonProperty("coordinates")]
        public KeyCoordinates Coordinates { get; private set; }

        /// <summary>
        /// Number of ticks rotated. Positive is to the right, negative to the left
        /// </summary>
        [JsonProperty("ticks")]
        public int Ticks { get; private set; }

        /// <summary>
        /// Boolean whether the dial is currently pressed or not
        /// </summary>
        [JsonProperty("pressed")]
        public bool IsDialPressed { get; private set; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="coordinates"></param>
        /// <param name="settings"></param>
        /// <param name="controller"></param>
        /// <param name="ticks"></param>
        /// <param name="isDialPressed"></param>
        public DialRotatePayload(KeyCoordinates coordinates, JObject settings, string controller, int ticks, bool isDialPressed)
        {
            Coordinates = coordinates;
            Settings = settings;
            Controller = controller;
            Ticks = ticks;
            IsDialPressed = isDialPressed;
        }

        /// <summary>
        /// Default constructor for serialization
        /// </summary>
        public DialRotatePayload() { }
    }
}



================================================
FILE: barraider-sdtools/Payloads/InitialPayload.cs
================================================
﻿using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using BarRaider.SdTools.Payloads;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Payload received during the plugin's constructor
    /// </summary>
    public class InitialPayload
    {
        /// <summary>
        /// Plugin instance's settings (set through Property Inspector)
        /// </summary>
        [JsonProperty("settings")]
        public JObject Settings { get; private set; }

        /// <summary>
        /// Plugin's physical location on the Stream Deck device
        /// </summary>
        [JsonProperty("coordinates")]
        public KeyCoordinates Coordinates { get; private set; }

        /// <summary>
        /// Current plugin state
        /// </summary>
        [JsonProperty("state")]
        public uint State { get; private set; }

        /// <summary>
        /// Is it in a Multiaction
        /// </summary>
        [JsonProperty("isInMultiAction")]
        public bool IsInMultiAction { get; private set; }

        /// <summary>
        /// The controller of the current action. Values include "Keypad" and "Encoder".
        /// </summary>
        [JsonProperty("controller")]
        public string Controller { get; private set; }

        /// <summary>
        /// Information regarding the Stream Deck hardware device
        /// </summary>
        [JsonProperty("deviceInfo", Required = Required.AllowNull)]
        public StreamDeckInfo DeviceInfo { get; private set; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="appearancePayload"></param>
        /// <param name="deviceInfo"></param>
        public InitialPayload(AppearancePayload appearancePayload, StreamDeckInfo deviceInfo)
        {
            Coordinates = appearancePayload.Coordinates;
            Settings = appearancePayload.Settings;
            State = appearancePayload.State;
            IsInMultiAction = appearancePayload.IsInMultiAction;
            Controller = appearancePayload.Controller;
            DeviceInfo = deviceInfo;
        }
    }
}



================================================
FILE: barraider-sdtools/Payloads/KeyPayload.cs
================================================
﻿using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Payload received when a key is pressed or released
    /// </summary>
    public class KeyPayload
    {
        /// <summary>
        /// Current event settings
        /// </summary>
        [JsonProperty("settings")]
        public JObject Settings { get; private set; }

        /// <summary>
        /// Coordinates of key on the stream deck
        /// </summary>
        [JsonProperty("coordinates")]
        public KeyCoordinates Coordinates { get; private set; }

        /// <summary>
        /// Current key state
        /// </summary>
        [JsonProperty("state")]
        public uint State { get; private set; }

        /// <summary>
        /// Desired state
        /// </summary>
        [JsonProperty("userDesiredState")]
        public uint UserDesiredState { get; private set; }

        /// <summary>
        /// Is part of a multiAction
        /// </summary>
        [JsonProperty("isInMultiAction")]
        public bool IsInMultiAction { get; private set; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="coordinates"></param>
        /// <param name="settings"></param>
        /// <param name="state"></param>
        /// <param name="userDesiredState"></param>
        /// <param name="isInMultiAction"></param>
        public KeyPayload(KeyCoordinates coordinates, JObject settings, uint state, uint userDesiredState, bool isInMultiAction)
        {
            Coordinates = coordinates;
            Settings = settings;
            State = state;
            UserDesiredState = userDesiredState;
            IsInMultiAction = isInMultiAction;
        }

        /// <summary>
        /// For Seralization
        /// </summary>
        public KeyPayload() { }
    }
}



================================================
FILE: barraider-sdtools/Payloads/ReceivedGlobalSettingsPayload.cs
================================================
﻿using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Payload that holds all the settings in the ReceivedGlobalSettings event
    /// </summary>
    public class ReceivedGlobalSettingsPayload
    {
        /// <summary>
        /// Global settings object
        /// </summary>
        [JsonProperty("settings")]
        public JObject Settings { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Payloads/ReceivedSettingsPayload.cs
================================================
﻿using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Payload that holds all the settings in the ReceivedSettings event
    /// </summary>
    public class ReceivedSettingsPayload
    {
        /// <summary>
        /// Action's settings
        /// </summary>
        [JsonProperty("settings")]
        public JObject Settings { get; private set; }

        /// <summary>
        /// Coordinates of the key pressed
        /// </summary>
        [JsonProperty("coordinates")]
        public KeyCoordinates Coordinates { get; private set; }

        /// <summary>
        /// Is event part of a multiaction
        /// </summary>
        [JsonProperty("isInMultiAction")]
        public bool IsInMultiAction { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Payloads/StreamDeckOptions.cs
================================================
﻿using CommandLine;
using Newtonsoft.Json.Linq;

namespace BarRaider.SdTools.Payloads
{
    /// <summary>
    /// Class holding all the information passed to the plugin when the program was launched
    /// </summary>
    public class StreamDeckOptions
    {
        private StreamDeckInfo deviceInfo;

        /// <summary>
        /// Port to communicate with the StreamDeck app
        /// </summary>
        [Option("port", Required = true, HelpText = "The websocket port to connect to", SetName = "port")]
        public int Port { get; set; }

        /// <summary>
        /// UUID of the plugin
        /// </summary>
        [Option("pluginUUID", Required = true, HelpText = "The UUID of the plugin")]
        public string PluginUUID { get; set; }

        /// <summary>
        /// Name of the event we should pass to the StreamDeck app to register
        /// </summary>
        [Option("registerEvent", Required = true, HelpText = "The event triggered when the plugin is registered?")]
        public string RegisterEvent { get; set; }

        /// <summary>
        /// Raw information in JSON format which we will parse into the DeviceInfo property
        /// </summary>
        [Option("info", Required = true, HelpText = "Extra JSON launch data")]
        public string RawInfo { get; set; }

        /// <summary>
        /// Information regarding the StreamDeck app and StreamDeck hardware which was parsed from the RawInfo JSON field.
        /// </summary>
        public StreamDeckInfo DeviceInfo
        {
            get
            {
                if (deviceInfo != null)
                {
                    return deviceInfo;
                }

                if (RawInfo == null)
                {
                    return null;
                }

                JObject obj = JObject.Parse(RawInfo);
                deviceInfo = obj.ToObject<StreamDeckInfo>();
                return deviceInfo;
            }
        }
    }
}



================================================
FILE: barraider-sdtools/Payloads/TitleParametersPayload.cs
================================================
﻿using BarRaider.SdTools.Wrappers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools.Payloads
{
    /// <summary>
    /// Payload for TitleParametersDidChange Event
    /// </summary>
    public class TitleParametersPayload
    {
        private TitleParameters titleParameters = null;

        /// <summary>
        /// Settings JSON Object
        /// </summary>
        [JsonProperty("settings")]
        public JObject Settings { get; private set; }

        /// <summary>
        /// Key Coordinates
        /// </summary>
        [JsonProperty("coordinates")]
        public KeyCoordinates Coordinates { get; private set; }

        /// <summary>
        /// Key State
        /// </summary>
        [JsonProperty("state")]
        public uint State { get; private set; }

        /// <summary>
        /// Title
        /// </summary>
        [JsonProperty("title")]
        public string Title { get; private set; }

        /// <summary>
        /// Title Parameters
        /// </summary>
        [JsonIgnore]
        public TitleParameters TitleParameters
        { 
            get
            {
                if (titleParameters != null)
                {
                    return titleParameters;
                }

                if (TitleParametersRaw != null)
                {
                    titleParameters = new TitleParameters(TitleParametersRaw.FontFamily, TitleParametersRaw.FontSize, TitleParametersRaw.FontStyle, TitleParametersRaw.FontUnderline, TitleParametersRaw.ShowTitle, TitleParametersRaw.TitleAlignment, TitleParametersRaw.TitleColor);
                }

                return titleParameters;
            }
            private set
            {
                titleParameters = value;
            }
        }

        /// <summary>
        /// Raw Title Parameters (not as proper object)
        /// </summary>
        [JsonProperty("titleParameters")]
        public TitleParametersRawPayload TitleParametersRaw { get; private set; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="settings"></param>
        /// <param name="coordinates"></param>
        /// <param name="state"></param>
        /// <param name="title"></param>
        /// <param name="titleParameters"></param>
        public TitleParametersPayload(JObject settings, KeyCoordinates coordinates, uint state, string title, TitleParameters titleParameters)
        {
            Settings = settings;
            Coordinates = coordinates;
            State = state;
            Title = title;
            TitleParameters = titleParameters;
        }

        /// <summary>
        /// For Serilization
        /// </summary>
        public TitleParametersPayload() { }
    }
}



================================================
FILE: barraider-sdtools/Payloads/TitleParametersRawPayload.cs
================================================
﻿using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools.Payloads
{
    /// <summary>
    /// Raw payload for TitleParametersRawPayload event (without objects)
    /// </summary>
    public class TitleParametersRawPayload
    {
        /// <summary>
        /// Name of font family
        /// </summary>
        [JsonProperty("fontFamily")]
        public string FontFamily { get; private set; }

        /// <summary>
        /// Size of font
        /// </summary>
        [JsonProperty("fontSize")]
        public uint FontSize { get; private set; }

        /// <summary>
        /// Style of font (bold, italic)
        /// </summary>
        [JsonProperty("fontStyle")]
        public string FontStyle { get; private set; }

        /// <summary>
        /// Is there an underling
        /// </summary>
        [JsonProperty("fontUnderline")]
        public bool FontUnderline { get; private set; }

        /// <summary>
        /// Should title be shown
        /// </summary>
        [JsonProperty("showTitle")]
        public bool ShowTitle { get; private set; }

        /// <summary>
        /// Alignment of title (top, middle, bottom)
        /// </summary>
        [JsonProperty("titleAlignment")]
        public string TitleAlignment { get; private set; }

        /// <summary>
        /// Color of title
        /// </summary>
        [JsonProperty("titleColor")]
        public string TitleColor { get; private set; }
    }
}



================================================
FILE: barraider-sdtools/Payloads/TouchpadPressPayload.cs
================================================
﻿using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools.Payloads
{
    /// <summary>
    /// Payload received when the touchpad (above the dials) is pressed
    /// </summary>
    public class TouchpadPressPayload
    {
        /// <summary>
        /// Controller which issued the event
        /// </summary>
        [JsonProperty("controller")]
        public string Controller { get; private set; }

        /// <summary>
        /// Current event settings
        /// </summary>
        [JsonProperty("settings")]
        public JObject Settings { get; private set; }

        /// <summary>
        /// Coordinates of key on the stream deck
        /// </summary>
        [JsonProperty("coordinates")]
        public KeyCoordinates Coordinates { get; private set; }

        /// <summary>
        /// Boolean whether it was a long press or not
        /// </summary>
        [JsonProperty("hold")]
        public bool IsLongPress { get; private set; }

        /// <summary>
        /// Position on touchpad which was pressed
        /// </summary>
        [JsonProperty("tapPos")]
        public int[] TapPosition { get; private set; }


        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="coordinates"></param>
        /// <param name="settings"></param>
        /// <param name="controller"></param>
        /// <param name="isLongPress"></param>
        /// <param name="tapPosition"></param>
        public TouchpadPressPayload(KeyCoordinates coordinates, JObject settings, string controller, bool isLongPress, int[] tapPosition)
        {
            Coordinates = coordinates;
            Settings = settings;
            Controller = controller;
            IsLongPress = isLongPress;
            TapPosition = tapPosition;
        }

        /// <summary>
        /// Default constructor for serialization
        /// </summary>
        public TouchpadPressPayload() { }
    }
}



================================================
FILE: barraider-sdtools/StreamDeckInfo/DeviceType.cs
================================================
﻿using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Type of StreamDeck hardware device, currently two are supported (classic and mini)
    /// </summary>
    public enum DeviceType
    {
        /// <summary>
        /// StreamDeck classic with 15 keys
        /// </summary>
        StreamDeckClassic = 0,

        /// <summary>
        /// StreamDeck mini with 6 keys
        /// </summary>
        StreamDeckMini = 1,

        /// <summary>
        /// StreamDeck XL with 32 keys
        /// </summary>
        StreamDeckXL = 2,

        /// <summary>
        /// StreamDeck Mobile version
        /// </summary>
        StreamDeckMobile = 3,

        /// <summary>
        /// Corsair G-Keys version
        /// </summary>
        CorsairGKeys = 4,

        /// <summary>
        /// Pedal
        /// </summary>
        StreamDeckPedal = 5,

        /// <summary>
        /// Corsair CUE SDK
        /// </summary>
        CorsairCueSDK = 6,

        /// <summary>
        /// Stream Deck+
        /// </summary>
        StreamDeckPlus = 7,

        /// <summary>
        /// SCUF Controller.
        /// </summary>
        SCUFController = 8,

        /// <summary>
        /// Stream Deck Neo.
        /// </summary>
        StreamDeckNeo = 9
    }
}



================================================
FILE: barraider-sdtools/StreamDeckInfo/StreamDeckApplicationInfo.cs
================================================
﻿using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Holds general information on the StreamDeck App we're communicating with
    /// </summary>
    public class StreamDeckApplicationInfo
    {
        /// <summary>
        /// Current language of the StreamDeck app
        /// </summary>
        [JsonProperty(PropertyName = "language")]
        public string Language { get; private set; }

        /// <summary>
        /// OS Platform
        /// </summary>
        [JsonProperty(PropertyName = "platform")]
        public string Platform { get; private set; }

        /// <summary>
        /// Current version of the StreamDeck app
        /// </summary>
        [JsonProperty(PropertyName = "version")]
        public string Version { get; private set; }

        /// <summary>
        /// Shows class information as string
        /// </summary>
        /// <returns></returns>
        public override string ToString()
        {
            return $"Language: {Language} Platform: {Platform} Version: {Version}";
        }
    }
}



================================================
FILE: barraider-sdtools/StreamDeckInfo/StreamDeckDeviceInfo.cs
================================================
﻿using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Class which holds information on the StreamDeck hardware device
    /// </summary>
    public class StreamDeckDeviceInfo
    {
        /// <summary>
        /// Details on number of keys of the StreamDeck hardware device
        /// </summary>
        [JsonProperty(PropertyName = "size")]
        public StreamDeckDeviceSize Size { get; private set; }

        /// <summary>
        /// Type of StreamDeck hardware device
        /// </summary>
        [JsonProperty(PropertyName = "type")]
        public DeviceType Type { get; private set; }

        /// <summary>
        /// Id of the StreamDeck hardware device
        /// </summary>
        [JsonProperty(PropertyName = "id")]
        public string Id { get; private set; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="size"></param>
        /// <param name="type"></param>
        /// <param name="deviceId"></param>
        public StreamDeckDeviceInfo(StreamDeckDeviceSize size, DeviceType type, string deviceId)
        {
            Size = size;
            Type = type;
            Id = deviceId;
        }

        /// <summary>
        /// Shows class information as string
        /// </summary>
        /// <returns></returns>
        public override string ToString()
        {
            return $"Id: {Id} Type: {Type} Size: {Size?.ToString()}";
        }
    }
}



================================================
FILE: barraider-sdtools/StreamDeckInfo/StreamDeckDeviceSize.cs
================================================
﻿using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Layout of the keys on the StreamDeck hardware device
    /// </summary>
    public class StreamDeckDeviceSize
    {
        /// <summary>
        /// Number of key rows on the StreamDeck hardware device
        /// </summary>
        [JsonProperty(PropertyName = "rows")]
        public int Rows { get; private set; }

        /// <summary>
        /// Number of key columns on the StreamDeck hardware device
        /// </summary>
        [JsonProperty(PropertyName = "columns")]
        public int Cols { get; private set; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="rows"></param>
        /// <param name="cols"></param>
        public StreamDeckDeviceSize(int rows, int cols)
        {
            Rows = rows;
            Cols = cols;
        }

        /// <summary>
        /// Shows class information as string
        /// </summary>
        /// <returns></returns>
        public override string ToString()
        {
            return $"Rows: {Rows} Columns: {Cols}";
        }
    }
}



================================================
FILE: barraider-sdtools/StreamDeckInfo/StreamDeckInfo.cs
================================================
﻿using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Class which holds information on the StreamDeck app and StreamDeck hardware device that the plugin is communicating with
    /// </summary>
    public class StreamDeckInfo
    {
        /// <summary>
        /// Information on the StreamDeck App which we're communicating with
        /// </summary>
        [JsonProperty(PropertyName = "application")]
        public StreamDeckApplicationInfo Application { get; private set; }

        /// <summary>
        /// Information on the StreamDeck hardware device that the plugin is running on
        /// </summary>
        [JsonProperty(PropertyName = "devices")]
        public StreamDeckDeviceInfo[] Devices { get; private set; }

        /// <summary>
        /// Information on the Plugin we're currently running
        /// </summary>
        [JsonProperty(PropertyName = "plugin")]
        public StreamDeckPluginInfo Plugin { get; private set; }

        /// <summary>
        /// Device pixel ratio
        /// </summary>
        [JsonProperty(PropertyName = "devicePixelRatio")]
        public int DevicePixelRatio { get; private set; }

        /// <summary>
        /// Shows class information as string
        /// </summary>
        /// <returns></returns>
        public override string ToString()
        {
            StringBuilder sb = new StringBuilder();
            if (Devices != null)
            {
                sb.Append("Devices:\n");
                for (int device = 0; device < Devices.Length; device++)
                {
                    if (Devices[device] != null)
                    {
                        sb.Append($"[{Devices[device]}]\n");
                    }
                }
            }

            if (Application != null)
            {
                sb.Append($"ApplicationInfo: {Application}\n");
            }

            if (Plugin != null)
            {
                sb.Append($"PluginInfo: {Plugin}\n");
            }
            return sb.ToString();
        }
    }
}



================================================
FILE: barraider-sdtools/StreamDeckInfo/StreamDeckPluginInfo.cs
================================================
﻿using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Holds general information on the StreamDeck App we're communicating with
    /// </summary>
    public class StreamDeckPluginInfo
    {
        /// <summary>
        /// Current version of the plugin
        /// </summary>
        [JsonProperty(PropertyName = "version")]
        public string Version { get; private set; }

        /// <summary>
        /// Shows class information as string
        /// </summary>
        /// <returns></returns>
        public override string ToString()
        {
            return $"Version: {Version}";
        }
    }
}



================================================
FILE: barraider-sdtools/Tools/ExtensionMethods.cs
================================================
﻿using BarRaider.SdTools.Wrappers;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.CompilerServices;
using System.Text;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Extension methods for various objects
    /// </summary>
    public static class ExtensionMethods
    {
        #region Coordinates
        /// <summary>
        /// Checks if too KeyCoordinates match to the same key
        /// </summary>
        /// <param name="coordinates"></param>
        /// <param name="secondCoordinates"></param>
        /// <returns></returns>
        public static bool IsCoordinatesSame(this KeyCoordinates coordinates, KeyCoordinates secondCoordinates)
        {
            if (secondCoordinates == null)
            {
                return false;
            }

            return coordinates.Row == secondCoordinates.Row && coordinates.Column == secondCoordinates.Column;
        }

        #endregion

        #region Brushes/Colors

        /// <summary>
        /// Shows Color In Hex Format
        /// </summary>
        /// <param name="color"></param>
        /// <returns></returns>
        public static string ToHex(this Color color)
        {
            return string.Format("#{0:X2}{1:X2}{2:X2}", color.R, color.G, color.B);
        }

        /// <summary>
        /// Shows Color in Hex format
        /// </summary>
        /// <param name="brush"></param>
        /// <returns></returns>
        public static string ToHex(this Brush brush)
        {
            if (brush is SolidBrush solidBrush)
            {
                return solidBrush.Color.ToHex();
            }
            return null;
        }

        #endregion

        #region Image/Graphics

        /// <summary>
        /// Converts an Image into a Byte Array
        /// </summary>
        /// <param name="image"></param>
        /// <returns></returns>
        public static byte[] ToByteArray(this Image image)
        {
            using (var ms = new MemoryStream())
            {
                image.Save(ms, ImageFormat.Bmp);
                return ms.ToArray();
            }
        }

        /// <summary>
        /// Convert a in-memory image object to Base64 format. Set the addHeaderPrefix to true, if this is sent to the SendImageAsync function
        /// </summary>
        /// <param name="image"></param>
        /// <param name="addHeaderPrefix"></param>
        /// <returns></returns>
        public static string ToBase64(this Image image, bool addHeaderPrefix)
        {
            return Tools.ImageToBase64(image, addHeaderPrefix);
        }

        /// <summary>
        /// Draws a string on a Graphics object and returns the ending Y position of the string
        /// </summary>
        /// <param name="graphics"></param>
        /// <param name="text"></param>
        /// <param name="font"></param>
        /// <param name="brush"></param>
        /// <param name="position"></param>
        /// <returns></returns>
        public static float DrawAndMeasureString(this Graphics graphics, string text, Font font, Brush brush, PointF position)
        {
            SizeF stringSize = graphics.MeasureString(text, font);
            graphics.DrawString(text, font, brush, position);

            return position.Y + stringSize.Height;
        }

        /// <summary>
        /// Returns the center X position of a string, given the image's max Width and Font information
        /// </summary>
        /// <param name="graphics"></param>
        /// <param name="text"></param>
        /// <param name="imageWidth"></param>
        /// <param name="font"></param>
        /// /// <param name="textFitsImage">True/False - Does text fit image? False if text overflows</param>
        /// <param name="minIndentation"></param>
        /// 
        /// <returns></returns>
        public static float GetTextCenter(this Graphics graphics, string text, int imageWidth, Font font, out bool textFitsImage, int minIndentation = 0)
        {
            SizeF stringSize = graphics.MeasureString(text, font);
            float stringWidth = minIndentation;
            textFitsImage = false;
            if (stringSize.Width < imageWidth)
            {
                textFitsImage = true;
                stringWidth = Math.Abs((imageWidth - stringSize.Width)) / 2;
            }
            return stringWidth;
        }

        /// <summary>
        /// Returns the center X position of a string, given the image's max Width and Font information
        /// </summary>
        /// <param name="graphics"></param>
        /// <param name="text"></param>
        /// <param name="imageWidth"></param>
        /// <param name="font"></param>
        /// <param name="minIndentation"></param>
        /// 
        /// <returns></returns>
        public static float GetTextCenter(this Graphics graphics, string text, int imageWidth, Font font, int minIndentation = 0)
        {
            return graphics.GetTextCenter(text, imageWidth, font, out _, minIndentation);
        }

        /// <summary>
        /// Returns the highest size of the given font in which the text fits the image
        /// </summary>
        /// <param name="graphics"></param>
        /// <param name="text"></param>
        /// <param name="imageWidth"></param>
        /// <param name="font"></param>
        /// /// <param name="minimalFontSize"></param>
        /// <returns></returns>
        public static float GetFontSizeWhereTextFitsImage(this Graphics graphics, string text, int imageWidth, Font font, int minimalFontSize = 6)
        {
            bool textFitsImage;
            float size = font.Size;
            Font variableFont = new Font(font.Name, size, font.Style, GraphicsUnit.Pixel);
            do
            {
                graphics.GetTextCenter(text, imageWidth, variableFont, out textFitsImage);
                if (!textFitsImage)
                {
                    variableFont.Dispose();
                    size -= 0.5f;
                    variableFont = new Font(font.Name, size, font.Style, GraphicsUnit.Pixel);
                }
            }
            while (!textFitsImage && size > minimalFontSize);

            variableFont.Dispose();
            return size;
        }

        /// <summary>
        /// Adds a text path to an existing Graphics object. Uses TitleParameters to emulate the Text settings in the Property Inspector
        /// </summary>
        /// <param name="graphics"></param>
        /// <param name="titleParameters"></param>
        /// <param name="imageHeight"></param>
        /// <param name="imageWidth"></param>
        /// <param name="text"></param>
        /// <param name="pixelsAlignment"></param>
        public static void AddTextPath(this Graphics graphics, TitleParameters titleParameters, int imageHeight, int imageWidth, string text, int pixelsAlignment = 15)
        {
            AddTextPath(graphics, titleParameters, imageHeight, imageWidth, text, Color.Black, 1, pixelsAlignment);
        }

        /// <summary>
        /// Adds a text path to an existing Graphics object. Uses TitleParameters to emulate the Text settings in the Property Inspector
        /// </summary>
        /// <param name="graphics"></param>
        /// <param name="titleParameters"></param>
        /// <param name="imageHeight"></param>
        /// <param name="imageWidth"></param>
        /// <param name="text"></param>
        /// <param name="strokeColor"></param>
        /// <param name="strokeThickness"></param>
        /// <param name="pixelsAlignment"></param>
        public static void AddTextPath(this Graphics graphics, TitleParameters titleParameters, int imageHeight, int imageWidth, string text, Color strokeColor, float strokeThickness, int pixelsAlignment = 15)
        {
            try
            {
                if (titleParameters == null)
                {
                    Logger.Instance.LogMessage(TracingLevel.ERROR, $"AddTextPath: titleParameters is null");
                    return;
                }

                Font font = new Font(titleParameters.FontFamily, (float)titleParameters.FontSizeInPixelsScaledToDefaultImage, titleParameters.FontStyle, GraphicsUnit.Pixel);
                Color color = titleParameters.TitleColor;
                graphics.PageUnit = GraphicsUnit.Pixel;
                float ratio = graphics.DpiY / imageWidth;
                SizeF stringSize = graphics.MeasureString(text, font);
                float textWidth = stringSize.Width * (1 - ratio);
                float textHeight = stringSize.Height * (1 - ratio);
                int stringWidth = 0;
                if (textWidth < imageWidth)
                {
                    stringWidth = (int)(Math.Abs((imageWidth - textWidth)) / 2) - pixelsAlignment;
                }

                int stringHeight = pixelsAlignment; // Top
                if (titleParameters.VerticalAlignment == TitleVerticalAlignment.Middle)
                {
                    stringHeight = (imageHeight / 2) - pixelsAlignment;
                }
                else if (titleParameters.VerticalAlignment == TitleVerticalAlignment.Bottom)
                {
                    stringHeight = (int)(Math.Abs((imageHeight - textHeight)) - pixelsAlignment);
                }

                Pen stroke = new Pen(strokeColor, strokeThickness);
                GraphicsPath gpath = new GraphicsPath();
                gpath.AddString(text,
                                    font.FontFamily,
                                    (int)font.Style,
                                    graphics.DpiY * font.SizeInPoints / imageWidth,
                                    new Point(stringWidth, stringHeight),
                                    new StringFormat());
                graphics.DrawPath(stroke, gpath);
                graphics.FillPath(new SolidBrush(color), gpath);
            }
            catch (Exception ex)
            {
                Logger.Instance.LogMessage(TracingLevel.ERROR, $"AddTextPath Exception {ex}");
            }
        }

        #endregion

        #region String


        /// <summary>
        /// /// Truncates a string to the first maxSize characters. If maxSize is less than string length, original string will be returned
        /// </summary>
        /// <param name="str">String</param>
        /// <param name="maxSize">Max size for string</param>
        /// <returns></returns>
        public static string Truncate(this string str, int maxSize)
        {
            if (String.IsNullOrEmpty(str))
            {
                return null;
            }

            if (maxSize < 1)
            {
                return str;
            }

            return str.Substring(0, Math.Min(Math.Max(0, maxSize), str.Length));
        }

        /// <summary>
        /// Adds line breaks (\n) to the text to make sure it fits the key when using SetTitleAsync()
        /// </summary>
        /// <param name="str"></param>
        /// <param name="titleParameters"></param>
        /// <param name="leftPaddingPixels"></param>
        /// <param name="rightPaddingPixels"></param>
        /// <param name="imageWidthPixels"></param>
        /// <returns></returns>
        public static string SplitToFitKey(this string str, TitleParameters titleParameters, int leftPaddingPixels = 3, int rightPaddingPixels = 3, int imageWidthPixels = 72)
        {
            try
            {
                if (titleParameters == null)
                {
                    return str;
                }

                int padding = leftPaddingPixels + rightPaddingPixels;
                Font font = new Font(titleParameters.FontFamily, (float)titleParameters.FontSizeInPoints, titleParameters.FontStyle, GraphicsUnit.Pixel);
                StringBuilder finalString = new StringBuilder();
                StringBuilder currentLine = new StringBuilder();
                SizeF currentLineSize;

                using (Bitmap img = new Bitmap(imageWidthPixels, imageWidthPixels))
                {
                    using (Graphics graphics = Graphics.FromImage(img))
                    {
                        for (int idx = 0; idx < str.Length; idx++)
                        {
                            currentLine.Append(str[idx]);
                            currentLineSize = graphics.MeasureString(currentLine.ToString(), font);
                            if (currentLineSize.Width <= img.Width - padding)
                            {
                                finalString.Append(str[idx]);
                            }
                            else // Overflow
                            {
                                finalString.Append("\n" + str[idx]);
                                currentLine = new StringBuilder(str[idx].ToString());
                            }
                        }
                    }
                }

                return finalString.ToString();
            }
            catch (Exception ex)
            {
                Logger.Instance.LogMessage(TracingLevel.ERROR, $"SplitStringToFit Exception: {ex}");
                return str;
            }
        }


        #endregion
    }
}



================================================
FILE: barraider-sdtools/Tools/GlobalSettingsManager.cs
================================================
﻿using BarRaider.SdTools.Communication;
using BarRaider.SdTools.Communication.SDEvents;
using BarRaider.SdTools.Payloads;
using BarRaider.SdTools.Wrappers;
using Newtonsoft.Json.Linq;
using System;
using System.Threading.Tasks;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Helper class which allows fetching the GlobalSettings of a plugin
    /// </summary>
    public class GlobalSettingsManager
    {
        #region Private Static Members

        private static GlobalSettingsManager instance = null;
        private static readonly object objLock = new object();

        #endregion

        #region Private Members

        private const int GET_GLOBAL_SETTINGS_DELAY_MS = 300;

        private Communication.StreamDeckConnection connection;
        private readonly System.Timers.Timer tmrGetGlobalSettings = new System.Timers.Timer();

        #endregion

        #region Constructor

        /// <summary>
        /// Returns singelton entry of GlobalSettingsManager
        /// </summary>
        public static GlobalSettingsManager Instance
        {
            get
            {
                if (instance != null)
                {
                    return instance;
                }

                lock (objLock)
                {
                    if (instance == null)
                    {
                        instance = new GlobalSettingsManager();
                    }
                    return instance;
                }
            }
        }

        private GlobalSettingsManager()
        {
            tmrGetGlobalSettings.Interval = GET_GLOBAL_SETTINGS_DELAY_MS;
            tmrGetGlobalSettings.Elapsed += TmrGetGlobalSettings_Elapsed;
            tmrGetGlobalSettings.AutoReset = true;
        }

        #endregion

        #region Public Methods

        /// <summary>
        /// Event triggered when Global Settings are received
        /// </summary>
        public event EventHandler<ReceivedGlobalSettingsPayload> OnReceivedGlobalSettings;


        internal void Initialize(StreamDeckConnection connection, int getGlobalSettingsDelayMs = GET_GLOBAL_SETTINGS_DELAY_MS)
        {
            this.connection = connection;
            this.connection.OnDidReceiveGlobalSettings += Connection_OnDidReceiveGlobalSettings;

            tmrGetGlobalSettings.Stop();
            tmrGetGlobalSettings.Interval = getGlobalSettingsDelayMs;
            Logger.Instance.LogMessage(TracingLevel.INFO, "GlobalSettingsManager initialized");
        }

        /// <summary>
        /// Command to request the Global Settings. Use the OnDidReceiveGlobalSSettings callback function to receive the Global Settings.
        /// </summary>
        /// <returns></returns>
        public void RequestGlobalSettings()
        {
            if (connection == null)
            {
                Logger.Instance.LogMessage(TracingLevel.ERROR, "GlobalSettingsManager::RequestGlobalSettings called while connection is null");
                return;
            }

            Logger.Instance.LogMessage(TracingLevel.INFO, "GlobalSettingsManager::RequestGlobalSettings called");
            tmrGetGlobalSettings.Start();
        }

        /// <summary>
        /// Sets the Global Settings for the plugin
        /// </summary>
        /// <param name="settings"></param>
        /// <param name="triggerDidReceiveGlobalSettings"></param>
        /// <returns></returns>
        public async Task SetGlobalSettings(JObject settings, bool triggerDidReceiveGlobalSettings = true)
        {
            if (connection == null)
            {
                Logger.Instance.LogMessage(TracingLevel.ERROR, "GlobalSettingsManager::SetGlobalSettings called while connection is null");
                return;
            }

            Logger.Instance.LogMessage(TracingLevel.INFO, "GlobalSettingsManager::SetGlobalSettings called");
            await connection.SetGlobalSettingsAsync(settings);

            if (triggerDidReceiveGlobalSettings)
            {
                tmrGetGlobalSettings.Start();
            }
        }


        #endregion

        #region Private Methods

        private void Connection_OnDidReceiveGlobalSettings(object sender, SDEventReceivedEventArgs<DidReceiveGlobalSettingsEvent> e)
        {
            OnReceivedGlobalSettings?.Invoke(this, JObject.FromObject(e.Event.Payload).ToObject<ReceivedGlobalSettingsPayload>());
        }

        private async void TmrGetGlobalSettings_Elapsed(object sender, System.Timers.ElapsedEventArgs e)
        {
            tmrGetGlobalSettings.Stop();

            Logger.Instance.LogMessage(TracingLevel.INFO, "GlobalSettingsManager::GetGlobalSettingsAsync triggered");
            await connection.GetGlobalSettingsAsync();
        }

        #endregion
    }
}



================================================
FILE: barraider-sdtools/Tools/GraphicsTools.cs
================================================
﻿using BarRaider.SdTools.Wrappers;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Text;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Library of tools used to manipulate graphics
    /// </summary>
    public static class GraphicsTools
    {
        /// <summary>
        /// Return a Color object based on the hex value
        /// </summary>
        /// <param name="hexColor"></param>
        /// <returns></returns>
        public static Color ColorFromHex(string hexColor)
        {
            return System.Drawing.ColorTranslator.FromHtml(hexColor);
        }

        /// <summary>
        /// Generates multiple shades based on an initial color, and number of stages/shades you want
        /// </summary>
        /// <param name="initialColor"></param>
        /// <param name="currentShade"></param>
        /// <param name="totalAmountOfShades"></param>
        /// <returns></returns>
        public static Color GenerateColorShades(string initialColor, int currentShade, int totalAmountOfShades)
        {
            Color color = ColorFromHex(initialColor);
            int a = color.A;
            double r = color.R;
            double g = color.G;
            double b = color.B;

            // Try and increase the color in the last stage;
            if (currentShade == totalAmountOfShades - 1)
            {
                currentShade = 1;
            }

            for (int idx = 0; idx < currentShade; idx++)
            {
                r /= 2;
                g /= 2;
                b /= 2;
            }

            return Color.FromArgb(a, (int)r, (int)g, (int)b);
        }

        /// <summary>
        /// Resizes an image while scaling
        /// </summary>
        /// <param name="original"></param>
        /// <param name="newWidth"></param>
        /// <param name="newHeight"></param>
        /// <returns></returns>
        public static Image ResizeImage(Image original, int newWidth, int newHeight)
        {
            if (original == null)
            {
                return null;
            }

            int originalWidth = original.Width;
            int originalHeight = original.Height;

            Image canvas = new Bitmap(newWidth, newHeight);
            Graphics graphic = Graphics.FromImage(canvas);

            graphic.InterpolationMode = InterpolationMode.HighQualityBicubic;
            graphic.SmoothingMode = SmoothingMode.HighQuality;
            graphic.PixelOffsetMode = PixelOffsetMode.HighQuality;
            graphic.CompositingQuality = CompositingQuality.HighQuality;

            // Figure out the ratio
            double ratioX = (double)newWidth / (double)originalWidth;
            double ratioY = (double)newHeight / (double)originalHeight;
            // use whichever multiplier is smaller
            double ratio = ratioX < ratioY ? ratioX : ratioY;

            // now we can get the new height and width
            //int imgHeight = Convert.ToInt32(originalHeight * ratio);
            //int imgWidth = Convert.ToInt32(originalWidth * ratio);

            // Now calculate the X,Y position of the upper-left corner 
            // (one of these will always be zero)
            int posX = Convert.ToInt32((newWidth - (originalWidth * ratio)) / 2);
            int posY = Convert.ToInt32((newHeight - (originalHeight * ratio)) / 2);

            graphic.Clear(Color.Black); // Padding
            graphic.DrawImage(original, posX, posY, newWidth, newHeight);

            return canvas;
        }

        /// <summary>
        /// Extract a part of an Image
        /// </summary>
        /// <param name="image"></param>
        /// <param name="startX"></param>
        /// <param name="startY"></param>
        /// <param name="width"></param>
        /// <param name="height"></param>
        /// <returns></returns>
        public static Bitmap ExtractRectangle(Image image, int startX, int startY, int width, int height)
        {
            Rectangle rec = new Rectangle(startX, startY, width, height);
            using (Bitmap src = new Bitmap(image))
            {
                return src.Clone(rec, src.PixelFormat);
            }
        }

        /// <summary>
        /// Creates a new image with different opacity
        /// </summary>
        /// <param name="image"></param>
        /// <param name="opacity"></param>
        /// <returns></returns>
        public static Image CreateOpacityImage(Image image, float opacity)
        {
            try
            {
                //create a Bitmap the size of the image provided  
                Bitmap bmp = new Bitmap(image.Width, image.Height);

                //create a graphics object from the image  
                using (Graphics gfx = Graphics.FromImage(bmp))
                {
                    //create a color matrix object  
                    ColorMatrix matrix = new ColorMatrix
                    {
                        //set the opacity  
                        Matrix33 = opacity
                    };

                    //create image attributes  
                    ImageAttributes attributes = new ImageAttributes();

                    //set the color(opacity) of the image  
                    attributes.SetColorMatrix(matrix, ColorMatrixFlag.Default, ColorAdjustType.Bitmap);

                    //now draw the image  
                    gfx.DrawImage(image, new Rectangle(0, 0, bmp.Width, bmp.Height), 0, 0, image.Width, image.Height, GraphicsUnit.Pixel, attributes);
                }
                return bmp;
            }
            catch (Exception ex)
            {
                Logger.Instance.LogMessage(TracingLevel.ERROR, $"SetImageOpacity exception {ex}");
                return null;
            }
        }

        /// <summary>
        /// Generates one (or more) images where each one has a few letters drawn on them based on the parameters. You can set number of letters and number of lines per key. 
        /// Use expandToNextImage to decide if you want only one Image returned or multiple if text is too long for one key
        /// </summary>
        /// <param name="text"></param>
        /// <param name="currentTextPosition"></param>
        /// <param name="lettersPerLine"></param>
        /// <param name="numberOfLines"></param>
        /// <param name="font"></param>
        /// <param name="backgroundColor"></param>
        /// <param name="textColor"></param>
        /// <param name="expandToNextImage"></param>
        /// <param name="keyDrawStartingPosition"></param>
        /// <returns></returns>
        public static Image[] DrawMultiLinedText(string text, int currentTextPosition, int lettersPerLine, int numberOfLines, Font font, Color backgroundColor, Color textColor, bool expandToNextImage, PointF keyDrawStartingPosition)
        {
            float currentWidth = keyDrawStartingPosition.X;
            float currentHeight = keyDrawStartingPosition.Y;
            int currentLine = 0;
            List<Image> images = new List<Image>();
            Bitmap img = Tools.GenerateGenericKeyImage(out Graphics graphics);
            images.Add(img);

            // Draw Background
            var bgBrush = new SolidBrush(backgroundColor);
            graphics.FillRectangle(bgBrush, 0, 0, img.Width, img.Height);

            float lineHeight = img.Height / numberOfLines;
            if (numberOfLines == 1)
            {
                currentHeight = img.Height / 2; // Align to middle
            }

            float widthIncrement = img.Width / lettersPerLine;
            for (int letter = currentTextPosition; letter < text.Length; letter++)
            {
                // Check if I need to move back to the beginning of the key, but on a new line
                if (letter > currentTextPosition && letter % lettersPerLine == 0)
                {
                    currentLine++;
                    if (currentLine >= numberOfLines)
                    {
                        if (expandToNextImage)
                        {
                            images.AddRange(DrawMultiLinedText(text, letter, lettersPerLine, numberOfLines, font, backgroundColor, textColor, expandToNextImage, keyDrawStartingPosition));
                        }
                        break;
                    }

                    currentHeight += lineHeight;
                    currentWidth = keyDrawStartingPosition.X;
                }

                graphics.DrawString(text[letter].ToString(), font, new SolidBrush(textColor), new PointF(currentWidth, currentHeight));
                currentWidth += widthIncrement;
            }
            graphics.Dispose();
            return images.ToArray();
        }

        /// <summary>
        /// Adds line breaks ('\n') to the string every time the text would overflow the image
        /// </summary>
        /// <param name="str"></param>
        /// <param name="titleParameters"></param>
        /// <param name="leftPaddingPixels"></param>
        /// <param name="rightPaddingPixels"></param>
        /// <param name="imageWidthPixels"></param>
        /// <returns></returns>
        public static string WrapStringToFitImage(string str, TitleParameters titleParameters, int leftPaddingPixels = 5, int rightPaddingPixels = 5, int imageWidthPixels = 72)
        {
            try
            {
                if (titleParameters == null)
                {
                    return str;
                }

                int padding = leftPaddingPixels + rightPaddingPixels;
                Font font = new Font(titleParameters.FontFamily, (float)titleParameters.FontSizeInPixels, titleParameters.FontStyle, GraphicsUnit.Pixel);
                StringBuilder finalString = new StringBuilder();
                StringBuilder currentLine = new StringBuilder();
                SizeF currentLineSize;

                using (Bitmap img = new Bitmap(imageWidthPixels, imageWidthPixels))
                {
                    using (Graphics graphics = Graphics.FromImage(img))
                    {
                        for (int idx = 0; idx < str.Length; idx++)
                        {
                            currentLine.Append(str[idx]);
                            currentLineSize = graphics.MeasureString(currentLine.ToString(), font);
                            if (currentLineSize.Width <= img.Width - padding)
                            {
                                finalString.Append(str[idx]);
                            }
                            else // Overflow
                            {
                                finalString.Append("\n" + str[idx]);
                                currentLine = new StringBuilder(str[idx].ToString());
                            }
                        }
                    }
                }

                return finalString.ToString();
            }
            catch (Exception ex)
            {
                Logger.Instance.LogMessage(TracingLevel.ERROR, $"WrapStringToFitImage Exception: {ex}");
                return str;
            }
        }
    }
}



================================================
FILE: barraider-sdtools/Tools/IUpdateHandler.cs
================================================
﻿using BarRaider.SdTools.Events;
using BarRaider.SdTools.Wrappers;
using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Interface for a plugin update handler
    /// </summary>
    public interface IUpdateHandler : IDisposable
    {
        #region Events

        /// <summary>
        /// Event received by the infrastructure after an upgrade check
        /// </summary>
        event EventHandler<PluginUpdateInfo> OnUpdateStatusChanged;

        #endregion

        #region Properties
        /// <summary>
        /// Is the current update a blocking one
        /// </summary>
        bool IsBlockingUpdate { get; }

        #endregion

        #region Methods

        /// <summary>
        /// Sets the information about the plugin
        /// </summary>
        /// <param name="pluginName"></param>
        /// <param name="pluginVersion"></param>
        void SetPluginConfiguration(string pluginName, string pluginVersion);

        /// <summary>
        /// Sets the plugin global settings
        /// </summary>
        /// <param name="settings"></param>
        void SetGlobalSettings(object settings);

        /// <summary>
        /// Checks for update
        /// </summary>
        void CheckForUpdate();

        #endregion

    }
}



================================================
FILE: barraider-sdtools/Tools/Logger.cs
================================================
﻿using NLog;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Tracing levels used for Logger
    /// </summary>
    public enum TracingLevel
    {
        /// <summary>
        /// Debug level
        /// </summary>
        DEBUG,

        /// <summary>
        /// Informational level
        /// </summary>
        INFO,

        /// <summary>
        /// Warning level
        /// </summary>
        WARN,

        /// <summary>
        /// Error level
        /// </summary>
        ERROR,

        /// <summary>
        /// Fatal (highest) level
        /// </summary>
        FATAL
    }

    /// <summary>
    /// Log4Net logger helper class
    /// </summary>
    public class Logger
    {
        private static Logger instance = null;
        private static readonly object objLock = new object();

        /// <summary>
        /// Returns singelton entry of Log4Net logger
        /// </summary>
        public static Logger Instance
        {
            get
            {
                if (instance != null)
                {
                    return instance;
                }

                lock (objLock)
                {
                    if (instance == null)
                    {
                        instance = new Logger();
                    }
                    return instance;
                }
            }
        }

        private readonly NLog.Logger log = null;
        private Logger()
        {
            var config = new NLog.Config.LoggingConfiguration();
            var logfile = new NLog.Targets.FileTarget("logfile") { FileName = "pluginlog.log", ArchiveEvery=NLog.Targets.FileArchivePeriod.Day, MaxArchiveFiles=3, ArchiveFileName="archive/log.{###}.log", ArchiveNumbering=NLog.Targets.ArchiveNumberingMode.Rolling, Layout = "${longdate}|${level:uppercase=true}|${processname}|${threadid}|${message}" };
            config.AddRule(LogLevel.Debug, LogLevel.Fatal, logfile);
            NLog.LogManager.Configuration = config;
            log = LogManager.GetCurrentClassLogger();
            LogMessage(TracingLevel.DEBUG, "Logger Initialized");
        }

        /// <summary>
        /// Add message to log with a specific severity level. 
        /// </summary>
        /// <param name="Level"></param>
        /// <param name="Message"></param>
        public void LogMessage(TracingLevel Level, string Message)
        {
            switch (Level)
            {
                case TracingLevel.DEBUG:
                    log.Debug(Message);
                    break;

                case TracingLevel.INFO:
                    log.Info(Message);
                    break;

                case TracingLevel.WARN:
                    log.Warn(Message);
                    break;

                case TracingLevel.ERROR:
                    log.Error(Message);
                    break;

                case TracingLevel.FATAL:
                    log.Fatal(Message);
                    break;
            }
        }
    }
}



================================================
FILE: barraider-sdtools/Tools/PayloadExtensionMethods.cs
================================================
﻿using BarRaider.SdTools.Payloads;
using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools
{
    internal static class PayloadExtensionMethods
    {
        internal static string ToStringEx(this ReceivedSettingsPayload rsp)
        {
            if (rsp == null)
            {
                return "ReceiveSettingsPayload is null!";
            }
            return $"IsInMultiAction: {rsp.IsInMultiAction} Coordinates: ({rsp.Coordinates?.Row},{rsp.Coordinates?.Column}) Settings: {rsp.Settings}";
        }

        internal static string ToStringEx(this AppearancePayload ap)
        {
            if (ap == null)
            {
                return "AppearancePayload is null!";
            }
            return $"State: {ap.State} IsInMultiAction: {ap.IsInMultiAction} Coordinates: ({ap.Coordinates?.Row},{ap.Coordinates?.Column}) Settings: {ap.Settings}";
        }

        internal static string ToStringEx(this KeyPayload kp)
        {
            if (kp == null)
            {
                return "KeyPayload is null!";
            }
            return $"State: {kp.State} IsInMultiAction: {kp.IsInMultiAction} DesiredState: {kp.UserDesiredState} Coordinates: ({kp.Coordinates?.Row},{kp.Coordinates?.Column}) Settings: {kp.Settings}";
        }

        internal static string ToStringEx(this ReceivedGlobalSettingsPayload gsp)
        {
            if (gsp == null)
            {
                return "ReceiveGlobalSettingsPayload is null!";
            }
            return $"Settings: {gsp.Settings}";
        }

        internal static string ToStringEx(this DialRotatePayload drp)
        {
            if (drp == null)
            {
                return "DialRotatePayload is null!";
            }
            return $"Controller: {drp.Controller} Ticks: {drp.Ticks} Coordinates: ({drp.Coordinates?.Row},{drp.Coordinates?.Column}) Settings: {drp.Settings}";
        }

        internal static string ToStringEx(this DialPayload dpp)
        {
            if (dpp == null)
            {
                return "DialPressPayload is null!";
            }
            return $"Controller: {dpp.Controller} Coordinates: ({dpp.Coordinates?.Row},{dpp.Coordinates?.Column}) Settings: {dpp.Settings}";
        }

        internal static string ToStringEx(this TouchpadPressPayload tpp)
        {
            if (tpp == null)
            {
                return "KeyPayload is null!";
            }
            return $"Controller: {tpp.Controller} LongPress: {tpp.IsLongPress} Position: {(tpp.TapPosition?.Length == 2 ? tpp.TapPosition[0].ToString() + "," + tpp.TapPosition[1] : "Invalid")} Coordinates: ({tpp.Coordinates?.Row},{tpp.Coordinates?.Column}) Settings: {tpp.Settings}";
        }
    }
}



================================================
FILE: barraider-sdtools/Tools/PluginUpdateInfo.cs
================================================
﻿using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Status of update request
    /// </summary>
    public enum PluginUpdateStatus
    {
        /// <summary>
        /// Unknown reply
        /// </summary>
        Unknown = 0,

        /// <summary>
        /// Plugin is up to date
        /// </summary>
        UpToDate = 1,

        /// <summary>
        /// Minor version update available
        /// </summary>
        MinorUpgrade = 2,

        /// <summary>
        /// Major version update available
        /// </summary>
        MajorUpgrade = 3,

        /// <summary>
        /// Critical update needed
        /// </summary>
        CriticalUpgrade = 4
    }

    /// <summary>
    /// Response to an update request
    /// </summary>
    public class PluginUpdateInfo
    {
        /// <summary>
        /// Status
        /// </summary>
        [JsonProperty("status")]
        public PluginUpdateStatus Status { get; private set; }

        /// <summary>
        /// Update URL
        /// </summary>
        [JsonProperty("updateURL")]
        public string UpdateURL { get; private set; }

        /// <summary>
        /// Update URL
        /// </summary>
        [JsonProperty("updateImage")]
        public string UpdateImage { get; private set; }

        /// <summary>
        /// Default Constructor
        /// </summary>
        public PluginUpdateInfo()
        {
        }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="status"></param>
        /// <param name="updateURL"></param>
        /// /// <param name="updateImage"></param>
        public PluginUpdateInfo(PluginUpdateStatus status, string updateURL, string updateImage)
        {
            Status = status;
            UpdateURL = updateURL;
            UpdateImage = updateImage;
        }
    }
}



================================================
FILE: barraider-sdtools/Tools/RandomGenerator.cs
================================================
﻿using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Helper class for generating random numbers
    /// </summary>
    public static class RandomGenerator
    {
        private static readonly Random random = new Random();

        /// <summary>
        /// Returns a non-negative random integer that is less than the specified maximum.
        /// </summary>
        /// <param name="maxValue"></param>
        /// <returns></returns>
        public static int Next(int maxValue)
        {
            return random.Next(maxValue);
        }

        /// <summary>
        /// Returns a random integer that is within a specified range. Value will be less than the specified maximum.
        /// </summary>
        /// <param name="minValue"></param>
        /// <param name="maxValue"></param>
        /// <returns></returns>
        public static int Next(int minValue, int maxValue)
        {
            return random.Next(minValue, maxValue);
        }
    }
}



================================================
FILE: barraider-sdtools/Tools/Tools.cs
================================================
﻿using BarRaider.SdTools.Wrappers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Drawing.Text;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;

namespace BarRaider.SdTools
{
    /// <summary>
    /// Set of common utilities used by various plugins
    /// Currently the class mostly focuses on image-related functions that will be passed to the StreamDeck key
    /// </summary>
    public static class Tools
    {
        private const string HEADER_PREFIX = "data:image/png;base64,";
        private const int CLASSIC_KEY_DEFAULT_HEIGHT = 72;
        private const int CLASSIC_KEY_DEFAULT_WIDTH = 72;
        private const int PLUS_KEY_DEFAULT_HEIGHT = 144;
        private const int PLUS_KEY_DEFAULT_WIDTH = 144;
        private const int XL_KEY_DEFAULT_HEIGHT = 96;
        private const int XL_KEY_DEFAULT_WIDTH = 96;
        private const int GENERIC_KEY_IMAGE_SIZE = 144;
        private const string FILENAME_NO_FILE_STRING = "No file...";

        #region Image Related

        /// <summary>
        /// Convert an image file to Base64 format. Set the addHeaderPrefix to true, if this is sent to the SendImageAsync function
        /// </summary>
        /// <param name="fileName"></param>
        /// <param name="addHeaderPrefix"></param>
        /// <returns></returns>
        public static string FileToBase64(string fileName, bool addHeaderPrefix)
        {
            if (!File.Exists(fileName))
            {
                return null;
            }

            using (Image image = Image.FromFile(fileName))
            {
                return ImageToBase64(image, addHeaderPrefix);
            }
        }

        /// <summary>
        /// Convert a in-memory image object to Base64 format. Set the addHeaderPrefix to true, if this is sent to the SendImageAsync function
        /// </summary>
        /// <param name="image"></param>
        /// <param name="addHeaderPrefix"></param>
        /// <returns></returns>
        public static string ImageToBase64(Image image, bool addHeaderPrefix)
        {
            if (image == null)
            {
                return null;
            }

            using (MemoryStream m = new MemoryStream())
            {
                image.Save(m, ImageFormat.Png);
                byte[] imageBytes = m.ToArray();

                // Convert byte[] to Base64 String
                string base64String = Convert.ToBase64String(imageBytes);
                return addHeaderPrefix ? HEADER_PREFIX + base64String : base64String;
            }
        }

        /// <summary>
        /// Convert a base64 image string to an Image object
        /// </summary>
        /// <param name="base64String"></param>
        /// <returns></returns>
        public static Image Base64StringToImage(string base64String)
        {
            try
            {
                if (string.IsNullOrEmpty(base64String))
                {
                    return null;
                }

                // Remove header
                if (base64String.Substring(0, HEADER_PREFIX.Length) == HEADER_PREFIX)
                {
                    base64String = base64String.Substring(HEADER_PREFIX.Length);
                }

                byte[] imageBytes = Convert.FromBase64String(base64String);
                using (MemoryStream m = new MemoryStream(imageBytes))
                {
                    return Image.FromStream(m);
                }
            }
            catch (Exception ex)
            {
                Logger.Instance.LogMessage(TracingLevel.ERROR, $"Base64StringToImage Exception: {ex}");
            }
            return null;
        }

        /// <summary>
        /// Gets the key default height in pixels.
        /// To get the StreamDeckType use Connection.DeviceInfo()
        /// </summary>
        /// <param name="streamDeckType"></param>
        /// <returns></returns>
        public static int GetKeyDefaultHeight(DeviceType streamDeckType)
        {
            switch (streamDeckType)
            {
                case DeviceType.StreamDeckClassic:
                case DeviceType.StreamDeckMini:
                case DeviceType.StreamDeckMobile:
                case DeviceType.StreamDeckNeo:
                    return CLASSIC_KEY_DEFAULT_HEIGHT;
                case DeviceType.StreamDeckXL:
                    return XL_KEY_DEFAULT_HEIGHT;
                case DeviceType.StreamDeckPlus:
                    return PLUS_KEY_DEFAULT_HEIGHT;
                default:
                    Logger.Instance.LogMessage(TracingLevel.ERROR, $"SDTools GetKeyDefaultHeight Error: Invalid StreamDeckDeviceType: {streamDeckType}");
                    break;
            }
            return 1;
        }

        /// <summary>
        /// Gets the key default width in pixels.
        /// To get the StreamDeckType use Connection.DeviceInfo()
        /// </summary>
        /// <param name="streamDeckType"></param>
        /// <returns></returns>
        public static int GetKeyDefaultWidth(DeviceType streamDeckType)
        {
            switch (streamDeckType)
            {
                case DeviceType.StreamDeckClassic:
                case DeviceType.StreamDeckMini:
                case DeviceType.StreamDeckMobile:
                case DeviceType.StreamDeckNeo:
                    return CLASSIC_KEY_DEFAULT_WIDTH;
                case DeviceType.StreamDeckXL:
                    return XL_KEY_DEFAULT_WIDTH;
                case DeviceType.StreamDeckPlus:
                    return PLUS_KEY_DEFAULT_WIDTH;
                default:
                    Logger.Instance.LogMessage(TracingLevel.ERROR, $"SDTools GetKeyDefaultHeight Error: Invalid StreamDeckDeviceType: {streamDeckType}");
                    break;
            }
            return 1;
        }

        /// <summary>
        /// Generates an empty key bitmap with the default height and width.
        /// New: To get the StreamDeckType use Connection.DeviceInfo()
        /// </summary>
        /// <param name="streamDeckType"></param>
        /// <param name="graphics"></param>
        /// <returns></returns>
        public static Bitmap GenerateKeyImage(DeviceType streamDeckType, out Graphics graphics)
        {
            int height = GetKeyDefaultHeight(streamDeckType);
            int width = GetKeyDefaultWidth(streamDeckType);

            return GenerateKeyImage(height, width, out graphics);
        }

        /// <summary>
        /// Creates a key image that fits all Stream Decks
        /// </summary>
        /// <param name="graphics"></param>
        /// <returns></returns>
        public static Bitmap GenerateGenericKeyImage(out Graphics graphics)
        {
            return GenerateKeyImage(GENERIC_KEY_IMAGE_SIZE, GENERIC_KEY_IMAGE_SIZE, out graphics);
        }

        /// <summary>
        /// Creates a key image based on given height and width
        /// </summary>
        /// <param name="height"></param>
        /// <param name="width"></param>
        /// <param name="graphics"></param>
        /// <returns></returns>
        private static Bitmap GenerateKeyImage(int height, int width, out Graphics graphics)
        {
            try
            {
                Bitmap bitmap = new Bitmap(width, height);
                var brush = new SolidBrush(Color.Black);

                graphics = Graphics.FromImage(bitmap);
                graphics.SmoothingMode = SmoothingMode.AntiAlias;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
                graphics.TextRenderingHint = TextRenderingHint.AntiAliasGridFit;

                //Fill background black
                graphics.FillRectangle(brush, 0, 0, width, height);
                return bitmap;
            }
            catch (Exception ex)
            {
                Logger.Instance.LogMessage(TracingLevel.ERROR, $"SDTools GenerateKeyImage exception: {ex} Height: {height} Width: {width}");
            }
            graphics = null;
            return null;
        }

        /// <summary>
        /// Deprecated! Use AddTextPath on the Graphics extension method instead.
        /// Adds a text path to an existing Graphics object. Uses TitleParser to emulate the Text settings in the Property Inspector
        /// </summary>
        /// <param name="graphics"></param>
        /// <param name="titleParameters"></param>
        /// <param name="imageHeight"></param>
        /// <param name="imageWidth"></param>
        /// <param name="text"></param>
        /// <param name="pixelsAlignment"></param>
        [Obsolete("Use graphics.AddTextPath() extension method instead")]
        public static void AddTextPathToGraphics(Graphics graphics, TitleParameters titleParameters, int imageHeight, int imageWidth, string text, int pixelsAlignment = 15)
        {
            if (graphics != null)
            {
                graphics.AddTextPath(titleParameters, imageHeight, imageWidth, text, pixelsAlignment);
            }
        }

        #endregion

        #region Filename Related

        /// <summary>
        /// Extracts the actual filename from a file payload received from the Property Inspector
        /// </summary>
        /// <param name="payload"></param>
        /// <returns></returns>
        public static string FilenameFromPayload(Newtonsoft.Json.Linq.JToken payload)
        {
            return FilenameFromString((string)payload);
        }

        private static string FilenameFromString(string filenameWithFakepath)
        {
            if (string.IsNullOrEmpty(filenameWithFakepath))
            {
                return null;
            }

            if (filenameWithFakepath == FILENAME_NO_FILE_STRING)
            {
                return String.Empty;
            }

            return Uri.UnescapeDataString(filenameWithFakepath.Replace("C:\\fakepath\\", ""));
        }

        #endregion

        #region String Related

        /// <summary>
        /// Converts a long to a human-readable string. Example: 54,265 => 54.27k
        /// </summary>
        /// <param name="num"></param>
        /// <returns></returns>
        public static string FormatNumber(long num)
        {
            if (num >= 100000000)
            {
                return (num / 1000000D).ToString("0.#M");
            }
            if (num >= 1000000)
            {
                return (num / 1000000D).ToString("0.##M");
            }
            if (num >= 100000)
            {
                return (num / 1000D).ToString("0.#k");
            }
            if (num >= 10000)
            {
                return (num / 1000D).ToString("0.##k");
            }

            return num.ToString("#,0");
        }

        //// <summary>Converts number in bytes to human-readable size (ex. "2 GB")</summary>
        /// <param name="numberInBytes">Size in bytes</param>
        /// <returns>Formatted human-readable string (ex. "2 MB")</returns>
        public static string FormatBytes(double numberInBytes)
        {
            var sizeCounter = 0;
            var format = new[] { "{0:F0} B", "{0:F0} KB", "{0:F0} MB", "{0:F0} GB", "{0:F2} TB", "{0:F2} PB", "{0:F2} EB" };
            while (sizeCounter < format.Length && numberInBytes >= 1024d)
            {
                numberInBytes = 100d * numberInBytes / 1024d / 100d;
                sizeCounter++;
            }
            return String.Format(format[sizeCounter], numberInBytes);
        }

        /// <summary>
        /// OBSOLETE - Use String.SplitToFitKey() from SdTools.ExtensionMethods
        /// </summary>
        /// <param name="str"></param>
        /// <param name="titleParameters"></param>
        /// <param name="leftPaddingPixels"></param>
        /// <param name="rightPaddingPixels"></param>
        /// <param name="imageWidthPixels"></param>
        /// <returns></returns>
        [Obsolete("Use String.SplitToFitKey(), now part of the SdTools.ExtensionMethods")]
        public static string SplitStringToFit(string str, TitleParameters titleParameters, int leftPaddingPixels = 3, int rightPaddingPixels = 3, int imageWidthPixels = 72)
        {
            return str.SplitToFitKey(titleParameters, leftPaddingPixels, rightPaddingPixels, imageWidthPixels);
        }

        #endregion

        #region SHA512

        /// <summary>
        /// Returns SHA512 Hash from an image object
        /// </summary>
        /// <param name="image"></param>
        /// <returns></returns>
        public static string ImageToSHA512(Image image)
        {
            if (image == null)
            {
                return null;
            }

            try
            {
                using (MemoryStream ms = new MemoryStream())
                {
                    image.Save(ms, ImageFormat.Png);
                    return BytesToSHA512(ms.ToArray());
                }
            }
            catch (Exception ex)
            {
                Logger.Instance.LogMessage(TracingLevel.ERROR, $"ImageToSHA512 Exception: {ex}");
            }
            return null;
        }

        /// <summary>
        /// Returns SHA512 Hash from a string
        /// </summary>
        /// <param name="str"></param>
        /// <returns></returns>
        public static string StringToSHA512(string str)
        {
            if (str == null)
            {
                return null;
            }
            return BytesToSHA512(System.Text.Encoding.UTF8.GetBytes(str));
        }

        /// <summary>
        /// Returns SHA512 Hash from a byte stream
        /// </summary>
        /// <param name="byteStream"></param>
        /// <returns></returns>
        public static string BytesToSHA512(byte[] byteStream)
        {
            try
            {
                using (SHA512 sha512 = SHA512.Create())
                {
                    byte[] hash = sha512.ComputeHash(byteStream);
                    return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
                }
            }
            catch (Exception ex)
            {
                Logger.Instance.LogMessage(TracingLevel.ERROR, $"BytesToSHA512 Exception: {ex}");
            }
            return null;
        }

        #endregion

        #region JObject Related

        /// <summary>
        /// Iterates through the fromJObject, finds the property that matches in the toSettings object, and sets the value from the fromJObject object
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="toSettings"></param>
        /// <param name="fromJObject"></param>
        /// <returns>Number of properties updated</returns>
        public static int AutoPopulateSettings<T>(T toSettings, JObject fromJObject)
        {
            Dictionary<string, PropertyInfo> dicProperties = MatchPropertiesWithJsonProperty(toSettings);
            int totalPopulated = 0;

            if (fromJObject != null)
            {
                foreach (var prop in fromJObject)
                {
                    if (dicProperties.ContainsKey(prop.Key))
                    {
                        PropertyInfo info = dicProperties[prop.Key];

                        // Special handling for FilenameProperty
                        if (info.GetCustomAttributes(typeof(FilenamePropertyAttribute), true).Length > 0)
                        {
                            string value = FilenameFromString((string)prop.Value);
                            info.SetValue(toSettings, value);
                        }
                        else
                        {
                            info.SetValue(toSettings, Convert.ChangeType(prop.Value, info.PropertyType));
                        }
                        totalPopulated++;
                    }
                }
            }
            return totalPopulated;
        }

        private static Dictionary<string, PropertyInfo> MatchPropertiesWithJsonProperty<T>(T obj)
        {
            Dictionary<string, PropertyInfo> dicProperties = new Dictionary<string, PropertyInfo>();
            if (obj != null)
            {
                PropertyInfo[] props = typeof(T).GetProperties();
                foreach (PropertyInfo prop in props)
                {
                    object[] attributes = prop.GetCustomAttributes(true);
                    foreach (object attr in attributes)
                    {
                        if (attr is JsonPropertyAttribute jprop)
                        {
                            dicProperties.Add(jprop.PropertyName, prop);
                            break;
                        }
                    }
                }
            }

            return dicProperties;
        }

        #endregion

        #region Dials Related

        /// <summary>
        /// Takes a custom range and recalculates the value on a scale from 0 to 100
        /// </summary>
        /// <param name="value"></param>
        /// <param name="originalMin"></param>
        /// <param name="originalMax"></param>
        /// <returns></returns>
        public static int RangeToPercentage(int value, int originalMin, int originalMax)
        {
            if (originalMax - originalMin == 0) // Prevent division by zero
            {
                return 0;
            }

            return ((value - originalMin) * 100) / (originalMax - originalMin);
        }

        #endregion

        #region Plugin Helper Classes

        internal static string GetExeName()
        {
            try
            {
                return System.IO.Path.GetFileNameWithoutExtension(System.Diagnostics.Process.GetCurrentProcess().MainModule.FileName);
            }
            catch (Exception ex)
            {
                Logger.Instance.LogMessage(TracingLevel.WARN, $"GetExeName failed {ex}");
            }
            return String.Empty;
        }

        /// <summary>
        /// Uses the PluginActionId attribute on the various classes derived from PluginBase to find all the actions supported in this assembly
        /// </summary>
        /// <returns></returns>
        public static PluginActionId[] AutoLoadPluginActions()
        {
            List<PluginActionId> actions = new List<PluginActionId>();

            var pluginTypes = Assembly.GetEntryAssembly().GetTypes().Where(typ => typ.IsClass && typ.GetCustomAttributes(typeof(PluginActionIdAttribute), true).Length > 0).ToList();
            pluginTypes.ForEach(typ =>
            {
                if (typ.GetCustomAttributes(typeof(PluginActionIdAttribute), true).First() is PluginActionIdAttribute attr)
                {
                    actions.Add(new PluginActionId(attr.ActionId, typ));
                }
            });

            return actions.ToArray();
        }

        #endregion
    }
}



================================================
FILE: barraider-sdtools/Wrappers/KeyCoordinates.cs
================================================
﻿using Newtonsoft.Json;
namespace BarRaider.SdTools
{
    /// <summary>
    /// Coordinates of the current key
    /// </summary>
    public class KeyCoordinates
    {
        /// <summary>
        /// Column of the current key
        /// </summary>
        [JsonProperty("column")]
        public int Column { get; set; }

        /// <summary>
        /// Row of the current key
        /// </summary>
        [JsonProperty("row")]
        public int Row { get; set; }
    }
}




================================================
FILE: barraider-sdtools/Wrappers/PluginActionId.cs
================================================
﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BarRaider.SdTools
{
    /// <summary>
    /// This class associates a plugin UUID (which is indicated in the Manifest file), with the type of the implementation class.
    /// The implementation class must be derived from the PluginBase class for this to work properly.
    /// If the type passed does not derrive from PluginBase, a NotSupportedException will be thrown
    /// </summary>
    public class PluginActionId
    {
        private Type pluginBaseType;

        /// <summary>
        /// Action UUID as indicated in the manifest file
        /// </summary>
        public string ActionId { get; private set; }

        /// <summary>
        /// Type of class that implemented this action. Must inherit PluginBase
        /// </summary>
        public Type PluginBaseType
        {
            get
            {
                return pluginBaseType;
            }
            private set
            {
                if (value == null || (!typeof(IKeypadPlugin).IsAssignableFrom(value) && !typeof(IEncoderPlugin).IsAssignableFrom(value)))
                {
                    throw new NotSupportedException("Class type set to PluginBaseType does not inherit IKeypadPlugin or IEncoderPlugin");
                }
                pluginBaseType = value;
            }
        }

        /// <summary>
        /// PluginActionId constructor
        /// </summary>
        /// <param name="actionId">actionId is the UUID from the manifest file</param>
        /// <param name="pluginBaseType">Type of class that implemented this action. Must inherit PluginBase</param>
        public PluginActionId(string actionId, Type pluginBaseType)
        {
            ActionId = actionId;
            PluginBaseType = pluginBaseType;
        }
    }
}



================================================
FILE: barraider-sdtools/Wrappers/SDEventReceivedEventArgs.cs
================================================
﻿using System;
using System.Collections.Generic;
using System.Text;

namespace BarRaider.SdTools.Wrappers
{
    /// <summary>
    /// Base (Generic) EventArgs used for events
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public class SDEventReceivedEventArgs<T> : EventArgs
    {
        /// <summary>
        /// Event Information
        /// </summary>
        public T Event { get; private set; }
        internal SDEventReceivedEventArgs(T evt)
        {
            this.Event = evt;
        }
    }
}



================================================
FILE: barraider-sdtools/Wrappers/TitleParameters.cs
================================================
﻿using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Text;

namespace BarRaider.SdTools.Wrappers
{
    /// <summary>
    /// Enum for the alignment of the Title text on the key
    /// </summary>
    public enum TitleVerticalAlignment
    {
        /// <summary>
        /// Top Alignment
        /// </summary>
        Top,

        /// <summary>
        /// Middle/Center Alignment
        /// </summary>
        Middle,

        /// <summary>
        /// Bottom Alignment
        /// </summary>
        Bottom
    }

    /// <summary>
    /// Class holding all the Title Information set by a user in the Property Inspector
    /// </summary>
    public class TitleParameters
    {
        #region Private Members
        private const double POINTS_TO_PIXEL_CONVERT = 1.3;
        private const int DEFAULT_IMAGE_SIZE_FONT_SCALE = 3;
        private const string DEFAULT_FONT_FAMILY_NAME = "Verdana";
        #endregion

        /// <summary>
        /// Title Color
        /// </summary>
        [JsonProperty("titleColor")]
        public Color TitleColor { get; private set; } = Color.White;

        /// <summary>
        /// Font Size in Points
        /// </summary>
        [JsonProperty("fontSize")]
        public double FontSizeInPoints { get; private set; } = 10;

        /// <summary>
        /// Font Size in Pixels
        /// </summary>
        [JsonIgnore]
        public double FontSizeInPixels => Math.Round(FontSizeInPoints * POINTS_TO_PIXEL_CONVERT);

        /// <summary>
        /// Font Size Scaled to Image
        /// </summary>
        [JsonIgnore]
        public double FontSizeInPixelsScaledToDefaultImage => Math.Round(FontSizeInPixels * DEFAULT_IMAGE_SIZE_FONT_SCALE);

        /// <summary>
        /// Font Family
        /// </summary>
        [JsonProperty("fontFamily")]
        public FontFamily FontFamily { get; private set; } = new FontFamily(DEFAULT_FONT_FAMILY_NAME);

        /// <summary>
        /// Font Style
        /// </summary>
        [JsonProperty("fontStyle")]
        public FontStyle FontStyle { get; private set; } = FontStyle.Bold;

        /// <summary>
        /// Should Title be shown
        /// </summary>
        [JsonProperty("showTitle")]
        public bool ShowTitle { get; private set; }

        /// <summary>
        /// Alignment position of the Title text on the key
        /// </summary>
        [JsonProperty("titleAlignment")]
        public TitleVerticalAlignment VerticalAlignment { get; private set; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="fontFamily"></param>
        /// <param name="fontStyle"></param>
        /// <param name="fontSize"></param>
        /// <param name="titleColor"></param>
        /// <param name="showTitle"></param>
        /// <param name="verticalAlignment"></param>
        public TitleParameters(FontFamily fontFamily, FontStyle fontStyle, double fontSize, Color titleColor, bool showTitle, TitleVerticalAlignment verticalAlignment)
        {
            FontFamily = fontFamily;
            FontStyle = fontStyle;
            FontSizeInPoints = fontSize;
            TitleColor = titleColor;
            ShowTitle = showTitle;
            VerticalAlignment = verticalAlignment;
        }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="fontFamily"></param>
        /// <param name="fontSize"></param>
        /// <param name="fontStyle"></param>
        /// <param name="fontUnderline"></param>
        /// <param name="showTitle"></param>
        /// <param name="titleAlignment"></param>
        /// <param name="titleColor"></param>
        public TitleParameters(string fontFamily, uint fontSize, string fontStyle, bool fontUnderline, bool showTitle, string titleAlignment, string titleColor)
        {
            ParsePayload(fontFamily, fontSize, fontStyle, fontUnderline, showTitle, titleAlignment, titleColor);
        }


        private void ParsePayload(string fontFamily, uint fontSize, string fontStyle, bool fontUnderline, bool showTitle, string titleAlignment, string titleColor)
        {
            try
            {
                ShowTitle = showTitle;

                // Color
                if (!String.IsNullOrEmpty(titleColor))
                {
                    TitleColor = ColorTranslator.FromHtml(titleColor);
                }

                if (!String.IsNullOrEmpty(fontFamily))
                {
                    FontFamily = new FontFamily(fontFamily);
                }

                FontSizeInPoints = fontSize;
                if (!String.IsNullOrEmpty(fontStyle))
                {
                    switch (fontStyle.ToLowerInvariant())
                    {
                        case "regular":
                            FontStyle = FontStyle.Regular;
                            break;
                        case "bold":
                            FontStyle = FontStyle.Bold;
                            break;
                        case "italic":
                            FontStyle = FontStyle.Italic;
                            break;
                        case "bold italic":
                            FontStyle = FontStyle.Bold | FontStyle.Italic;
                            break;
                        default:
                            Logger.Instance.LogMessage(TracingLevel.WARN, $"{this.GetType()} Cannot parse Font Style: {fontStyle}");
                            break;
                    }
                }
                if (fontUnderline)
                {
                    FontStyle |= FontStyle.Underline;
                }

                if (!string.IsNullOrEmpty(titleAlignment))
                {
                    switch (titleAlignment.ToLowerInvariant())
                    {
                        case "top":
                            VerticalAlignment = TitleVerticalAlignment.Top;
                            break;
                        case "bottom":
                            VerticalAlignment = TitleVerticalAlignment.Bottom;
                            break;
                        case "middle":
                            VerticalAlignment = TitleVerticalAlignment.Middle;
                            break;
                    }
                }
            }
            catch (Exception ex)
            {
                Logger.Instance.LogMessage(TracingLevel.ERROR, $"TitleParameters failed to parse payload {ex}");
            }
        }
    }
}



================================================
FILE: SamplePlugin/!!README!!.txt
================================================
﻿To use:
1. Right click the project and choose "Manage Nuget Packages"
2. Choose the restore option in the Nuget screen (or just install the latest StreamDeck-Tools from Nuget)
3. Update the manifest.json file with the correct details about your plugin
4. Modify PluginAction.cs as needed (it holds the logic for your plugin)
5. Modify the PropertyInspector\PluginActionPI.html and PropertyInspector\PluginActionPI.js as needed to show field in the Property Inspector

For help with the StreamDeck-Tools:
Resources:
* StreamDeck-Tools samples and tutorial: https://github.com/BarRaider/streamdeck-tools
* EasyPI library (for working with Property Inspector): https://github.com/BarRaider/streamdeck-easypi

Discord Server: http://discord.barraider.com


================================================
FILE: SamplePlugin/App.config
================================================
﻿<?xml version="1.0" encoding="utf-8"?>
<configuration>
    <startup> 
        <supportedRuntime version="v4.0" sku=".NETFramework,Version=v4.7.2" />
    </startup>
  <runtime>
    <assemblyBinding xmlns="urn:schemas-microsoft-com:asm.v1">
      <dependentAssembly>
        <assemblyIdentity name="CommandLine" publicKeyToken="5a870481e358d379" culture="neutral" />
        <bindingRedirect oldVersion="0.0.0.0-2.6.0.0" newVersion="2.6.0.0" />
      </dependentAssembly>
    </assemblyBinding>
  </runtime>
</configuration>


================================================
FILE: SamplePlugin/manifest.json
================================================
{
  "Actions": [
    {
      "Icon": "Images/icon",
      "Name": "SDTools Test",
      "States": [
        {
          "Image": "Images/pluginAction",
          "TitleAlignment": "middle",
          "FontSize": "12"
        }
      ],
      "SupportedInMultiActions": true,
      "Tooltip": "Sample Plugin to Test SDTools",
      "UUID": "com.test.sdtools.sampleplugin",
      "PropertyInspectorPath": "PropertyInspector/Sample.html"
    }
  ],
  "Author": "BarRaider",
  "Description": "Sample Plugin to test SDTools",
  "Name": "SDTools Sample Plugin",
  "Icon": "Images/pluginIcon",
  "URL": "https://barraider.com/",
  "Version": "0.1",
  "CodePath": "com.test.sdtools",
  "Category": "Test",
  "CategoryIcon": "Images/categoryIcon",
  "OS": [
    {
      "Platform": "windows",
      "MinimumVersion": "10"
    }
  ],
  "SDKVersion": 2,
  "Software": {
    "MinimumVersion": "4.4.1"
  },
  "ApplicationsToMonitor": {
    "windows": [
      "notepad.exe",
      "calc.exe"
    ]
  }

}



================================================
FILE: SamplePlugin/PluginAction.cs
================================================
﻿using BarRaider.SdTools;
using BarRaider.SdTools.Wrappers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SamplePlugin
{
    [PluginActionId("com.test.sdtools.sampleplugin")]
    public class PluginAction : KeypadBase
    {
        private class PluginSettings
        {
            public static PluginSettings CreateDefaultSettings()
            {
                PluginSettings instance = new PluginSettings
                {
                    OutputFileName = String.Empty,
                    InputString = String.Empty
                };
                return instance;
            }

            [FilenameProperty]
            [JsonProperty(PropertyName = "outputFileName")]
            public string OutputFileName { get; set; }

            [JsonProperty(PropertyName = "inputString")]
            public string InputString { get; set; }
        }

        #region Private Members

        private readonly PluginSettings settings;

        #endregion
        public PluginAction(ISDConnection connection, InitialPayload payload) : base(connection, payload)
        {
            if (payload.Settings == null || payload.Settings.Count == 0)
            {
                this.settings = PluginSettings.CreateDefaultSettings();
            }
            else
            {
                this.settings = payload.Settings.ToObject<PluginSettings>();
            }

            Connection.OnApplicationDidLaunch += Connection_OnApplicationDidLaunch;
            Connection.OnApplicationDidTerminate += Connection_OnApplicationDidTerminate;
            Connection.OnDeviceDidConnect += Connection_OnDeviceDidConnect;
            Connection.OnDeviceDidDisconnect += Connection_OnDeviceDidDisconnect;
            Connection.OnPropertyInspectorDidAppear += Connection_OnPropertyInspectorDidAppear;
            Connection.OnPropertyInspectorDidDisappear += Connection_OnPropertyInspectorDidDisappear;
            Connection.OnSendToPlugin += Connection_OnSendToPlugin;
            Connection.OnTitleParametersDidChange += Connection_OnTitleParametersDidChange;
        }

        private void Connection_OnTitleParametersDidChange(object sender, BarRaider.SdTools.Wrappers.SDEventReceivedEventArgs<BarRaider.SdTools.Events.TitleParametersDidChange> e)
        {
        }

        private void Connection_OnSendToPlugin(object sender, BarRaider.SdTools.Wrappers.SDEventReceivedEventArgs<BarRaider.SdTools.Events.SendToPlugin> e)
        {
        }

        private void Connection_OnPropertyInspectorDidDisappear(object sender, BarRaider.SdTools.Wrappers.SDEventReceivedEventArgs<BarRaider.SdTools.Events.PropertyInspectorDidDisappear> e)
        {
        }

        private void Connection_OnPropertyInspectorDidAppear(object sender, BarRaider.SdTools.Wrappers.SDEventReceivedEventArgs<BarRaider.SdTools.Events.PropertyInspectorDidAppear> e)
        {
        }

        private void Connection_OnDeviceDidDisconnect(object sender, BarRaider.SdTools.Wrappers.SDEventReceivedEventArgs<BarRaider.SdTools.Events.DeviceDidDisconnect> e)
        {
        }

        private void Connection_OnDeviceDidConnect(object sender, BarRaider.SdTools.Wrappers.SDEventReceivedEventArgs<BarRaider.SdTools.Events.DeviceDidConnect> e)
        {
        }

        private void Connection_OnApplicationDidTerminate(object sender, BarRaider.SdTools.Wrappers.SDEventReceivedEventArgs<BarRaider.SdTools.Events.ApplicationDidTerminate> e)
        {
        }

        private void Connection_OnApplicationDidLaunch(object sender, BarRaider.SdTools.Wrappers.SDEventReceivedEventArgs<BarRaider.SdTools.Events.ApplicationDidLaunch> e)
        {
        }

        public override void Dispose()
        {
            Connection.OnApplicationDidLaunch -= Connection_OnApplicationDidLaunch;
            Connection.OnApplicationDidTerminate -= Connection_OnApplicationDidTerminate;
            Connection.OnDeviceDidConnect -= Connection_OnDeviceDidConnect;
            Connection.OnDeviceDidDisconnect -= Connection_OnDeviceDidDisconnect;
            Connection.OnPropertyInspectorDidAppear -= Connection_OnPropertyInspectorDidAppear;
            Connection.OnPropertyInspectorDidDisappear -= Connection_OnPropertyInspectorDidDisappear;
            Connection.OnSendToPlugin -= Connection_OnSendToPlugin;
            Connection.OnTitleParametersDidChange -= Connection_OnTitleParametersDidChange;
            Logger.Instance.LogMessage(TracingLevel.INFO, $"Destructor called");
        }

        public async override void KeyPressed(KeyPayload payload)
        {
            Logger.Instance.LogMessage(TracingLevel.INFO, "Key Pressed");
            TitleParameters tp = new TitleParameters(new FontFamily("Arial"), FontStyle.Bold, 20, Color.White, true, TitleVerticalAlignment.Middle);
            using (Image image = Tools.GenerateGenericKeyImage(out Graphics graphics))
            {
                graphics.FillRectangle(new SolidBrush(Color.White), 0, 0, image.Width, image.Height);
                graphics.AddTextPath(tp, image.Height, image.Width, "Test");
                graphics.Dispose();

                await Connection.SetImageAsync(image);
            }
        }

        public async override void KeyReleased(KeyPayload payload) 
        {
            TitleParameters tp = new TitleParameters(new FontFamily("Arial"), FontStyle.Bold, 20, Color.White, true, TitleVerticalAlignment.Middle);
            using (Image image = Tools.GenerateGenericKeyImage(out Graphics graphics))
            {
                graphics.FillRectangle(new SolidBrush(Color.White), 0, 0, image.Width, image.Height);
                graphics.AddTextPath(tp, image.Height, image.Width, "Test", Color.Black, 7);
                graphics.Dispose();

                await Connection.SetImageAsync(image);
            }
        }

        public override void OnTick() { }

        public override void ReceivedSettings(ReceivedSettingsPayload payload)
        {
            Tools.AutoPopulateSettings(settings, payload.Settings);
            SaveSettings();
        }

        public override void ReceivedGlobalSettings(ReceivedGlobalSettingsPayload payload) { }

        #region Private Methods

        private Task SaveSettings()
        {
            return Connection.SetSettingsAsync(JObject.FromObject(settings));
        }

        #endregion
    }
}


================================================
FILE: SamplePlugin/Program.cs
================================================
﻿using BarRaider.SdTools;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SamplePlugin
{
    class Program
    {
        static void Main(string[] args)
        {
            // Uncomment this line of code to allow for debugging
            //while (!System.Diagnostics.Debugger.IsAttached) { System.Threading.Thread.Sleep(100); }

            SDWrapper.Run(args);
        }
    }
}



================================================
FILE: SamplePlugin/SamplePlugin.csproj
================================================
﻿<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net472</TargetFramework>
    <AppendTargetFrameworkToOutputPath>false</AppendTargetFrameworkToOutputPath>
    <AssemblyName>com.test.sdtools</AssemblyName>
    <Platforms>AnyCPU;x64</Platforms>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(Platform)'=='Release|AnyCPU'">
    <OutputPath>bin\Release\com.test.sdtools.sdPlugin\</OutputPath>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(Platform)'=='Release|x64'">
    <OutputPath>bin\Release\com.test.sdtools.sdPlugin\</OutputPath>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(Platform)'=='Debug|AnyCPU'">
    <OutputPath>bin\Debug\com.test.sdtools.sdPlugin\</OutputPath>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(Platform)'=='Debug|x64'">
    <OutputPath>bin\Debug\com.test.sdtools.sdPlugin\</OutputPath>
  </PropertyGroup> 
  <ItemGroup>
    <None Include="App.config" />
    <None Include="manifest.json">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </None>
  </ItemGroup>
  <ItemGroup>
    <Content Include="!!README!!.txt" />
    <Content Include="Images\categoryIcon%402x.png">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Images\categoryIcon.png">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Images\icon%402x.png">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Images\icon.png">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Images\pluginAction%402x.png">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Images\pluginAction.png">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Images\pluginIcon%402x.png">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="Images\pluginIcon.png">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="PropertyInspector\caret.svg">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="PropertyInspector\check.png">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="PropertyInspector\check.svg">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="PropertyInspector\elg_calendar.svg">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="PropertyInspector\elg_calendar_inv.svg">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="PropertyInspector\Sample.html">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="PropertyInspector\Sample.js">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="PropertyInspector\rcheck.svg">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="PropertyInspector\sdpi.css">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
    <Content Include="PropertyInspector\sdtools.common.js">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\barraider-sdtools\barraider-sdtools.csproj" />
  </ItemGroup>
  <ItemGroup>
    <Folder Include="Properties\" />
  </ItemGroup>
</Project>


================================================
FILE: SamplePlugin/PropertyInspector/Sample.html
================================================
﻿<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name=viewport content="width=device-width,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no,minimal-ui,viewport-fit=cover">
    <meta name=apple-mobile-web-app-capable content=yes>
    <meta name=apple-mobile-web-app-status-bar-style content=black>
    <title>SamplePlugin Settings</title>
    <link rel="stylesheet" href="sdpi.css">
    <script src="sdtools.common.js"></script>
    <script src="Sample.js"></script>
</head>
<body>
    <div class="sdpi-wrapper">
        <div class="sdpi-item" id="dvTitlePrefix">
            <div class="sdpi-item-label">Unused</div>
            <input class="sdpi-item-value sdProperty" placeholder="" value="" id="inputString" oninput="setSettings()">
        </div>
        <div class="sdpi-item" id="dvReset">
            <div class="sdpi-item-label">SendToPlugin Test</div>
            <button class="sdpi-item-value max20" onclick="resetCounter()">Reset</button>
        </div>
    </div>
</body>
</html>



================================================
FILE: SamplePlugin/PropertyInspector/Sample.js
================================================
﻿function resetCounter() {
    var payload = {};
    payload.property_inspector = 'resetCounter';
    sendPayloadToPlugin(payload);
}


================================================
FILE: SamplePlugin/PropertyInspector/sdpi.css
================================================
.linkspan {
    cursor: pointer;
    color: #7397d2;
    text-decoration: underline;
}

html {
  --sdpi-bgcolor: #2D2D2D;
  --sdpi-background: #3D3D3D;
  --sdpi-color: #d8d8d8;
  --sdpi-bordercolor: #3a3a3a;
  --sdpi-buttonbordercolor: #969696;
  --sdpi-borderradius: 0px;
  --sdpi-width: 224px;
  --sdpi-fontweight: 600;
    height: 100%;
  width: 100%;
  overflow: hidden;
}

html, body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  font-size: 9pt;
	background-color: var(--sdpi-bgcolor);
	color: #9a9a9a;
}

body {
  height: 100%;
  padding: 0;
  overflow-x: hidden;
  overflow-y: auto;
  margin: 0;
  -webkit-overflow-scrolling: touch;
  -webkit-text-size-adjust: 100%;
  -webkit-font-smoothing: antialiased;
}

mark {
  background-color: var(--sdpi-bgcolor);
  color: var(--sdpi-color);
}

hr, hr2 {
  -webkit-margin-before: 1em;
  -webkit-margin-after: 1em;
  border-style: none;
  background: var(--sdpi-background);
  height: 1px;
}

hr2,
.sdpi-heading {
	display: flex;
	flex-basis: 100%;
	align-items: center;
	color: inherit;
	font-size: 9pt;
	margin: 8px 0px;
}

.sdpi-heading::before,
.sdpi-heading::after {
	content: "";
	flex-grow: 1;
	background: var(--sdpi-background);
	height: 1px;
	font-size: 0px;
	line-height: 0px;
	margin: 0px 16px;
}

hr2 {
  height: 2px;
}

hr, hr2 {
  margin-left:16px;
  margin-right:16px;
}

.sdpi-item-value,
option,
input,
select,
button {
  font-size: 10pt;
  font-weight: var(--sdpi-fontweight);
  letter-spacing: var(--sdpi-letterspacing);
}



.win .sdpi-item-value,
.win option,
.win input,
.win select,
.win button {
  font-size: 11px;
  font-style: normal;
  letter-spacing: inherit;
  font-weight: 100;
}

.win button {
  font-size: 12px;
}

::-webkit-progress-value,
meter::-webkit-meter-optimum-value {
  border-radius: 2px;
  /* background: linear-gradient(#ccf, #99f 20%, #77f 45%, #77f 55%, #cdf); */
}

::-webkit-progress-bar,
meter::-webkit-meter-bar {
  border-radius: 3px;
  background: var(--sdpi-background);
}

::-webkit-progress-bar:active,
meter::-webkit-meter-bar:active {
  border-radius: 3px;
  background: #222222;
}
::-webkit-progress-value:active,
meter::-webkit-meter-optimum-value:active {
  background: #99f;
}

progress,
progress.sdpi-item-value {
  min-height: 5px !important;
  height: 5px;
  background-color: #303030;
}

progress {
  margin-top: 8px !important;
  margin-bottom: 8px !important;
}

.full progress,
progress.full {
  margin-top: 3px !important;
}

::-webkit-progress-inner-element {
  background-color: transparent;
}


.sdpi-item[type="progress"] {
  margin-top: 4px !important;
  margin-bottom: 12px;
  min-height: 15px;
}

.sdpi-item-child.full:last-child {
  margin-bottom: 4px;
}

.tabs {
  /**
   * Setting display to flex makes this container lay
   * out its children using flexbox, the exact same
   * as in the above "Stepper input" example.
   */
  display: flex;

  border-bottom: 1px solid #D7DBDD;
}

.tab {
  cursor: pointer;
  padding: 5px 30px;
  color: #16a2d7;
  font-size: 9pt;
  border-bottom: 2px solid transparent;
}

.tab.is-tab-selected {
  border-bottom-color: #4ebbe4;
}

select {
  -webkit-appearance: none;
  -moz-appearance: none;
  -o-appearance: none;
  appearance: none;
  background: url(caret.svg) no-repeat 97% center;
}

label.sdpi-file-label,
input[type="button"],
input[type="submit"],
input[type="reset"],
input[type="file"],
input[type=file]::-webkit-file-upload-button,
button,
select {
  color: var(--sdpi-color);
  border: 1pt solid #303030;
  font-size: 8pt;
  background-color: var(--sdpi-background);
  border-radius: var(--sdpi-borderradius);
}

label.sdpi-file-label,
input[type="button"],
input[type="submit"],
input[type="reset"],
input[type="file"],
input[type=file]::-webkit-file-upload-button,
button {
  border: 1pt solid var(--sdpi-buttonbordercolor);
  border-radius: var(--sdpi-borderradius);
  border-color: var(--sdpi-buttonbordercolor);
  min-height: 23px !important;
  height: 23px !important;
  margin-right: 8px;
}

input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="file"] {
  border-radius: var(--sdpi-borderradius);
  max-width: 220px;
}


option {
  height: 1.5em;
  padding: 4px;
}

/* SDPI */

.sdpi-wrapper {
  overflow-x: hidden;
}

.sdpi-item {
  display: flex;
  flex-direction: row;
  min-height: 32px;
  align-items: center;
  margin-top: 2px;
  max-width: 344px;
}

.sdpi-item:first-child {
  margin-top:1px;
}

.sdpi-item:last-child {
  margin-bottom: 0px;
}

.sdpi-item > *:not(.sdpi-item-label):not(meter):not(details) {
  min-height: 26px;
  padding: 0px 4px 0px 4px;
}

.sdpi-item > *:not(.sdpi-item-label.empty):not(meter) {
  min-height: 26px;
  padding: 0px 4px 0px 4px;
}


.sdpi-item-group {
  padding: 0 !important;
}

meter.sdpi-item-value {
  margin-left: 6px;
}

.sdpi-item[type="group"] {
  display: block;
  margin-top: 12px;
  margin-bottom: 12px;
  /* border: 1px solid white; */
  flex-direction: unset;
  text-align: left;
}

.sdpi-item[type="group"] > .sdpi-item-label,
.sdpi-item[type="group"].sdpi-item-label {
  width: 96%;
  text-align: left;
  font-weight: 700;
  margin-bottom: 4px;
  padding-left: 4px;
}

dl,
ul,
ol {
  -webkit-margin-before: 0px;
  -webkit-margin-after: 4px;
  -webkit-padding-start: 1em;
  max-height: 90px;
  overflow-y: scroll;
  cursor: pointer;
  user-select: none;
}

table.sdpi-item-value,
dl.sdpi-item-value,
ul.sdpi-item-value,
ol.sdpi-item-value {
  -webkit-margin-before: 4px;
  -webkit-margin-after: 8px;
  -webkit-padding-start: 1em;
  width: var(--sdpi-width);
  text-align: center;
}

table > caption {
  margin: 2px;
}

.list,
.sdpi-item[type="list"] {
  align-items: baseline;
}

.sdpi-item-label {
  text-align: right;
  flex: none;
  width: 94px;
  padding-right: 4px;
  font-weight: 600;
  -webkit-user-select: none;
}

.win .sdpi-item-label,
.sdpi-item-label > small{
  font-weight: normal;
}

.sdpi-item-label:after {
  content: ": ";
}

.sdpi-item-label.empty:after {
  content: "";
}

.sdpi-test,
.sdpi-item-value {
  flex: 1 0 0;
  /* flex-grow: 1;
  flex-shrink: 0; */
  margin-right: 14px;
  margin-left: 4px;
  justify-content: space-evenly;
}

canvas.sdpi-item-value {
  max-width: 144px;
  max-height: 144px;
  width: 144px;
  height: 144px;
  margin: 0 auto;
  cursor: pointer;
}

input.sdpi-item-value {
  margin-left: 5px;
}

.sdpi-item-value button,
button.sdpi-item-value {
  margin-left: 7px;
  margin-right: 19px;
}

.sdpi-item-value.range {
  margin-left: 0px;
}

table,
dl.sdpi-item-value,
ul.sdpi-item-value,
ol.sdpi-item-value,
.sdpi-item-value > dl,
.sdpi-item-value > ul,
.sdpi-item-value > ol
{
  list-style-type: none;
  list-style-position: outside;
  margin-left:  -4px;
  margin-right: -4px;
  padding: 4px;
  border: 1px solid var(--sdpi-bordercolor);
}

dl.sdpi-item-value,
ul.sdpi-item-value,
ol.sdpi-item-value,
.sdpi-item-value > ol {
  list-style-type: none;
  list-style-position: inside;
  margin-left: 5px;
  margin-right: 12px;
  padding: 4px !important;
}

ol.sdpi-item-value,
.sdpi-item-value > ol[listtype="none"] {
  list-style-type: none;
}
ol.sdpi-item-value[type="decimal"],
.sdpi-item-value > ol[type="decimal"] {
  list-style-type: decimal;
}

ol.sdpi-item-value[type="decimal-leading-zero"],
.sdpi-item-value > ol[type="decimal-leading-zero"] {
  list-style-type: decimal-leading-zero;
}

ol.sdpi-item-value[type="lower-alpha"],
.sdpi-item-value > ol[type="lower-alpha"] {
  list-style-type: lower-alpha;
}

ol.sdpi-item-value[type="upper-alpha"],
.sdpi-item-value > ol[type="upper-alpha"] {
  list-style-type: upper-alpha;
}

ol.sdpi-item-value[type="upper-roman"],
.sdpi-item-value > ol[type="upper-roman"] {
  list-style-type: upper-roman;
}

ol.sdpi-item-value[type="lower-roman"],
.sdpi-item-value > ol[type="lower-roman"] {
  list-style-type: upper-roman;
}

tr:nth-child(even),
.sdpi-item-value > ul > li:nth-child(even),
.sdpi-item-value > ol > li:nth-child(even),
li:nth-child(even) {
  background-color: rgba(0,0,0,.2)
}

td:hover,
.sdpi-item-value > ul > li:hover:nth-child(even),
.sdpi-item-value > ol > li:hover:nth-child(even),
li:hover:nth-child(even),
li:hover { 
  background-color: rgba(255,255,255,.1);
}

td.selected,
td.selected:hover,
li.selected:hover,
li.selected {
  color: white;
  background-color: #77f;
}

tr {
  border: 1px solid var(--sdpi-bordercolor);
}

td {
  border-right: 1px solid var(--sdpi-bordercolor);
  -webkit-user-select: none;
}

tr:last-child,
td:last-child {
  border: none;
}

.sdpi-item-value.select,
.sdpi-item-value > select {
  margin-right: 13px;
  margin-left: 4px;
}

.sdpi-item-child,
.sdpi-item-group > .sdpi-item > input[type="color"] {
  margin-top: 0.4em;
  margin-right: 4px;
}

.full,
.full *,
.sdpi-item-value.full,
.sdpi-item-child > full > *,
.sdpi-item-child.full,
.sdpi-item-child.full > *,
.full > .sdpi-item-child,
.full > .sdpi-item-child > *{
  display: flex;
  flex: 1 1 0;
  margin-bottom: 4px;
  margin-left: 0px;
  width: 100%;

  justify-content: space-evenly;
}

.sdpi-item-group > .sdpi-item > input[type="color"] {
  margin-top: 0px;
}

::-webkit-calendar-picker-indicator:focus,
input[type=file]::-webkit-file-upload-button:focus,
button:focus,
textarea:focus,
input:focus,
select:focus,
option:focus,
details:focus,
summary:focus,
.custom-select select {
  outline: none;
}

summary {
  cursor: default;
  -webkit-user-select: none;
}

.pointer,
summary .pointer {
  cursor: pointer;
}

details.message {
  padding: 4px 18px 4px 12px;
}

details.message summary {
  font-size: 10pt;
  font-weight: 600;
  min-height: 18px;
}

details.message:first-child {
  margin-top: 4px;
  margin-left: 0;
  padding-left: 106px;
}

details.message h1 {
  text-align: left;  
}

.message > summary::-webkit-details-marker {
  display: none;
}

.info20,
.question,
.caution,
.info {
  background-repeat: no-repeat;
  background-position: 70px center;
}

.info20 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath fill='%23999' d='M10,20 C4.4771525,20 0,15.5228475 0,10 C0,4.4771525 4.4771525,0 10,0 C15.5228475,0 20,4.4771525 20,10 C20,15.5228475 15.5228475,20 10,20 Z M10,8 C8.8954305,8 8,8.84275812 8,9.88235294 L8,16.1176471 C8,17.1572419 8.8954305,18 10,18 C11.1045695,18 12,17.1572419 12,16.1176471 L12,9.88235294 C12,8.84275812 11.1045695,8 10,8 Z M10,3 C8.8954305,3 8,3.88165465 8,4.96923077 L8,5.03076923 C8,6.11834535 8.8954305,7 10,7 C11.1045695,7 12,6.11834535 12,5.03076923 L12,4.96923077 C12,3.88165465 11.1045695,3 10,3 Z'/%3E%3C/svg%3E%0A");
}

.info {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath fill='%23999' d='M10,18 C5.581722,18 2,14.418278 2,10 C2,5.581722 5.581722,2 10,2 C14.418278,2 18,5.581722 18,10 C18,14.418278 14.418278,18 10,18 Z M10,8 C9.44771525,8 9,8.42137906 9,8.94117647 L9,14.0588235 C9,14.5786209 9.44771525,15 10,15 C10.5522847,15 11,14.5786209 11,14.0588235 L11,8.94117647 C11,8.42137906 10.5522847,8 10,8 Z M10,5 C9.44771525,5 9,5.44082732 9,5.98461538 L9,6.01538462 C9,6.55917268 9.44771525,7 10,7 C10.5522847,7 11,6.55917268 11,6.01538462 L11,5.98461538 C11,5.44082732 10.5522847,5 10,5 Z'/%3E%3C/svg%3E%0A");
}

.info2 {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 15 15'%3E%3Cpath fill='%23999' d='M7.5,15 C3.35786438,15 0,11.6421356 0,7.5 C0,3.35786438 3.35786438,0 7.5,0 C11.6421356,0 15,3.35786438 15,7.5 C15,11.6421356 11.6421356,15 7.5,15 Z M7.5,2 C6.67157287,2 6,2.66124098 6,3.47692307 L6,3.52307693 C6,4.33875902 6.67157287,5 7.5,5 C8.32842705,5 9,4.33875902 9,3.52307693 L9,3.47692307 C9,2.66124098 8.32842705,2 7.5,2 Z M5,6 L5,7.02155172 L6,7 L6,12 L5,12.0076778 L5,13 L10,13 L10,12 L9,12.0076778 L9,6 L5,6 Z'/%3E%3C/svg%3E%0A");
}

.sdpi-more-info {
  background-image: linear-gradient(to right, #00000000 0%,#00000040 80%), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpolygon fill='%23999' points='4 7 8 7 8 5 12 8 8 11 8 9 4 9'/%3E%3C/svg%3E%0A");
}
.caution {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath fill='%23999' fill-rule='evenodd' d='M9.03952676,0.746646542 C9.57068894,-0.245797319 10.4285735,-0.25196227 10.9630352,0.746646542 L19.7705903,17.2030214 C20.3017525,18.1954653 19.8777595,19 18.8371387,19 L1.16542323,19 C0.118729947,19 -0.302490098,18.2016302 0.231971607,17.2030214 L9.03952676,0.746646542 Z M10,2.25584053 L1.9601405,17.3478261 L18.04099,17.3478261 L10,2.25584053 Z M10,5.9375 C10.531043,5.9375 10.9615385,6.37373537 10.9615385,6.91185897 L10.9615385,11.6923077 C10.9615385,12.2304313 10.531043,12.6666667 10,12.6666667 C9.46895697,12.6666667 9.03846154,12.2304313 9.03846154,11.6923077 L9.03846154,6.91185897 C9.03846154,6.37373537 9.46895697,5.9375 10,5.9375 Z M10,13.4583333 C10.6372516,13.4583333 11.1538462,13.9818158 11.1538462,14.6275641 L11.1538462,14.6641026 C11.1538462,15.3098509 10.6372516,15.8333333 10,15.8333333 C9.36274837,15.8333333 8.84615385,15.3098509 8.84615385,14.6641026 L8.84615385,14.6275641 C8.84615385,13.9818158 9.36274837,13.4583333 10,13.4583333 Z'/%3E%3C/svg%3E%0A");
}

.question {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath fill='%23999' d='M10,18 C5.581722,18 2,14.418278 2,10 C2,5.581722 5.581722,2 10,2 C14.418278,2 18,5.581722 18,10 C18,14.418278 14.418278,18 10,18 Z M6.77783203,7.65332031 C6.77783203,7.84798274 6.85929281,8.02888914 7.0222168,8.19604492 C7.18514079,8.36320071 7.38508996,8.44677734 7.62207031,8.44677734 C8.02409055,8.44677734 8.29703704,8.20768468 8.44091797,7.72949219 C8.59326248,7.27245865 8.77945854,6.92651485 8.99951172,6.69165039 C9.2195649,6.45678594 9.56233491,6.33935547 10.027832,6.33935547 C10.4256205,6.33935547 10.7006836,6.37695313 11.0021973,6.68847656 C11.652832,7.53271484 10.942627,8.472229 10.3750916,9.1321106 C9.80755615,9.79199219 8.29492188,11.9897461 10.027832,12.1347656 C10.4498423,12.1700818 10.7027991,11.9147157 10.7832031,11.4746094 C11.0021973,9.59857178 13.1254883,8.82415771 13.1254883,7.53271484 C13.1254883,7.07568131 12.9974785,6.65250846 12.7414551,6.26318359 C12.4854317,5.87385873 12.1225609,5.56600048 11.652832,5.33959961 C11.1831031,5.11319874 10.6414419,5 10.027832,5 C9.36767248,5 8.79004154,5.13541531 8.29492187,5.40625 C7.79980221,5.67708469 7.42317837,6.01879677 7.16503906,6.43139648 C6.90689975,6.8439962 6.77783203,7.25130007 6.77783203,7.65332031 Z M10.0099668,15 C10.2713191,15 10.5016601,14.9108147 10.7009967,14.7324415 C10.9003332,14.5540682 11,14.3088087 11,13.9966555 C11,13.7157177 10.9047629,13.4793767 10.7142857,13.2876254 C10.5238086,13.0958742 10.2890379,13 10.0099668,13 C9.72646591,13 9.48726565,13.0958742 9.2923588,13.2876254 C9.09745196,13.4793767 9,13.7157177 9,13.9966555 C9,14.313268 9.10077419,14.5596424 9.30232558,14.735786 C9.50387698,14.9119295 9.73975502,15 10.0099668,15 Z'/%3E%3C/svg%3E%0A");
}


.sdpi-more-info {
  position: fixed;
  left: 0px;
  right: 0px;
  bottom: 0px;
  min-height:16px;
  padding-right: 16px;
  text-align: right;
  -webkit-touch-callout: none;
  cursor: pointer;
  user-select: none;
  background-position: right center;
  background-repeat: no-repeat;
  border-radius: var(--sdpi-borderradius);
  text-decoration: none;
  color: var(--sdpi-color);
}

.sdpi-more-info-button {
  display: flex;
  align-self: right;
  margin-left: auto;
  position: fixed;
  right: 17px;
  bottom: 0px;
}

details a {
  background-position: right !important;
  min-height: 24px;
  display: inline-block;
  line-height: 24px;
  padding-right: 28px;
}
input:not([type="range"]),
textarea {
  -webkit-appearance: none;
  background: var(--sdpi-background);
  color: var(--sdpi-color);
  font-weight: normal;
  font-size: 9pt;
  border: none;
  margin-top: 2px;
  margin-bottom: 2px;
}

textarea + label {
  display: flex;
  justify-content: flex-end
}
input[type="radio"],
input[type="checkbox"] {
  display: none;
}
input[type="radio"] + label,
input[type="checkbox"] + label {
  font-size: 9pt;
  color: var(--sdpi-color);
  font-weight: normal;
  margin-right: 8px;
  -webkit-user-select: none;
}

input[type="radio"] + label:after, 
input[type="checkbox"] + label:after {
  content: " " !important;
}

.sdpi-item[type="radio"] > .sdpi-item-value,
.sdpi-item[type="checkbox"] > .sdpi-item-value {
  padding-top: 2px;
}

.sdpi-item[type="checkbox"] > .sdpi-item-value > * {
  margin-top: 4px;
}

.sdpi-item[type="checkbox"]  .sdpi-item-child,
.sdpi-item[type="radio"] .sdpi-item-child {
  display: inline-block;
}

.sdpi-item[type="range"]  .sdpi-item-value,
.sdpi-item[type="meter"]  .sdpi-item-child,
.sdpi-item[type="progress"] .sdpi-item-child {
  display: flex;
}

.sdpi-item[type="range"] .sdpi-item-value {
  min-height: 26px;
}

.sdpi-item[type="range"]  .sdpi-item-value span,
.sdpi-item[type="meter"]  .sdpi-item-child  span,
.sdpi-item[type="progress"] .sdpi-item-child span {
  margin-top: -2px;
  min-width: 8px;
  text-align: right;
  user-select: none;
  cursor: pointer;
}

.sdpi-item[type="range"]  .sdpi-item-value span {
  margin-top: 7px;
  text-align: right;
}

span + input[type="range"] {
  display: flex;
  max-width: 168px;

}

.sdpi-item[type="range"]  .sdpi-item-value span:first-child,
.sdpi-item[type="meter"]  .sdpi-item-child  span:first-child,
.sdpi-item[type="progress"] .sdpi-item-child span:first-child {
  margin-right: 4px;
}

.sdpi-item[type="range"]  .sdpi-item-value span:last-child,
.sdpi-item[type="meter"]  .sdpi-item-child  span:last-child,
.sdpi-item[type="progress"] .sdpi-item-child span:last-child {
  margin-left: 4px;
}

.reverse {
  transform: rotate(180deg);
}

.sdpi-item[type="meter"]  .sdpi-item-child meter + span:last-child {
  margin-left: -10px;
}

.sdpi-item[type="progress"] .sdpi-item-child meter + span:last-child {
  margin-left: -14px;
}

.sdpi-item[type="radio"] > .sdpi-item-value > * {
  margin-top: 2px;
}

details {
  padding: 8px 18px 8px 12px;
  min-width: 86px;
}

details > h4 {
  border-bottom: 1px solid var(--sdpi-bordercolor);
}

legend {
  display: none;
}
.sdpi-item-value > textarea {
  padding: 0px;
  width: 227px;
  margin-left: 1px;
}

input[type="radio"] + label span,
input[type="checkbox"] + label span {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin: 2px 4px 2px 0;
  border-radius: 3px;
  vertical-align: middle;
  background: var(--sdpi-background);
  cursor: pointer;
  border: 1px solid rgb(0,0,0,.2);
}

input[type="radio"] + label span {
  border-radius: 100%;
}

input[type="radio"]:checked + label span,
input[type="checkbox"]:checked + label span {
  background-color: #77f;
  background-image: url(check.svg);
  background-repeat: no-repeat;
  background-position: center center;
  border: 1px solid rgb(0,0,0,.4);
}

input[type="radio"]:active:checked + label span,
input[type="radio"]:active + label span,
input[type="checkbox"]:active:checked + label span,
input[type="checkbox"]:active + label span {
  background-color: #303030;
}

input[type="radio"]:checked + label span {
  background-image: url(rcheck.svg);
}


/*
input[type="radio"] + label span {
  background: url(buttons.png) -38px top no-repeat;
}

input[type="radio"]:checked + label span {
  background: url(buttons.png) -57px top no-repeat;
}
*/

input[type="range"] {
  width: var(--sdpi-width);
  h