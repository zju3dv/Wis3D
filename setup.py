# coding=utf-8
from setuptools import setup, find_packages
from os import path

with open('wis3d/version.py') as f:
    exec(f.read())

basedir = path.abspath(path.dirname(__file__))

# Get the long description from the README file
with open(path.join(basedir, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

setup(
    name='wis3d',
    version=__version__,
    author='Jingmeng Zhang, Hongcheng Zhao, Zijing Huang, Jiaming Sun',
    project_urls={
        'Homepage': 'https://wis3d.readthedocs.io/en/latest/',
        'Online Demo': 'http://wis3d.idr.ai/',
        'Source Code': 'https://github.com/zju3dv/wis3d.git', 
    },
    description='A web-based 3D visualization tool for 3D computer vision.',
    long_description=long_description,
    long_description_content_type='text/markdown',
    packages=find_packages(),
    package_dir={'wis3d': 'wis3d'},
    include_package_data=True,
    license='Apache License 2.0',
    classifiers=[
        'Programming Language :: Python :: 3',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
    ],
    python_requires='>=3.6',
    install_requires=[
        'numpy',
        'trimesh >= 3.9.0',
        'cherrypy',
        'pillow',
        'scipy',
        'transforms3d',
        'torch'
    ],
    entry_points={
        'console_scripts': [
            'wis3d = wis3d:main'
        ]
    },
)
