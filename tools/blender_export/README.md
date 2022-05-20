# Import a Wis3D data folder to Blender (WIP)
This is a handy tool for drawing paper figures.

## Download
[Blender](https://www.blender.org/download/)
## Install
```shell
sudo ln -s /Applications/Blender.app/Contents/Resources/2.80/python/bin/python3.7m /usr/bin/bpython
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
bpython get-pip.py
bpython -m pip install -r blender_python_requirements.txt
```

## VSCode Blender Development
Name: Blender Development  
Id: jacqueslucke.blender-development  
Description: Tools to simplify Blender development.  
Version: 0.0.12  
Publisher: Jacques Lucke  
VS Marketplace Link: https://marketplace.visualstudio.com/items?itemName=JacquesLucke.blender-development  

### Run Blender Python Code
#### 1. Blender: Build and Start
Open a new blender project
#### 2. Blender: Run Script
Run your script in the blender project which is opened in step 1.