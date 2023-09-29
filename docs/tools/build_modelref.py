#!/usr/bin/env python
'''
Script to auto-generate API docs
'''

import sys
from apigen import ApiDocWriter


if __name__ == '__main__':
    package = sys.argv[1]
    outdir = sys.argv[2]

    # Check if the package is available.
    try:
        __import__(package)
    except ImportError as e:
        error = 'Can not import ' + package
        print('API documentation not generated: %s' %error)
        exit(1)
    
    module = sys.modules[package]
    docwriter = ApiDocWriter(package, package_skip_patterns = [r'\.server$', r'\.version'])
    docwriter.include_classes = {'wis3d.wis3d': 'Wis3D'}
    docwriter.write_api_docs(outdir)
    docwriter.write_index(outdir, froot="index")
